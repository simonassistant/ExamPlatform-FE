<template>
  <q-card
    class="paper-editor-card q-mb-md"
    :class="{ 'paper-editor-card--focused': focused }"
    @click="$emit('focus')"
  >
    <q-card-section class="q-py-sm bg-grey-1 row items-center">
      <q-icon name="drag_indicator" class="drag-handle q-mr-sm" size="sm" />
      <div class="text-subtitle2">Question {{ question.seq }}</div>
      <q-space />
      <q-btn flat round dense icon="delete" color="negative" size="sm" @click.stop="$emit('remove')" />
    </q-card-section>

    <q-card-section v-if="focused">
      <div class="row q-col-gutter-md">
        <div class="col-12">
          <q-input
            v-model="question.content"
            label="Question Text"
            type="textarea"
            outlined
            rows="2"
            dense
            autogrow
          />
        </div>
        <div class="col-12 col-md-6">
          <q-select
            v-model="question.question_type"
            :options="questionTypes"
            label="Question Type"
            outlined
            dense
            emit-value
            map-options
          />
        </div>
        <div class="col-12 col-md-6">
          <q-input
            v-model.number="question.score"
            label="Points"
            type="number"
            outlined
            dense
          />
        </div>
      </div>

      <!-- Options -->
      <div v-if="isChoiceType" class="q-mt-md">
        <div class="text-caption q-mb-sm text-weight-bold">Answer Options</div>
        <div v-for="(option, oIdx) in question.options" :key="oIdx" class="row items-center q-mb-sm q-col-gutter-sm">
          <div class="col-auto">
            <q-checkbox v-model="option.is_correct" dense color="positive" />
          </div>
          <div class="col">
            <q-input
              v-model="option.content"
              dense
              outlined
              :placeholder="`Option ${String.fromCharCode(65 + oIdx)}`"
            />
          </div>
          <div class="col-auto">
            <q-btn flat round dense icon="close" size="xs" color="grey-6" @click="removeOption(oIdx)" />
          </div>
        </div>
        <q-btn
          flat
          dense
          color="primary"
          icon="add"
          label="Add Option"
          size="sm"
          class="q-mt-xs"
          @click="addOption"
        />
      </div>
    </q-card-section>

    <q-card-section v-else class="q-py-md cursor-pointer">
      <div class="text-body1 text-grey-8 ellipsis-2-lines">
        {{ question.content || '(Empty question)' }}
      </div>
      <div class="row items-center q-mt-sm text-caption text-grey-6">
        <q-badge outline color="grey-7" class="q-mr-sm">{{ typeLabel }}</q-badge>
        <span>{{ question.score }} pts</span>
        <q-space />
        <span>{{ question.options?.length || 0 }} options</span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { QuestionType } from '../models';

const props = defineProps<{
  question: any;
  focused: boolean;
}>();

const emit = defineEmits(['focus', 'remove', 'update']);

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

const typeLabel = computed(() => {
  const type = questionTypes.find(t => t.value === props.question.question_type);
  return type ? type.label : 'Unknown';
});

const isChoiceType = computed(() => {
  return [1, 2, 3, 4].includes(props.question.question_type);
});

function addOption() {
  const options = props.question.options || [];
  options.push({
    code: String.fromCharCode(65 + options.length),
    content: '',
    is_correct: false,
  });
}

function removeOption(index: number) {
  props.question.options.splice(index, 1);
  props.question.options.forEach((o: any, i: number) => {
    o.code = String.fromCharCode(65 + i);
  });
}
</script>
