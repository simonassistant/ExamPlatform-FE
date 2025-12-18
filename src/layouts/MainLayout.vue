<script setup lang="ts">
import { useUserStore } from 'stores/user-store';
import { onMounted, onUnmounted, ref } from 'vue';
import { useExamStore } from 'stores/exam-store';
import { ExamStatus } from 'src/util/util-def';
import { behavior, logout, submitSection } from 'src/util/util-biz';

const logoutDlg = ref(false);
const submitSectionDlg = ref(false);
const userStore = useUserStore();
const examStore = useExamStore();

const onLogout = () => {
  behavior('logout');
  logout();
}

function handleBeforeUnload(event:BeforeUnloadEvent) {
  event.preventDefault();
}

function handleVisibilityChange() {
  behavior('page ' + (document.hidden ? 'hidden' : 'shown'));
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  window.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          {{ examStore.section ? examStore.section.name : 'Exam Platform' }}
        </q-toolbar-title>
        <div>{{userStore.user.enroll_number}}</div>&nbsp;&nbsp;&nbsp;
        <div v-if="userStore.token && (!examStore.section || examStore.section.status!=ExamStatus.InExam)">
          <q-btn color="secondary" @click="logoutDlg = true">Logout</q-btn>
        </div>
        <div v-if="examStore.section?.status==ExamStatus.InExam">
          <q-btn color="secondary" label="Submit & Exit Section" @click="submitSectionDlg = true"/>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>

  <q-dialog v-model="logoutDlg" persistent>
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="logout" color="primary" text-color="white" />
        <span class="q-ml-sm">Are you sure to leave?</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Leave" color="primary" v-close-popup @click="onLogout"/>
        <q-btn flat label="Cancel" color="primary" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <q-dialog v-model="submitSectionDlg" persistent>
    <q-card style="width: 500px; max-width: 120vw;">
      <q-card-section class="row items-center">
        <q-avatar icon="assignment_turned_in" color="primary" text-color="white" />
        <span class="q-ml-sm">Are you sure to submit & exit this section?</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Submit & Exit Section" color="primary" v-close-popup @click="submitSection"/>
        <q-btn flat label="Cancel" color="primary" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style>
.note {
  font-size: medium;
}

.q-btn {
  text-transform: none !important;
}
</style>
