<script setup lang="ts">
import { httpsCallable } from "@firebase/functions";
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { functions } from "~/firebase";
import { CommonFunctions } from "@common";
import { Functions } from "~/types";
import * as t from "io-ts";
import Button from "~/components/Button.vue";
import { convertTimestampToDate } from "~/utls";

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
const eventTheme = ref(result.event.data.theme);

const selectDatetime = async (n: number, diff: number) => {
  const res = await httpsCallable<
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
  }).then((res) => res.data);

  if (res.status === "success") {
    orderStatus.value = "reserved";
    // TODO: should be without reload
    location.reload();
  }
};

const generateQrCodeImageLink = (data: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURI(
    data
  )}&size=300x300`;

onMounted(() => {
  document.body.style.backgroundColor = eventTheme.value;
});
</script>

<template>
  <div
    v-if="orderStatus === 'adjusting' || orderStatus === 'unadjusted'"
    class="adjusting"
  >
    <div class="h1-wrap">
      <h1>日程調整</h1>
    </div>
    <div class="adjust-order">
      <p v-if="orderStatus === 'unadjusted'">
        ※【開発者向けメッセージ】日程調整メール送信前にこの画面を見ています。
      </p>
      <p class="adjust-order__lead">
        {{ result.customer.data.name }} さん日程調整をしてください。
      </p>
      <div
        v-for="(range, i) in result.event.data.openingTimes"
        :key="String(range.from)"
        class="adjust-order__row"
      >
        <div class="adjust-order__time">
          {{ convertTimestampToDate(range.from).toLocaleString() }} 〜
          {{ convertTimestampToDate(range.to).toLocaleString() }}
        </div>
        <Button
          @click="selectDatetime(i, 1)"
          text="この時間を選択"
          size="small"
        />
      </div>
    </div>
  </div>
  <div v-else-if="orderStatus === 'reserved'" class="reserved">
    <div class="h1-wrap">
      <h1>日程調整完了</h1>
    </div>
    <div v-if="result.order.data.receiptDatetime" class="adjust-order">
      <p class="head">日程調整が完了しました。</p>
      <p class="datetime">
        <span> {{ result.customer.data.name }} さんの受取日時は </span>
        <span class="note">
          {{
            convertTimestampToDate(
              result.order.data.receiptDatetime?.from
            ).toLocaleString()
          }}
        </span>
        <span> 〜 </span>
        <span class="note">
          {{
            convertTimestampToDate(
              result.order.data.receiptDatetime?.to
            ).toLocaleString()
          }}
        </span>
        <span> です。 </span>
      </p>
      <p class="qrlead">QR コードは以下です。</p>
      <div class="qrimg">
        <img :src="generateQrCodeImageLink(iam)" alt="QR Code" />
      </div>
    </div>
  </div>
  <div v-else-if="orderStatus === 'completed'">
    <div class="h1-wrap">
      <h1>受取完了</h1>
    </div>
    <div class="adjust-order">
      <p>すでに商品を受取済みです。</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "~/styles";

.h1-wrap {
  @include styles.h1-wrap;
}

.adjust-order {
  @include styles.a-content;

  &__lead {
    margin-bottom: 20px;
  }

  &__row {
    @include styles.center;
    justify-content: flex-start;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #ccc;
    &:last-of-type {
      border: none;
    }
  }
}

.reserved {
  .head {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .datetime {
    margin-bottom: 20px;
    span {
      display: inline-block;
    }
    .note {
      color: styles.$c-primary;
      font-weight: bold;
    }
  }

  .qrlead {
    margin-bottom: 20px;
    text-align: center;
  }

  .qrimg {
    @include styles.center;
    width: clamp(1px, 300px, 70%);
    height: clamp(1px, 300px, 70%);
    margin: auto;
    img {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
