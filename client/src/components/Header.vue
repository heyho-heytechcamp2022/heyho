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
  width: 100%;
  padding: 0 25px;
  margin: auto;
  padding: 10px 50px;
  background: white;
  box-shadow: 0 0 1px 2px rgba(0, 0, 0, 0.108);

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
