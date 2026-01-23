import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { 
    path: '/', 
    redirect: '/bridge' 
  },
  { 
    path: '/bridge', 
    name: 'bridge', 
    component: () => import('@/views/BridgeView.vue'),
    meta: { title: 'Bridge', order: 1 }
  },
  { 
    path: '/helm', 
    name: 'helm', 
    component: () => import('@/views/HelmView.vue'),
    meta: { title: 'Helm', order: 2 }
  },
  { 
    path: '/sensors', 
    name: 'sensors', 
    component: () => import('@/views/SensorsView.vue'),
    meta: { title: 'Sensors', order: 3 }
  },
  { 
    path: '/cargo', 
    name: 'cargo', 
    component: () => import('@/views/CargoView.vue'),
    meta: { title: 'Cargo', order: 4 }
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
