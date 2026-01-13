<script setup lang="ts">
import { accessWithToken } from 'src/util/util-net';
import { url_exam_question, url_exam_section, url_exam_section_start } from 'src/util/util-url';
import { useUserStore } from 'stores/user-store';
import { type ExamAnswer, type ExamSection, useExamStore } from 'stores/exam-store';
import {
  type Question,
  type QuestionOption,
  type PaperSection,
} from 'src/components/models';
import { usePaperStore } from 'stores/paper-store';
import { onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { formatDuration } from 'src/util/util';

interface QuestionResult {
  exam_answer: ExamAnswer;
  question: Question;
  question_options: QuestionOption[];
}

interface Exam {
  status: number;
  actual_start: Date;
  actual_end: Date;
}

interface SectionResult {
  exam: Exam;
  exam_section: ExamSection;
  paper_section: PaperSection;
  start_count_down: number;
}

interface SectionStartResult {
  end_count_down: number;
  exam: Exam;
  exam_section: ExamSection;
}

const $q = useQuasar();
const router = useRouter();
const userStore = useUserStore();
const examStore = useExamStore();
const paperStore = usePaperStore();
const startCountDown = ref(0);
const countDownTitle = ref('');
const startSectionClicked = ref(false);
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

const onStart = function() {
  startSectionClicked.value = true;
  accessWithToken({
    method: 'POST',
    onSuccess: onStartSuccess,
    token: userStore.token,
    url: url_exam_section_start,
    onError: (message:string) => {
      notifyError(message, 'Failed to Start/Continue Section');
      startSectionClicked.value = false;
    },
  }, {
    exam_id: examStore.section.exam_id,
    section_id: examStore.section.id,
  });
}

const onStartSuccess = function(data: unknown) {
  const result = data as SectionStartResult;
  examStore.end_count_down = result.end_count_down;
  examStore.entry_count_down = new Date();
  examStore.exam = result.exam;
  examStore.section = result.exam_section;
  if (result.end_count_down <= 0) {
    router.push('/exam').catch((error) => {
      notifyError(error.message, 'Failed to go to Exam');
    });
    return;
  }
  accessWithToken({
    method: 'POST',
    onSuccess: onGetQuestionSuccess,
    token: userStore.token,
    url: url_exam_question,
    onError: (message:string) => {
      notifyError(message, 'Failed to get Question');
      startSectionClicked.value = false;
    },
  }, {
    section_id: examStore.section.id,
  });
}

const onGetQuestionSuccess = function(data: unknown) {
  const result = data as QuestionResult;
  examStore.answer = result.exam_answer;
  paperStore.question = result.question;
  paperStore.questionOptions = result.question_options;
  router.push('/question').catch((error) => {
    notifyError(error.message, 'Failed to go to Exam Question');
  });
}

const onSectionSuccess = function(data: unknown) {
  const result = data as SectionResult;
  if (result.start_count_down > 0) {
    timer = window.setInterval(() => {
      startCountDown.value--;
      if (Math.floor(startCountDown.value) <= 0) {
        clearTimer();
        countDownTitle.value = '';
        return;
      }
      countDownTitle.value = formatDuration(startCountDown.value);
    }, 1000);
  }
  startCountDown.value = result.start_count_down;

  examStore.exam = result.exam;
  examStore.section = result.exam_section;
  paperStore.section = result.paper_section;
}

accessWithToken({
  method: 'POST',
  onSuccess: onSectionSuccess,
  token: userStore.token,
  url: url_exam_section,
  onError: (message:string) => {
    notifyError(message, 'Failed to access section');
  },
}, {
  exam_id: examStore.exam.id,
  section_seq: paperStore.section?.seq || 1,
});
</script>

<template>
  <div class="row q-pa-md flex justify-center">
    <h5>{{paperStore.section?.name}} Section</h5>
  </div>
  <div class="row q-pa-md flex justify-center" style="width: 70%; margin: 0 auto;">
    <div v-html="paperStore.section?.note" class="note"></div>
  </div>
  <p></p>
  <div class="row q-pa-md justify-center note">{{countDownTitle}}</div>
  <div class="row q-pa-md justify-center">
    <q-btn
      @click="onStart"
      :color="(startCountDown > 0 || startSectionClicked) ? 'grey' : 'primary'"
      :disable="startCountDown > 0 || startSectionClicked"
      :label="(examStore.section?.actual_start ? 'Continue': 'Start') + ' Section'"
    />
  </div>
</template>

<style scoped>

</style>
