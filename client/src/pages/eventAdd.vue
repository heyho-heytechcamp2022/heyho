<script setup lang="ts">
import { Timestamp, collection, addDoc } from "firebase/firestore";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { db, auth, getUser } from "~/firebase";
import { Firestore } from "@common";

const { userId } = await getUser();
const router = useRouter();

const name = ref("");
const location = ref("");
const maxPreception = ref(0);
const theme = ref("");
const openingTimes = ref<
  { from: Timestamp; to: Timestamp; headcount: number }[]
>([]);

const addOpeningTime = () => {
  openingTimes.value.push({
    from: Timestamp.fromDate(new Date()),
    to: Timestamp.fromDate(new Date()),
    headcount: 0,
  });
};

const removeOpeningTime = (index: number) => {
  openingTimes.value.splice(index, 1);
};

const addEvent = async () => {
  try {
    const docRef = await addDoc(
      collection(db, `users/${userId}/events`).withConverter(
        Firestore.converter(Firestore.Event)
      ),
      {
        name: name.value,
        location: location.value,
        maxPreception: maxPreception.value,
        theme: theme.value,
        openingTimes: openingTimes.value,
      }
    );
    console.log("Document written with ID: ", docRef.id);
    router.push("/events");
  } catch {
    console.log("error");
  }
};
</script>

<template>
  <h1>イベントの追加</h1>
  <div>イベント名 <input type="text" v-model="name" /></div>
  <div>受取場所の説明 <input type="text" v-model="location" /></div>
  <div>
    受付時間
    <div
      v-for="(openingTime, i) in openingTimes"
      :key="String(openingTime.from)"
    >
      <input type="datetime-local" v-model="openingTime.from" />
      <input type="datetime-local" v-model="openingTime.to" />
      <button @click="removeOpeningTime(i)">削除</button>
    </div>

    <button @click="addOpeningTime">追加</button>
  </div>
  <div>
    1 時間あたりの最大受取可能人数
    <input type="number" v-model="maxPreception" />
  </div>
  <div>テーマ <input type="text" v-model="theme" /></div>
  <button @click="addEvent">イベントを追加</button>
</template>
