<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import PaperMeta from 'src/components/PaperMeta.vue';
import SectionEditor from 'src/components/SectionEditor.vue';
import ImportDialog from 'src/components/ImportDialog.vue';
import { usePaperStore } from 'stores/paper-store';
import type { Paper, PaperSection } from 'src/components/models';
import { useRoute } from 'vue-router';

const $q = useQuasar();
const paperStore = usePaperStore();
const route = useRoute();

const paper = computed(() => paperStore.paper as Paper | null);
const sections = computed(() => paperStore.sections as PaperSection[]);
const importDialog = ref(false);
const { isLoading: busy, lastMessage } = storeToRefs(paperStore);

onMounted(() => {
  const paperId = route.query.paperId as string | undefined;
  if (paperId) {
    paperStore.loadPaper(paperId).catch(() => paperStore.newDraft());
  } else if (!paperStore.paper) {
    paperStore.newDraft();
  }
});

function notifySuccess(message: string) {
  $q.notify({ type: 'positive', message, position: 'top' });
}

function notifyError(message: string) {
  $q.notify({ type: 'negative', message, position: 'top' });
}

function handleMetaUpdate(partial: Partial<Paper>) {
  paperStore.updatePaper(partial);
}

function handleSectionsUpdate(next: PaperSection[]) {
  paperStore.updateSections(next);
}

async function handleSave() {
  try {
    await paperStore.saveDraft();
    notifySuccess('Draft saved');
  } catch (e: any) {
    notifyError(e?.message || 'Failed to save draft');
  }
}

async function handlePublish() {
  try {
    await paperStore.publishDraft();
    notifySuccess('Paper published');
  } catch (e: any) {
    notifyError(e?.message || 'Publish failed');
  }
}

async function handleImport(markdown: string) {
  try {
    await paperStore.importMarkdown(markdown);
    notifySuccess('Import requested');
  } catch (e: any) {
    notifyError(e?.message || 'Import failed');
  } finally {
    importDialog.value = false;
  }
}

function handleNewDraft() {
  paperStore.newDraft();
  notifySuccess('New draft started');
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md q-gutter-sm">
      <div class="text-h5">Exam Paper Editor</div>
      <q-space />
      <q-btn flat icon="note_add" label="New Draft" @click="handleNewDraft" />
      <q-btn flat icon="cloud_upload" label="Import" @click="() => (importDialog = true)" />
      <q-btn color="primary" label="Save Draft" :loading="busy" @click="handleSave" />
      <q-btn color="positive" label="Publish" :loading="busy" outline @click="handlePublish" />
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <PaperMeta :paper="paper" :disabled="busy" @update="handleMetaUpdate" />
        <div class="q-mt-md text-caption text-grey-7">
          Status: {{ paper?.status || 'Draft' }}<br />
          {{ lastMessage || '' }}
        </div>
      </div>

      <div class="col-12 col-md-8">
        <SectionEditor :sections="sections" :disabled="busy" @update:sections="handleSectionsUpdate" />
      </div>
    </div>

    <ImportDialog v-model="importDialog" :loading="busy" @import="handleImport" />
  </q-page>
</template>
