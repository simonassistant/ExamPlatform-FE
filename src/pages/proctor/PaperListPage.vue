<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-lg">
      <div class="text-h4">Exam Papers</div>
      <q-btn flat round icon="help_outline" color="grey-7" class="q-ml-sm" @click="showHelp = true">
        <q-tooltip>How to use the Paper Editor</q-tooltip>
      </q-btn>
      <q-space />
      <q-btn
        color="primary"
        icon="add"
        label="New Paper"
        @click="createPaper"
      />
      <q-btn
        class="q-ml-sm"
        color="secondary"
        icon="upload"
        label="Import Markdown"
        @click="showImportDialog = true"
      />
    </div>

    <q-table
      :rows="papers"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
    >
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            flat
            dense
            icon="edit"
            color="primary"
            @click="editPaper(props.row.id)"
          >
            <q-tooltip>Edit paper</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            icon="delete"
            color="negative"
            @click="confirmDelete(props.row)"
          >
            <q-tooltip>Delete paper</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <!-- Import Dialog -->
    <q-dialog v-model="showImportDialog">
      <q-card style="min-width: 450px">
        <q-card-section>
          <div class="text-h6">Import Paper from Markdown</div>
        </q-card-section>
        <q-card-section>
          <div class="text-body2 text-grey-7 q-mb-md">
            Select a markdown (.md) file to import. The file should follow the
            <a href="#" @click.prevent="showHelp = true" class="text-primary">required format</a>.
          </div>
          <q-file
            v-model="importFile"
            label="Select .md file"
            accept=".md"
            outlined
            counter
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Import"
            :loading="importing"
            :disable="!importFile"
            @click="importPaper"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Help Dialog -->
    <q-dialog v-model="showHelp" maximized>
      <q-card>
        <q-bar class="bg-primary text-white">
          <div>Paper Editor Guide</div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>
        <q-card-section class="scroll" style="max-height: calc(100vh - 50px)">
          <div class="text-h5 q-mb-md">Quick Start Guide</div>
          
          <div class="text-h6 q-mt-lg">Creating a Paper</div>
          <ol>
            <li>Click <strong>New Paper</strong> to open the editor</li>
            <li>Fill in the paper details (title, duration, scores)</li>
            <li>Click <strong>+ Add Section</strong> to create sections (e.g., Reading, Listening)</li>
            <li>Inside each section, add <strong>Questions</strong> with options</li>
            <li>Use <strong>Preview</strong> to see how it looks to students</li>
            <li>Click <strong>Save</strong> when done</li>
          </ol>

          <div class="text-h6 q-mt-lg">Importing from Markdown</div>
          <p>Your markdown file should follow this structure:</p>
          <pre class="bg-grey-2 q-pa-md rounded-borders overflow-auto">
# Paper Title
```
paper type: reading
full score: 100
duration: 60
```

## Section Name
```
duration: 20
question type: single choice
```
Section passage or information goes here...

### Question 1
What is the answer?

- [ ] Wrong option
- [x] Correct option
- [ ] Another wrong option
          </pre>

          <div class="text-h6 q-mt-lg">Tips</div>
          <ul>
            <li><strong>Ctrl+Z</strong> to undo, <strong>Ctrl+Y</strong> to redo</li>
            <li>Red icons indicate errors that must be fixed</li>
            <li>Yellow icons indicate warnings (recommended to fix)</li>
            <li>Save frequently to avoid losing work</li>
          </ul>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'src/util/api';

interface Paper {
  id: string;
  title: string;
  section_num: number;
  question_num: number;
  duration: number;
  full_score: number | null;
  created_at: string | null;
}

const $q = useQuasar();
const router = useRouter();

const papers = ref<Paper[]>([]);
const loading = ref(false);
const showImportDialog = ref(false);
const showHelp = ref(false);
const importFile = ref<File | null>(null);
const importing = ref(false);

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left' as const, sortable: true },
  { name: 'section_num', label: 'Sections', field: 'section_num', align: 'center' as const },
  { name: 'question_num', label: 'Questions', field: 'question_num', align: 'center' as const },
  { name: 'duration', label: 'Duration (min)', field: 'duration', align: 'center' as const },
  { name: 'full_score', label: 'Full Score', field: 'full_score', align: 'center' as const },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const },
];

async function loadPapers(): Promise<void> {
  loading.value = true;
  try {
    const response = await api.get('/proctor/paper/list');
    papers.value = response.data as Paper[];
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load papers' });
  } finally {
    loading.value = false;
  }
}

function createPaper(): void {
  void router.push('/proctor/papers/new');
}

function editPaper(id: string): void {
  void router.push(`/proctor/papers/${id}`);
}

function confirmDelete(paper: Paper): void {
  $q.dialog({
    title: 'Delete Paper',
    message: `Are you sure you want to delete "${paper.title}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/proctor/paper/${paper.id}`);
        $q.notify({ type: 'positive', message: 'Paper deleted' });
        await loadPapers();
      } catch {
        $q.notify({ type: 'negative', message: 'Failed to delete paper' });
      }
    })();
  });
}

async function importPaper(): Promise<void> {
  if (!importFile.value) return;

  importing.value = true;
  const formData = new FormData();
  formData.append('file', importFile.value);

  try {
    const response = await api.post('/proctor/paper/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    $q.notify({ type: 'positive', message: 'Paper imported successfully' });
    showImportDialog.value = false;
    importFile.value = null;
    void router.push(`/proctor/papers/${response.data.id}`);
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to import paper' });
  } finally {
    importing.value = false;
  }
}

onMounted(() => {
  void loadPapers();
});
</script>
