<script setup lang="ts">
import { ref, computed } from "vue";
import { collection, getDocs } from "firebase/firestore";
import { db, auth, getUser } from "~/firebase";
import { CommonFirestore } from "@common";
import { Firestore } from "~/types";

const { userId } = await getUser();

const querySnapshot = await getDocs(
  collection(db, `users/${userId}/events`).withConverter(
    Firestore.converter(Firestore.Event)
  )
);

const events = ref(
  querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
);
</script>

<template>
  <h1>イベント一覧</h1>
  <div>
    <div v-for="event in events" :key="event.id">
      <router-link :to="'/events/' + event.id">{{ event.name }}</router-link>
    </div>
  </div>
</template>
