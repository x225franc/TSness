<script setup>
	import { useRouter } from "vue-router";
	import { ref, onMounted } from "vue";
	const router = useRouter();
	const user = ref(null);

	function logout() {
		localStorage.removeItem("jwt_token");
		localStorage.removeItem("user");
		window.location.reload();
	}
	onMounted(() => {
		const u = localStorage.getItem("user");
		user.value = u ? JSON.parse(u) : null;
	});
</script>

<template>
	<header class="bg-white shadow flex items-center px-6 py-3 justify-between">
		<div class="flex items-center cursor-pointer" @click="router.push('/')">
			<img src="/favicon.ico" alt="Logo TSness" class="w-10 h-10 mr-3" />
			<span class="text-2xl font-bold text-blue-600">TSness</span>
		</div>
		<div class="flex items-center gap-2">
			<template v-if="user">
				<!-- admin -->
				<router-link
					v-if="user.role === 'superadmin'"
					to="/admin/gyms"
					class="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-4 py-2 rounded-md shadow"
				>
					Gestion des salles
				</router-link>
				<router-link
					v-if="user.role === 'superadmin'"
					to="/admin/users"
					class="bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-4 py-2 rounded-md shadow"
				>
					Gestion des utilisateurs
				</router-link>
				<router-link
					v-if="user.role === 'superadmin'"
					to="/admin/badges"
					class="bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold px-4 py-2 rounded-md shadow"
				>
					Badges 🏆
				</router-link>
				<!-- owner -->
				<router-link
					v-if="user.role === 'owner'"
					to="/owner/gym"
					class="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold px-4 py-2 rounded-md shadow"
				>
					Mes salles
				</router-link>
				<router-link
					v-if="user.role === 'owner'"
					to="/owner/challenges"
					class="bg-violet-100 hover:bg-violet-200 text-violet-700 font-semibold px-4 py-2 rounded-md shadow"
				>
					Challenges 🏆
				</router-link>
				<!-- client -->
				<router-link
					v-if="user.role === 'client'"
					to="/"
					class="bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold px-4 py-2 rounded-md shadow"
				>
					Espace Client
				</router-link>
				<!-- Déconnexion -->
				<button
					@click="logout"
					class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-md shadow ml-2"
				>
					Se déconnecter
				</button>
			</template>
		</div>
	</header>
</template>

<style scoped>
	header {
		z-index: 50;
	}
</style>
