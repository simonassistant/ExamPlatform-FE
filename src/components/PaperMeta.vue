<script setup lang="ts">
import { computed } from 'vue';
import type { Paper } from './models';
import { QuestionType } from './models';

const props = defineProps<{ paper: Paper | null; disabled?: boolean }>();
const emit = defineEmits<{ (e: 'update', partial: Partial<Paper>): void }>();

const questionTypeOptions = [
  { label: 'Single Choice', value: QuestionType.SingleChoice },
  { label: 'True / False', value: QuestionType.TrueFalse },
  { label: 'Definite Multiple Choice', value: QuestionType.DefiniteMultipleChoice },
  { label: 'Indefinite Multiple Choice', value: QuestionType.IndefiniteMultipleChoice },
  { label: 'Fill in the Blank', value: QuestionType.FillInTheBlank },
  { label: 'Writing', value: QuestionType.Writing },
  { label: 'Listening', value: QuestionType.Listening },
  { label: 'Speaking', value: QuestionType.Speaking },
];

const current = computed<Paper>(() =>
  props.paper ?? {
    title: '',
    questionType: QuestionType.SingleChoice,
    note: '',
    sections: [],
  }
);

function emitUpdate(partial: Partial<Paper>) {
  emit('update', partial);
}
</script>

<template>
  <q-card flat bordered>
    <q-card-section class="row q-col-gutter-md">
      <div class="col-12">
        <q-input
          label="Title"
          :model-value="current.title"
          :disable="disabled"
          standout="bg-grey-2"
          dense
          clearable
          @update:model-value="(v) => emitUpdate({ title: v || '' })"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-select
          label="Default Question Type"
          :model-value="current.questionType"
          :options="questionTypeOptions"
          option-label="label"
          option-value="value"
          map-options
          emit-value
          dense
          :disable="disabled"
          @update:model-value="(v) => emitUpdate({ questionType: v as QuestionType })"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-input
          label="Duration (minutes)"
          type="number"
          :model-value="current.duration ?? ''"
          dense
          :disable="disabled"
          @update:model-value="(v) => emitUpdate({ duration: v ? Number(v) : undefined })"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          label="Full Score"
          type="number"
          :model-value="current.fullScore ?? ''"
          dense
          :disable="disabled"
          @update:model-value="(v) => emitUpdate({ fullScore: v ? Number(v) : undefined })"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          label="Pass Score"
          type="number"
          :model-value="current.passScore ?? ''"
          dense
          :disable="disabled"
          @update:model-value="(v) => emitUpdate({ passScore: v ? Number(v) : undefined })"
        />
      </div>
      <div class="col-12 col-md-4">
        <q-input
          label="Unit Score"
          type="number"
          :model-value="current.unitScore ?? ''"
          dense
          :disable="disabled"
          @update:model-value="(v) => emitUpdate({ unitScore: v ? Number(v) : undefined })"
        />
      </div>
      <div class="col-12">
        <q-input
          label="Notes"
          type="textarea"
          autogrow
          :model-value="current.note ?? ''"
          :disable="disabled"
          @update:model-value="(v) => emitUpdate({ note: v ?? '' })"
        />
      </div>
    </q-card-section>
  </q-card>
</template>
