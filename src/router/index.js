import { createRouter, createWebHistory } from "vue-router";
import { parseJwt } from "../utils/jwt";

import AppUserLayout from "../layouts/AppUserLayout.vue";

import HomeView from "../views/User/HomeView.vue";
import AboutView from "../views/AboutView.vue";
import GamesView from "@/views/GamesView.vue";
import KioskView from "@/views/User/KioskView.vue";
import EventView from "@/views/User/EventView.vue";
import AllEventsView from "@/views/Admin/AllEventsView.vue";
import AppAdminLayout from "@/layouts/AppAdminLayout.vue";
import AdminLoginView from "@/views/Admin/AdminLoginView.vue";
import AdminHomeView from "@/views/Admin/AdminHomeView.vue";
import NewEventView from "@/views/Admin/NewEventView.vue";
import AdminEventView from "@/views/Admin/AdminEventView.vue";
import BeerStockView from "@/views/User/BeerStockView.vue";
import CustomersDetailView from "@/views/User/CustomersDetailView.vue";
import BACDemoView from "@/views/BACDemoView.vue";

const routes = [
  {
    path: "/",
    component: AppUserLayout,
    children: [
      {
        path: "",
        name: "home",
        component: HomeView,
      },
      {
        path: "games",
        name: "games",
        component: GamesView,
      },
      {
        path: "event/:eventId",
        name: "event",
        component: EventView,
        props: true,
      },
      {
        path: "about",
        name: "about",
        component: AboutView,
      },
      {
        path: "event/:eventId/beer/:eventBeerId",
        name: "beer-stock",
        component: BeerStockView,
        props: true,
      },
      {
        path: "event/:eventId/customer/:customerId",
        name: "customer-detail",
        component: CustomersDetailView,
        props: true,
      },
      {
        path: "event/:eventId/bac-demo",
        name: "bac-demo",
        component: BACDemoView,
        props: true,
      },
    ],
  },
  {
    path: "/admin",
    component: AppAdminLayout,
    meta: { requiresAdmin: true },
    children: [
      {
        path: "",
        name: "admin-home",
        component: AdminHomeView,
      },
      {
        path: "events/new",
        name: "event-new",
        component: NewEventView,
      },
      {
        path: "events",
        name: "admin-events",
        component: AllEventsView,
      },
      {
        path: "events/:eventId",
        name: "admin-event",
        component: AdminEventView,
        props: true,
      },
    ],
  },
  {
    path: "/admin/login",
    name: "admin-login",
    component: AdminLoginView,
  },
  {
    path: "/event/:eventId/kiosk",
    name: "kiosk",
    component: KioskView,
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation Guards
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem("jwt");
  const decoded = token ? parseJwt(token) : null;
  const role = decoded?.role;
  const username = decoded?.sub;

  // Admin route protection
  if (to.meta.requiresAdmin) {
    if (!token || (role !== "SUPERUSER" && role !== "MODERATOR")) {
      return next({ name: "admin-login" });
    }
  }

  // user request protection
  if (to.meta.requiresUser) {
    const userRequestId = to.params.userRequestId;
    if (!token || role !== "USER" || username !== userRequestId) {
      return next({ name: "home" });
    }
  }

  next();
});

export default router;
export { routes };
