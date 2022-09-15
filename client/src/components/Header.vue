<script lang="ts" setup></script>

<template>
  <header>
    <div class="header_container">
      <div class="header">
        <a href="/">
          <img src="../assets/heyho.svg" alt="heyho_logo" />
        </a>
        <slot></slot>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
@use "~/styles";
.header_container {
  width: 100%;
  height: styles.$h-header;
  padding: 0 25px;
  margin: auto;
  padding: 10px 50px;
  background: white;
  box-shadow: 0 0 1px 2px rgba(0, 0, 0, 0.108);

  @include styles.mq(sp) {
    padding: 0px 10px;
    height: auto;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
