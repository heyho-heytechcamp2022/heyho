<script lang="ts" setup>
    type Props = {
        modelValue: string | number,
        type: "text" | "number",
    };
    const props = defineProps<Props>();
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
    <input :type="type"
    :value="modelValue"
    :class="{
        'text-field': true,
    }"
    @input="handleInput"
    @keydown.enter="handleEnter"
    />
 </template>

<style lang="scss" scoped>
.text-field {
    padding: 7px;
    border: 2px solid #ccc;
    border-radius: 3px;
}
</style>