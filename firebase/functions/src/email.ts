import * as functions from "firebase-functions";
import { db } from "./init";
import sgMail from "@sendgrid/mail";
import { requireAuth } from "./utils";
import { CommonFirestore, CommonFunctions } from "../../../common/types";
import { Firestore } from "./types";
import t from "io-ts";

export const sendAdjustingEmail = functions
  .region("asia-northeast1")
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

const generateEmailMessage = (order: any, customer: any) => ({
  to: customer.email,
  from: "hosokawa@heyho.fans",
  subject: "受取日程調整のお願い",
  text: generateEmailBody(order.iam),
});

const generateEmailBody = (iam: string) => `
以下の URL より受取日程を調整してください \n ${generateUrl(iam)}
`;

const generateUrl = (iam: string) => `https://heyho.fans/iam/${iam}`;

const isTestEmailAdress = (email: string) =>
  /r(\+.+)?@hosokawa\.dev/.test(email) ||
  /yu\.1hpa(\+.+)?@gmail\.com$/.test(email);
