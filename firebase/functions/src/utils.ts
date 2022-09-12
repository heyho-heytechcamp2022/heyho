import * as functions from "firebase-functions";

export const requireAuth = (context: functions.https.CallableContext) => {
  if (!context.auth)
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );

  return context.auth.uid;
};
