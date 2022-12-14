import { DocumentReference } from "firebase-admin/firestore";
import { db } from "./init";
import { dummyItems, dummyCustomers, dummyOrders } from "./dummyData";
import * as crypto from "crypto";
import { EcSite } from "../../../common/types";
import t from "io-ts";
import { Firestore } from "./types";
import { CommonFirestore } from "../../../common/types";

export type Item = { id: string; name: string };
export type Order = {
  id: string;
  customerId: string;
  items: { id: string; quantity: number }[];
};
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

const generateIam = () => crypto.randomBytes(16).toString("hex");

export const saveToFirestore = async (
  userId: string,
  eventId: string,
  data: {
    items: Item[];
    orders: Order[];
    customers: Customer[];
  }
) => {
  // TODO: use transactions

  const items = data.items;
  const orders = data.orders;
  const customers = data.customers;

  const itemRefMap = new Map<Item["id"], DocumentReference>();

  await Promise.all(
    items.map(async (item) => {
      const newItemRef = await db
        .collection(`users/${userId}/events/${eventId}/items`)
        .add({
          eventRef: null,
          ...item,
        });
      itemRefMap.set(item.id, newItemRef);
    })
  );

  const customerRefMap = new Map<Customer["id"], DocumentReference>();

  await Promise.all(
    customers.map(async (customer) => {
      const newCustomerRef = await db
        .collection(`users/${userId}/events/${eventId}/customers`)
        .withConverter(Firestore.converter(CommonFirestore.Customer))
        .add(customer);
      customerRefMap.set(customer.id, newCustomerRef);
    })
  );

  await Promise.all(
    orders.map(async (order) => {
      const customerRef = customerRefMap.get(order.customerId);

      if (!customerRef) return;

      await db
        .collection(`users/${userId}/events/${eventId}/orders`)
        .withConverter(Firestore.converter(Firestore.Order))
        .add({
          ...order,
          items: order.items.map((item) => {
            const itemRef = itemRefMap.get(item.id);
            if (!itemRef) {
              throw new Error("ItemRef not found:" + item.id);
            }
            return {
              ...item,
              itemRef: itemRef,
            };
          }),
          customerRef,
          status: "unadjusted",
          iam: generateIam(),
          receiptDatetime: null,
          recievedDateTime: null,
        });
    })
  );
};

export const fetchFromEc = async (
  type: t.TypeOf<typeof EcSite>,
  shopId: string,
  apiKey: string
) => {
  // TODO
  if (type === "stores") {
    return await fetchFromStoers(shopId, apiKey);
  } else if (type === "base") {
    return await fetchFromStoers(shopId, apiKey);
  } else if (type === "shopify") {
    return await fetchFromStoers(shopId, apiKey);
  }

  return await fetchFromStoers(shopId, apiKey);
};

const fetchFromStoers = async (shopId: string, apiKey: string) => {
  return {
    items: dummyItems,
    orders: dummyOrders,
    customers: dummyCustomers,
  };
};
