import * as functions from "firebase-functions";
import { fetchFromEc, saveToFirestore } from "./ec";
import { db } from "./init";

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

    const ecData = await fetchFromEc("stoers", "", "");
    if (!ecData) return;
    await saveToFirestore(uid, ecData);
  });

const requireAuth = (context: functions.https.CallableContext) => {
  if (!context.auth)
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );

  return context.auth.uid;
};
