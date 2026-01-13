<template>
  <q-page class="editor-page q-pa-lg">
    <div class="row q-col-gutter-lg">
      <!-- Main Editor Area -->
      <div class="col-12 col-md-9">
        <header class="row items-center q-mb-lg">
          <q-btn flat round icon="arrow_back" @click="goBack" class="q-mr-sm" />
          <h1 class="text-h4 q-my-none text-weight-medium">{{ isNew ? 'Create Paper' : 'Edit Paper' }}</h1>
          
          <div class="q-ml-md row items-center text-grey-7 text-caption">
            <q-icon :name="isDirty ? 'sync' : 'cloud_done'" :color="isDirty ? 'warning' : 'positive'" class="q-mr-xs" />
            <span>{{ saveStatus }}</span>
          </div>
          
          <q-space />
          
          <div class="row q-gutter-sm">
            <q-btn flat round icon="undo" :disable="!canUndo" @click="handleUndo">
              <q-tooltip>Undo</q-tooltip>
            </q-btn>
            <q-btn flat round icon="redo" :disable="!canRedo" @click="handleRedo">
              <q-tooltip>Redo</q-tooltip>
            </q-btn>
            <q-separator vertical inset class="q-mx-sm" />
            <q-btn color="primary" icon="visibility" label="Preview" @click="showPreview = true" outline />
            <q-btn color="positive" icon="save" label="Publish Paper" @click="savePaper" :loading="saving" />
          </div>
        </header>

        <!-- Paper Metadata Card -->
        <q-card
          class="paper-editor-card q-mb-xl"
          :class="{ 'paper-editor-card--focused': focusedId === 'paper-meta' }"
          @click="focusedId = 'paper-meta'"
        >
          <q-card-section class="bg-primary text-white row items-center">
            <q-icon name="description" size="sm" class="q-mr-sm" />
            <div class="text-h6">General Information</div>
          </q-card-section>

          <q-card-section v-if="focusedId === 'paper-meta'">
            <div class="row q-col-gutter-lg">
              <div class="col-12">
                <q-input v-model="paper.title" label="Paper Title" outlined stack-label class="text-h6" />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="paper.paper_type"
                  :options="paperTypeOptions"
                  label="Exam Mode"
                  outlined
                  emit-value
                  map-options
                />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="paper.question_type"
                  :options="questionTypeOptions"
                  label="Default Question Type"
                  outlined
                  emit-value
                  map-options
                  clearable
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model.number="paper.duration" type="number" label="Total Time (mins)" outlined />
              </div>
              <div class="col-12">
                <q-input v-model="paper.note" type="textarea" label="Welcome Note / Global Instructions" outlined autogrow rows="2" />
              </div>
            </div>
          </q-card-section>
          
          <q-card-section v-else class="row items-center cursor-pointer q-py-md">
            <div class="text-h6 text-primary">{{ paper.title }}</div>
            <q-space />
            <div class="text-caption text-grey-7">{{ modeLabel }} • {{ paper.duration }} mins</div>
          </q-card-section>
        </q-card>

        <!-- Sections List -->
        <draggable
          v-model="paper.sections"
          group="sections"
          item-key="temp_id"
          handle=".drag-handle"
          ghost-class="ghost-card"
          @change="pushHistory"
        >
          <template #item="{ element, index }">
            <SectionCard
              :section="element"
              :focused="focusedId === element.temp_id"
              :focused-question-id="focusedQuestionId"
              @focus="focusedId = element.temp_id"
              @focus-question="handleFocusQuestion"
              @remove="removeSection(index)"
            />
          </template>
        </draggable>

        <!-- Global Actions -->
        <div class="row justify-center q-my-xl">
          <q-btn
            unelevated
            color="primary"
            size="lg"
            icon="add_circle"
            label="Add New Section"
            padding="12px 32px"
            @click="addSection"
          />
        </div>
      </div>

      <!-- Right Sidebar (Question Bank) -->
      <div class="col-12 col-md-3">
        <div class="sticky-sidebar">
          <QuestionBank />
          
          <q-card class="q-mt-md shadow-1">
            <q-card-section>
              <div class="text-subtitle2 q-mb-sm">Status Panel</div>
              <div class="row justify-between text-caption q-mb-xs">
                <span>Sections:</span>
                <span class="text-weight-bold">{{ paper.sections.length }}</span>
              </div>
              <div class="row justify-between text-caption q-mb-xs">
                <span>Total Questions:</span>
                <span class="text-weight-bold">{{ totalQuestions }}</span>
              </div>
              <div class="row justify-between text-caption">
                <span>Total Weight:</span>
                <span class="text-weight-bold">{{ totalScore }}</span>
              </div>
            </q-card-section>
          </q-card>

          <q-card v-if="validationIssues.length" class="q-mt-md bg-red-1">
            <q-card-section>
              <div class="text-subtitle2 text-negative row items-center q-mb-sm">
                <q-icon name="warning" class="q-mr-xs" /> Issues ({{ validationIssues.length }})
              </div>
              <ul class="q-pl-md q-ma-none text-caption text-negative">
                <li v-for="(issue, idx) in validationIssues" :key="idx">{{ issue.message }}</li>
              </ul>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Preview Dialog -->
    <q-dialog v-model="showPreview" maximized>
      <q-card>
        <PaperPreview :paper="paper" />
        <q-btn round color="primary" icon="close" v-close-popup class="fixed-top-right q-ma-md" />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import draggable from 'vuedraggable';
