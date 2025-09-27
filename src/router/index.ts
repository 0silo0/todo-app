import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/projects'
  },
  {
    path: '/projects',
    name: 'Projects',
    component: () => import('../views/ProjectsView.vue')
  },
  {
    path: '/projects/:projectId',
    name: 'Project',
    component: () => import('../views/ProjectView.vue'),
    props: true
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/projects'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;