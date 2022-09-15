<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  DocumentReference,
  onSnapshot,
} from "firebase/firestore";
import { db, getUser } from "~/firebase";
import { CommonFirestore } from "@common";
import { Firestore } from "~/types";
import ToggleSwitch from "~/components/ToggleSwitch.vue";
import * as t from "io-ts";

const route = useRoute();
const { userId } = await getUser();

if (!userId) {
  throw new Error("userId is not found");
}

const eventId = String(route.params.eventId);

const q = query(
  collection(db, `users/${userId}/events/${eventId}/items`)
).withConverter(Firestore.converter(Firestore.Item));

let items = ref<(t.TypeOf<typeof Firestore.Item> & { docId: string })[]>([]);

const unsub = onSnapshot(q, async (querySnapshot) => {
  items.value = querySnapshot.docs.map((doc) => ({
    docId: doc.id,
    ...doc.data(),
  }));
  await updateHandlingOrdersAndCustomers();
});

type Order = t.TypeOf<typeof Firestore.Order> & { docId: string };

let orders = ref<Order[]>([]);

const handlingOrdersAndCustomers = ref<
  {
    order: Order;
    customer: t.TypeOf<typeof CommonFirestore.Customer>;
  }[]
>();

const q2 = query(
  collection(db, `users/${userId}/events/${eventId}/orders`)
).withConverter(Firestore.converter(Firestore.Order));

const unsub2 = onSnapshot(q2, async (querySnapshot) => {
  orders.value = querySnapshot.docs.map((doc) => ({
    docId: doc.id,
    ...doc.data(),
  }));
  await updateHandlingOrdersAndCustomers();
});

const updateHandlingOrdersAndCustomers = async () => {
  const handlingItems = items.value.filter(
    (item) =>
      item.eventRef?.id === doc(db, `users/${userId}/events/${eventId}`).id
  );

  const handlingOrders = orders.value
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

  handlingOrdersAndCustomers.value = await Promise.all(
    handlingOrders.map(async (order) => {
      const docSnap = await getDoc(
        order.customerRef.withConverter(
          Firestore.converter(CommonFirestore.Customer)
        )
      );
      const docData = docSnap.data();
      if (!docData) throw new Error("docData is not found");

      return {
        order,
        customer: docData,
      };
    })
  );
};

onUnmounted(() => {
  unsub();
  unsub2();
});

const updateItemEvent = async (id: string, willSelect: boolean) => {
  const itemDocRef = doc(
    db,
    `users/${userId}/events/${eventId}/items`,
    id
  ).withConverter(Firestore.converter(Firestore.Item));
  const eventDocRef = doc(db, `users/${userId}/events`, eventId).withConverter(
    Firestore.converter(Firestore.Event)
  );
  await updateDoc(itemDocRef, {
    eventRef: willSelect ? eventDocRef : null,
  });
};

const updateStatus = async (index: number) => {
  if (!handlingOrdersAndCustomers.value) return;

  const statusDocRef = doc(
    db,
    `users/${userId}/events/${eventId}/orders`,
    handlingOrdersAndCustomers.value[index].order.docId
  ).withConverter(Firestore.converter(Firestore.Order));
  const statusDocSnap = await getDoc(statusDocRef);
  if (
    statusDocSnap.data()?.status !== "completed" &&
    confirm("「済」に変更しますか？")
  ) {
    await updateDoc(statusDocRef, {
      status: "completed",
    });
  }
};

const isShowStatus = ref(true);
const isShowRecieve = ref(true);
const isShowAddress = ref(true);
const isShowTel = ref(true);
</script>

<template>
  <div class="h1-wrap">
    <h1>注文一覧</h1>
  </div>
  <div class="orders">
    <h2>連携設定</h2>

    <h2>グッズ選択</h2>
    <div class="selecting-goods">
      <div v-for="item in items" :key="item.docId" class="item-row">
        <button
          class="button --selected"
          v-if="item.eventRef?.id === eventId"
          @click="updateItemEvent(item.docId, false)"
        >
          <span class="material-symbols-outlined"> check_box </span>
        </button>
        <button
          class="button --unselected"
          v-else
          @click="updateItemEvent(item.docId, true)"
        >
          <span class="material-symbols-outlined">
            check_box_outline_blank
          </span>
        </button>
        <p class="name">{{ item.name }}</p>
      </div>
    </div>

    <h2>注文一覧</h2>
    <ul class="is_show">
      <li>ステータス<ToggleSwitch v-model="isShowStatus" /></li>
      <li>受取予定時間<ToggleSwitch v-model="isShowRecieve" /></li>
      <li>住所<ToggleSwitch v-model="isShowAddress" /></li>
      <li>電話番号<ToggleSwitch v-model="isShowTel" /></li>
    </ul>
    <table class="admin_user-list_recieved_goods">
      <thead>
        <tr>
          <th v-if="isShowStatus">ステータス</th>
          <th>名前</th>
          <th v-if="isShowRecieve">受取予定時間</th>
          <!-- TODO: 受け取った時間の値を用意
        <th>受け取った時間</th>
        -->
          <th v-if="isShowAddress">住所</th>
          <th v-if="isShowTel">電話番号</th>
        </tr>
      </thead>
      <tbody
        v-for="(eventOrderAndCustomer, index) in handlingOrdersAndCustomers"
        :key="eventOrderAndCustomer.order.id"
      >
        <tr>
          <td v-if="isShowStatus">
            <button
              class="status_recieved"
              v-if="eventOrderAndCustomer.order.status === 'completed'"
              @click="updateStatus(index)"
            >
              済
            </button>
            <button
              class="status_not-yet-recieved"
              v-else
              @click="updateStatus(index)"
            >
              未
            </button>
          </td>
          <td>{{ eventOrderAndCustomer.customer?.name }}</td>
          <td v-if="isShowRecieve">
            {{ eventOrderAndCustomer.order.receiptDatetime }}
          </td>
          <!-- TODO: 受け取った時間の値を用意
        <td>{{ eventOrderAndCustomer.order.recievedtime }}</td>
        -->
          <td v-if="isShowAddress">
            {{ eventOrderAndCustomer.customer?.address }}
          </td>
          <td v-if="isShowTel">{{ eventOrderAndCustomer.customer.phone }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
@use "~/styles";

.h1-wrap {
  @include styles.h1-wrap;
}

.orders {
  @include styles.a-content;
}

h2 {
  margin-bottom: 10px;
  font-size: 20px;
  border-bottom: 1px solid #ccc;
  &:not(:first-child) {
    margin-top: 30px;
  }
}

.selecting-goods {
  .item-row {
    @include styles.center;
    justify-content: flex-start;
    margin: 10px 0;
    .button {
      @include styles.clickable;
      &.--selected {
        color: styles.$c-primary;
      }
      &.--unselected {
        color: #ccc;
      }
    }
    .name {
      margin-left: 20px;
    }
  }
}

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

ul {
  display: flex;
  justify-content: center;
}

li {
  display: flex;
  list-style: none;
  margin-left: 20px;
}
</style>
