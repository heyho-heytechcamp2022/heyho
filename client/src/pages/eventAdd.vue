<script setup lang="ts">
import { Timestamp, collection, addDoc } from "firebase/firestore";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { db, auth, getUser } from "~/firebase";
import { CommonFirestore } from "@common";
import { Firestore } from "~/types";
import { log } from "console";
import Datepicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

const { userId } = await getUser();
const router = useRouter();

const name = ref("");
const location = ref("");
const maxPreception = ref(0);
const theme = ref("");
const openingTimes = ref<{ from: Date; to: Date; headcount: number }[]>([]);

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
        openingTimes: openingTimes.value.map((openingTime) => ({
          from: Timestamp.fromDate(openingTime.from),
          to: Timestamp.fromDate(openingTime.to),
          headcount: openingTime.headcount,
        })),
      }
    );
    console.log("Document written with ID: ", docRef.id);
    router.push("/events");
  } catch {
    console.log("error");
  }
};

const addOpeningTime = () => {
  openingTimes.value.push({
    from: new Date(),
    to: new Date(),
    headcount: 0,
  });
  console.log(openingTimes.value);
};

const removeOpeningTime = (index: number) => {
  openingTimes.value.splice(index, 1);
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
      <Datepicker v-model="openingTime.from" />
      <Datepicker v-model="openingTime.to" />
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
