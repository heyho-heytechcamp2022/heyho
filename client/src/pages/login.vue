<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { db, ui } from "~/firebase";
import { GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
import "firebaseui/dist/firebaseui.css";

const router = useRouter();

onMounted(() => {
  ui.start("#firebaseui-auth-container", {
    signInOptions: [
      GoogleAuthProvider.PROVIDER_ID,
      EmailAuthProvider.PROVIDER_ID,
    ],
    callbacks: {
      signInSuccessWithAuthResult: (authResult, redirectUrl) => {
        router.push("/events");
        return false;
      },
    },
  });
});
</script>

<template>
  <div class="wrap">
    <div class="left">
      <div id="firebaseui-auth-container"></div>
    </div>
    <div class="right">
      <p>
        HeyHo ならよりたくさんのお客さんに <br />
        素早くイベントグッズをお渡しできます
      </p>
      <div>
        <img src="../assets/login-picture-1.svg" alt="" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "~/styles";

.wrap {
  @include styles.center;
}

$content-height: calc(100vh - styles.$h-header);

.left {
  @include styles.center;
  width: 50%;
  height: $content-height;
  background-color: styles.$c-base-1;
  #firebaseui-auth-container {
    width: 400px;
    padding-bottom: 100px;
  }
}

.right {
  @include styles.center;
  flex-direction: column;
  width: 50%;
  height: $content-height;
  background: styles.$c-white;
  p {
    font-size: 30px;
    margin-bottom: 40px;
  }
  div {
    width: clamp(1px, 400px, 80%);
  }
  img {
    width: 100%;
  }
}
</style>
