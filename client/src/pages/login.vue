<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { db, ui } from "~/firebase";
import { GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  setDoc,
} from "firebase/firestore";

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
  <h1>Login</h1>
  <div id="firebaseui-auth-container"></div>
</template>
