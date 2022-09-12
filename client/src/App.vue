<script setup lang="ts"></script>

<template>
  <Suspense>
    <template #default>
      <Layout>
        <router-view />
      </Layout>
    </template>
    <template #fallback>
      <div>now loading...</div>
    </template>
  </Suspense>
</template>
