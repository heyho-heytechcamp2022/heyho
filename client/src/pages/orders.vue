<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
} from "firebase/firestore";
import { db, getUser } from "~/firebase";

const route = useRoute();
const { userId } = await getUser();

const eventId = String(route.params.eventId);

const q = query(collection(db, `users/${userId}/events/${eventId}/items`));
const querySnapshot = await getDocs(q);
const items = ref(
  querySnapshot.docs.map((doc) => ({
    docId: doc.id,
    ...doc.data(),
  }))
);

// TODO: リロードしなくても反映されるように
const updateItemEvent = async (id: string, eventId: string) => {
  const itemDocRef = doc(db, `users/${userId}/events/${eventId}/items`, id);
  const eventDocRef = doc(db, `users/${userId}/events`, eventId);
  await updateDoc(itemDocRef, {
    eventRef: eventDocRef,
  });
};
</script>

<template>
  <h1>注文一覧</h1>
  <h2>連携設定</h2>
  <h3>グッズ選択</h3>
  <div>
    <div v-for="item in items" :key="item.docId">
      <div>{{ item.name }}</div>
      <button
        v-if="item.eventRef?.id !== eventId"
        @click="updateItemEvent(item.docId, eventId)"
      >
        選択
      </button>
      <button v-else @click="updateItemEvent(item.docId, '')">解除</button>
    </div>
  </div>
</template>
