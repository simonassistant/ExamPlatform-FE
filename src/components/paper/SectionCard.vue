<template>
  <div class="section-container q-mb-xl">
    <q-card
      class="paper-editor-card q-mb-md"
      :class="{ 'paper-editor-card--focused': focused }"
      @click="$emit('focus')"
    >
      <q-card-section class="q-py-sm bg-primary text-white row items-center">
        <q-icon name="drag_indicator" class="drag-handle q-mr-sm" size="sm" />
        <div class="text-subtitle1 text-weight-bold">Section {{ section.seq }}: {{ section.name }}</div>
        <q-space />
        <q-btn flat round dense icon="delete" color="white" size="sm" @click.stop="$emit('remove')" />
      </q-card-section>

      <q-card-section v-if="focused">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-input v-model="section.name" label="Section Name" outlined dense />
          </div>
          <div class="col-12 col-md-4">
            <q-select
              v-model="section.question_type"
              :options="questionTypes"
              label="Inherited Type"
              outlined
              dense
              emit-value
              map-options
              clearable
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="section.content"
              label="Section Context (Passage, Audio Transcript, etc.)"
              type="textarea"
              outlined
              dense
              autogrow
              rows="3"
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="section.note"
              label="Instructions for Candidates"
              type="textarea"
              outlined
              dense
              rows="2"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="q-pl-lg">
      <draggable
        v-model="section.questions"
        group="questions"
        item-key="temp_id"
        handle=".drag-handle"
        ghost-class="ghost-card"
      >
        <template #item="{ element, index }">
          <QuestionCard
            :question="element"
            :focused="focusedQuestionId === element.temp_id"
            @focus="$emit('focus-question', element.temp_id)"
            @remove="removeQuestion(index)"
          />
        </template>
      </draggable>

      <div class="row justify-center q-mt-md">
        <q-btn
          outline
          color="primary"
          icon="add"
          label="Add Question"
          @click="addQuestion"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable';
import QuestionCard from './QuestionCard.vue';

const props = defineProps<{
  section: any;
  focused: boolean;
  focusedQuestionId: string | null;
}>();

const emit = defineEmits(['focus', 'remove', 'focus-question']);

const questionTypes = [
  { label: 'Single Choice', value: 1 },
  { label: 'True/False', value: 2 },
  { label: 'Definite Multiple Choice', value: 3 },
  { label: 'Indefinite Multiple Choice', value: 4 },
  { label: 'Fill in the Blank', value: 5 },
  { label: 'Writing', value: 6 },
  { label: 'Listening', value: 7 },
  { label: 'Speaking', value: 8 },
];

function addQuestion() {
  const maxSeq = props.section.questions.length > 0
    ? Math.max(...props.section.questions.map((q: any) => q.seq))
    : 0;

  const newQuestion = {
    temp_id: Math.random().toString(36).substr(2, 9),
    seq: maxSeq + 1,
    content: '',
    question_type: props.section.question_type || 1,
    score: props.section.unit_score || 1,
    options: [],
  };
  props.section.questions.push(newQuestion);
  emit('focus-question', newQuestion.temp_id);
}

function removeQuestion(index: number) {
  props.section.questions.splice(index, 1);
  props.section.questions.forEach((q: any, i: number) => {
    q.seq = i + 1;
  });
}
</script>

<style scoped>
.section-container {
  border-left: 2px solid #e0e0e0;
}
</style>
