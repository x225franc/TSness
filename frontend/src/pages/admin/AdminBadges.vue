<script setup>
	import { ref, onMounted } from "vue";

	const badges = ref([]);
	const success = ref(false);
	const successMessage = ref("");
	const error = ref("");
	const form = ref({
		_id: "",
		name: "",
		description: "",
		image: "",
		rule: {
			type: "",
			value: 1,
			details: "",
		},
	});

	const fetchBadges = async () => {
		try {
			const res = await fetch(window.config.BACKEND_URL + "/api/badges");
			badges.value = await res.json();
		} catch (err) {
			error.value = "Erreur lors du chargement des badges";
		}
	};

	const onSubmit = async () => {
		success.value = false;
		error.value = "";

		try {
			const method = form.value._id ? "PUT" : "POST";
			const url = form.value._id
				? window.config.BACKEND_URL + `/api/badges/${form.value._id}`
				: window.config.BACKEND_URL + "/api/badges";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form.value),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.erreur || "Erreur lors de la sauvegarde");
			}

			success.value = true;
			successMessage.value = form.value._id
				? "Badge modifié avec succès !"
				: "Badge créé avec succès !";

			resetForm();
			await fetchBadges();

			window.scrollTo({ top: 0, behavior: "smooth" });

			setTimeout(() => {
				success.value = false;
			}, 3000);
		} catch (e) {
			error.value = e.message;
		}
	};

	const editBadge = (badge) => {
		form.value = {
			_id: badge._id,
			name: badge.name,
			description: badge.description,
			image: badge.image || "",
			rule: {
				type: badge.rule?.type || "",
				value: badge.rule?.value || 1,
				details: badge.rule?.details || "",
			},
		};

		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const deleteBadge = async (badge) => {
		if (
			confirm(
				`Supprimer le badge "${badge.name}" ?\n\nCette action est irréversible.`
			)
		) {
			try {
				const res = await fetch(
					window.config.BACKEND_URL + `/api/badges/${badge._id}`,
					{
						method: "DELETE",
					}
				);

				if (res.ok) {
					success.value = true;
					successMessage.value = `Badge "${badge.name}" supprimé avec succès !`;
					await fetchBadges();

					setTimeout(() => {
						success.value = false;
						window.location.reload();
					}, 3000);
				} else {
					const errorData = await res.json();
					error.value = errorData.erreur || "Erreur lors de la suppression";
				}
			} catch (e) {
				error.value = "Erreur lors de la suppression";
			}
		}
	};

	const resetForm = () => {
		form.value = {
			_id: "",
			name: "",
			description: "",
			image: "",
			rule: {
				type: "",
				value: 1,
				details: "",
			},
		};
	};

	const getRuleTypeLabel = (type) => {
		const labels = {
			challenge_complete: "Défis",
			consecutive_days: "Jours",
			total_score: "Score",
			gym_visits: "Visites",
			calories_burned: "Calories",
		};
		return labels[type] || type;
	};

	const getRuleDescription = (type) => {
		const descriptions = {
			challenge_complete: "défis complétés",
			consecutive_days: "jours consécutifs d'activité",
			total_score: "points de score total",
			gym_visits: "visites de salle",
			calories_burned: "calories brûlées",
		};
		return descriptions[type] || "accomplissements";
	};

	onMounted(async () => {
		await fetchBadges();
	});
</script>

<template>
	<div
		class="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 py-8"
	>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-8">
				<h1 class="text-4xl font-bold text-gray-900 mb-2">
					🏆 Gestion des Badges et Récompenses
				</h1>
				<p class="text-lg text-gray-600">
					Créez et gérez les badges et récompenses pour motiver vos utilisateurs
				</p>
			</div>

			<transition name="slide-down">
				<div v-if="success" class="mb-6">
					<div
						class="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center"
					>
						<div
							class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3"
						>
							<svg
								class="w-6 h-6 text-green-600"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
							</svg>
						</div>
						<div>
							<h3 class="text-green-800 font-semibold">Succès !</h3>
							<p class="text-green-700 text-sm">{{ successMessage }}</p>
						</div>
					</div>
				</div>
			</transition>

			<transition name="slide-down">
				<div v-if="error" class="mb-6">
					<div
						class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center"
					>
						<div
							class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3"
						>
							<svg
								class="w-6 h-6 text-red-600"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
								/>
							</svg>
						</div>
						<div>
							<h3 class="text-red-800 font-semibold">Erreur</h3>
							<p class="text-red-700 text-sm">{{ error }}</p>
						</div>
					</div>
				</div>
			</transition>

			<div
				class="bg-white shadow-2xl rounded-3xl mb-12 overflow-hidden border border-gray-200"
			>
				<div class="bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-6">
					<h2 class="text-2xl font-bold text-white flex items-center gap-3">
						<div
							class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
						>
							<svg
								class="w-6 h-6 text-white"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								/>
							</svg>
						</div>
						{{ form._id ? "Modifier le badge" : "Créer un nouveau badge" }}
					</h2>
				</div>
				<div class="p-8">
					<form @submit.prevent="onSubmit" class="space-y-6">
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label class="block text-sm font-semibold text-gray-700 mb-2">
									<svg
										class="inline w-4 h-4 mr-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
										/>
									</svg>
									Nom du badge *
								</label>
								<input
									v-model="form.name"
									type="text"
									required
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
									placeholder="Ex: Premier défi, Marathon master..."
								/>
							</div>
							<div>
								<label class="block text-sm font-semibold text-gray-700 mb-2">
									<svg
										class="inline w-4 h-4 mr-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
									</svg>
									Type de règle *
								</label>
								<select
									v-model="form.rule.type"
									required
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
								>
									<option value="">Choisir un type...</option>
									<option value="challenge_complete">Défis complétés</option>
									<option value="consecutive_days">Jours consécutifs</option>
									<option value="total_score">Score total</option>
									<option value="gym_visits">Visites de salle</option>
									<option value="calories_burned">Calories brûlées</option>
								</select>
							</div>
						</div>

						<div>
							<label class="block text-sm font-semibold text-gray-700 mb-2">
								<svg
									class="inline w-4 h-4 mr-1"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"
									/>
								</svg>
								Description *
							</label>
							<textarea
								v-model="form.description"
								required
								rows="3"
								class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
								placeholder="Décrivez ce que l'utilisateur doit accomplir pour obtenir ce badge..."
							></textarea>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<label class="block text-sm font-semibold text-gray-700 mb-2">
									<svg
										class="inline w-4 h-4 mr-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
										/>
									</svg>
									Valeur requise *
								</label>
								<input
									v-model.number="form.rule.value"
									type="number"
									min="1"
									required
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
									placeholder="Ex: 5, 10, 100..."
								/>
							</div>
							<div>
								<label class="block text-sm font-semibold text-gray-700 mb-2">
									<svg
										class="inline w-4 h-4 mr-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
									</svg>
									URL de l'image (optionnel)
								</label>
								<input
									v-model="form.image"
									type="url"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
								/>
							</div>
						</div>

						<div>
							<label class="block text-sm font-semibold text-gray-700 mb-2">
								<svg
									class="inline w-4 h-4 mr-1"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"
									/>
								</svg>
								Détails de la règle (optionnel)
							</label>
							<input
								v-model="form.rule.details"
								type="text"
								class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200"
								placeholder="Détails supplémentaires sur les conditions d'obtention..."
							/>
						</div>

						<div class="flex justify-end gap-4">
							<button
								type="button"
								@click="resetForm"
								class="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
							>
								Annuler
							</button>
							<button
								type="submit"
								class="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
							>
								<svg
									class="inline w-5 h-5 mr-2"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
									/>
								</svg>
								{{ form._id ? "Mettre à jour" : "Créer le badge" }}
							</button>
						</div>
					</form>
				</div>
			</div>

			<div
				class="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200"
			>
				<div class="bg-gradient-to-r from-orange-500 to-red-500 px-8 py-6">
					<h2 class="text-2xl font-bold text-white flex items-center gap-3">
						<div
							class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
						>
							<svg
								class="w-6 h-6 text-white"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								/>
							</svg>
						</div>
						Badges existants ({{ badges.length }})
					</h2>
				</div>

				<div v-if="badges.length === 0" class="text-center text-gray-500 py-12">
					<div
						class="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
					>
						<svg
							class="w-12 h-12 text-gray-400"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
							/>
						</svg>
					</div>
					<p class="text-xl font-medium text-gray-600">Aucun badge</p>
					<p class="text-gray-500 mt-2">
						Créez votre premier badge pour commencer à récompenser vos
						utilisateurs
					</p>
				</div>

				<div v-else class="p-6">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div
							v-for="badge in badges"
							:key="badge._id"
							class="group bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
						>
							<div
								class="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 text-white"
							>
								<div class="flex items-center justify-between">
									<h4 class="text-lg font-bold truncate">{{ badge.name }}</h4>
									<div
										class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center"
									>
										<svg
											class="w-5 h-5"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
											/>
										</svg>
									</div>
								</div>
							</div>

							<div class="p-4">
								<p class="text-gray-600 text-sm mb-3">
									{{ badge.description }}
								</p>

								<div v-if="badge.rule" class="bg-gray-50 rounded-lg p-3 mb-4">
									<div class="flex items-center justify-between mb-2">
										<span class="text-xs font-semibold text-gray-500 uppercase"
											>Règle</span
										>
										<span
											class="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
										>
											{{ getRuleTypeLabel(badge.rule.type) }}
										</span>
									</div>
									<p class="text-sm text-gray-700">
										<strong>{{ badge.rule.value }}</strong>
										{{ getRuleDescription(badge.rule.type) }}
									</p>
									<p
										v-if="badge.rule.details"
										class="text-xs text-gray-500 mt-1"
									>
										{{ badge.rule.details }}
									</p>
								</div>
								<div v-else class="bg-gray-50 rounded-lg p-3 mb-4">
									<p class="text-sm text-gray-500 italic">
										Aucune règle définie pour ce badge
									</p>
								</div>

								<div class="flex gap-2">
									<button
										@click="editBadge(badge)"
										class="flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center justify-center"
									>
										<svg
											class="w-4 h-4 mr-1"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
											/>
										</svg>
										Modifier
									</button>
									<button
										@click="deleteBadge(badge)"
										class="flex-1 px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center justify-center"
									>
										<svg
											class="w-4 h-4 mr-1"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
											/>
										</svg>
										Supprimer
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
	.slide-down-enter-active {
		transition: all 0.3s ease-out;
	}
	.slide-down-leave-active {
		transition: all 0.3s ease-in;
	}
	.slide-down-enter-from {
		transform: translateY(-20px);
		opacity: 0;
	}
	.slide-down-leave-to {
		transform: translateY(-20px);
		opacity: 0;
	}

	.group:hover {
		transform: translateY(-2px);
	}

	button {
		transition: all 0.2s ease;
	}

	button:hover {
		transform: translateY(-1px);
	}

	input:focus,
	textarea:focus,
	select:focus {
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
	}
</style>
