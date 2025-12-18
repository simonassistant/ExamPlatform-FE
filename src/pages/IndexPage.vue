<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import { url_exam_login } from 'src/util/util-url';
import { useUserStore } from 'stores/user-store';
import { getErrorMessage } from 'src/util/util';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useExamStore } from 'stores/exam-store';

const text = ref<string>('');
const errorMessage = ref<string>('');
const $q = useQuasar();
const router = useRouter();

function notifyError(message: string, caption: string='Error') {
  console.error(message, caption);
  $q.notify({
    caption: caption,
    message: message,
    position: 'top',
    icon: 'error',
    color: 'negative',
  });
}

const onLogin = () => {
  text.value = text.value.trim();
  if (text.value.length == 0) {
    notifyError('Please enter your student ID', 'Login Error');
    return;
  }
  axios({
    method: 'POST',
    url: url_exam_login,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: {
      username: text.value,
      password: '',
    },
  })
  .then((response) => {
    errorMessage.value = "";
    useUserStore().login(response.data.access_token, response.data.user);
    useExamStore().exam = response.data.exam;
    if (response.data.exam && response.data.exam.status < 4)
      void router.push("/exam");
  })
  .catch((error) => {
    errorMessage.value = getErrorMessage(error);
    notifyError(errorMessage.value, 'Login Error');
  });
};
</script>

<template>
  <div class="flex flex-center" style="height: 60vh;">
    <div class="column items-center q-gutter-y-md">
      <q-input outlined v-model="text" label="Student ID" @keydown.enter="onLogin"/>
      <q-separator spaced />
      <q-btn color="primary" label="Login" @click="onLogin"/>
      <label v-if="errorMessage != ''" style="color: red">{{errorMessage}}</label>
    </div>
  </div>
</template>
