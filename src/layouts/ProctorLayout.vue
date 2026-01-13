<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat @click="drawer = !drawer" round dense icon="menu" />
        <q-toolbar-title>ExamPlatform - Proctor</q-toolbar-title>
        <q-btn flat icon="logout" label="Logout" @click="logout" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above :width="200" :breakpoint="500">
      <q-list>
        <q-item-label header>Management</q-item-label>

        <q-item clickable v-ripple :to="'/proctor/papers'" :active="isActive('/proctor/papers')">
          <q-item-section avatar>
            <q-icon name="description" />
          </q-item-section>
          <q-item-section>Papers</q-item-section>
        </q-item>

        <q-item clickable v-ripple :to="'/proctor/schedules'" :active="isActive('/proctor/schedules')">
          <q-item-section avatar>
            <q-icon name="schedule" />
          </q-item-section>
          <q-item-section>Schedules</q-item-section>
        </q-item>

        <q-separator class="q-my-md" />

        <q-item-label header>Monitoring</q-item-label>

        <q-item clickable v-ripple :to="'/proctor/sessions'" :active="isActive('/proctor/sessions')">
          <q-item-section avatar>
            <q-icon name="groups" />
          </q-item-section>
          <q-item-section>Sessions</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const drawer = ref(true);
const route = useRoute();
const router = useRouter();

function isActive(path: string): boolean {
  return route.path.startsWith(path);
}

function logout(): void {
  localStorage.removeItem('proctor_token');
  void router.push('/proctor/login');
}
</script>
