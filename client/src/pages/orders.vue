<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  collection,
  doc,
  getDoc,
  updateDoc,
  query,
  onSnapshot,
} from "firebase/firestore";
import { db, functions, getUser } from "~/firebase";
import { CommonFirestore, CommonFunctions } from "@common";
import { Firestore } from "~/types";
import ToggleSwitch from "~/components/ToggleSwitch.vue";
import * as t from "io-ts";
import { httpsCallable } from "@firebase/functions";
import Button from "~/components/Button.vue";

const route = useRoute();
const router = useRouter();
const { userId, user } = await getUser();

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
    confirm("?????????????????????????????????")
  ) {
    await updateDoc(statusDocRef, {
      status: "completed",
    });
  }
};

const sendAdjustingEmails = async () => {
  const res = await httpsCallable<
    t.TypeOf<typeof CommonFunctions.SendAdjustingEmail.In>,
    t.TypeOf<typeof CommonFunctions.SendAdjustingEmail.Out>
  >(
    functions,
    "sendAdjustingEmail"
  )({
    eventId,
  }).then((res) => res.data);

  if (res.status === "success") {
    alert("??????????????????????????????");
  } else {
    alert("???????????????????????????????????????");
  }
};

const switchToQrReader = () => {
  router.push(`/events/${eventId}/orders/check`);
};

const isShowStatus = ref(true);
const isShowRecieve = ref(true);
const isShowAddress = ref(true);
const isShowTel = ref(true);
</script>

<template>
  <div class="h1-wrap">
    <h1>????????????</h1>
    <div class="button-wrap">
      <Button
        @click="switchToQrReader"
        text="QR????????????????????????"
        size="small"
        icon="qr_code"
      />
    </div>
  </div>
  <div class="orders">
    <h2>EC ???????????????????????????</h2>
    <p>
      ?????????????????????????????????????????????????????????????????????????????????????????????????????????????????????
      EC ?????????????????????????????????????????????????????????????????????
    </p>

    <h2>???????????????????????????????????????</h2>
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

    <h2>??????????????????????????????????????????????????????</h2>
    <div>
      <p>
        ???
        {{ user?.email }}
        ???????????????????????????????????????????????????????????????????????????????????????????????????????????????
      </p>
      <Button
        @click="sendAdjustingEmails"
        text="??????????????????????????????????????????"
        size="small"
      />
    </div>

    <h2>????????????</h2>
    <ul class="is_show">
      <li>???????????????<ToggleSwitch v-model="isShowStatus" id="status" /></li>
      <li>??????????????????<ToggleSwitch v-model="isShowRecieve" id="time" /></li>
      <li>??????<ToggleSwitch v-model="isShowAddress" id="address" /></li>
      <li>????????????<ToggleSwitch v-model="isShowTel" id="phone" /></li>
    </ul>
    <table class="admin_user-list_recieved_goods">
      <thead>
        <tr>
          <th v-if="isShowStatus">???????????????</th>
          <th>??????</th>
          <th v-if="isShowRecieve">??????????????????</th>
          <th>?????????????????????</th>
          <th v-if="isShowAddress">??????</th>
          <th v-if="isShowTel">????????????</th>
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
              ???
            </button>
            <button
              class="status_not-yet-recieved"
              v-else
              @click="updateStatus(index)"
            >
              ???
            </button>
          </td>
          <td>{{ eventOrderAndCustomer.customer?.name }}</td>
          <td v-if="isShowRecieve">
            {{
              eventOrderAndCustomer.order.receiptDatetime?.from
                .toDate()
                .toLocaleString()
            }}
            ~
            {{
              eventOrderAndCustomer.order.receiptDatetime?.to
                .toDate()
                .toLocaleString()
            }}
          </td>
          <td>
            {{
              eventOrderAndCustomer.order.recievedDateTime
                ?.toDate()
                .toLocaleTimeString()
            }}
          </td>
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
  display: flex;
  justify-content: space-between;
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
    padding: 5px 10px;
    text-align: left;
    border-top: 2px solid #ccc;
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
