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
    path: '/completar-perfil',
    name: 'completar-perfil',
    component: () => import('../features/competidores/views/RiderProfileCompleteView.vue'),
    meta: { public: true },
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
        path: 'camarografos',
        name: 'camarografos',
        component: () => import('../features/camarografos/views/PhotographersView.vue'),
      },
      {
        path: 'posicion',
        name: 'posicion',
        component: () => import('../features/classification/views/ClassificationView.vue'),
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
    name: 'not-found',
    component: LoginView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const ROLE_DEFAULT_ROUTES = {
  PARTIDA: '/dashboard/partida',
  INTERMEDIO: '/dashboard/checkpoint',
  META: '/dashboard/meta',
  ADMIN: '/dashboard/competidores',
};

const ROLE_ALLOWED_ROUTES = {
  PARTIDA: ['partida', 'categorias-explorer', 'competidores', 'posicion'],
  INTERMEDIO: ['checkpoint', 'categorias-explorer', 'competidores', 'posicion'],
  META: ['meta', 'confirmacion', 'categorias-explorer', 'posicion'],
};

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token');
  const role = localStorage.getItem('user_role')?.toUpperCase();
  
  console.log(`[Router Guard] Navigating from "${from.path}" to "${to.path}" (Name: "${to.name}"). Token: ${!!token}, Role: ${role}`);

  // Formulario público para competidores (sin login)
  if (to.meta?.public || to.name === 'completar-perfil') {
    next();
    return;
  }
  
  // 1. Si no está autenticado y no va a login, redirigir a login
  if (!token) {
    if (to.name !== 'login') {
      console.log(`[Router Guard] Redirecting to login (unauthenticated)`);
      next({ name: 'login' });
    } else {
      next();
    }
    return;
  }

  // Validar si el rol es válido (previene bucles si el localStorage tiene la cadena "undefined")
  const validRoles = ['ADMIN', 'PARTIDA', 'INTERMEDIO', 'META'];
  if (!role || !validRoles.includes(role)) {
    console.log(`[Router Guard] Invalid or undefined role ("${role}"). Clearing session and redirecting to login.`);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    if (to.name !== 'login') {
      next({ name: 'login' });
    } else {
      next();
    }
    return;
  }
  
  // 2. Si está autenticado e intenta ir a la raíz "/" o al login "/login", redirigir directamente a su ruta
  if (to.path === '/' || to.name === 'login' || to.name === 'not-found') {
    const targetPath = ROLE_DEFAULT_ROUTES[role] || '/dashboard/competidores';
    console.log(`[Router Guard] Authenticated redirect to: ${targetPath}`);
    next({ path: targetPath });
    return;
  }
  
  // 3. Control de acceso por Roles (excluyendo a ADMIN)
  if (role && role !== 'ADMIN') {
    const defaultPath = ROLE_DEFAULT_ROUTES[role] || '/dashboard/competidores';
    
    // Si intenta ir a la raíz del dashboard
    if (to.path === '/dashboard' || to.path === '/dashboard/') {
      console.log(`[Router Guard] Redirecting dashboard root to default: ${defaultPath}`);
      next({ path: defaultPath });
      return;
    }
    
    // Verificar si el nombre de la ruta está en la lista de permitidos
    const allowed = ROLE_ALLOWED_ROUTES[role] || [];
    if (to.name && to.name !== 'dashboard' && !allowed.includes(to.name)) {
      console.log(`[Router Guard] Route "${to.name}" not allowed for role ${role}. Redirecting to ${defaultPath}`);
      next({ path: defaultPath });
      return;
    }
  }

  console.log(`[Router Guard] Navigation allowed: ${to.path}`);
  next();
});

export default router;
