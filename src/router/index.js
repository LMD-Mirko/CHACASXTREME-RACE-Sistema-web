import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../features/login/views/LoginView.vue';
import DashboardView from '../features/dashboard/views/DashboardView.vue';
import PartidaView from '../features/partida/views/PartidaView.vue';
import CheckpointView from '../features/intermedio/views/CheckpointView.vue';
import MetaView from '../features/meta/views/MetaView.vue';
import RidersView from '../features/competidores/views/RidersView.vue';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    children: [
      {
        path: 'partida',
        name: 'partida',
        component: PartidaView,
      },
      {
        path: 'categorias-explorer',
        name: 'categorias-explorer',
        component: () => import('../features/explorer/views/CategoriesExplorerView.vue'),
      },
      {
        path: 'checkpoint',
        name: 'checkpoint',
        component: CheckpointView,
      },
      {
        path: 'meta',
        name: 'meta',
        component: MetaView,
      },
      {
        path: 'confirmacion',
        name: 'confirmacion',
        component: () => import('../features/meta/views/MetaConfirmadorView.vue'),
      },
      {
        path: 'competidores',
        name: 'competidores',
        component: RidersView,
      },
      {
        path: 'configuracion',
        name: 'configuracion',
        component: () => import('../features/configuracion/views/ConfiguracionView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token');
  const role = localStorage.getItem('user_role');
  
  if (to.name !== 'login' && !token) {
    next({ name: 'login' });
  } else if (to.name === 'login' && token) {
    next({ name: 'dashboard' });
  } else if (to.meta.requiresAdmin && role !== 'ADMIN') {
    next({ name: 'competidores' });
  } else {
    next();
  }
});

export default router;