import { api } from 'src/util/api';
import SectionCard from 'src/components/paper/SectionCard.vue';
import QuestionBank from 'src/components/paper/QuestionBank.vue';
import PaperPreview from 'src/components/paper/PaperPreview.vue';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

// State
const paper = ref<any>({
  id: undefined,
  title: 'Untitled Paper',
  paper_type: 1,
  duration: 60,
  question_type: 1,
  full_score: 100,
  pass_score: 60,
  note: '',
  sections: [],
});

const focusedId = ref('paper-meta');
const focusedQuestionId = ref<string | null>(null);
const showPreview = ref(false);
const saving = ref(false);
const isDirty = ref(false);
const lastSavedAt = ref<Date | null>(null);
let autoSaveTimer: any = null;

const saveStatus = computed(() => {
  if (saving.value) return 'Saving...';
  if (isDirty.value) return 'Unsaved changes';
  if (lastSavedAt.value) {
    return `Saved at ${lastSavedAt.value.toLocaleTimeString()}`;
  }
  return 'Saved to cloud';
});

const isNew = computed(() => route.params.id === 'new');

const paperTypeOptions = [
  { label: 'Reading', value: 1 },
  { label: 'Listening', value: 2 },
  { label: 'Writing', value: 3 },
  { label: 'Speaking', value: 4 },
];

const questionTypeOptions = [
  { label: 'Single Choice', value: 1 },
  { label: 'True/False', value: 2 },
  { label: 'Definite Multiple Choice', value: 3 },
  { label: 'Indefinite Multiple Choice', value: 4 },
  { label: 'Fill in the Blank', value: 5 },
  { label: 'Writing', value: 6 },
  { label: 'Listening', value: 7 },
  { label: 'Speaking', value: 8 },
];

const modeLabel = computed(() => {
  return paperTypeOptions.find(o => o.value === paper.value.paper_type)?.label || 'Test';
});

// Stats
const totalQuestions = computed(() => 
  paper.value.sections.reduce((acc: number, s: any) => acc + s.questions.length, 0)
);

const totalScore = computed(() => 
  paper.value.sections.reduce((acc: number, s: any) => 
    acc + s.questions.reduce((qAcc: number, q: any) => qAcc + (q.score || 0), 0), 0
  )
);

// History (Undo/Redo)
const historyStack = ref<string[]>([]);
const historyIndex = ref(-1);
const isSuppressingHistory = ref(false);

function pushHistory() {
  isDirty.value = true;
  scheduleAutoSave();
  
  if (isSuppressingHistory.value) return;
  const state = JSON.stringify(paper.value);
  if (historyStack.value[historyIndex.value] === state) return;

  historyIndex.value++;
  historyStack.value = historyStack.value.slice(0, historyIndex.value);
  historyStack.value.push(state);
  
  if (historyStack.value.length > 30) {
    historyStack.value.shift();
    historyIndex.value--;
  }
}

