<script setup lang="ts">
import { defineProps } from "vue";

const props = withDefaults(
  defineProps<{
    text: string;
    theme?: "primary" | "normal" | "simple";
    size?: "small" | "middle";
    element?: "button" | "a";
    href?: string;
    icon?: string;
    onClick?: () => void;
  }>(),
  {
    theme: "normal",
    size: "middle",
    element: "button",
  }
);

const emit = defineEmits(["click"]);

const handleClick = () => {
  emit("click");
};
</script>

<template>
  <div class="button">
    <component
      :is="props.element"
      :href="props.href"
      class="button__element"
      :class="`button__element--${props.theme} button__element--${props.size}`"
      @click="handleClick"
    >
      <span class="text">
        {{ props.text }}
      </span>
      <span v-if="props.icon" class="button__icon material-symbols-outlined">
        {{ props.icon }}
      </span>
    </component>
  </div>
</template>

<style lang="scss" scoped>
@use "../styles";

.button {
  &__element {
    @include styles.clickable;
    @include styles.center;
    gap: 5px;

    .text {
      flex-shrink: 0;
    }

    &:hover {
      opacity: 0.7;
    }

    &--primary {
      background-color: styles.$c-primary;
      color: styles.$c-white;
    }

    &--normal {
      background-color: styles.$c-gray;
      color: styles.$c-white;
    }

    &--simple {
      background-color: transparent;
      color: styles.$c-text;
    }

    &--small {
      font-size: 14px;
      padding: 5px 10px;
      border-radius: 4px;
    }

    &--middle {
      padding: 10px 20px;
      border-radius: 100px;
    }
  }
}
</style>
