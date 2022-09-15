<script setup lang="ts">
import { httpsCallable } from "@firebase/functions";
import { CommonFunctions } from "@common";
import { ref, reactive } from "vue";
import QRReader from "~/components/QRReader.vue";
import * as t from "io-ts";
import { Functions } from "~/types";
import { db, functions } from "~/firebase";
import { Firestore } from "~/types";
import { getDoc, doc } from "firebase/firestore";

interface IState {
  iamFromQr: string;
}

const state = reactive<IState>({
  iamFromQr: "",
});

type OrderItems = {
  name: string;
  quantity: number;
}[];

const orderItems = ref<OrderItems>();
const result = ref<t.TypeOf<typeof Functions.FindOrderByIam.Out>["body"]>();
const isEnable = ref(true);
const showGoods = ref(false);

const onScan = async (code: string) => {
  state.iamFromQr = code;
  const _result = await httpsCallable<
    t.TypeOf<typeof CommonFunctions.FindOrderByIam.In>,
    t.TypeOf<typeof Functions.FindOrderByIam.Out>
  >(
    functions,
    "findOrderByIam"
  )({ iam: String(state.iamFromQr) }).then((res) => res.data);

  result.value = _result.body;
  orderItems.value = await Promise.all(
    _result.body.order.data.items.map(async (item) => {
      console.log(item.itemRef._path.segments.join("/"));
      const itemRef = doc(db, item.itemRef._path.segments.join("/"));
      const docSnap = await getDoc(
        itemRef.withConverter(Firestore.converter(Firestore.Item))
      );
      const docData = docSnap.data();
      if (!docData) throw new Error("docData is not found");
      showGoods.value = true;
      return {
        name: docData.name,
        quantity: item.quantity,
      };
    })
  );
};

const updateOrderStatus = async () => {
  if (!result.value) {
    return;
  }
  const orderStatus = ref(result.value.order.data.status);
  const res = await httpsCallable<
    t.TypeOf<typeof CommonFunctions.UpdateOrderStatus.In>,
    t.TypeOf<typeof CommonFunctions.UpdateOrderStatus.Out>
  >(
    functions,
    "updateOrderStatus"
  )({
    ownerId: result.value.owner.id,
    eventId: result.value.event.id,
    orderId: result.value.order.id,
  }).then((res) => res.data);

  if (res.status === "success") {
    orderStatus.value = "completed";
    location.reload();
  }
};
</script>

<template>
  <div>
    <div class="box">
      <button @click="isEnable = !isEnable">ON/OFF</button>
      <QRReader @scan="onScan" v-if="isEnable"></QRReader>
      <div v-for="orderItem in orderItems">
        <p>{{ orderItem.name }}</p>
        <p>{{ orderItem.quantity }}</p>
      </div>
      <div v-if="showGoods">
        <button @click="updateOrderStatus()">確認</button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.box {
  max-width: 600px;
  margin: 0 auto;
}

.info {
  word-break: break-all;
}
</style>
