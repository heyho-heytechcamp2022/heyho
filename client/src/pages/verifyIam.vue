<script setup lang="ts">
import { httpsCallable } from "firebase/functions";
import { useRoute, useRouter } from "vue-router";
import { functions } from "~/firebase";
import * as t from "io-ts";
import { CommonFunctions } from "@common";
import { Functions } from "~/types";

const router = useRouter();
const route = useRoute();

const iam = String(route.params.iam);

const result = await httpsCallable<
  t.TypeOf<typeof CommonFunctions.FindOrderByIam.In>,
  t.TypeOf<typeof Functions.FindOrderByIam.Out>
>(
  functions,
  "findOrderByIam"
)({ iam }).then((res) => res.data);

if (result) {
  router.push("/adjust-order/" + iam);
}
</script>

<template>
  <h1>verify iam</h1>
  <p v-if="result">認証成功、受取日時調整ページにリダイレクト中</p>
  <p v-else>認証失敗</p>
</template>
