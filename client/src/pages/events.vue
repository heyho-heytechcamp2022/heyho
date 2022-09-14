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
  <div class="h1-wrap">
    <h1>イベント一覧</h1>
  </div>
  <div class="events">
    <div>
      <div v-for="event in events" :key="event.id">
        <div class="event-link">
          <router-link :to="'/events/' + event.id">
            {{ event.name }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "~/styles";

.h1-wrap {
  @include styles.h1-wrap;
}

.events {
  @include styles.a-content();
}

.event-link {
  a {
    display: block;
    padding: 10px;
    border-bottom: 1px solid #ccc;
    &:hover {
      opacity: 0.7;
    }
  }
}
</style>
