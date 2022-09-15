<script setup lang="ts">
import { useRoute } from "vue-router";
import { ref } from "vue";
import { doc, getDoc } from "firebase/firestore";
import { db, getUser, functions } from "~/firebase";
import { Firestore } from "~/types";
import Button from "~/components/Button.vue";
import Input from "~/components/Input.vue";
import { httpsCallable } from "@firebase/functions";
import * as t from "io-ts";
import { CommonFunctions } from "@common";

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

const newStaffEmail = ref("");

const addStaff = async () => {
  if (!userId) return;
  if (!event.value) return;

  console.log("addStaff", newStaffEmail.value);

  const res = await httpsCallable<
    t.TypeOf<typeof CommonFunctions.InviteStuffByEmail.In>,
    t.TypeOf<typeof CommonFunctions.InviteStuffByEmail.Out>
  >(
    functions,
    "inviteStuffByEmail"
  )({
    ownerId: userId,
    eventId: id,
    email: newStaffEmail.value,
  }).then((res) => res.data);

  if (res.status === "error") {
    console.error(res);
    alert("ユーザが見つかりませんでした");
  } else {
    window.location.reload();
  }
};

const nowUrl = ref(location.href + "orders/check");
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
      <div>
        <h2>スタッフ一覧</h2>
        <div class="value staff-list">
          <p>
            スタッフ権限が与えられたアカウントはグッズの受渡しを行なうことができます。<br />
            以下の URL をスタッフの方に共有してください。<br />
            {{ `${nowUrl}` }}
          </p>
          <div v-for="email in event.staffEmails" class="email">
            {{ email }}
          </div>
          <div class="add">
            <Input
              type="email"
              v-model="newStaffEmail"
              placeholder="招待したいスタッフのメールアドレスを入力"
            />
            <Button
              @click="addStaff"
              text="追加"
              size="small"
              icon="person_add"
            />
          </div>
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
  .value {
    margin-bottom: 40px;
  }
}

.staff-list {
  .email {
    margin: 20px 0;
  }
  .add {
    @include styles.center();
    gap: 10px;
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
