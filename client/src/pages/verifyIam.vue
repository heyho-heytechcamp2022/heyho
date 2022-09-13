<script setup lang="ts">
import { Timestamp, collection, addDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { db, auth, getUser, functions } from "~/firebase";
import t from "io-ts";
import { Functions } from "@common";

const router = useRouter();
const route = useRoute();

const iam = String(route.params.iam);

const result = await httpsCallable<
  t.TypeOf<typeof Functions.FindOrderByIam.In>,
  t.TypeOf<typeof Functions.FindOrderByIam.Out.Sdk>
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
