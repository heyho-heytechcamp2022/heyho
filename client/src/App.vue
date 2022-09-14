<script setup lang="ts">
import { auth, getUser } from "~/firebase";
import { signOut, Auth, User } from "firebase/auth";
import { useRouter } from "vue-router";
import { ref } from "vue";
import Header from "./components/Header.vue";

const router = useRouter();
const handleLogoutClick = () => {
  signOut(auth).then(() => {
    router.push("/login");
    console.log("success");
  });
};

let isLogin = ref(false);
let userInfo = ref<User>();

getUser().then(({ user, userId }) => {
  isLogin.value = Boolean(user);
  userInfo.value = user ?? undefined;
});

const handleLoginClick = () => {
  router.push("/login");
};
</script>

<template>
  <Suspense>
    <template #default>
      <Layout>
        <div class="header-wrap">
          <Header>
            <div v-if="isLogin" class="header-button --islogin">
              <div class="user-icon">
                <img :src="userInfo?.photoURL ?? ''" />
              </div>
              <p>
                {{ userInfo?.displayName }}
              </p>
              <button class="signout-button" @click="handleLogoutClick()">
                ログアウト
              </button>
            </div>
            <div v-else>
              <button @click="handleLoginClick">ログイン</button>
            </div>
          </Header>
        </div>
        <router-view />
      </Layout>
    </template>
    <template #fallback>
      <div>now loading...</div>
    </template>
  </Suspense>
</template>

<style lang="scss" scoped>
@use "~/styles";
.signout-button {
  @include styles.clickable();
}

.header-wrap {
  position: sticky;
  top: 0;
}

.header-button {
  &.--islogin {
    @include styles.center;
    gap: 20px;
  }
}

.user-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
