import { createRouter, createWebHistory } from 'vue-router';
import { parseJwt } from '../utils/jwt';

import AppUserLayout from '../layouts/AppUserLayout.vue';

import HomeView from '../views/HomeView.vue';
import AboutView from "../views/AboutView.vue";
import GamesView from "@/views/GamesView.vue";
import KioskView from "@/views/KioskView.vue";
import EventView from "@/views/EventView.vue";
import AllEventsView from "@/views/AllEventsView.vue";

const routes = [
  {
    path: '/',
    component: AppUserLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomeView,
      },
      {
        path: 'games',
        name: 'games',
        component: GamesView,
      },
      {
        path: 'event/:eventId',
        name: 'event',
        component: EventView,
        props: true,
      },
      {
        path: 'events',
        name: 'events',
        component: AllEventsView,
      },
      {
         path: 'events/new',
          name: 'event-new',
           component: () => import('@/views/NewEventView.vue'),
      },
      {
        path: 'about',
        name: 'about',
        component: AboutView,
      },
    ],
  },
  {
    path: '/kiosk',
    name: 'kiosk',
    component: KioskView,
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guards
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('jwt');
  const decoded = token ? parseJwt(token) : null;
  const role = decoded?.role;
  const username = decoded?.sub;

  // Admin route protection
  if (to.meta.requiresAdmin) {
    if (!token || (role !== 'SUPERUSER' && role !== 'MODERATOR')) {
      return next({ name: 'admin-login' });
    }
  }

  // user request protection
  if (to.meta.requiresUser) {
    const userRequestId = to.params.userRequestId;
    if (!token || role !== 'USER' || username !== userRequestId) {
      return next({ name: 'home' });
    }
  }

  next();
});

export default router;
export { routes };