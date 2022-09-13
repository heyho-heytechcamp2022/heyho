<script setup lang="ts">
import { httpsCallable } from "@firebase/functions";
import { Timestamp, collection, addDoc } from "firebase/firestore";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { db, auth, getUser, functions } from "~/firebase";
import axios from "axios";

const route = useRoute();

const iam = String(route.params.iam);

// TODO: type safe
const result = (await httpsCallable(
  functions,
  "findOrderByIam"
)({ iam }).then((res) => res.data)) as any;

console.log(result);

const orderStatus = ref(result.order.data.status);

const selectDatetime = async (n: number, diff: number) => {
  // TODO: type safe
  const res = (await httpsCallable(
    functions,
    "updateHeadcount"
  )({
    ownerId: result.owner.id,
    eventId: result.event.id,
    orderId: result.order.id,
    timesIndex: n,
    diff,
  }).then((res) => res.data)) as { status: string };

  if (res.status === "ok") {
    orderStatus.value = "adjusted";
    // TODO: should be without reload
    location.reload();
  }
};

const generateQrCodeImageLink = (data: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURI(
    data
  )}&size=300x300`;
</script>

<template>
  <div v-if="orderStatus === 'adjusting'">
    <h1>日程調整</h1>
    <p>{{ result.customer.data.name }} さん日程調整をしてください。</p>
    <div v-for="(range, i) in result.event.data.openingTimes" :key="range.from">
      {{ range.from }} 〜 {{ range.to }}
      <button @click="selectDatetime(i, 1)">この時間を選択</button>
    </div>
  </div>
  <div v-if="orderStatus === 'adjusted'">
    <h1>日程調整完了</h1>
    <p>日程調整が完了しました。</p>
    <p>
      {{ result.customer.data.name }} さんの受取日時は
      {{ result.order.data.receivingDatetime.from }} 〜
      {{ result.order.data.receivingDatetime.to }} です。
    </p>
    <p>QR コードは以下です。</p>
    <img :src="generateQrCodeImageLink(iam)" alt="QR Code" />
  </div>
</template>
