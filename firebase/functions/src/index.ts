import * as functions from "firebase-functions";
import { fetchFromEc, saveToFirestore } from "./ec";
import { db } from "./init";
import { sendEmail as _sendEmail } from "./email";
import { requireAuth } from "./utils";
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

    const ecData = await fetchFromEc("stoers", "", "");
    if (!ecData) return;

    const eventId = data.eventId;
    await saveToFirestore(uid, eventId, ecData);
  });

export const findOrderByIam = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
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
      .get();
    const orderDoc = querySnapshot.docs[0];

    if (!orderDoc.exists) return null;

    const eventDoc = await orderDoc.ref.parent.parent?.get();
    if (!eventDoc) return null;

    // TODO: type safe
    const customerRef = orderDoc.data().customerRef as DocumentReference;
    const customerDoc = await customerRef.get();

    const ownerDoc = await eventDoc.ref.parent?.parent?.get();

    return {
      order: {
        id: orderDoc.id,
        data: orderDoc.data(),
      },
      event: {
        id: eventDoc?.id,
        data: eventDoc?.data(),
      },
      customer: {
        id: customerDoc.id,
        data: customerDoc.data(),
      },
      owner: {
        id: ownerDoc?.id,
        data: ownerDoc?.data(),
      },
    };
  });

//TODO: should be able to decrease when the order is adjusted
export const updateHeadcount = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
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
    if (!openingTimes) return;

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

    return { status: "ok" };
  });

export const sendEmail = _sendEmail;
