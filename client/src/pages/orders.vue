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
import { Firestore } from "@common";

const route = useRoute();
const { userId } = await getUser();

// TODO: route gurde ができたら delete
if (!userId) {
  throw new Error("userId is not found");
}

const eventId = String(route.params.eventId);

const q = query(
  collection(db, `users/${userId}/events/${eventId}/items`)
).withConverter(Firestore.converter(Firestore.Item("sdk")));
const querySnapshot = await getDocs(q);
const items = querySnapshot.docs.map((doc) => ({
  docId: doc.id,
  ...doc.data(),
}));

const q2 = query(
  collection(db, `users/${userId}/events/${eventId}/orders`)
).withConverter(Firestore.converter(Firestore.Order("sdk")));
const querySnapshot2 = await getDocs(q2);
const orders = querySnapshot2.docs.map((doc) => ({
  docId: doc.id,
  ...doc.data(),
}));

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
    const ref = order.customerRef as DocumentReference;
    return {
      order,
      // TODO: 並列化
      customer: await getDoc(ref).then((doc) => doc.data()),
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

const eventOrders = ref([
  {
    status: false,
    name: "スズキ",
    timeofreceipt: "2022/09/09 14:00 - 15:00",
    recievedtime: "14:34",
    address: "大阪府たこ焼き市お好み焼き区33-4",
    tel: "080-xxxx-xxxx",
  },
]);

const updateStatus = async (index: number) => {
  if (!eventOrders.value[index].status) {
    eventOrders.value[index].status = true;
  }
};
</script>

<template>
  <table class="admin_user-list_recieved_goods">
    <thead>
      <tr>
        <th>ステータス</th>
        <th>名前</th>
        <th>受取予定時間</th>
        <th>受け取った時間</th>
        <th>住所</th>
        <th>電話番号</th>
      </tr>
    </thead>
    <tbody v-for="(eventOrder, index) in eventOrders" :key="eventOrder.name">
      <tr>
        <td>
          <button
            class="status_recieved"
            v-if="eventOrder.status === true"
            @click="updateStatus(index)"
          >
            済
          </button>
          <button
            class="status_not-yet-recieved"
            v-else-if="eventOrder.status === false"
            @click="updateStatus(index)"
          >
            未
          </button>
        </td>
        <td></td>
        <td>{{ eventOrder.name }}</td>
        <td>{{ eventOrder.timeofreceipt }}</td>
        <td>{{ eventOrder.recievedtime }}</td>
        <td>{{ eventOrder.address }}</td>
        <td>{{ eventOrder.tel }}</td>
      </tr>
    </tbody>
  </table>

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

<style lang="scss" scoped>
.admin_user-list_recieved_goods {
  margin: 3px auto;
  thead th {
    padding: 10px;
    width: auto;
    text-align: left;
  }
  tbody td {
    max-width: 300px;
    padding: 0px 10px;
    text-align: left;
  }
}
.status_recieved {
  width: 50px;
  text-align: center;
  background-color: rgb(136, 218, 136);
  border-radius: 30px;
}
.status_not-yet-recieved {
  width: 50px;
  text-align: center;
  background-color: rgb(248, 155, 163);
  border-radius: 30px;
}
.time_of_receipt {
  max-width: 50px;
}
</style>
