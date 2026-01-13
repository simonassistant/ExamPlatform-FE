<template>
  <q-page class="q-pa-lg">
    <div class="row items-center q-mb-lg">
      <q-btn flat icon="arrow_back" @click="goBack" />
      <div class="text-h4 q-ml-md">{{ isNew ? 'New Schedule' : 'Edit Schedule' }}</div>
      <q-space />
      <q-btn color="positive" icon="save" label="Save" :loading="saving" @click="saveSchedule" />
    </div>

    <!-- Schedule Metadata -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6">Schedule Details</div>
      </q-card-section>
      <q-card-section>
        <q-input v-model="schedule.title" label="Schedule Title" outlined />
      </q-card-section>
    </q-card>

    <!-- Sessions -->
    <div class="text-h5 q-mb-md">
      Sessions
      <q-btn flat round icon="add" color="primary" @click="addSession" />
    </div>

    <q-card v-for="(session, sIndex) in schedule.sessions" :key="sIndex" class="q-mb-lg">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="session.title" label="Session Title" outlined />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="session.paper_id"
              :options="paperOptions"
              label="Paper"
              outlined
              emit-value
              map-options
            />
          </div>
          <div class="col-6 col-md-3">
            <q-input v-model="session.plan_start" label="Start Time" type="datetime-local" outlined />
          </div>
          <div class="col-6 col-md-3">
            <q-input v-model="session.plan_end" label="End Time" type="datetime-local" outlined />
          </div>
          <div class="col-6 col-md-3">
            <q-input v-model="session.place" label="Place / Room" outlined />
          </div>
          <div class="col-6 col-md-3">
            <q-input v-model="session.proctor_email" label="Proctor Email" outlined />
          </div>
        </div>

        <!-- Students -->
        <div class="q-mt-lg">
          <div class="text-subtitle1 q-mb-sm">
            Students ({{ session.students?.length || 0 }})
            <q-btn flat size="sm" icon="add" label="Add" @click="showAddStudents(sIndex)" />
          </div>
          <q-chip
            v-for="student in session.students"
            :key="student.email"
            removable
            @remove="removeStudent(sIndex, student.email)"
          >
            {{ student.email }}
          </q-chip>
        </div>
      </q-card-section>
      <q-card-actions>
        <q-btn flat color="negative" label="Remove Session" @click="removeSession(sIndex)" />
      </q-card-actions>
    </q-card>

    <!-- Add Students Dialog -->
    <q-dialog v-model="showStudentDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add Students</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="studentEmails"
            label="Student Emails (one per line)"
            type="textarea"
            outlined
            rows="6"
            hint="Enter email addresses, one per line"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Add" @click="addStudents" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'src/util/api';

interface Student {
  exam_id?: string;
  email: string;
  enroll_number?: string;
  status?: number;
}

interface Session {
  id?: string;
  title: string;
  paper_id: string;
  plan_start?: string;
  plan_end?: string;
  place?: string;
  proctor_email?: string;
  students: Student[];
}

interface Schedule {
  id?: string;
  title: string;
  sessions: Session[];
}

interface PaperOption {
  label: string;
  value: string;
}

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const schedule = ref<Schedule>({
  title: 'New Schedule',
  sessions: [],
});

const papers = ref<PaperOption[]>([]);
const saving = ref(false);
const showStudentDialog = ref(false);
const studentEmails = ref('');
const currentSessionIndex = ref(0);

const isNew = computed(() => route.params.id === 'new');
const paperOptions = computed(() => papers.value);

function goBack(): void {
  void router.push('/proctor/schedules');
}

function addSession(): void {
  schedule.value.sessions.push({
    title: `Session ${schedule.value.sessions.length + 1}`,
    paper_id: '',
    students: [],
  });
}

function removeSession(index: number): void {
  schedule.value.sessions.splice(index, 1);
}

function showAddStudents(sessionIndex: number): void {
  currentSessionIndex.value = sessionIndex;
  studentEmails.value = '';
  showStudentDialog.value = true;
}

function addStudents(): void {
  const emails = studentEmails.value.split('\n').map(e => e.trim()).filter(e => e);
  const session = schedule.value.sessions[currentSessionIndex.value];
  if (!session) return;

  for (const email of emails) {
    if (!session.students.some(s => s.email === email)) {
      session.students.push({ email });
    }
  }

  showStudentDialog.value = false;
}

function removeStudent(sessionIndex: number, email: string): void {
  const session = schedule.value.sessions[sessionIndex];
  if (!session) return;
  session.students = session.students.filter(s => s.email !== email);
}

async function saveSchedule(): Promise<void> {
  saving.value = true;
  try {
    if (isNew.value) {
      // Create schedule first
      const formData = new FormData();
      formData.append('title', schedule.value.title);
      const response = await api.post('/proctor/schedule', formData);
      schedule.value.id = response.data.id as string;

      // Then create sessions
      for (const session of schedule.value.sessions) {
        const sessionFormData = new FormData();
        sessionFormData.append('schedule_id', schedule.value.id);
        sessionFormData.append('title', session.title);
        sessionFormData.append('paper_id', session.paper_id);
        if (session.plan_start) sessionFormData.append('plan_start', session.plan_start);
        if (session.plan_end) sessionFormData.append('plan_end', session.plan_end);
        if (session.place) sessionFormData.append('place', session.place);
        if (session.proctor_email) sessionFormData.append('proctor_email', session.proctor_email);

        const sessionResponse = await api.post('/proctor/schedule/session', sessionFormData);

        // Add students to session
        if (session.students.length > 0) {
          const emails = session.students.map(s => s.email);
          await api.post(`/proctor/schedule/session/${sessionResponse.data.id}/students`, emails);
        }
      }

      void router.replace(`/proctor/schedules/${schedule.value.id}`);
    } else {
      // Update existing schedule
      const formData = new FormData();
      formData.append('title', schedule.value.title);
      await api.put(`/proctor/schedule/${schedule.value.id}`, formData);
    }

    $q.notify({ type: 'positive', message: 'Schedule saved successfully' });
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to save schedule' });
  } finally {
    saving.value = false;
  }
}

async function loadSchedule(id: string): Promise<void> {
  try {
    const response = await api.get(`/proctor/schedule/${id}`);
    schedule.value = response.data as Schedule;
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load schedule' });
  }
}

async function loadPapers(): Promise<void> {
  try {
    const response = await api.get('/proctor/paper/list');
    papers.value = (response.data as Array<{ id: string; title: string }>).map((p) => ({
      label: p.title,
      value: p.id,
    }));
  } catch (err) {
    console.error('Failed to load papers', err);
  }
}

onMounted(() => {
  void (async () => {
    await loadPapers();
    if (!isNew.value && route.params.id) {
      await loadSchedule(route.params.id as string);
    }
  })();
});
</script>
