<script setup>
import { ref, onMounted } from 'vue';

const leaderboard = ref([]);

const loadLeaderboard = async () => {
  const res = await fetch(window.config.BACKEND_URL + '/api/user/leaderboard');
  if (res.ok) {
    leaderboard.value = await res.json();
  }
};

onMounted(loadLeaderboard);
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-green-100 via-white to-green-200 py-10">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-4xl font-extrabold text-green-700 mb-8 text-center flex items-center justify-center gap-3">
        <svg class="w-10 h-10 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3V2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1H3v4a5 5 0 0 0 4 4.9V15a3 3 0 0 0 3 3v2H7v2h10v-2h-3v-2a3 3 0 0 0 3-3v-3.1A5 5 0 0 0 21 7V3h-4zm-8 2V3h10v2h-2V3h-6v2H5zm12 2a3 3 0 0 1-2.24 2.9A1 1 0 0 0 15 9v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V9a1 1 0 0 0-.76-.97A3 3 0 0 1 5 7V5h14v2z"/></svg>
        Classement des Membres
      </h1>
      <div class="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
        <table class="w-full text-left">
          <thead class="bg-green-200">
            <tr>
              <th class="px-4 py-2 text-green-800 font-bold">#</th>
              <th class="px-4 py-2 text-green-800 font-bold">Nom</th>
              <th class="px-4 py-2 text-green-800 font-bold">Score</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, i) in leaderboard" :key="user._id"
                :class="[
                  i === 0 ? 'bg-yellow-100 font-extrabold text-yellow-700' :
                  i === 1 ? 'bg-gray-100 font-bold text-gray-700' :
                  i === 2 ? 'bg-orange-100 font-bold text-orange-700' :
                  i % 2 === 0 ? 'bg-green-50' : 'bg-white'
                ]">
              <td class="px-4 py-2">
                <span v-if="i === 0">
                  <svg class="w-6 h-6 inline text-yellow-400 mr-1 align-middle" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3V2a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v1H3v4a5 5 0 0 0 4 4.9V15a3 3 0 0 0 3 3v2H7v2h10v-2h-3v-2a3 3 0 0 0 3-3v-3.1A5 5 0 0 0 21 7V3h-4zm-8 2V3h10v2h-2V3h-6v2H5zm12 2a3 3 0 0 1-2.24 2.9A1 1 0 0 0 15 9v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V9a1 1 0 0 0-.76-.97A3 3 0 0 1 5 7V5h14v2z"/></svg>
                </span>
                <span v-else>{{ i + 1 }}</span>
              </td>
              <td class="px-4 py-2">{{ user.firstname }} {{ user.lastname }}</td>
              <td class="px-4 py-2 text-green-800 font-bold">{{ user.score }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="leaderboard.length === 0" class="text-center text-gray-500 py-8">Aucun membre classé pour l'instant.</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
table {
  border-collapse: separate;
  border-spacing: 0;
}
th, td {
  border-bottom: 1px solid #bbf7d0;
}
tr:last-child td {
  border-bottom: none;
}
</style> 