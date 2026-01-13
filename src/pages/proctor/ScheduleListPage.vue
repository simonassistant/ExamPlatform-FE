<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-lg">
      <div class="text-h4">Exam Schedules</div>
      <q-space />
      <q-btn color="primary" icon="add" label="New Schedule" @click="createSchedule" />
    </div>

    <q-table
      :rows="schedules"
      :columns="columns"
      row-key="id"
      :loading="loading"
      flat
      bordered
    >
      <template v-slot:body-cell-actions="props">
        <q-td :props="props">
          <q-btn flat dense icon="edit" color="primary" @click="editSchedule(props.row.id)" />
          <q-btn flat dense icon="delete" color="negative" @click="confirmDelete(props.row)" />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'src/util/api';

interface Schedule {
  id: string;
  title: string;
  created_at: string | null;
}

const $q = useQuasar();
const router = useRouter();

const schedules = ref<Schedule[]>([]);
const loading = ref(false);

const columns = [
  { name: 'title', label: 'Title', field: 'title', align: 'left' as const, sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left' as const },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'center' as const },
];

async function loadSchedules(): Promise<void> {
  loading.value = true;
  try {
    const response = await api.get('/proctor/schedule/list');
    schedules.value = response.data as Schedule[];
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load schedules' });
  } finally {
    loading.value = false;
  }
}

function createSchedule(): void {
  void router.push('/proctor/schedules/new');
}

function editSchedule(id: string): void {
  void router.push(`/proctor/schedules/${id}`);
}

function confirmDelete(schedule: Schedule): void {
  $q.dialog({
    title: 'Delete Schedule',
    message: `Are you sure you want to delete "${schedule.title}"?`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await api.delete(`/proctor/schedule/${schedule.id}`);
        $q.notify({ type: 'positive', message: 'Schedule deleted' });
        await loadSchedules();
      } catch {
        $q.notify({ type: 'negative', message: 'Failed to delete schedule' });
      }
    })();
  });
}

onMounted(() => {
  void loadSchedules();
});
</script>
