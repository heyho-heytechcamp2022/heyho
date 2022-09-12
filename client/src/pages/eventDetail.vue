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

const route = useRoute();
const { userId } = await getUser();

const id = String(route.params.id);

console.log(id);

const docRef = doc(db, `users/${userId}/events`, id);
const docSnap = await getDoc(docRef);

if (!docSnap.exists()) {
  console.error("No such document!");
  // TODO: error handling
}

const event = ref(docSnap.data());

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
</template>
