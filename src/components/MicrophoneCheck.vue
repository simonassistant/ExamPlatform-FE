
<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

let audioBlob: Blob | null = null;
const isRecording = ref(false);
const isMicrophoneAvailable = ref(false);
const audioUrl = ref<string | null>(null);
const volume = ref(0.5);
const elapsedTime = ref(0);

const volumePercentage = computed(() => Math.round(volume.value * 100));
const formattedTime = computed(() => {
  const minutes = Math.floor(elapsedTime.value / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(elapsedTime.value % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
});
const timerInterval = ref<NodeJS.Timeout | null>(null);

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
let mediaStream: MediaStream | null = null;

let analyser: AnalyserNode | null = null;
let animationFrameId: number | null = null;
const volumeLevel = ref(0);

const initMicrophone = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    isMicrophoneAvailable.value = true;
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Denied microphone access',
      caption: 'Please check the rights of the browser microphone',
    });
  }
};

watch(volume, (newVal) => {
  if (gainNode) {
    gainNode.gain.value = newVal;
  }
});

const adjustVolume = () => {
  if (gainNode) {
    gainNode.gain.value = volume.value;
  }
};

const startRecording = async () => {
  try {
    const sampleRate = 48000;
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: sampleRate,
        sampleSize: 16,
        echoCancellation: false,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });
    audioContext = new window.AudioContext({ sampleRate: sampleRate });
    const source = audioContext.createMediaStreamSource(mediaStream);

    // 创建增益节点控制音量
    gainNode = audioContext.createGain();
    gainNode.gain.value = volume.value;
    source.connect(gainNode);

    // 添加高通滤波器，过滤低频噪音
    const highpassFilter = audioContext.createBiquadFilter();
    highpassFilter.type = "highpass";
    highpassFilter.frequency.value = 100;
    gainNode.connect(highpassFilter);

    // 添加低通滤波器，过滤高频噪音
    const lowpassFilter = audioContext.createBiquadFilter();
    lowpassFilter.type = "lowpass";
    lowpassFilter.frequency.value = 14000;
    highpassFilter.connect(lowpassFilter);

    // 创建新的媒体流用于录音
    const dest = audioContext.createMediaStreamDestination();
    lowpassFilter.connect(dest);

    const mimeType = 'audio/webm; codecs=opus';
    const bitRate = 48000;
    if (MediaRecorder.isTypeSupported(mimeType)) {
      mediaRecorder = new MediaRecorder(dest.stream, {
        mimeType: mimeType,
        audioBitsPerSecond: bitRate
      });
    } else {
      console.warn('This MIME type is not supported:', mimeType);
      mediaRecorder = new MediaRecorder(dest.stream, {
        audioBitsPerSecond: bitRate
      });
    }
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = () => {
      audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioUrl.value = URL.createObjectURL(audioBlob);
      cleanupResources();
    };

    mediaRecorder.start();
    isRecording.value = true;
    elapsedTime.value = 0;
    timerInterval.value = setInterval(() => {
      elapsedTime.value++;
    }, 1000);

    analyser = audioContext.createAnalyser();
    lowpassFilter.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let lastUpdateTime = 0;
    const updateVolume = (timestamp: number) => {
      if (timestamp - lastUpdateTime >= 100) {
        analyser?.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] || 0;
        }
        volumeLevel.value = sum / bufferLength;
        lastUpdateTime = timestamp;
      }
      animationFrameId = requestAnimationFrame(updateVolume);
    };
    updateVolume(0);
  } catch (error) {
    console.error('Failed to start recording:', error);
    cleanupResources();
  }
};

const stopRecording = () => {
  mediaRecorder?.stop();
  isRecording.value = false;
  volumeLevel.value = 0;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
};

const toggleRecording = () => {
  if (isRecording.value)
    stopRecording();
  else
    void startRecording();
};

const cleanupResources = () => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }

  mediaStream?.getTracks().forEach(track => track.stop());
  if (audioContext?.state !== 'closed') {
    void audioContext?.close();
  }

  volumeLevel.value = 0;
};

onMounted(initMicrophone);
onUnmounted(() => {
  if (mediaRecorder?.state === 'recording')
    stopRecording();
  cleanupResources();
});

defineExpose({
  isRecording,
  elapsedTime,
  startRecording,
  stopRecording
})
</script>

<template>
  <q-card class="q-pa-md">
    <q-card-section>
      <div class="text-h6">Please check your microphone:</div>
    </q-card-section>

    <q-card-section v-if="isRecording">
      <div class="row items-center mic-container">
        <q-icon
          name="mic"
          size="lg"
          :color="isRecording ? 'primary' : 'grey'"
          class="q-mr-sm"
        />
        <div class="text-subtitle1">
          {{ formattedTime }}
        </div>
        <div class="volume-bar-container">
          <div class="volume-bar" :style="{ width: `${volumeLevel}%` }"></div>
        </div>
      </div>
    </q-card-section>

    <q-card-section v-if="!isRecording">
      <q-slider
        class="q-mt-lg"
        v-model="volume"
        :min="0.1"
        :max="1"
        :step="0.1"
        label
        :label-value="'Volume: ' + volume"
        label-always
        @input="adjustVolume"
      >
        <template v-slot:marker-label-group>
          <div>{{ volumePercentage }}%</div>
        </template>
      </q-slider>
    </q-card-section>

    <q-card-actions align="around">
      <q-btn
        :icon="isRecording ? 'stop' : 'fiber_manual_record'"
        :color="isRecording ? 'negative' : 'primary'"
        :label="isRecording ? 'Stop' : 'Start'"
        @click="toggleRecording"
        :disable="!isMicrophoneAvailable"
      />
    </q-card-actions>

    <audio
      v-if="audioUrl"
      :src="audioUrl"
      controls
      controlsList="nodownload"
      class="full-width q-mt-md"
    />
  </q-card>
</template>

<style scoped>
.mic-container {
  margin-bottom: 20px;
}

.volume-bar-container {
  width: 200px;
  height: 30px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-left: 10px;
}

.volume-bar {
  height: 100%;
  background-color: #007bff;
  transition: width 0.1s ease;
}
</style>
