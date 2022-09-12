<script setup lang="ts">
import { ref, computed } from "vue";
import { collection, getDocs } from "firebase/firestore";

import { db } from "~/firebase";

const querySnapshot = await getDocs(collection(db, "events"));

const events = ref(
  querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
);

console.log(events.value);
</script>

<template>
  <h1>イベント一覧</h1>
  <div>
    <div v-for="event in events" :key="event.id">
      <router-link :to="'/events/' + event.id">{{ event.name }}</router-link>
    </div>
  </div>
</template>
