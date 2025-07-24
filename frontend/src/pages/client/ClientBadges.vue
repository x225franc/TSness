<script setup>
import { ref, onMounted } from 'vue';

const allBadges = ref([]);
const userBadges = ref([]);

const loadBadges = async () => {
  const res = await fetch(window.config.BACKEND_URL + '/api/badges');
  if (res.ok) {
    allBadges.value = await res.json();
  }
};
const loadUserBadges = async () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user || !user.id) return;
  const res = await fetch(window.config.BACKEND_URL + `/api/user/${user.id}`);
  if (res.ok) {
    const data = await res.json();
    userBadges.value = data.badges || [];
  }
};

onMounted(async () => {
  await loadBadges();
  await loadUserBadges();
});

const hasBadge = (badge) => userBadges.value.some(b => b.name === badge.name);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-100 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-yellow-700 mb-6 flex items-center gap-2">
        <svg class="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        Mes Badges
      </h1>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        <div v-for="badge in allBadges" :key="badge._id || badge.name"
          class="flex flex-col items-center bg-white border border-yellow-100 rounded-2xl shadow-lg px-4 py-4 relative transition-all duration-200"
          :class="hasBadge(badge) ? 'ring-2 ring-yellow-400 ring-offset-2 shadow-yellow-200' : 'opacity-60'">
          <div class="mb-2 relative">
            <img v-if="badge.image" :src="badge.image" alt="badge" class="w-14 h-14 object-contain rounded-full border border-yellow-200 bg-yellow-50 shadow" />
            <svg v-else :class="hasBadge(badge) ? 'text-yellow-400 drop-shadow-lg' : 'text-gray-300'" class="w-14 h-14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <svg v-if="hasBadge(badge)" class="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
          <div class="text-base font-semibold text-yellow-700 text-center">{{ badge.name }}</div>
          <div class="text-xs text-gray-500 text-center">{{ badge.description }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pulse {
  animation: pulse 1.2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; filter: drop-shadow(0 0 0 yellow); }
  50% { opacity: 0.7; filter: drop-shadow(0 0 8px gold); }
}
</style> 