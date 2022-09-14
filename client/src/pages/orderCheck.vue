<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import QRReader from "~/components/QRReader.vue";

interface IState {
  /** QRコードデータ */
  qrCode: string;
}

const state = reactive<IState>({
  qrCode: "",
});

const isUrl = computed(() => {
  return /^https?:\/\//.test(state.qrCode);
});

const onScan = (code: string) => {
  state.qrCode = code;
};

const isEnable = ref(false);
</script>

<template>
  <div>
    <div class="box">
      <button @click="isEnable = !isEnable">ON/OFF</button>
      <QRReader @scan="onScan" v-if="isEnable"></QRReader>
      <div class="info">
        <div>QRデータ:</div>
        <div v-if="isUrl">
          <a :href="state.qrCode" target="_blank">{{ state.qrCode }}</a>
        </div>
        <div>{{ state.qrCode }}</div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.box {
  max-width: 600px;
  margin: 0 auto;
}

.info {
  word-break: break-all;
}
</style>
