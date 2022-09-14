<script setup lang="ts">
import { httpsCallable } from "@firebase/functions";
import { CommonFunctions } from "@common";
import { ref, reactive } from "vue";
import QRReader from "~/components/QRReader.vue";
import * as t from "io-ts";
import { Functions } from "~/types";
import { functions } from "~/firebase";

interface IState {
  iamFromQr: string;
}

const state = reactive<IState>({
  iamFromQr: "",
});

const onScan = async (code: string) => {
  state.iamFromQr = code;
  const _result = await httpsCallable<
    t.TypeOf<typeof CommonFunctions.FindOrderByIam.In>,
    t.TypeOf<typeof Functions.FindOrderByIam.Out>
  >(
    functions,
    "findOrderByIam"
  )({ iam: String(state.iamFromQr) }).then((res) => res.data);

  const result = _result.body;

  const orderStatus = ref(result.order.data.status);
  const res = await httpsCallable<
    t.TypeOf<typeof CommonFunctions.UpdateOrderStatus.In>,
    t.TypeOf<typeof CommonFunctions.UpdateOrderStatus.Out>
  >(
    functions,
    "updateOrderStatus"
  )({
    ownerId: result.owner.id,
    eventId: result.event.id,
    orderId: result.order.id,
  }).then((res) => res.data);

  if (res.status === "success") {
    orderStatus.value = "completed";
    location.reload();
  }
};

const isEnable = ref(false);
</script>

<template>
  <div>
    <div class="box">
      <button @click="isEnable = !isEnable">ON/OFF</button>
      <QRReader @scan="onScan" v-if="isEnable"></QRReader>
      <div class="info">
        <div>QRデータ:</div>
        <div>{{ state.iamFromQr }}</div>
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
