import * as functions from "firebase-functions";
import { fetchFromEc, saveToFirestore } from "./ec";
import { db } from "./init";
import { sendEmail as _sendEmail } from "./email";
import { requireAuth } from "./utils";

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

export const sendEmail = _sendEmail;
