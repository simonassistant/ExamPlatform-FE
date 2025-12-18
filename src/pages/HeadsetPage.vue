<script setup lang="ts">
import HeadsetCheck from 'components/HeadsetCheck.vue';
import MicrophoneCheck from 'components/MicrophoneCheck.vue';


</script>

<template>
  <div class="row q-pa-md items-center">
    <span><b>If there is any problem with your headset or microphone, please report to the invigilator!</b></span>
    <router-link @click="$router.go(-1)" to="" class="text-secondary q-ml-auto">Back</router-link>
  </div>

  <div class="q-pa-md">
    <div><HeadsetCheck /></div>
    <p></p>
    <div><MicrophoneCheck /></div>
  </div>
  <p></p>
</template>

<style scoped>
</style>
