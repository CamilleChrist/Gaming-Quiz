import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: HomeView,
    },
    // Lien d'invitation : même écran, code du salon pré-rempli (passé en prop)
    {
      path: "/join/:code",
      component: HomeView,
      props: true,
    },
  ],
});

export default router;
