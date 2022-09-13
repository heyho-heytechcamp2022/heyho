import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { createRouter, createWebHistory } from "vue-router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: () => import("./pages/index.vue") },
    { path: "/login", component: () => import("./pages/login.vue") },
    {
      path: "/events",
      component: () => import("./pages/events.vue"),
      meta: { requireAuth: true },
    },
    {
      path: "/events/new",
      component: () => import("./pages/eventAdd.vue"),
      meta: { requireAuth: true },
    },
    {
      path: "/events/:id",
      component: () => import("./pages/eventDetail.vue"),
      meta: { requireAuth: true },
    },
    {
      path: "/events/:eventId/orders",
      component: () => import("./pages/orders.vue"),
      meta: { requireAuth: true },
    },
    {
      path: "/iam/:iam",
      component: () => import("./pages/verifyIam.vue"),
    },
    {
      path: "/adjust-order/:iam",
      component: () => import("./pages/adjustOrder.vue"),
    },
  ],
});

router.beforeEach((to, _, next) => {
  const requireAuth = to.matched.some((record) => record.meta.requireAuth);

  if (!requireAuth) {
    next();
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      next({
        path: "/login",
        query: { redirect: to.fullPath },
      });
      return;
    }

    next();
  });
});

createApp(App).use(router).mount("#app");
