import * as functions from "firebase-functions";
import { fetchFromEc, saveToFirestore } from "./ec";
import { db } from "./init";
import { sendEmail as _sendEmail } from "./email";
import { requireAuth } from "./utils";
import { CommonFirestore, CommonFunctions } from "@common";
import { Functions, Firestore } from "./types";
import t from "io-ts";
import { DocumentReference } from "firebase-admin/firestore";

const REGION = "asia-northeast1";

export const createUserCollection = functions
  .region(REGION)
  .auth.user()
  .onCreate((user) => {
    db.collection("users").doc(user.uid).set({
      email: user.email,
      displayName: user.displayName,
    });
  });

export const updateOrders = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    const uid = requireAuth(context);

    if (!data.eventId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Event ID must be provided"
      );
    }

    const ecData = await fetchFromEc("stores", "", "");
    if (!ecData) return;

    const eventId = data.eventId;
    await saveToFirestore(uid, eventId, ecData);
  });

export const findOrderByIam = functions
  .region(REGION)
  .https.onCall(
    async (data): Promise<t.TypeOf<typeof Functions.FindOrderByIam.Out>> => {
      if (!CommonFunctions.FindOrderByIam.In.is(data))
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid argument types."
        );

      const iam = data.iam;

      if (!iam) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "IAM must be provided"
        );
      }

      const querySnapshot = await db
        .collectionGroup("orders")
        .where("iam", "==", iam)
        .withConverter(Firestore.converter(Firestore.Order))
        .get();
      const orderDoc = querySnapshot.docs[0];
      const orderData = orderDoc.data();

      if (!orderData)
        throw new functions.https.HttpsError(
          "not-found",
          "No order data found."
        );

      const eventDoc = await orderDoc.ref.parent.parent
        ?.withConverter(Firestore.converter(Firestore.Event))
        .get();
      const eventData = eventDoc?.data();
      if (!eventDoc || !eventData)
        throw new functions.https.HttpsError(
          "not-found",
          "No event data found."
        );

      // TODO: make type safe
      const customerRef = orderDoc.data().customerRef as DocumentReference;
      const customerDoc = await customerRef
        .withConverter(Firestore.converter(CommonFirestore.Customer))
        .get();
      const customerData = customerDoc.data();
      if (!customerRef || !customerData)
        throw new functions.https.HttpsError(
          "not-found",
          "No customer data found."
        );

      const ownerDoc = await eventDoc.ref.parent?.parent
        ?.withConverter(Firestore.converter(CommonFirestore.Owner))
        .get();
      const ownerData = ownerDoc?.data();
      if (!ownerDoc || !ownerData)
        throw new functions.https.HttpsError(
          "not-found",
          "No owner document found."
        );

      return {
        status: "success",
        body: {
          owner: {
            id: ownerDoc.id,
            data: ownerData,
          },
          event: {
            id: eventDoc.id,
            data: eventData,
          },
          order: {
            id: orderDoc.id,
            data: orderData,
          },
          customer: {
            id: customerDoc.id,
            data: customerData,
          },
        },
      };
    }
  );

//TODO: should be able to decrease when the order is adjusted
export const updateHeadcount = functions
  .region(REGION)
  .https.onCall(
    async (
      data,
      context
    ): Promise<t.TypeOf<typeof CommonFunctions.UpdateHeadcount.Out>> => {
      if (!CommonFunctions.UpdateHeadcount.In.is(data))
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid argument types."
        );

      const timesIndex = data.timesIndex;
      const ownerId = data.ownerId;
      const eventId = data.eventId;
      const orderId = data.orderId;
      const diff = data.diff;

      if (typeof timesIndex === "undefined")
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Times index must be provided"
        );

      if (!ownerId)
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Owner ID must be provided"
        );

      if (!eventId)
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Event ID must be provided"
        );

      if (!orderId)
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Order ID must be provided"
        );

      if (!diff)
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Diff must be provided"
        );

      // TODO: auth check

      const eventRef = db.collection(`users/${ownerId}/events`).doc(eventId);
      const eventDoc = await eventRef.get();
      const event = eventDoc.data();

      const openingTimes = event?.openingTimes;
      if (!openingTimes)
        throw new functions.https.HttpsError("not-found", "Event not found");

      openingTimes[timesIndex].headcount += diff;

      eventRef.update({ openingTimes });

      const orderRef = db
        .collection(`users/${ownerId}/events/${eventId}/orders`)
        .doc(orderId);
      orderRef.update({
        receivingDatetime: {
          from: openingTimes[timesIndex].from,
          to: openingTimes[timesIndex].to,
          timesIndex,
        },
        status: "adjusted",
      });

      return { status: "success", body: null };
    }
  );

export const sendEmail = _sendEmail;
