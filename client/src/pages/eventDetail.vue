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
import Button from "~/components/Button.vue";

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
  <div class="h1-wrap">
    <h1>イベント詳細</h1>
  </div>
  <div class="event-detail">
    <div class="detail">
      <div class="row">
        <h2>イベント名</h2>
        <p class="value">
          {{ event.name }}
        </p>
      </div>
      <div>
        <h2>受取場所の説明</h2>
        <p class="value">
          {{ event.location }}
        </p>
      </div>
      <div>
        <h2>受付時間</h2>
        <div class="value">
          <div
            v-for="(openingTime, i) in event.openingTimes"
            :key="String(openingTime.from)"
          >
            {{ openingTime.from.toDate().toLocaleString() }} 〜
            {{ openingTime.to.toDate().toLocaleString() }}
          </div>
        </div>
        <div>
          <h2>1 時間あたりの最大受取可能人数</h2>
          <p class="value">{{ event.maxPreception }} 人</p>
        </div>
        <div>
          <h2>テーマ</h2>
          <p class="value">
            {{ event.theme }}
          </p>
        </div>
      </div>
    </div>
  </div>
  <div class="bottom">
    <Button element="a" :href="`/events/${id}/orders`" text="注文情報一覧" />
  </div>
</template>

<style lang="scss" scoped>
@use "~/styles";

.event-detail {
  @include styles.a-content();
}

.h1-wrap {
  @include styles.h1-wrap();
}

.detail {
  h2 {
    margin-bottom: 10px;
    font-weight: bold;
    color: styles.$c-text-light;
  }
  p {
    margin-bottom: 40px;
    padding-left: 20px;
  }
}

.bottom {
  @include styles.center();
  margin-top: 40px;
  a {
    padding: 10px 20px;
    border-radius: 10px;
    background-color: styles.$c-primary;
    color: white;
    &:hover {
      opacity: 0.7;
    }
  }
}
</style>
