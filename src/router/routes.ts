import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'home', component: () => import('pages/IndexPage.vue') }],
  },
  {
    path: '/exam',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'exam', component: () => import('pages/ExamPage.vue') }],
  },
  {
    path: '/headset',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'headset', component: () => import('pages/HeadsetPage.vue') }],
  },
  {
    path: '/section',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'section', component: () => import('pages/SectionPage.vue') }],
  },
  {
    path: '/question',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'question', component: () => import('pages/QuestionPage.vue') }],
  },

  // Proctor routes
  {
    path: '/proctor/login',
    component: () => import('layouts/MainLayout.vue'),
    children: [{ path: '', name: 'proctor-login', component: () => import('pages/proctor/ProctorLoginPage.vue') }],
  },
  {
    path: '/proctor',
    component: () => import('layouts/ProctorLayout.vue'),
    children: [
      { path: '', redirect: '/proctor/papers' }, // Dashboard redirects to papers
      { path: 'dashboard', name: 'proctor-dashboard', redirect: '/proctor/papers' },
      { path: 'papers', name: 'paper-list', component: () => import('pages/proctor/PaperListPage.vue') },
      { path: 'papers/:id', name: 'paper-edit', component: () => import('pages/proctor/PaperEditorPage.vue') },
      { path: 'schedules', name: 'schedule-list', component: () => import('pages/proctor/ScheduleListPage.vue') },
      { path: 'schedules/:id', name: 'schedule-edit', component: () => import('pages/proctor/ScheduleEditorPage.vue') },
      { path: 'sessions', name: 'session-list', redirect: '/proctor/schedules' }, // Sessions -> Schedules
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    name: '404',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
