<template>
  <div class="paper-preview">
    <!-- T038: Validation Summary Badge -->
    <div v-if="showValidation && (errors.length > 0 || warnings.length > 0)" class="validation-summary q-mb-md">
      <q-banner v-if="errors.length > 0" class="bg-negative text-white q-mb-sm" rounded>
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        <div class="text-weight-bold">{{ errors.length }} Error(s)</div>
        <div v-for="(err, idx) in errors.slice(0, 3)" :key="idx" class="text-caption">
          • {{ err.message }}
        </div>
        <div v-if="errors.length > 3" class="text-caption">...and {{ errors.length - 3 }} more</div>
      </q-banner>
      <q-banner v-if="warnings.length > 0" class="bg-warning text-dark" rounded>
        <template v-slot:avatar>
          <q-icon name="warning" />
        </template>
        <div class="text-weight-bold">{{ warnings.length }} Warning(s)</div>
        <div v-for="(warn, idx) in warnings.slice(0, 3)" :key="idx" class="text-caption">
          • {{ warn.message }}
        </div>
        <div v-if="warnings.length > 3" class="text-caption">...and {{ warnings.length - 3 }} more</div>
      </q-banner>
    </div>

    <!-- Paper Header with Inheritance Badge -->
    <div class="row items-center q-mb-md">
      <div class="text-h4">{{ paper.title }}</div>
      <q-chip v-if="paper.status" :color="statusColor" text-color="white" size="sm" class="q-ml-md">
        {{ paper.status }}
      </q-chip>
    </div>

    <div v-if="paper.note" class="q-mb-lg">
      <div class="text-subtitle1">Instructions:</div>
      <div v-html="paper.note" class="paper-content"></div>
    </div>

    <!-- Score/Duration Summary with Inheritance Indicators -->
    <div class="row q-col-gutter-sm q-mb-lg text-body2">
      <div class="col-auto">
        <q-icon name="schedule" size="xs" class="q-mr-xs" />
        <strong>Duration:</strong> {{ paper.duration }} min
      </div>
      <div class="col-auto">
        <q-icon name="star" size="xs" class="q-mr-xs" />
        <strong>Full Score:</strong> {{ paper.full_score }}
      </div>
      <div class="col-auto">
        <q-icon name="check_circle" size="xs" class="q-mr-xs" />
        <strong>Pass Score:</strong> {{ paper.pass_score }}
      </div>
      <div v-if="paper.question_type" class="col-auto">
        <q-chip size="sm" color="primary" text-color="white" icon="category">
          Default: {{ questionTypeName(paper.question_type) }}
        </q-chip>
      </div>
    </div>

    <q-separator class="q-mb-lg" />

    <!-- Sections -->
    <div v-for="section in paper.sections" :key="section.id || section.seq" class="q-mb-xl">
      <div class="row items-center q-mb-sm">
        <div class="text-h5">{{ section.name }}</div>
        <!-- Inheritance Badge: Section-level overrides -->
        <q-chip v-if="section.question_type && section.question_type !== paper.question_type" 
                size="xs" color="info" text-color="white" class="q-ml-sm">
          {{ questionTypeName(section.question_type) }}
        </q-chip>
        <q-chip v-if="section.duration" size="xs" outline class="q-ml-sm">
          {{ section.duration }} min
        </q-chip>
      </div>

      <!-- Section Context / Passage -->
      <div v-if="section.content" class="q-mb-lg q-pa-md bg-white shadow-1 rounded-borders paper-content" v-html="section.content"></div>
      
      <div v-if="section.note" class="text-body2 q-mb-md paper-content italic text-grey-7" v-html="section.note"></div>

      <!-- Questions -->
      <div v-for="question in section.questions" :key="question.id || question.seq" 
            class="q-mb-md q-pa-md bg-grey-1 rounded-borders">
        <div class="row items-start">
          <div class="text-weight-bold q-mr-sm">Q{{ question.seq }}.</div>
          <div class="col paper-content" v-html="question.content || '(No content)'"></div>
          <div class="row items-center">
            <!-- Inheritance Badge: Question-level overrides -->
            <q-chip v-if="question.question_type && question.question_type !== (section.question_type || paper.question_type)"
                    size="xs" color="secondary" class="q-mr-xs">
              {{ questionTypeName(question.question_type) }}
            </q-chip>
            <q-chip size="sm" color="primary">{{ question.score }} pts</q-chip>
          </div>
        </div>

        <!-- Choice options -->
        <div v-if="question.options && question.options.length > 0" class="q-mt-sm q-pl-lg">
          <div
            v-for="option in question.options"
            :key="option.code"
            class="q-mb-xs"
            :class="{ 'text-positive text-weight-bold': option.is_correct }"
          >
            <span class="q-mr-sm">{{ option.code }}.</span>
            <span>{{ option.content }}</span>
            <q-icon v-if="option.is_correct" name="check_circle" color="positive" class="q-ml-xs" />
          </div>
        </div>

        <!-- Writing / Speaking placeholders -->
        <div v-else-if="question.question_type === 6" class="q-mt-sm q-pl-lg text-grey-6">
          <div class="q-pa-md bg-grey-2 rounded-borders">Student will write their response here...</div>
        </div>
        <div v-else-if="question.question_type === 8" class="q-mt-sm q-pl-lg text-grey-6">
          <q-icon name="mic" /> Student will record audio response
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ValidationIssue } from 'src/stores/paper-store';

interface QuestionOption {
  code: string;
  content: string;
  is_correct: boolean;
}

interface Question {
  id?: string;
  seq: number;
  content: string;
  question_type: number;
  score: number | null;
  options: QuestionOption[];
}

interface Section {
  id?: string;
  seq: number;
  name: string;
  content?: string;
  duration?: number;
  question_type?: number;
  note?: string;
  questions: Question[];
}

interface Paper {
  title: string;
  note?: string;
  duration: number;
  question_type?: number;
  full_score?: number;
  pass_score?: number;
  status?: string;
  sections: Section[];
}

const props = withDefaults(defineProps<{
  paper: Paper;
  validationIssues?: ValidationIssue[];
  showValidation?: boolean;
}>(), {
  validationIssues: () => [],
  showValidation: true,
});

const errors = computed(() => props.validationIssues.filter(i => i.type === 'error'));
const warnings = computed(() => props.validationIssues.filter(i => i.type === 'warning'));

const statusColor = computed(() => {
  switch (props.paper.status) {
    case 'Published': return 'positive';
    case 'Draft': return 'warning';
    case 'Archived': return 'grey';
    default: return 'primary';
  }
});

const questionTypeNames: Record<number, string> = {
  1: 'Single Choice',
  2: 'True/False',
  3: 'Definite Multiple',
  4: 'Indefinite Multiple',
  5: 'Fill in Blank',
  6: 'Writing',
  7: 'Listening',
  8: 'Speaking',
};

function questionTypeName(type: number | undefined): string {
  return type ? questionTypeNames[type] || `Type ${type}` : 'Unknown';
}
</script>

<style scoped>
.paper-preview {
  padding: 1rem;
}
.paper-content {
  line-height: 1.6;
}
.paper-content :deep(img) {
  max-width: 100%;
  height: auto;
}
.paper-content :deep(audio) {
  width: 100%;
}
.validation-summary {
  position: sticky;
  top: 0;
  z-index: 10;
}
</style>
