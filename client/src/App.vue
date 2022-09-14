<script setup lang="ts">
import { auth, getUser } from "~/firebase";
import { signOut, Auth } from "firebase/auth";
import { useRouter } from "vue-router";
import { ref } from "vue";

const router = useRouter();
const handleClick = () => {
  signOut(auth).then(() => {
    router.push("/login");
    console.log("success");
  });
};
let isLogin = ref(false);
getUser().then(({ user, userId }) => {
  isLogin.value = Boolean(user);
});
</script>

<template>
  <Suspense>
    <template #default>
      <Layout>
        <button v-if="isLogin" @click="handleClick()">SignOut</button>
        <router-view />
      </Layout>
    </template>
    <template #fallback>
      <div>now loading...</div>
    </template>
  </Suspense>
</template>
