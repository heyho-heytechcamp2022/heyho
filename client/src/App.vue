<script setup lang="ts">
import { auth, getUser } from "~/firebase";
import { signOut, User } from "firebase/auth";
import { useRouter } from "vue-router";
import { ref } from "vue";
import Header from "./components/Header.vue";
import Button from "./components/Button.vue";

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
              <div v-if="userInfo?.photoURL" class="user-icon">
                <img :src="userInfo?.photoURL ?? ''" />
              </div>
              <p>
                {{ userInfo?.displayName }}
              </p>
              <Button
                @click="handleLogoutClick()"
                text="ログアウト"
                theme="simple"
              />
            </div>
            <div v-else>
              <Button
                @click="handleLoginClick"
                text="ログイン"
                theme="primary"
              />
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
  @include styles.mq(sp) {
    width: 95px;
  }
}

.header-wrap {
  position: sticky;
  top: 0;
}

.header-button {
  &.--islogin {
    @include styles.center;
    gap: 20px;
    @include styles.mq(sp) {
      gap: 10px;
    }
  }
  p {
    width: 80px;
  }
}

.user-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  @include styles.mq(sp) {
    width: 30px;
    height: 30px;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}
</style>
