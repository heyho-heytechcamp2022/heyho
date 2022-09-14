<script setup lang="ts">
import { auth, getUser } from "~/firebase";
import { signOut, Auth } from "firebase/auth";
import { useRouter } from "vue-router";
import { ref } from "vue";
import Header from "./components/Header.vue";

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
        <Header>
          <button class="signout_button" v-if="isLogin" @click="handleClick()">
            SignOut
          </button>
        </Header>
        <router-view />
      </Layout>
    </template>
    <template #fallback>
      <div>now loading...</div>
    </template>
  </Suspense>
</template>

<style lang="scss" scoped>
.signout_button {
  height: 36px;
  background: #ff8a65;
  border: none;
  cursor: pointer;
  color: white;
  font-size: 15px;
  border-radius: 10%;
}
</style>
