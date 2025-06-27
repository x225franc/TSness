<script setup>
	import { ref, computed } from "vue";
	const isLoggedIn = ref(!!localStorage.getItem("jwt_token"));
	const user = computed(() => {
		try {
			return JSON.parse(localStorage.getItem("user")) || null;
		} catch {
			return null;
		}
	});
	function logout() {
		localStorage.removeItem("jwt_token");
		localStorage.removeItem("user");
		window.location.reload();
	}
</script>

<template>
	<div
		class="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4"
	>
		<div class="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-lg">
			<div class="text-center mb-6">
				<img src="/logo.png" alt="Logo" class="mx-auto mb-4 w-16 h-16" />
				<h1 class="text-3xl font-extrabold mb-1 text-gray-800">
					Bienvenue sur <span class="text-blue-600">TSness</span>
					<span v-if="isLoggedIn && user" class="block text-lg mt-1">
						<span class="text-gray-600"
							>{{ user.firstname }} {{ user.lastname }}</span
						>
						<br />
						<i class="text-sm text-gray-400 font-medium">
							Rôle :
							<i v-if="user.role === 'superadmin'">administrateur</i>
							<i v-else-if="user.role === 'owner'">propriétaire</i>
							<i v-else-if="user.role === 'client'">client</i>
							<i v-else>{{ user.role }}</i>
						</i>
					</span>
				</h1>
				<p class="text-gray-500 mt-3">
					<template v-if="user">
						<p v-if="user.role === 'superadmin'">Plateforme moderne de gestion de salles de sport, défis, utilisateurs
						et récompenses.</p>
						<p v-else-if="user.role === 'owner'">Plateforme moderne de gestion de salles de sport, défis, utilisateurs
						et récompenses.</p>
						<p v-else-if="user.role === 'client'">Bienvenue sur votre espace client</p>
						<p v-else>{{ user.role }}</p>
					</template>
					<p v-else>Plateforme moderne de gestion de salles de sport</p>
				</p>
			</div>

			<div class="flex flex-col gap-4">
				<template v-if="!isLoggedIn">
					<router-link
						to="/register"
						class="w-full text-white bg-blue-600 hover:bg-blue-700 font-semibold py-2 px-4 rounded-lg text-center"
					>
						Créer un compte
					</router-link>
					<router-link
						to="/login"
						class="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg text-center"
					>
						Se connecter
					</router-link>
				</template>
				<template v-else>
					<button
						@click="logout"
						class="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
					>
						Se déconnecter
					</button>
				</template>
			</div>
		</div>

		<div class="mt-6 text-gray-400 text-sm text-center">
			<i class="bi bi-info-circle"></i>
			<span v-if="!isLoggedIn">
				Pour accéder à la plateforme, créez un compte ou connectez-vous.</span
			>
		</div>
	</div>
</template>
