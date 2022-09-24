import * as functions from "firebase-functions";
import { fetchFromEc, saveToFirestore } from "./ec";
import { db } from "./init";
import { CommonFirestore, CommonFunctions } from "../../../common/types";
import { Functions, Firestore } from "./types";
import t from "io-ts";
import {
  DocumentReference,
  Timestamp,
  FieldValue,
} from "firebase-admin/firestore";
import { requireAuth } from "./utils";
import sgMail from "@sendgrid/mail";
import { generateEmailMessage, isTestEmailAdress } from "./email";

const REGION = "asia-northeast1";

export const createUserCollection = functions
  .region(REGION)
  .auth.user()
  .onCreate((user) => {
    db.collection("users").doc(user.uid).set({
      email: user.email,
      displayName: user.displayName,
      userId: user.uid,
    });
  });

export const updateOrdersOnCreate = functions
  .region(REGION)
  .firestore.document("users/{userId}/events/{eventId}")
  .onCreate(async (snap, context) => {
    const { userId, eventId } = context.params as {
      userId: string;
      eventId: string;
    };

    const ecData = await fetchFromEc("stores", "", "");
    if (!ecData) return;

    await saveToFirestore(userId, eventId, ecData);

    return { success: true };
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

      const eventRef = db
        .collection(`users/${ownerId}/events`)
        .doc(eventId)
        .withConverter(Firestore.converter(Firestore.Event));
      const eventDoc = await eventRef.get();
      const event = eventDoc.data();

      const openingTimes = event?.openingTimes;
      if (!openingTimes)
        throw new functions.https.HttpsError("not-found", "Event not found");

      openingTimes[timesIndex].headcount += diff;

      eventRef.update({ openingTimes });

      const orderRef = db
        .collection(`users/${ownerId}/events/${eventId}/orders`)
        .doc(orderId)
        .withConverter(Firestore.converter(Firestore.Order));
      orderRef.update({
        receiptDatetime: {
          from: openingTimes[timesIndex].from,
          to: openingTimes[timesIndex].to,
          timesIndex,
        },
        status: "reserved",
      });

      return { status: "success", body: null };
    }
  );

export const updateOrderStatus = functions
  .region(REGION)
  .https.onCall(
    async (
      data,
      context
    ): Promise<t.TypeOf<typeof CommonFunctions.UpdateOrderStatus.Out>> => {
      if (!CommonFunctions.UpdateOrderStatus.In.is(data))
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid argument types."
        );

      const ownerId = data.ownerId;
      const eventId = data.eventId;
      const orderId = data.orderId;

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

      const statusRef = db
        .collection(`users/${ownerId}/events/${eventId}/orders`)
        .doc(orderId)
        .withConverter(Firestore.converter(Firestore.Order));
      statusRef.update({
        status: "completed",
        recievedDateTime: Timestamp.now(),
      });

      return { status: "success", body: null };
    }
  );

export const inviteStuffByEmail = functions
  .region(REGION)
  .https.onCall(
    async (
      data
    ): Promise<t.TypeOf<typeof CommonFunctions.InviteStuffByEmail.Out>> => {
      if (!CommonFunctions.InviteStuffByEmail.In.is(data))
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid argument types."
        );

      const ownerId = data.ownerId;
      const eventId = data.eventId;
      const email = data.email;

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

      if (!email)
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Email must be provided"
        );

      const querySnapshot = await db
        .collection(`users`)
        .withConverter(Firestore.converter(CommonFirestore.Owner))
        .where("email", "==", email)
        .get();

      if (querySnapshot.empty) return { status: "error", body: null };

      const statusRef = db
        .doc(`users/${ownerId}/events/${eventId}`)
        .withConverter(Firestore.converter(Firestore.Event));
      statusRef.update({
        staffEmails: FieldValue.arrayUnion(email),
      });

      return { status: "success", body: null };
    }
  );

export const sendAdjustingEmail = functions
  .region(REGION)
  .runWith({ secrets: ["SENDGRID_API_KEY"] })
  .https.onCall(
    async (
      data,
      context
    ): Promise<t.TypeOf<typeof CommonFunctions.SendAdjustingEmail.Out>> => {
      const userId = requireAuth(context);

      if (!CommonFunctions.SendAdjustingEmail.In.is(data))
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Invalid argument types."
        );

      const eventId = data.eventId;

      if (!eventId)
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Event ID must be provided"
        );

      const unadjustedOrdersRef = db
        .collection(`users/${userId}/events/${eventId}/orders`)
        .withConverter(Firestore.converter(Firestore.Order));
      const unadjustedOrdersSnapshop = await unadjustedOrdersRef
        .where("status", "==", "unadjusted")
        .get();
      const unadjustedOrders = unadjustedOrdersSnapshop.docs.map((doc) =>
        doc.data()
      );
      const unadjustedOrderRefs = unadjustedOrdersSnapshop.docs.map(
        (doc) => doc.ref
      );

      const ownerSnap = await db
        .doc(`users/${userId}`)
        .withConverter(Firestore.converter(CommonFirestore.Owner))
        .get();
      const ownerData = ownerSnap.data();
      if (!ownerData)
        throw new functions.https.HttpsError("not-found", "Owner not found");

      const ownerEmail = ownerData.email;

      const sgMailApiKey = process.env.SENDGRID_API_KEY;

      if (!sgMailApiKey)
        throw new functions.https.HttpsError(
          "internal",
          "SendGrid API key is not set"
        );

      sgMail.setApiKey(sgMailApiKey);

      await Promise.all(
        unadjustedOrders.map(async (order, i) => {
          const customerSnapshot = await order.customerRef
            .withConverter(Firestore.converter(CommonFirestore.Customer))
            .get();
          const customer = customerSnapshot.data();

          if (!customer) return;

          // allow to send test emails
          if (!isTestEmailAdress(customer.email)) {
            console.log("Not sending email to " + customer.email);
            return;
          }

          if (customer.email === "DEMO_EMAIL") customer.email = ownerEmail;

          const message = generateEmailMessage(order, customer);

          try {
            await sgMail.send(message);
            console.log(`Email sent to ${customer.email}`);
          } catch (error) {
            console.error(error);
            // TODO: make type safe
            // @ts-ignore
            if (error.response) {
              // @ts-ignore
              console.error(error.response.body);
            }
            return;
          }

          await unadjustedOrderRefs[i].update({
            status: "adjusting",
          });
        })
      );

      return { status: "success", body: null };
    }
  );
