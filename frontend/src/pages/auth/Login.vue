<script setup>
	import { ref } from 'vue';
	import { useRouter } from 'vue-router';

	const router = useRouter();

	// State réactif
	const form = ref({
		email: "",
		password: "",
	});
	const message = ref("");
	const success = ref(false);

	// Méthodes
	const onLogin = async () => {
		message.value = "";
		try {
			const res = await fetch(
				window.config.BACKEND_URL + "/api/user/login",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(form.value),
				}
			);
			const data = await res.json();
			if (res.ok) {
				success.value = true;
				message.value = "Connexion réussie.";
				if (data.token) {
					localStorage.setItem("jwt_token", data.token);
					localStorage.setItem("user", JSON.stringify(data.user));
				}
				router.push("/"); // Rediriger vers la page d'accueil
			} else {
				success.value = false;
				message.value = data.erreur || "Erreur lors de la connexion.";
			}
		} catch (e) {
			success.value = false;
			message.value = "Erreur réseau.";
		}
	};
</script>

<template>
	<div
		class="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4"
	>
		<div class="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
			<div class="text-center mb-6">
				<i class="bi bi-box-arrow-in-right text-5xl text-blue-600 mb-2"></i>
				<h2 class="font-bold text-2xl mb-2">Connexion</h2>
				<p class="text-gray-500">Accédez à votre espace personnel TSness.</p>
			</div>

			<form @submit.prevent="onLogin" class="space-y-4">
				<div>
					<label class="block text-gray-700 mb-1">Email</label>
					<input
						v-model="form.email"
						type="email"
						required
						placeholder="Entrez votre email"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<div>
					<label class="block text-gray-700 mb-1">Mot de passe</label>
					<input
						v-model="form.password"
						type="password"
						required
						placeholder="Entrez votre mot de passe"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
				<button
					type="submit"
					class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
				>
					<i class="bi bi-box-arrow-in-right mr-2"></i>Se connecter
				</button>
			</form>

			<div v-if="message" class="mt-4">
				<div
					:class="
						success
							? 'text-green-700 bg-green-100 border border-green-300 px-4 py-2 rounded-lg'
							: 'text-red-700 bg-red-100 border border-red-300 px-4 py-2 rounded-lg'
					"
				>
					{{ message }}
				</div>
			</div>

			<div class="text-center mt-4">
				<router-link
					to="/register"
					class="text-blue-600 hover:underline text-sm"
				>
					Pas encore de compte ? S'inscrire
				</router-link>
			</div>
			<div class="text-center mt-4">
				<div class="text-center mt-4">
					<router-link to="/" class="text-blue-600 hover:underline text-sm">
						<i class="bi bi-arrow-left mr-2"></i>Retour à l'accueil
					</router-link>
				</div>
			</div>
		</div>
	</div>
</template>