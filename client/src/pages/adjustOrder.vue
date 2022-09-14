<script setup lang="ts">
import { httpsCallable } from "@firebase/functions";
import { Timestamp, collection, addDoc } from "firebase/firestore";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { db, auth, getUser, functions } from "~/firebase";
import axios from "axios";
import { CommonFunctions } from "@common";
import { Firestore, Functions } from "~/types";
import * as t from "io-ts";
import Button from "~/components/Button.vue";

const route = useRoute();

const iam = String(route.params.iam);

const _result = await httpsCallable<
  t.TypeOf<typeof CommonFunctions.FindOrderByIam.In>,
  t.TypeOf<typeof Functions.FindOrderByIam.Out>
>(
  functions,
  "findOrderByIam"
)({ iam }).then((res) => res.data);

const result = _result.body;

const orderStatus = ref(result.order.data.status);

const selectDatetime = async (n: number, diff: number) => {
  const res = (await httpsCallable<
    t.TypeOf<typeof CommonFunctions.UpdateHeadcount.In>,
    t.TypeOf<typeof CommonFunctions.UpdateHeadcount.Out>
  >(
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
    orderStatus.value = "reserved";
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
    <div
      v-for="(range, i) in result.event.data.openingTimes"
      :key="String(range.from)"
    >
      {{ range.from }} 〜 {{ range.to }}
      <Button @click="selectDatetime(i, 1)" text="この時間を選択" />
    </div>
  </div>
  <div v-if="orderStatus === 'reserved'">
    <h1>日程調整完了</h1>
    <p>日程調整が完了しました。</p>
    <p>
      {{ result.customer.data.name }} さんの受取日時は
      {{ result.order.data.receiptDatetime?.from }} 〜
      {{ result.order.data.receiptDatetime?.to }} です。
    </p>
    <p>QR コードは以下です。</p>
    <img :src="generateQrCodeImageLink(iam)" alt="QR Code" />
  </div>
</template>
