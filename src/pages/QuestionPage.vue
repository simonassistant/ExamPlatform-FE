<script setup lang="ts">
import { type QTreeNode, useQuasar } from 'quasar';
import { type ExamAnswer, useExamStore } from 'stores/exam-store';
import {
  type Question,
  type QuestionGroup,
  type QuestionOption,
  QuestionType,
  usePaperStore
} from 'stores/paper-store';
import { computed, onUnmounted, type Ref, ref } from 'vue';
import { accessWithToken } from 'src/util/util-net';
import { url_exam_answer, url_exam_question, url_exam_questions_in_group } from 'src/util/util-url';
import { useUserStore } from 'stores/user-store';
import { formatDuration, stripHtml } from 'src/util/util';
import { clearCountDownTimer, submitSection } from 'src/util/util-biz';
import AudioRecorder from 'components/AudioRecorder.vue';

const $q = useQuasar();

const examStore = useExamStore();
const paperStore = usePaperStore();
const userStore = useUserStore();
if (!paperStore.question)
  notifyError('Failed to get question');

const hasAudio = ref(false);
type AudioRecorderType = InstanceType<typeof AudioRecorder>
const recorderRef = ref<AudioRecorderType | null>(null);

let countDownWarned = false;
let warningTime = -1;
if (![QuestionType.Listening, QuestionType.Speaking].includes(paperStore.section.question_type)) {
  if (paperStore.section.duration >= 10) {
    warningTime = 300;
  } else if (paperStore.section.duration < 10 && paperStore.section.duration >= 5) {
    warningTime = 120;
  }
}
const count_down_title = ref();
const count_down = ref(examStore.end_count_down);
clearCountDownTimer();
examStore.timer_count_down = setInterval(() => {
  if (count_down.value <= 0) {
    submitSection();
    return;
  } else if (!countDownWarned && count_down.value <= warningTime) {
    countDownWarned = true;
    $q.notify({
      caption: 'Reminder',
      message: 'You have less than ' + warningTime/60 + ' minutes to finish this section!',
      position: 'top',
      icon: 'warning',
      color: 'orange',
    });
  }
  count_down.value--;
  count_down_title.value = formatDuration(count_down.value);
}, 1000);
const showTime = ref(true);


const fontSize = ref(14);
const splitterModel = ref(50);
const question = ref<Question>(paperStore.question);
const questionGroup = ref<QuestionGroup>(paperStore.questionGroup);
const questionOptions = ref(paperStore.questionOptions);
const examAnswer = ref<ExamAnswer>(examStore.answer);
const options = ref([{}]);
const answer = ref('');
const answerOld = ref('');
const group = ref(['']);
const answers_string = ref(new Array(1).fill(''));
const wordCount = computed(() => {
  if (question.value.question_type !== QuestionType.Writing)
    return 0;
  const value = answer.value
    .replace(/[\u4e00-\u9fa5]+/g, ' ')  // 过滤中文
    .replace(/[^\w\s]/g, ' ')          // 过滤标点符号
    .replace(/\n|\r|^\s+|\s+$/gi, '')  // 去除首尾空格和换行
    .replace(/\s+/gi, ' ')             // 合并连续空格
  return value ? value.trim().split(' ').length : 0;
})

const answered = ref(new Array(paperStore.section.question_num).fill(false));
const marks = ref(new Array(paperStore.section.question_num).fill(false));
const mark = ref(false);

const saveRemindDlg = ref(false);
let seqWillTo = 0;
const submitSectionDlg = ref(false);
const reviewDlg = ref(false);
const reviewIdx = ref();
const ops = [];
for (let i=0; i<paperStore.section.question_num; i++) {
  const idx = (i+1) + '';
  ops.push({
    label: idx,
    value: idx,
    color: 'grey',
  });
}
const reviewOptions = ref(ops);

const questionsInGroupFlag = ref(false);
const questionsInGroupTree:Ref<QTreeNode[]> = ref([]);


interface QuestionResult {
  exam_answer: ExamAnswer;
  question: Question;
  question_group: QuestionGroup;
  question_options: QuestionOption[];
}

