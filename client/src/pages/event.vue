<script setup lang="ts">
import { onMounted } from "@vue/runtime-core";
import { useRoute } from "vue-router";

const route = useRoute();

const id = route.params.id;
</script>

<template>
  <div>Event Id. {{ id }}</div>
</template>
