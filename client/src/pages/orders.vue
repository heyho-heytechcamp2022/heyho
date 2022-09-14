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
import { CommonFirestore } from "@common";
import { Firestore } from "~/types";
import ToggleSwitch from "~/components/ToggleSwitch.vue";

const route = useRoute();
const { userId } = await getUser();

// TODO: route gurde ができたら delete
if (!userId) {
  throw new Error("userId is not found");
}

const eventId = String(route.params.eventId);

const q = query(
  collection(db, `users/${userId}/events/${eventId}/items`)
).withConverter(Firestore.converter(Firestore.Item));
const querySnapshot = await getDocs(q);
const items = querySnapshot.docs.map((doc) => ({
  docId: doc.id,
  ...doc.data(),
}));

const q2 = query(
  collection(db, `users/${userId}/events/${eventId}/orders`)
).withConverter(Firestore.converter(Firestore.Order));
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

// TODO: リロードしなくても反映されるように
const updateStatus = async (index: number) => {
  const statusDocRef = doc(
    db,
    `users/${userId}/events/${eventId}/orders`,
    handlingOrdersAndCustomers[index].order.docId
  );
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
          @click="updateItemEvent(item.docId, '')"
        >
          <span class="material-symbols-outlined"> check_box </span>
        </button>
        <button
          class="button --unselected"
          v-else
          @click="updateItemEvent(item.docId, eventId)"
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
        <td v-if="isShowTel">{{ eventOrderAndCustomer.customer?.tel }}</td>
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
