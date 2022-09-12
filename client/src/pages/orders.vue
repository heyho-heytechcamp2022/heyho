<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  DocumentReference,
} from "firebase/firestore";
import { db, getUser } from "~/firebase";

const route = useRoute();
const { userId } = await getUser();

// TODO: route gurde ができたら delete
if (!userId) {
  throw new Error("userId is not found");
}

const eventId = String(route.params.eventId);

const q = query(collection(db, `users/${userId}/events/${eventId}/items`));
const querySnapshot = await getDocs(q);
const items = querySnapshot.docs.map((doc) => ({
  docId: doc.id,
  ...(doc.data() as { id: string; name: string; eventRef: DocumentReference }),
}));

const q2 = query(collection(db, `users/${userId}/events/${eventId}/orders`));
const querySnapshot2 = await getDocs(q2);
const orders = querySnapshot2.docs.map((doc) => ({
  docId: doc.id,
  ...(doc.data() as {
    id: string;
    name: string;
    customerId: string;
    customerRef: DocumentReference;
    iam: string;
    items: { id: string; itemRef: DocumentReference; quantity: number }[];
    status: string;
  }),
}));

console.log(items);

const handlingItems = items.filter(
  (item) =>
    item.eventRef?.id === doc(db, `users/${userId}/events/${eventId}`).id
);

const handlingOrders = orders
  .map((order) => {
    return {
      ...order,
      items: order.items.filter((item) =>
        handlingItems.some(
          (handlingItem) => handlingItem.docId === item.itemRef.id
        )
      ),
    };
  })
  .filter((order) => order.items.length > 0);

const handlingOrdersAndCustomers = await Promise.all(
  handlingOrders.map(async (order) => {
    console.log(order);
    return {
      order,
      // TODO: 並列化
      customer: await getDoc(order.customerRef).then((doc) => doc.data()),
    };
  })
);

// TODO: リロードしなくても反映されるように
const updateItemEvent = async (id: string, eventId: string) => {
  const itemDocRef = doc(db, `users/${userId}/events/${eventId}/items`, id);
  const eventDocRef = doc(db, `users/${userId}/events`, eventId);
  await updateDoc(itemDocRef, {
    eventRef: eventDocRef,
  });
};
</script>

<template>
  <h1>注文一覧</h1>
  <h2>連携設定</h2>
  <h3>グッズ選択</h3>
  <div>
    <div v-for="item in items" :key="item.docId">
      <div>{{ item.name }}</div>
      <button
        v-if="item.eventRef?.id !== eventId"
        @click="updateItemEvent(item.docId, eventId)"
      >
        選択
      </button>
      <button v-else @click="updateItemEvent(item.docId, '')">解除</button>
    </div>
  </div>
  <h3>注文一覧</h3>

  <div
    v-for="orderAndCustomer in handlingOrdersAndCustomers"
    :key="orderAndCustomer.order.id"
  >
    {{ orderAndCustomer.customer?.name }} {{ orderAndCustomer.customer?.email }}
    <div v-for="item in orderAndCustomer.order.items" :key="item.id">
      {{ item.itemRef.id }} {{ item.quantity }}
    </div>
  </div>
</template>
