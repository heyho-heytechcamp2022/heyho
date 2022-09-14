<script lang="ts" setup></script>
<template>
  <header>
    <div class="header_container">
      <div class="header">
        <img src="../assets/heyho.svg" alt="heyho_logo" />
        <slot></slot>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.header_container {
  max-width: 1200px;
  padding: 0 25px;
  margin: auto;
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
