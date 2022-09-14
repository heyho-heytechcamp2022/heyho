import { DocumentReference } from "firebase-admin/firestore";
import { db } from "./init";
import * as crypto from "crypto";
import { EcSite } from "../../../common/types";
import t from "io-ts";

type Item = { id: string; name: string };
type Order = {
  id: string;
  customerId: string;
  items: { id: string; quantity: number }[];
};
type Customer = {
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
        .add(customer);
      customerRefMap.set(customer.id, newCustomerRef);
    })
  );

  await Promise.all(
    orders.map(async (order) => {
      await db.collection(`users/${userId}/events/${eventId}/orders`).add({
        ...order,
        items: order.items.map((item) => ({
          ...item,
          itemRef: itemRefMap.get(item.id),
        })),
        customerRef: customerRefMap.get(order.customerId),
        status: "unadjusted",
        iam: generateIam(),
        receiptDatetime: null,
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

const dummyItems: Item[] = [
  { id: "1", name: "item1" },
  { id: "2", name: "item2" },
  { id: "3", name: "item3" },
];

const dummyOrders: Order[] = [
  { id: "1", customerId: "1", items: [{ id: "1", quantity: 1 }] },
  {
    id: "2",
    customerId: "2",
    items: [
      { id: "1", quantity: 1 },
      { id: "2", quantity: 2 },
    ],
  },
];

const dummyCustomers: Customer[] = [
  {
    id: "1",
    name: "customer1",
    email: "r+customer1@hosokawa.dev",
    phone: "000-0000-0000",
    address: "address1",
  },
  {
    id: "2",
    name: "customer2",
    email: "r+customer2@hosokawa.dev",
    phone: "001-0001-0001",
    address: "address2",
  },
];

const fetchFromStoers = async (shopId: string, apiKey: string) => {
  // TODO: implement
  return {
    items: dummyItems,
    orders: dummyOrders,
    customers: dummyCustomers,
  };
};
