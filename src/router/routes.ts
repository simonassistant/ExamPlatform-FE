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

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    name: '404',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
