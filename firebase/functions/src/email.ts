import { CommonFirestore } from "../../../common/types";
import { Firestore } from "./types";
import t from "io-ts";

export const generateEmailMessage = (
  order: t.TypeOf<typeof Firestore.Order>,
  customer: t.TypeOf<typeof CommonFirestore.Customer>
) => ({
  to: customer.email,
  from: "hosokawa@heyho.fans",
  subject: "受取日程調整のお願い",
  text: generateEmailBody(order.iam),
});

const generateEmailBody = (iam: string) => `
以下の URL より受取日程を調整してください \n ${generateUrl(iam)}
`;

const generateUrl = (iam: string) => `https://heyho.fans/iam/${iam}`;

export const isTestEmailAdress = (email: string) =>
  /r(\+.+)?@hosokawa\.dev/.test(email) ||
  /yu\.1hpa(\+.+)?@gmail\.com$/.test(email) ||
  "DEMO_EMAIL" === email;
