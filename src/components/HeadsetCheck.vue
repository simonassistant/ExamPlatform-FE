<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';

const audioUrl = ref<string>('/exam/sample.mp3');
const audioElement = ref<HTMLAudioElement | null>(null);
const paused = ref(false);
const playing = ref(false);

const volume = ref<number>(0.5);
const volumePercentage = ref<number>(0);
let animationFrameId: number;

const initAudioAnalyser = () => {
  if (!audioElement.value) return;

  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaElementSource(audioElement.value);

  source.connect(analyser);
  analyser.connect(audioContext.destination);
  analyser.fftSize = 256;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const updateVolume = () => {
    analyser.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    volumePercentage.value = Math.min(100, (average / 255) * 150); // 放大显示效果
    animationFrameId = requestAnimationFrame(updateVolume);
  };

  updateVolume();
};

watch(volume, (newVal) => {
  if (audioElement.value) {
    audioElement.value.volume = newVal;
  }
});

const play = () => {
  playing.value = true;
  if (!audioElement.value)
    return;

  if (paused.value)
    audioElement.value?.play()
      .catch(console.error);
  else
    audioElement.value?.play()
      .then(initAudioAnalyser)
      .catch(console.error);
  paused.value = false;
};

const pause = () => {
  audioElement.value?.pause();
  cancelAnimationFrame(animationFrameId);
  paused.value = true;
};

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
});
</script>

<template>
  <audio ref="audioElement" :src="audioUrl"></audio>
  <q-card class="q-pa-md">
    <q-card-section>
      <div class="text-h6">Please check your headset:</div>
    </q-card-section>

    <q-card-section>
      <q-slider
        v-model="volume"
        :min="0.1"
        :max="1"
        :step="0.1"
        label
        label-always
        :label-value="'Volume: ' + volume"
        color="secondary"
      />
      <div class="q-gutter-sm center">
        <q-btn icon="play_arrow" :color="playing && !paused ? 'grey' : 'secondary'" @click="play" class="q-mr-sm" :disable="playing && !paused">Play</q-btn>
        <q-btn icon="pause" :color="!playing || paused ? 'grey' : 'negative'" @click="pause" :disable="!playing || paused">Pause</q-btn>
      </div>
    </q-card-section>

    <q-card-section>
      <div class="volume-container">
        <div
          class="volume-bar"
          :style="{ width: `${volumePercentage}%` }"
        ></div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.volume-container {
  width: 200px;
  height: 30px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.volume-bar {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.1s ease-out;
}
</style>