const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1);

function handleUndo() {
  if (!canUndo.value) return;
  isSuppressingHistory.value = true;
  historyIndex.value--;
  paper.value = JSON.parse(historyStack.value[historyIndex.value]!);
  setTimeout(() => isSuppressingHistory.value = false, 50);
}

function handleRedo() {
  if (!canRedo.value) return;
  isSuppressingHistory.value = true;
  historyIndex.value++;
  paper.value = JSON.parse(historyStack.value[historyIndex.value]!);
  setTimeout(() => isSuppressingHistory.value = false, 50);
}

// Validation
const validationIssues = computed(() => {
  const issues: any[] = [];
  if (!paper.value.title?.trim()) issues.push({ message: 'Paper title is missing' });
  if (paper.value.sections.length === 0) issues.push({ message: 'Add at least one section' });
  return issues;
});

function scheduleAutoSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  if (isNew.value) return; // Don't autosave brand new papers until first manual save (to avoid junk)
  
  autoSaveTimer = setTimeout(() => {
    if (isDirty.value) savePaper(true);
  }, 3000); // 3 second debounce
}

// Handlers
function handleFocusQuestion(qId: string) {
  focusedQuestionId.value = qId;
  focusedId.value = ''; // Unfocus section if question is focused
}

function handleGlobalClick() {
  // Logic to unfocus everything if clicking empty space? 
  // Quasar components usually handle their own focus
}

function addSection() {
  const newSection = {
    temp_id: Math.random().toString(36).substr(2, 9),
    seq: paper.value.sections.length + 1,
    name: 'New Section',
    content: '',
    note: '',
    questions: [],
  };
  paper.value.sections.push(newSection);
  focusedId.value = newSection.temp_id;
  pushHistory();
}

function removeSection(index: number) {
  paper.value.sections.splice(index, 1);
  paper.value.sections.forEach((s: any, i: number) => s.seq = i + 1);
  pushHistory();
}

async function savePaper(silent = false) {
  if (saving.value) return;
  if (!silent) saving.value = true;
  try {
    const payload = JSON.parse(JSON.stringify(paper.value));
    const result = await api.post('/proctor/paper/save', payload);
    if (!silent) $q.notify({ type: 'positive', message: 'Paper published!' });
    
    isDirty.value = false;
    lastSavedAt.value = new Date();
    
    if (isNew.value) router.replace(`/proctor/papers/${result.data.id}`);
  } catch (err) {
    if (!silent) $q.notify({ type: 'negative', message: 'Save failed' });
  } finally {
    saving.value = false;
  }
}

async function loadPaper() {
  if (isNew.value) {
    pushHistory();
    return;
  }
  const id = route.params.id;
  try {
    const res = await api.get(`/proctor/paper/${id}`);
    paper.value = res.data;
    // Add temp_ids for draggable
    paper.value.sections.forEach((s: any) => {
      s.temp_id = s.id || Math.random().toString(36).substr(2, 9);
      s.questions.forEach((q: any) => {
        q.temp_id = q.id || Math.random().toString(36).substr(2, 9);
      });
    });
    pushHistory();
  } catch (err) {
    $q.notify({ type: 'negative', message: 'Load failed' });
  }
}

function goBack() {
  router.push('/proctor/papers');
}

// Lifecycle
const keyHandler = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.key === 'z') handleUndo();
  if (e.ctrlKey && e.key === 'y') handleRedo();
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); savePaper(); }
};

onMounted(() => {
  loadPaper();
  window.addEventListener('keydown', keyHandler);
});

onUnmounted(() => {
  window.removeEventListener('keydown', keyHandler);
});
</script>

<style lang="scss" scoped>
.editor-page {
  max-width: 1400px;
  margin: 0 auto;
}

.sticky-sidebar {
  position: sticky;
  top: 80px;
}

header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 10px 0;
}
</style>
