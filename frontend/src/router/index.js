import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/home/Home.vue'
import NotFound from '@/pages/home/NotFound.vue'
import AdminGyms from '@/pages/admin/AdminGyms.vue'
import AdminBadges from '@/pages/admin/AdminBadges.vue'
import AdminUsers from '@/pages/admin/AdminUsers.vue'
import Register from '@/pages/auth/Register.vue'
import Login from '@/pages/auth/Login.vue'
import OwnerGym from '@/pages/owner/OwnerGym.vue'
import OwnerChallenges from '@/pages/owner/OwnerChallenges.vue'
import Client from '@/pages/client/Client.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  ////////////////////////////////////  common routes /////////////////////////
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta: { showheader: true, title: 'Accueil' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFound,
      meta: { title: '404 - Page non trouvée', showheader: false }
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
      meta: { title: 'Inscription', guest: true, showheader: false }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { title: 'Connexion', guest: true, showheader: false }
    },
    ///////////////////////////////////////////////////////////////////////

    //////////////////////////////////// Admin routes /////////////////////////
    {
      path: '/admin/gyms',
      name: 'adminGyms',
      component: AdminGyms,
      meta: { title: "Gestion des Salles d'Entraînement", showheader: true, requiresAuth: true, role: 'superadmin' }
    },
    {
      path: '/admin/badges',
      name: 'adminBadges',
      component: AdminBadges,
      meta: { title: 'Gestion des Badges et Récompenses', showheader: true, requiresAuth: true, role: 'superadmin' }
    },
    {
      path: '/admin/users',
      name: 'adminUsers',
      component: AdminUsers,
      meta: { title: 'Gestion des Utilisateurs', showheader: true, requiresAuth: true, role: 'superadmin' }
    },
    /////////////////////////////////////////////////////////////////////////
    
    //////////////////////////////////// Owner routes /////////////////////////
    {
      path: '/owner/gym',
      name: 'OwnerGym',
      component: OwnerGym,
      meta: { title: 'Ma Salle', showheader: true, requiresAuth: true, role: 'owner' }
    },
    {
      path: '/owner/challenges',
      name: 'OwnerChallenges',
      component: OwnerChallenges,
      meta: { title: 'Mes Défis d\'Entraînement', showheader: true, requiresAuth: true, role: 'owner' }
    },
    /////////////////////////////////////////////////////////////////////////

    //////////////////////////////////// Client routes /////////////////////////
    {
      path: '/client',
      name: 'Client',
      component: Client,
      meta: { title: 'Mon Compte', showheader: true, requiresAuth: true, role: 'client' }
    },
    /////////////////////////////////////////////////////////////////////////

  ],
})

// Guard
router.beforeEach((to, from, next) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  // 1. Authentification requise ?
  if (to.meta.requiresAuth && !user) {
    return next('/');
  }
  // 2. Rôle requis ?
  if (to.meta.role && (!user || user.role !== to.meta.role)) {
    return next('/');
  }
  // 3. Page réservée aux invités ?
  if (to.meta.guest && user) {
    return next('/');
  }
  next();
});

export default router
