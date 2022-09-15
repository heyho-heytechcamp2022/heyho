<script lang="ts" setup>
type Props = {
  modelValue: string | number;
  type: "text" | "number" | "email";
  placeholder?: string;
};

defineProps<Props>();
const emit = defineEmits(["update:modelValue", "enter-text-field"]);
const handleInput = (e: Event) => {
  if (!(e.target instanceof HTMLInputElement)) {
    return;
  }
  emit("update:modelValue", e.target.value);
};
const handleEnter = (e: KeyboardEvent) => {
  emit("enter-text-field", e);
};
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    :placeholder="placeholder ?? ''"
    :class="{
      'text-field': true,
    }"
    @input="handleInput"
    @keydown.enter="handleEnter"
  />
</template>

<style lang="scss" scoped>
@use "~/styles";

.text-field {
  width: 100%;
  padding: 7px;
  border: 1px solid #ccc;
  background-color: rgb(244, 244, 244);
  border-radius: 4px;
  &:focus {
    outline: none;
    border-color: styles.$c-primary;
  }
  &::placeholder {
    color: rgb(144, 144, 144);
  }
}
</style>
