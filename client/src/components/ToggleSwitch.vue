<template>
  <div class="switchArea">
    <input type="checkbox" id="switch1" :checked="modelValue" />
    <label for="switch1"></label>
    <div id="circle" @click.stop.self="toggle()"></div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);

const toggle = () => {
  emit("update:modelValue", !props.modelValue);
};
</script>

<style lang="scss" scoped>
.switchArea {
  line-height: 60px;
  position: relative;
  width: 38px;
  background: #fff;
  display: inline-block;
  margin-left: 4px;
  input[type="checkbox"] {
    display: none;
  }
  label {
    display: block;
    box-sizing: border-box;
    height: 22px;
    border: 2px solid #999999;
    border-radius: 30px;
  }
  input[type="checkbox"]:checked + label {
    border-color: #78bd78;
  }
  #circle {
    position: absolute;
    width: 14px;
    height: 14px;
    background: #999999;
    top: 4px;
    left: 4px;
    border-radius: 26px;
    transition: 0.2s;
  }
  input[type="checkbox"]:checked ~ #circle {
    transform: translateX(15px);
    background: #78bd78;
  }
}
</style>
