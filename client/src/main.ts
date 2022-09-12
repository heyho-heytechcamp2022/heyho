import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: () => import("./pages/index.vue") },
    { path: "/login", component: () => import("./pages/login.vue") },
    { path: "/events", component: () => import("./pages/events.vue") },
    { path: "/events/new", component: () => import("./pages/eventAdd.vue") },
    { path: "/events/:id", component: () => import("./pages/eventDetail.vue") },
    {
      path: "/events/:eventId/orders",
      component: () => import("./pages/orders.vue"),
    },
  ],
});

createApp(App).use(router).mount("#app");
