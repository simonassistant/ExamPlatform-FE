<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { usePaperStore } from 'stores/paper-store';

const router = useRouter();
const $q = useQuasar();
const paperStore = usePaperStore();
const { paperList, isLoading, total } = storeToRefs(paperStore);

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left' as const, sortable: true },
  { name: 'status', label: 'Status', field: 'status', sortable: true },
  { name: 'sections', label: 'Sections', field: 'section_count', sortable: true },
  { name: 'questions', label: 'Questions', field: 'question_count', sortable: true },
  { name: 'actions', label: 'Actions', field: 'id', align: 'right' as const },
];

onMounted(() => {
  paperStore.fetchList().catch((e) => console.error(e));
});

function notify(message: string, type: 'positive' | 'negative' = 'positive') {
  $q.notify({ type, message, position: 'top' });
}

function editPaper(row: any) {
  router.push({ name: 'paper-edit', params: { id: row.id } });
}

async function duplicatePaper(row: any) {
  try {
    const newId = await paperStore.duplicatePaper(row.id);
    notify('Paper duplicated');
    router.push({ name: 'paper-edit', params: { id: newId } });
  } catch (e: any) {
    notify(e?.message || 'Duplicate failed', 'negative');
  }
}

async function deletePaper(row: any) {
  $q.dialog({
    title: 'Archive Paper',
    message: 'Are you sure you want to archive this paper?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await paperStore.deletePaper(row.id);
      notify('Paper archived');
    } catch (e: any) {
      notify(e?.message || 'Archive failed', 'negative');
    }
  });
}

function newPaper() {
  paperStore.newDraft();
  router.push({ name: 'paper-edit', params: { id: 'new' } });
}
</script>

<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-md">
      <div class="text-h5">Exam Papers</div>
      <q-space />
      <q-btn color="primary" icon="add" label="New Paper" @click="newPaper" />
    </div>

    <q-table
      flat
      bordered
      :rows="paperList"
      :columns="columns"
      row-key="id"
      :loading="isLoading"
      :rows-per-page-options="[10, 20, 50]"
    >
      <template #body-cell-title="props">
        <q-td :props="props">
          <div class="text-weight-medium">{{ props.row.title }}</div>
          <div class="text-caption text-grey-7">ID: {{ props.row.id }}</div>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <div class="row q-gutter-xs justify-end">
            <q-btn flat dense size="sm" icon="edit" @click="() => editPaper(props.row)" />
            <q-btn flat dense size="sm" icon="content_copy" @click="() => duplicatePaper(props.row)" />
            <q-btn flat dense size="sm" color="negative" icon="archive" @click="() => deletePaper(props.row)" />
          </div>
        </q-td>
      </template>
      <template #no-data>
        <div class="q-pa-md text-grey-6">No papers yet. Create one to get started.</div>
      </template>
    </q-table>
  </q-page>
</template>
