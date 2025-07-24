<script setup>
	import { ref } from "vue";

	const form = ref({
		firstname: "",
		lastname: "",
		email: "",
		password: "",
		role: "client",
	});
	const message = ref("");
	const success = ref(false);

	const onRegister = async () => {
		message.value = "";
		const pwd = form.value.password;
		const pwdRegex =
			/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
		if (!pwdRegex.test(pwd)) {
			success.value = false;
			message.value =
				"Le mot de passe doit contenir au moins 8 caractères, une majuscule, un chiffre et un caractère spécial.";
			return;
		}
		try {
			const res = await fetch(
				window.config.BACKEND_URL + "/api/user/register",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(form.value),
				}
			);
			const data = await res.json();
			if (res.ok) {
				success.value = true;
				message.value =
					"Inscription réussie. Vous pouvez maintenant vous connecter.";
				form.value = {
					firstname: "",
					lastname: "",
					email: "",
					password: "",
					role: "client",
				};
			} else {
				success.value = false;
				message.value = data.erreur || "Erreur lors de l'inscription.";
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
		<div class="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg">
			<div class="text-center mb-6">
				<i class="bi bi-person-plus text-5xl text-blue-600 mb-2"></i>
				<h2 class="font-bold text-2xl mb-2">Créer un compte</h2>
				<p class="text-gray-500">
					Rejoignez la communauté TSness et accédez à toutes les
					fonctionnalités.
				</p>
			</div>

			<form @submit.prevent="onRegister" class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-gray-700 mb-1">Nom</label>
						<input
							v-model="form.firstname"
							type="text"
							placeholder="Entrez votre nom"
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label class="block text-gray-700 mb-1">Prénom</label>
						<input
							v-model="form.lastname"
							type="text"
							placeholder="Entrez votre prénom"
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				<div>
					<label class="block text-gray-700 mb-1">Email</label>
					<input
						v-model="form.email"
						type="email"
						placeholder="Entrez votre email"
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label class="block text-gray-700 mb-1">Mot de passe</label>
					<input
						v-model="form.password"
						type="password"
						placeholder="Entrez votre mot de passe"
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div>
					<label class="block text-gray-700 mb-1">Rôle</label>
					<select
						v-model="form.role"
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="client">Client</option>
						<option value="owner">Propriétaire de salle</option>
						<option value="superadmin">Super administrateur</option>
					</select>
				</div>

				<button
					type="submit"
					class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
				>
					<i class="bi bi-person-plus mr-2"></i>S'inscrire
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
				<router-link to="/login" class="text-blue-600 hover:underline text-sm">
					Déjà inscrit ? Se connecter
				</router-link>
			</div>
			<div class="text-center mt-4">
				<router-link to="/" class="text-blue-600 hover:underline text-sm">
					<i class="bi bi-arrow-left mr-2"></i>Retour à l'accueil
				</router-link>
			</div>
		</div>
	</div>
</template>
