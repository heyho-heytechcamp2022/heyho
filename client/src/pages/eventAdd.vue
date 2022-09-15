<script setup lang="ts">
import { Timestamp, collection, addDoc } from "firebase/firestore";
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { db, getUser } from "~/firebase";
import { Firestore } from "~/types";
import Datepicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import Input from "~/components/Input.vue";
import Button from "~/components/Button.vue";

const { userId } = await getUser();
const router = useRouter();

const name = ref("");
const location = ref("");
const maxPreception = ref(0);
const theme = ref("#eaf0e9");
const openingTimes = ref<{ from: Date; to: Date; headcount: number }[]>([]);

const addEvent = async () => {
  try {
    await addDoc(
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
        staffEmails: [],
      }
    );
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

const format = (date: Date) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${year}/${month}/${day} ${hours}:${minutes}`;
};
</script>

<template>
  <div class="h1-wrap">
    <h1>イベントの追加</h1>
  </div>
  <div class="event-add">
    <div class="row">
      <p class="item">イベント名</p>
      <Input type="text" v-model="name" />
    </div>
    <div class="row">
      <p class="item">受付場所の説明</p>
      <Input type="text" v-model="location" />
    </div>
    <div class="row">
      <p class="item">受付時間</p>
      <div
        v-for="(openingTime, i) in openingTimes"
        :key="String(openingTime.from)"
        class="opening-time-row"
      >
        <Datepicker v-model="openingTime.from" :format="format" /> ~
        <Datepicker v-model="openingTime.to" :format="format" />
        <Button
          @click="removeOpeningTime(i)"
          text="削除"
          theme="simple"
          icon="delete"
          size="small"
        />
      </div>
      <Button @click="addOpeningTime()" text="追加" icon="add" size="small" />
    </div>
    <div class="row">
      <p class="item">1 時間あたりの最大受取可能人数</p>
      <Input type="number" v-model.number="maxPreception" />
    </div>
    <div class="row">
      <p class="item">テーマカラー</p>
      <input class="theme" type="color" v-model="theme" />
    </div>
  </div>
  <div class="bottom">
    <Button @click="addEvent" text="イベントを追加" theme="primary" />
  </div>
</template>

<style lang="scss" scoped>
@use "~/styles";

.h1-wrap {
  @include styles.h1-wrap;
}

.event-add {
  @include styles.a-content;
}

.row {
  margin-bottom: 30px;
  .item {
    margin-bottom: 5px;
    font-weight: bold;
    color: rgb(106, 106, 106);
  }
  .theme {
    background-color: white;
    border-color: #ccc;
    &:hover {
      border-color: #797979;
    }
  }
}

.opening-time-row {
  @include styles.center();
  justify-content: flex-start;
  gap: 10px;
  margin-bottom: 10px;
  color: rgb(59, 59, 59);
}

.bottom {
  @include styles.center;
  margin: 30px 0 200px;
}
</style>
