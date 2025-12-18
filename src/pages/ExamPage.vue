<script setup lang="ts">
import type { Paper, PaperSection } from 'stores/paper-store';
import { usePaperStore } from 'stores/paper-store';
import { useUserStore } from 'stores/user-store';
import { accessWithToken } from 'src/util/util-net';
import { url_exam_exam } from 'src/util/util-url';
import { onUnmounted, ref } from 'vue';
import { type Exam, useExamStore } from 'stores/exam-store';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { logout } from 'src/util/util-biz';

interface ExamResult {
  exam: Exam;
  paper: Paper;
  paper_sections: PaperSection[];
  section_seq: number;
}
const count_down_logout_default = 60;

const $q = useQuasar();
const router = useRouter();
const userStore = useUserStore();
const examStore = useExamStore();
const paperStore = usePaperStore();
const paper = ref({
  title: '',
  note: '',
});
const section_seq = ref(0);
const count_down_logout = ref(count_down_logout_default);
let timer: number | null;

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

onUnmounted(() => {
  clearTimer();
});


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

function goToSection() {
  router.push('/section').catch((error) => {
    notifyError(error.message, 'Failed to go to Exam Section');
  });
}

const onSuccess = function(data: unknown) {
  const result = data as ExamResult
  examStore.exam = result.exam;
  if (result.exam.status == 3) {
    count_down_logout.value = count_down_logout_default;
    timer = window.setInterval(() => {
      if (count_down_logout.value <= 0) {
        clearTimer();
        logout();
        return;
      }
      count_down_logout.value--;
    }, 1000);
  } else {
    examStore.section_seq = result.section_seq;
    paper.value = result.paper;
    paperStore.paper = result.paper;
    paperStore.sections = result.paper_sections;
    paperStore.section = result.paper_sections[result.section_seq - 1];
    section_seq.value = result.section_seq;
  }
}

accessWithToken({
  method: 'POST',
  onSuccess: onSuccess,
  token: userStore.token,
  url: url_exam_exam,
  onError: (message:string) => {
    notifyError(message, 'Failed to access exam');
  },
}, {
  exam_id: examStore.exam.id,
});
</script>

<template>
  <div class="flex-container">
    <div class="center"><h4>{{paper.title}}</h4></div>
  </div>
  <div class="flex-container q-pa-md" style="width: 70%; margin: 0 auto;">
    <div v-html="paper.note" class="center note"></div>
  </div>
  <p></p>
  <div class="flex-container q-pa-md note" v-if="examStore.exam && examStore.exam.status<3">
    <div class="center">Please <router-link to="/headset" class="text-secondary q-ml-auto">Check Headset</router-link> before enter exam section.</div>
  </div>
  <div class="flex-container q-pa-sm note">
    <div v-if="examStore.exam && paperStore.sections && examStore.exam.status<3" class="center">
      Exam Progress: {{ section_seq }} / {{ paperStore.sections.length }}
    </div>
    <div v-if="examStore.exam && paperStore.sections && examStore.exam.status==3" class="center">
      Exam Completed! Please logout!
    </div>
  </div>
  <div class="flex-container q-pa-sm">
    <q-btn color="primary" @click="goToSection()" class="center" v-if="examStore.exam && examStore.exam.status<3">
      <label>Enter</label>
      <label v-if="paperStore.section">&nbsp;{{paperStore.section.name}}</label>
      <label>&nbsp;Section</label>
    </q-btn>
    <q-btn color="primary" @click="logout()" class="center" v-if="examStore.exam && examStore.exam.status==3">
      Logout ( {{count_down_logout}}s )
    </q-btn>
  </div>
</template>

<style scoped>
.flex-container {
  display: flex;
  justify-content: space-between;
}
.center {
  margin: 0 auto;
}
</style>