interface QuestionsInGroupResult {
  questions: Question[];
  question_options: QuestionOption[];
}

onUnmounted(() => {
  clearCountDownTimer();
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

function loadMark() {
  const ops = [];
  for (let i=0; i<paperStore.section.question_num; i++) {
    const m = marks.value[i];
    const idx = (i+1) + '';
    ops.push({
      label: idx,
      value: idx,
      color: answered.value[i] ? 'green' : 'grey',
      class: m ? 'text-orange' : 'text-white'
    });
  }
  reviewOptions.value = ops;
  mark.value = marks.value[question.value.seq - 1];
  reviewIdx.value = -1;
}

function setFontSize(value: number) {
  fontSize.value += value;
}

function loadQuestion(result:QuestionResult | null=null) {
  if (result) {
    examAnswer.value = result.exam_answer;
    question.value = result.question;
    questionGroup.value = result.question_group;
    questionOptions.value = result.question_options;
  }
  examStore.answer = examAnswer.value;
  paperStore.question = question.value;
  paperStore.questionGroup = questionGroup.value;
  hasAudio.value = questionGroup.value.content.indexOf('<audio id="examAudio"') >= 0;

  const ops = [];
  for (const op of questionOptions.value) {
    ops.push({
      label: op.content,
      value: op.code,
    });
  }
  options.value = ops;
  answer.value = examAnswer.value ? examAnswer.value.answer : '';
  answerOld.value = answer.value;
  answered.value[question.value.seq - 1] = !!answer.value;
  answer.value = examAnswer.value? examAnswer.value.answer : '';
  if (question.value.question_type === QuestionType.DefiniteMultipleChoice
    || question.value.question_type === QuestionType.IndefiniteMultipleChoice) {
    group.value = examAnswer.value ? examAnswer.value.answer.split('|') : [];
  } else if (question.value.question_type === QuestionType.FillInTheBlank) {
    answers_string.value = examAnswer.value? examAnswer.value.answer.split('|') : new Array(options.value.length).fill('');
  }

  loadMark();

  audioPlayDlg.value = false;
  audioPlaying.value = false;
  let audioPlayedTimesGroup = examStore.audioPlayTimes[questionGroup.value.id];
  if (audioPlayedTimesGroup == undefined)
    audioPlayedTimesGroup = 0;
  audioPlayedTimes.value = audioPlayedTimesGroup;
  audioCurrentTime.value = '00:00';
  audioDuration.value = '00:00';
}

function willToQuestion(seq: number) {
  seqWillTo = seq;
  reviewDlg.value = false;
  if (answer.value.trim()=='' || answer.value==answerOld.value) {
    toQuestion();
  } else {
    saveRemindDlg.value = true;
  }
}

function toQuestion() {
  accessWithToken({
    method: 'POST',
    onSuccess: onGoToQuestionSuccess,
    token: userStore.token,
    url: url_exam_question,
    onError: (message:string) => {
      notifyError(message, 'Failed to go to question ' + seqWillTo);
    },
  }, {
    section_id: examStore.section.id,
    seq: seqWillTo,
  });
}

const onGoToQuestionSuccess = function(data: unknown) {
  loadQuestion(data as QuestionResult);
}

const onAnswerSuccess = function(data: unknown) {
  examAnswer.value = (data as QuestionResult).exam_answer;
  answered.value[question.value.seq - 1] = true;
  answerOld.value = answer.value;
  $q.notify({ type: 'positive', timeout: 1000, message: 'Succeeded to save answer' });
}

function onAnswer() {
  accessWithToken({
      method: 'POST',
      onSuccess: onAnswerSuccess,
      token: userStore.token,
      url: url_exam_answer,
      onError: (message:string) => {
        notifyError(message, 'Failed to answer question ' + question.value.seq);
      },
    }, {
      answer: answer.value,
      exam_answer_id: examAnswer.value ? examAnswer.value.id : '',
      exam_id: examStore.exam.id,
      exam_section_id: examStore.section.id,
      paper_id: paperStore.paper.id,
      paper_section_id: paperStore.section.id,
      question_id: question.value.id,
      question_group_id: questionGroup.value.id,
      question_seq: question.value.seq,
    });
}

function onSingleChoiceUpdate(newVal: string) {
  answer.value = newVal;
}

function onMultiChoiceUpdate() {
  answer.value = group.value.join('|');
}

function onFillInBlankUpdate() {
  const values = new Array(answers_string.value.length).fill('');
  const separators = values.join('|');
  for (let i=0; i<values.length; i++) {
    values[i] = answers_string.value[i].trim();
  }
  answer.value = values.join('|');
  if (answer.value === separators)
    answer.value = '';
}

function onPreview() {
  reviewDlg.value = true;
}

function onToggleMark(newVal: boolean) {
  mark.value = newVal;
  marks.value[question.value.seq-1] = newVal;
  loadMark();
}

const audioPlayedMax = 1;
const audioPlayDlg = ref(false);
const audioPlaying = ref(false);
const audioPlayedTimes = ref(0);
const audioCurrentTime = ref('00:00');
const audioDuration = ref('00:00');

function onAudioPlayConfirm() {
  audioPlayDlg.value = true;
}

function onAudioPlay() {
  if (audioPlayedTimes.value > audioPlayedMax) return;
  const value = examStore.audioPlayTimes[questionGroup.value.id];
  if (value && value >= audioPlayedMax) {
    return;
  }
  audioPlayedTimes.value++;
  examStore.audioPlayTimes[questionGroup.value.id] = audioPlayedTimes.value;
  const audioElement = document.getElementById('examAudio');
  if (audioElement) {
    audioPlaying.value = true;
    const audio = audioElement as HTMLAudioElement;
    audio.autoplay = false;
    audio.loop = false;
    const min = Math.floor(audio.duration / 60);
    const sec = Math.floor(audio.duration % 60);
    audioDuration.value = `${min < 10? '0' : ''}${min}:${sec < 10? '0' : ''}${sec}`;
    audio.addEventListener('timeupdate', () => {
      const minutes = Math.floor(audio.currentTime / 60);
      const seconds = Math.floor(audio.currentTime % 60);
      audioCurrentTime.value = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    });
    audio.addEventListener('ended', () => {
      audioPlaying.value = false;
    });
    void audio.play();
  }
  audioPlayedTimes.value++;
}

function listQuestionsInGroupSuc(result: unknown) {
  const data = result as QuestionsInGroupResult;
  const nodeMap = new Map<string, QTreeNode>();

  const questions = data.questions;
  questions.forEach(question => {
    nodeMap.set(question.id, {
      label: question.seq + '. ' + stripHtml(question.content),
      children: [],
    });
  });

  const options = data.question_options;
  options.forEach(option => {
    const parentNode = nodeMap.get(option.question_id);
    if (parentNode) {
      parentNode.children?.push({
        label: option.content,
        icon: 'radio_button_unchecked',
      });
    }
  });

  questionsInGroupTree.value = Array.from(nodeMap.values());
}

function listQuestionsInGroup() {
  if (!questionsInGroupFlag.value)
    return;
  accessWithToken({
    method: 'POST',
    onSuccess: listQuestionsInGroupSuc,
    token: userStore.token,
    url: url_exam_questions_in_group,
    onError: (message:string) => {
      notifyError(message, 'Failed to list questions in Group ' + question.value.seq);
    },
  }, {
    exam_id: examStore.exam.id,
    question_group_id: questionGroup.value.id,
  });
}

loadQuestion();
</script>

<template>
  <div class="row q-col-gutter-md">
    <div class="text-left col-3">
      <q-btn color="secondary" flat icon="text_decrease" @click="setFontSize(-1)" :disabled="fontSize<=13">
        <q-tooltip anchor="top middle" self="center middle" class="bg-secondary">Decrease Font</q-tooltip>
      </q-btn>
      <q-btn color="secondary" flat icon="text_increase" @click="setFontSize(1)" :disabled="fontSize>=18">
        <q-tooltip anchor="top middle" self="center middle" class="bg-secondary">Increase Font</q-tooltip>
      </q-btn>
      <q-toggle
        v-model="questionsInGroupFlag"
        @click="listQuestionsInGroup"
        color="secondary"
        label="show all questions"
      >
        <q-tooltip anchor="top middle" self="center middle" class="bg-secondary">View all questions in this group</q-tooltip>
      </q-toggle>
    </div>
    <div class="text-center col-6">
      <q-btn flat round icon="keyboard_arrow_left" @click="willToQuestion(question.seq-1)"
             :color="(questionsInGroupFlag || question.seq==1 || audioPlaying || recorderRef?.isRecording) ? 'grey' : 'secondary'"
             :disable="questionsInGroupFlag || question.seq==1 || audioPlaying || recorderRef?.isRecording">
        <q-tooltip anchor="top middle" self="center middle" class="bg-secondary">Previous Question</q-tooltip>
      </q-btn>
      Question {{question.seq}} / {{paperStore.section.question_num}}
      <q-btn flat round icon="keyboard_arrow_right" @click="willToQuestion(question.seq+1)"
             :color="(questionsInGroupFlag || question.seq>=paperStore.section.question_num || audioPlaying || recorderRef?.isRecording) ? 'grey' : 'secondary'"
             :disable="questionsInGroupFlag || question.seq>=paperStore.section.question_num || audioPlaying || recorderRef?.isRecording">
        <q-tooltip anchor="top middle" self="center middle" class="bg-secondary">
          <label v-if="question.seq < paperStore.section.question_num">Next Question</label>
          <label v-if="question.seq == paperStore.section.question_num">End of Section</label>
        </q-tooltip>
      </q-btn>
    </div>
    <div class="text-right col-3">
      <span v-if="showTime" style="color:grey">{{ count_down_title }}</span>
      <q-toggle v-model="showTime" label="Show Time&nbsp;" color="secondary" right-label/>
    </div>
  </div>

  <div :style="{ fontSize: fontSize+'px' }">
    <q-splitter
      v-model="splitterModel"
      :limits="[30, 70]"
      style="width: 100%;"
      separator-class="bg-grey-4"
      separator-style="width: 3px; cursor: col-resize"
    >
      <template v-slot:before>
        <q-scroll-area style="height: 86vh">
          <div class="q-pa-md">
            <div class="text-h6">{{questionGroup.title}}</div>
            <p></p>
            <div v-html="questionGroup.content"></div>
          </div>
          <div class="row q-pa-md items-center" v-if="hasAudio">
            <q-btn color="primary" round icon="play_arrow" @click="onAudioPlayConfirm" :disable="audioPlayedTimes>=audioPlayedMax">
              <q-tooltip anchor="top middle" self="bottom middle">Play Audio</q-tooltip>
            </q-btn>&nbsp;&nbsp;
            <label>{{ audioCurrentTime }} / {{ audioDuration }}</label>&nbsp;&nbsp;
            <label>The audio can be played only once and can't be stopped until the end! Please read related questions first if necessary and click the above icon to play audio.</label>
          </div>
        </q-scroll-area>
      </template>

      <template v-slot:after>
        <q-scroll-area style="height: 86vh">
          <div v-if="!questionsInGroupFlag">
            <div class="q-pa-md">
              <div class="row">
                <div v-html="question.content"></div>
              </div>
              <div>Answer:</div>

              <div v-if="[QuestionType.SingleChoice, QuestionType.Listening].includes(question.question_type)">
                <q-option-group
                  v-model="answer"
                  :options="options"
                  @update:model-value="onSingleChoiceUpdate"
                  color="primary"
                />
              </div>
              <div v-if="[QuestionType.DefiniteMultipleChoice, QuestionType.IndefiniteMultipleChoice].includes(question.question_type)">
                <q-option-group
                  v-model="group"
                  :options="options"
                  @update:model-value="onMultiChoiceUpdate"
                  color="primary"
                  type="checkbox"
                />
              </div>
              <div v-if="question.question_type === QuestionType.FillInTheBlank" style="max-width: 50%">
                <ol style="list-style: none; padding-left: 0;">
                  <li v-for="index in Array.from({ length: options.length }, (_, i) => i) " :key="index"
                      style="display: flex; align-items: center;">
                    <span v-if="options.length > 1" style="margin-right: 8px; white-space: nowrap;">({{index+1}})</span>
                    <q-input v-model="answers_string[index]" dense @update:model-value="onFillInBlankUpdate" style="flex: 1;" />
                  </li>
                </ol>
              </div>
              <div v-if="question.question_type === QuestionType.Writing" style="max-width: 100%">
                <q-input v-model="answer" type="textarea" rows="30" filled/>
                <div class="q-mt-sm">{{ wordCount }} words</div>
              </div>
              <div v-if="question.question_type === QuestionType.Speaking">
                <AudioRecorder ref="recorderRef" />
              </div>

              <div class="row justify-between items-center" v-if="question.question_type !== QuestionType.Speaking">
                <div class="text-left">
                  <q-btn
                    :color="(answer.trim()=='' || answer==answerOld) ? 'grey' : 'primary'"
                    label="Save"
                    @click="onAnswer"
                    :disable="answer.trim()=='' || answer==answerOld"
                  />
                </div>
                <div class="text-right" v-if="paperStore.section?.question_num>5 && !audioPlaying && !recorderRef?.isRecording">
                  <q-toggle v-model="mark" label="Mark for Review" color="orange" @update:model-value="onToggleMark" left-label/>
                  <q-btn color="secondary" round icon="preview" @click="onPreview"/>
                </div>
              </div>
            </div>
          </div>

          <div v-if="questionsInGroupFlag">
            <div style="text-align: center; margin-bottom: 16px; color: red;">
              Preview Only! Please click "show all questions" toggle to switch back!
            </div>
            <q-tree
              :nodes="questionsInGroupTree"
              node-key="label"
              default-expand-all
            />
          </div>
        </q-scroll-area>
      </template>
    </q-splitter>
  </div>

  <q-dialog v-model="submitSectionDlg" persistent>
    <q-card style="width: 500px; max-width: 120vw;">
      <q-card-section class="row items-center">
        <q-avatar icon="assignment_turned_in" color="primary" text-color="white" />
        <span class="q-ml-sm">Are you sure to submit & exit this section?</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Submit & Exit Section" color="primary" v-close-popup @click="submitSection"/>
        <q-btn flat label="Cancel" color="primary" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="reviewDlg" v-if="paperStore.section?.question_num>5" :disabled="audioPlaying || recorderRef?.isRecording">
    <q-card style="max-width: 120vw;">
      <q-btn-toggle
        v-model="reviewIdx"
        push
        glossy
        toggle-color="primary"
        :options="reviewOptions"
        @click="willToQuestion(parseInt(reviewIdx))"
      />

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="audioPlayDlg">
    <q-card style="max-width: 120vw;">
      <q-card-actions align="left">
        <q-icon name="warning" color="warning" size="4rem"/>
        <label>The audio can be played only once and can't be stopped until the end!&nbsp;&nbsp;Please read related questions first if necessary!</label>
      </q-card-actions>

      <q-card-actions align="right">
        <q-btn flat label="Play" color="primary" v-close-popup @click="onAudioPlay"/>
        <q-btn flat label="Cancel" color="primary" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="saveRemindDlg">
    <q-card style="max-width: 120vw;">
      <q-card-actions align="left">
        <q-icon name="warning" color="warning" size="4rem"/>
        <label>Would you want to leave this question without saving your answer?</label>
      </q-card-actions>

      <q-card-actions align="right">
        <q-btn flat label="Proceed without saving" color="grey" v-close-popup @click="toQuestion"/>
        <q-btn flat label="Cancel" color="primary" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped>
audio {
  width: 40px;  /* 仅保留必要宽度 */
  height: 40px; /* 固定高度避免留白 */
  overflow: hidden; /* 关键属性 */
}
</style>
