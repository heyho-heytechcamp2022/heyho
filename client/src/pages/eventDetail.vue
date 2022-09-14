<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref, computed } from "vue";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth, getUser } from "~/firebase";
import { Firestore } from "~/types";

const route = useRoute();
const { userId } = await getUser();

const id = String(route.params.id);

const docRef = doc(db, `users/${userId}/events`, id).withConverter(
  Firestore.converter(Firestore.Event)
);
const docSnap = await getDoc(docRef);

if (!docSnap.exists()) {
  console.error("No such document!");
  // TODO: error handling
}

const docData = docSnap.data();

// TODO: Error handling
if (!docData) throw new Error("docData is not found");

const event = ref(docData);

console.log(event.value);
</script>

<template>
  <div>Event Id. {{ id }}</div>
  <div>
    <div>イベント名 {{ event.name }}</div>
    <div>受取場所の説明 {{ event.location }}</div>
    <div>
      受付時間
      <div
        v-for="(openingTime, i) in event.openingTimes"
        :key="String(openingTime.from)"
      >
        {{ openingTime.from }}
        {{ openingTime.to }}
      </div>
      <div>
        1 時間あたりの最大受取可能人数
        {{ event.maxPreception }}
      </div>
      <div>テーマ {{ event.theme }}</div>
    </div>
  </div>
  <router-link :to="'/events/' + id + '/orders'">注文情報一覧</router-link>
</template>
