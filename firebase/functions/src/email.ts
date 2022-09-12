import * as functions from "firebase-functions";
import { fetchFromEc, saveToFirestore } from "./ec";
import { db } from "./init";
import sgMail from "@sendgrid/mail";
import { requireAuth } from ".";

export const sendEmail = functions
  .region("asia-northeast1")
  .runWith({ secrets: ["SENDGRID_API_KEY"] })
  .https.onCall(async (data, context) => {
    const userId = requireAuth(context);

    const eventId = data.eventId;

    if (!eventId)
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Event ID must be provided"
      );

    const unadjustedOrdersRef = db.collection(
      `users/${userId}/events/${eventId}/orders`
    );
    const unadjustedOrdersSnapshop = await unadjustedOrdersRef
      .where("status", "==", "unadjusted")
      .get();
    const unadjustedOrders = unadjustedOrdersSnapshop.docs.map((doc) =>
      doc.data()
    );
    const unadjustedOrderRefs = unadjustedOrdersSnapshop.docs.map(
      (doc) => doc.ref
    );

    const sgMailApiKey = process.env.SENDGRID_API_KEY;

    if (!sgMailApiKey)
      throw new functions.https.HttpsError(
        "internal",
        "SendGrid API key is not set"
      );

    sgMail.setApiKey(sgMailApiKey);

    await Promise.all(
      unadjustedOrders.map(async (order, i) => {
        const customerSnapshot = await order.customerRef.get();
        const customer = customerSnapshot.data();

        const message = generateEmailMessage(order, customer);

        try {
          await sgMail.send(message);
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

    return { status: "ok" };
  });

const generateEmailMessage = (order: any, customer: any) => ({
  to: customer.email,
  from: "hosokawa@heyho.funs",
  subject: "受取日程調整のお願い",
  text: generateEmailBody(order.iam),
});

const generateEmailBody = (iam: string) => `
以下の URL より受取日程を調整してください \n ${generateUrl(iam)}
`;

const generateUrl = (iam: string) => `https://heyho.funs/iam/${iam}`;
