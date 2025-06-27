<script setup>
	import { ref, computed, onMounted } from "vue";
	import { useRoute } from "vue-router";

	const route = useRoute();

	// variable
	const loading = ref(true);
	const challenges = ref([]);
	const gyms = ref([]);
	const exerciseTypes = ref([]);
	const success = ref(false);
	const successMessage = ref("");
	const error = ref("");
	const showCreateForm = ref(false);
	const editMode = ref({});
	const editForms = ref({});
	const createForm = ref({
		title: "",
		description: "",
		gymIds: [],
		exerciseTypeId: "",
		difficulty: "facile",
		startDate: "",
		endDate: "",
		objectivesText: "",
	});

	// Computed properties
	const approvedGyms = computed(() => {
		return gyms.value.filter((gym) => gym.isApproved);
	});

	// Fonction pour calculer automatiquement la durée entre deux dates
	const calculateDuration = (startDate, endDate) => {
		if (!startDate || !endDate) return "";

		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffInMilliseconds = end - start;
		const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24));

		if (diffInDays <= 0) return "Durée invalide";
		if (diffInDays === 1) return "1 jour";
		if (diffInDays < 7) return `${diffInDays} jours`;
		if (diffInDays < 30) {
			const weeks = Math.round(diffInDays / 7);
			return weeks === 1 ? "1 semaine" : `${weeks} semaines`;
		}
		if (diffInDays < 365) {
			const months = Math.round(diffInDays / 30);
			return months === 1 ? "1 mois" : `${months} mois`;
		}
		const years = Math.round(diffInDays / 365);
		return years === 1 ? "1 an" : `${years} ans`;
	};

	const loadData = async () => {
		loading.value = true;
		try {
			const user = JSON.parse(localStorage.getItem("user"));
			if (!user || !user.id) throw new Error("Utilisateur non trouvé");

			// Charger les salles, défis et types d'exercices en parallèle
			await Promise.all([
				loadGyms(user.id),
				loadChallenges(user.id),
				loadExerciseTypes(),
			]);

			initEditForms();
		} catch (e) {
			error.value = e.message;
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		} finally {
			loading.value = false;
		}
	};

	const loadGyms = async (ownerId) => {
		const res = await fetch(
			window.config.BACKEND_URL + `/api/gyms/owner?id=${ownerId}`
		);
		if (!res.ok) throw new Error("Impossible de charger les salles");
		gyms.value = await res.json();
	};

	const loadChallenges = async (ownerId) => {
		const res = await fetch(
			window.config.BACKEND_URL + `/api/challenges/owner?ownerId=${ownerId}`
		);
		if (!res.ok) throw new Error("Impossible de charger les défis");
		challenges.value = await res.json();
	};

	const loadExerciseTypes = async () => {
		const res = await fetch(
			window.config.BACKEND_URL + "/api/challenges/exercise-types"
		);
		if (!res.ok) throw new Error("Impossible de charger les types d'exercices");
		exerciseTypes.value = await res.json();
	};

	const initEditForms = () => {
		editForms.value = {};
		editMode.value = {};

		challenges.value.forEach((challenge) => {
			editMode.value[challenge._id] = false;
			editForms.value[challenge._id] = {
				title: challenge.title || "",
				description: challenge.description || "",
				gymIds: challenge.gymIds
					? challenge.gymIds.map((gym) => gym._id || gym)
					: [],
				exerciseTypeId: challenge.exerciseTypeId?._id || "",
				difficulty: challenge.difficulty || "facile",
				startDate: challenge.startDate ? challenge.startDate.split("T")[0] : "",
				endDate: challenge.endDate ? challenge.endDate.split("T")[0] : "",
				objectivesText: (challenge.objectives || []).join("\n"),
			};
		});
	};

	const createChallenge = async () => {
		success.value = false;
		error.value = "";

		try {
			const user = JSON.parse(localStorage.getItem("user"));
			if (!user || !user.id) {
				window.scrollTo({
					top: 0,
					behavior: "smooth",
				});
				throw new Error("Utilisateur non trouvé");
			}

			// Validation des salles sélectionnées
			if (!createForm.value.gymIds || createForm.value.gymIds.length === 0) {
				window.scrollTo({
					top: 0,
					behavior: "smooth",
				});
				throw new Error("Veuillez sélectionner au moins une salle");
			}

			// Validation des dates
			if (!createForm.value.startDate || !createForm.value.endDate) {
				window.scrollTo({
					top: 0,
					behavior: "smooth",
				});
				throw new Error("Veuillez renseigner les dates de début et de fin");
			}

			if (
				new Date(createForm.value.startDate) >=
				new Date(createForm.value.endDate)
			) {
				window.scrollTo({
					top: 0,
					behavior: "smooth",
				});
				throw new Error(
					"La date de fin doit être postérieure à la date de début"
				);
			}

			const objectives = createForm.value.objectivesText
				.split("\n")
				.map((obj) => obj.trim())
				.filter(Boolean);

			const payload = {
				title: createForm.value.title,
				description: createForm.value.description,
				gymIds: createForm.value.gymIds, // Tableau de salles
				exerciseTypeId: createForm.value.exerciseTypeId || null,
				difficulty: createForm.value.difficulty,
				startDate: createForm.value.startDate,
				endDate: createForm.value.endDate,
				objectives,
				ownerId: user.id,
			};

			const res = await fetch(
				window.config.BACKEND_URL + "/api/challenges/owner",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.erreur || "Erreur lors de la création");
			}

			const newChallenge = await res.json();
			challenges.value.unshift(newChallenge);

			// Réinitialiser le formulaire
			createForm.value = {
				title: "",
				description: "",
				gymIds: [],
				exerciseTypeId: "",
				difficulty: "facile",
				startDate: "",
				endDate: "",
				objectivesText: "",
			};

			showCreateForm.value = false;
			success.value = true;
			successMessage.value = `Défi "${newChallenge.title}" créé avec succès !`;

			initEditForms();

			setTimeout(() => {
				success.value = false;
			}, 3000);
		} catch (e) {
			error.value = e.message;
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		}
	};

	const toggleEdit = (challengeId) => {
		editMode.value[challengeId] = !editMode.value[challengeId];
		if (!editMode.value[challengeId]) {
			cancelEdit(challengeId);
		}
	};

	const cancelEdit = (challengeId) => {
		editMode.value[challengeId] = false;
		const challenge = challenges.value.find((c) => c._id === challengeId);
		if (challenge) {
			editForms.value[challengeId] = {
				title: challenge.title || "",
				description: challenge.description || "",
				exerciseTypeId: challenge.exerciseTypeId?._id || "",
				difficulty: challenge.difficulty || "facile",
				startDate: challenge.startDate ? challenge.startDate.split("T")[0] : "",
				endDate: challenge.endDate ? challenge.endDate.split("T")[0] : "",
				objectivesText: (challenge.objectives || []).join("\n"),
			};
		}
	};

	const updateChallenge = async (challenge) => {
		success.value = false;
		error.value = "";

		try {
			const user = JSON.parse(localStorage.getItem("user"));
			if (!user || !user.id) throw new Error("Utilisateur non trouvé");

			const formData = editForms.value[challenge._id];
			const objectives = formData.objectivesText
				.split("\n")
				.map((obj) => obj.trim())
				.filter(Boolean);

			const payload = {
				title: formData.title,
				description: formData.description,
				exerciseTypeId: formData.exerciseTypeId || null,
				difficulty: formData.difficulty,
				startDate: formData.startDate,
				endDate: formData.endDate,
				objectives,
				ownerId: user.id,
			};

			const res = await fetch(
				window.config.BACKEND_URL + `/api/challenges/owner/${challenge._id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.erreur || "Erreur lors de la mise à jour");
			}

			const updatedChallenge = await res.json();
			const index = challenges.value.findIndex((c) => c._id === challenge._id);
			if (index !== -1) {
				challenges.value[index] = updatedChallenge;
			}

			editMode.value[challenge._id] = false;
			success.value = true;
			successMessage.value = `Défi "${updatedChallenge.title}" mis à jour avec succès.`;

			initEditForms();

			setTimeout(() => {
				success.value = false;
			}, 3000);
		} catch (e) {
			error.value = e.message;
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		}
	};

	const deleteChallenge = async (challenge) => {
		const confirmMessage = `⚠️ SUPPRESSION DU DÉFI ⚠️\n\nÊtes-vous sûr(e) de vouloir supprimer le défi "${challenge.title}" ?\n\nCette action est irréversible.\n\nTapez "SUPPRIMER" pour confirmer.`;
		const userInput = prompt(confirmMessage);
		if (userInput !== "SUPPRIMER") {
			return;
		}

		success.value = false;
		error.value = "";

		try {
			const user = JSON.parse(localStorage.getItem("user"));
			if (!user || !user.id) throw new Error("Utilisateur non trouvé");

			const res = await fetch(
				window.config.BACKEND_URL + `/api/challenges/owner/${challenge._id}`,
				{
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ownerId: user.id }),
				}
			);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.erreur || "Erreur lors de la suppression");
			}

			challenges.value = challenges.value.filter(
				(c) => c._id !== challenge._id
			);
			success.value = true;
			successMessage.value = `Défi "${challenge.title}" supprimé avec succès.`;

			initEditForms();

			setTimeout(() => {
				success.value = false;
			}, 3000);
		} catch (e) {
			error.value = e.message;
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		}
	};

	onMounted(async () => {
		await loadData();
	});
</script>

<template>
	<div
		class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8"
	>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<!-- Header -->
			<div class="text-center mb-8">
				<h1 class="text-4xl font-bold text-gray-900 mb-2">
					Mes Défis d'Entraînement
				</h1>
				<p class="text-lg text-gray-600">
					Proposez des défis spécifiques pour vos salles de sport
				</p>
			</div>

			<!-- Loading State -->
			<transition name="fade" mode="out-in">
				<div v-if="loading" key="loading" class="text-center py-20">
					<div
						class="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 animate-spin"
					>
						<svg
							class="w-8 h-8 text-purple-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
					</div>
					<p class="text-xl font-medium text-gray-600">
						Chargement en cours...
					</p>
				</div>

				<!-- Content -->
				<div v-else key="content">
					<!-- Messages de statut -->
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
										<path
											d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
										/>
									</svg>
								</div>
								<div>
									<h3 class="text-green-800 font-semibold">Action réussie !</h3>
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

					<!-- Message si aucune salle approuvée -->
					<div v-if="approvedGyms.length === 0" class="text-center py-12">
						<div
							class="bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-md mx-auto"
						>
							<div
								class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"
							>
								<svg
									class="w-8 h-8 text-yellow-600"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"
									/>
								</svg>
							</div>
							<h3 class="text-xl font-bold text-yellow-800 mb-2">
								Aucune salle approuvée
							</h3>
							<p class="text-yellow-700 mb-4">
								Vous devez avoir au moins une salle approuvée pour créer des
								défis d'entraînement.
							</p>
							<router-link
								to="/owner/gym"
								class="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
							>
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
									<path
										d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
									/>
								</svg>
								Gérer mes salles
							</router-link>
						</div>
					</div>

					<!-- Contenu principal -->
					<div v-else>
						<!-- Bouton d'ajout d'un nouveau défi -->
						<div class="mb-8 text-center">
							<button
								@click="showCreateForm = !showCreateForm"
								class="font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform flex items-center gap-2 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white hover:shadow-xl hover:scale-105"
							>
								<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
									<path d="M13 10h7v2h-7v7h-2v-7H4v-2h7V3h2v7z" />
								</svg>
								{{ showCreateForm ? "Annuler" : "Proposer un nouveau défi" }}
							</button>
						</div>

						<!-- Formulaire de création -->
						<transition name="fade" mode="out-in">
							<div
								v-if="showCreateForm"
								key="create-form"
								class="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200 mb-8"
							>
								<div
									class="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6"
								>
									<h2
										class="text-2xl font-bold text-white flex items-center gap-3"
									>
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
										Proposer un nouveau défi
									</h2>
									<p class="text-purple-100 mt-2">
										Créez un défi d'entraînement spécifique pour une de vos
										salles
									</p>
								</div>

								<div class="p-8">
									<form @submit.prevent="createChallenge" class="space-y-6">
										<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div>
												<label
													class="block text-sm font-semibold text-gray-700 mb-2"
												>
													<svg
														class="inline w-4 h-4 mr-1"
														fill="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
														/>
													</svg>
													Titre du défi *
												</label>
												<input
													v-model="createForm.title"
													type="text"
													required
													class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
													placeholder="Ex: Défi Cardio Intensif"
												/>
											</div>
											<div>
												<label
													class="block text-sm font-semibold text-gray-700 mb-2"
												>
													<svg
														class="inline w-4 h-4 mr-1"
														fill="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
														/>
													</svg>
													Salles associées *
												</label>
												<div
													class="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-xl p-3"
												>
													<div
														v-for="gym in approvedGyms"
														:key="gym._id"
														class="flex items-center gap-3"
													>
														<input
															type="checkbox"
															:id="`gym-${gym._id}`"
															v-model="createForm.gymIds"
															:value="gym._id"
															class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
														/>
														<label
															:for="`gym-${gym._id}`"
															class="flex-1 text-sm text-gray-700 cursor-pointer hover:text-purple-600"
														>
															{{ gym.name }}
															<span class="text-gray-500 text-xs block">{{
																gym.address
															}}</span>
														</label>
													</div>
												</div>
												<p class="text-xs text-gray-500 mt-1">
													Sélectionnez une ou plusieurs salles pour ce défi
												</p>
											</div>
										</div>

										<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div>
												<label
													class="block text-sm font-semibold text-gray-700 mb-2"
												>
													Type d'exercice
												</label>
												<select
													v-model="createForm.exerciseTypeId"
													class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
												>
													<option value="">Aucun type spécifique</option>
													<option
														v-for="type in exerciseTypes"
														:key="type._id"
														:value="type._id"
													>
														{{ type.name }}
													</option>
												</select>
											</div>
											<div>
												<label
													class="block text-sm font-semibold text-gray-700 mb-2"
												>
													Difficulté
												</label>
												<select
													v-model="createForm.difficulty"
													class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
												>
													<option value="facile">🟢 Facile</option>
													<option value="intermédiaire">
														🟡 Intermédiaire
													</option>
													<option value="difficile">🔴 Difficile</option>
												</select>
											</div>
										</div>

										<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div>
												<label
													class="block text-sm font-semibold text-gray-700 mb-2"
												>
													Date de début *
												</label>
												<input
													v-model="createForm.startDate"
													type="date"
													required
													class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
												/>
											</div>
											<div>
												<label
													class="block text-sm font-semibold text-gray-700 mb-2"
												>
													Date de fin *
												</label>
												<input
													v-model="createForm.endDate"
													type="date"
													required
													class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
												/>
											</div>
										</div>

										<div
											v-if="createForm.startDate && createForm.endDate"
											class="bg-blue-50 border border-blue-200 rounded-xl p-4"
										>
											<div class="flex items-center gap-2">
												<svg
													class="w-5 h-5 text-blue-600"
													fill="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6h6v-2h-4z"
													/>
												</svg>
												<span class="text-blue-700 font-medium">
													Durée calculée :
													{{
														calculateDuration(
															createForm.startDate,
															createForm.endDate
														)
													}}
												</span>
											</div>
										</div>

										<div>
											<label
												class="block text-sm font-semibold text-gray-700 mb-2"
											>
												Description du défi *
											</label>
											<textarea
												v-model="createForm.description"
												rows="4"
												required
												class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
												placeholder="Décrivez le défi, ses objectifs, les exercices recommandés..."
											></textarea>
										</div>

										<div>
											<label
												class="block text-sm font-semibold text-gray-700 mb-2"
											>
												Objectifs (optionnel)
											</label>
											<textarea
												v-model="createForm.objectivesText"
												rows="3"
												class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
												placeholder="Un objectif par ligne : Ex: Faire 30 min de cardio, Brûler 300 calories..."
											></textarea>
											<p class="text-xs text-gray-500 mt-1">
												Séparez chaque objectif par une nouvelle ligne
											</p>
										</div>

										<div class="flex justify-end gap-4 pt-4">
											<button
												type="button"
												@click="showCreateForm = false"
												class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-all duration-200"
											>
												Annuler
											</button>
											<button
												type="submit"
												class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
											>
												<svg
													class="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 24 24"
												>
													<path d="M13 10h7v2h-7v7h-2v-7H4v-2h7V3h2v7z" />
												</svg>
												Créer le défi
											</button>
										</div>
									</form>
								</div>
							</div>
						</transition>

						<!-- Liste des défis existants -->
						<transition name="fade" mode="out-in">
							<div
								v-if="!showCreateForm"
								key="challenges-list"
								class="space-y-6"
							>
								<div v-if="challenges.length === 0" class="text-center py-12">
									<div
										class="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md mx-auto"
									>
										<div
											class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"
										>
											<svg
												class="w-8 h-8 text-gray-500"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
												/>
											</svg>
										</div>
										<h3 class="text-xl font-bold text-gray-800 mb-2">
											Aucun défi créé
										</h3>
										<p class="text-gray-600">
											Proposez votre premier défi d'entraînement pour vos salles
											!
										</p>
									</div>
								</div>

								<transition-group
									v-else
									name="card-list"
									tag="div"
									class="grid grid-cols-1 lg:grid-cols-2 gap-6"
								>
									<div
										v-for="challenge in challenges"
										:key="challenge._id"
										class="bg-white shadow-lg rounded-3xl overflow-hidden border border-gray-200 transform transition-all duration-300 hover:shadow-xl card-hover"
									>
										<!-- Header de la carte -->
										<div
											class="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4"
										>
											<div class="flex items-center justify-between">
												<h3
													class="text-xl font-bold text-white flex items-center gap-2"
												>
													<svg
														class="w-6 h-6"
														fill="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
														/>
													</svg>
													{{ challenge.title }}
												</h3>
												<div class="flex items-center gap-2">
													<button
														@click="toggleEdit(challenge._id)"
														:class="[
															'p-2 rounded-lg transition-colors duration-200',
															editMode[challenge._id]
																? 'bg-red-100 hover:bg-red-200 text-red-600'
																: 'bg-white/20 hover:bg-white/30 text-white',
														]"
													>
														<svg
															class="w-4 h-4"
															fill="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																v-if="!editMode[challenge._id]"
																d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
															/>
															<path
																v-else
																d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
															/>
														</svg>
													</button>
													<button
														@click="deleteChallenge(challenge)"
														class="p-2 rounded-lg transition-colors duration-200 bg-red-500/20 hover:bg-red-500/30 text-red-600 hover:text-red-700"
														title="Supprimer ce défi"
													>
														<svg
															class="w-4 h-4"
															fill="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
															/>
														</svg>
													</button>
												</div>
											</div>
											<div class="mt-2 text-sm text-purple-100">
												<div
													v-if="challenge.gymIds && challenge.gymIds.length > 0"
												>
													<span class="font-medium">Salles associées :</span>
													<div class="mt-1 flex flex-wrap gap-1">
														<span
															v-for="gym in challenge.gymIds"
															:key="gym._id"
															class="inline-block bg-purple-400/30 px-2 py-1 rounded text-xs"
														>
															{{ gym.name }}
														</span>
													</div>
												</div>
												<div v-else class="text-purple-200/70">
													Aucune salle associée
												</div>
											</div>
										</div>

										<!-- Contenu de la carte -->
										<div class="p-6">
											<div v-if="!editMode[challenge._id]">
												<!-- Mode lecture -->
												<div class="space-y-4">
													<div
														class="flex items-center gap-4 text-sm flex-wrap"
													>
														<span
															:class="[
																'px-3 py-1 rounded-full text-xs font-medium',
																challenge.difficulty === 'facile'
																	? 'bg-green-100 text-green-800'
																	: challenge.difficulty === 'intermédiaire'
																	? 'bg-yellow-100 text-yellow-800'
																	: 'bg-red-100 text-red-800',
															]"
														>
															{{ challenge.difficulty }}
														</span>

														<!-- Affichage des dates et durée -->
														<div
															v-if="challenge.startDate && challenge.endDate"
															class="flex items-center gap-1 text-gray-600"
														>
															<svg
																class="w-4 h-4"
																fill="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
																/>
															</svg>
															<span class="text-xs">
																{{
																	new Date(
																		challenge.startDate
																	).toLocaleDateString("fr-FR")
																}}
																-
																{{
																	new Date(
																		challenge.endDate
																	).toLocaleDateString("fr-FR")
																}}
															</span>
														</div>

														<span
															v-if="challenge.duration"
															class="flex items-center gap-1 text-gray-600"
														>
															<svg
																class="w-4 h-4"
																fill="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6h6v-2h-4z"
																/>
															</svg>
															{{ challenge.duration }}
														</span>
													</div>

													<div v-if="challenge.exerciseTypeId" class="text-sm">
														<span class="font-medium text-gray-700"
															>Type d'exercice :</span
														>
														<span class="text-purple-600 ml-1">{{
															challenge.exerciseTypeId.name
														}}</span>
													</div>

													<div class="space-y-2">
														<span class="text-sm font-medium text-gray-700"
															>Description :</span
														>
														<p class="text-sm text-gray-600 leading-relaxed">
															{{ challenge.description }}
														</p>
													</div>

													<div
														v-if="
															challenge.objectives &&
															challenge.objectives.length
														"
														class="space-y-2"
													>
														<span class="text-sm font-medium text-gray-700"
															>Objectifs :</span
														>
														<ul class="space-y-1">
															<li
																v-for="objective in challenge.objectives"
																:key="objective"
																class="flex items-start gap-2 text-sm text-gray-600"
															>
																<svg
																	class="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"
																	fill="currentColor"
																	viewBox="0 0 24 24"
																>
																	<path
																		d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
																	/>
																</svg>
																{{ objective }}
															</li>
														</ul>
													</div>
												</div>
											</div>

											<div v-else>
												<!-- Mode édition -->
												<form
													@submit.prevent="updateChallenge(challenge)"
													class="space-y-4"
												>
													<div>
														<label
															class="block text-sm font-medium text-gray-700 mb-1"
															>Titre</label
														>
														<input
															v-model="editForms[challenge._id].title"
															type="text"
															required
															class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
														/>
													</div>

													<div>
														<label
															class="block text-sm font-medium text-gray-700 mb-1"
															>Description</label
														>
														<textarea
															v-model="editForms[challenge._id].description"
															rows="3"
															required
															class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
														></textarea>
													</div>

													<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
														<div>
															<label
																class="block text-sm font-medium text-gray-700 mb-1"
																>Difficulté</label
															>
															<select
																v-model="editForms[challenge._id].difficulty"
																class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
															>
																<option value="facile">🟢 Facile</option>
																<option value="intermédiaire">
																	🟡 Intermédiaire
																</option>
																<option value="difficile">🔴 Difficile</option>
															</select>
														</div>
														<div>
															<label
																class="block text-sm font-medium text-gray-700 mb-1"
																>Date de début</label
															>
															<input
																v-model="editForms[challenge._id].startDate"
																type="date"
																class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
															/>
														</div>
													</div>

													<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
														<div>
															<label
																class="block text-sm font-medium text-gray-700 mb-1"
																>Date de fin</label
															>
															<input
																v-model="editForms[challenge._id].endDate"
																type="date"
																class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
															/>
														</div>
														<div
															v-if="
																editForms[challenge._id].startDate &&
																editForms[challenge._id].endDate
															"
															class="flex items-end"
														>
															<div
																class="bg-blue-50 border border-blue-200 rounded-lg p-3 w-full"
															>
																<label
																	class="block text-sm font-medium text-gray-700 mb-1"
																	>Durée calculée</label
																>
																<div class="flex items-center gap-2">
																	<svg
																		class="w-4 h-4 text-blue-600"
																		fill="currentColor"
																		viewBox="0 0 24 24"
																	>
																		<path
																			d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6h6v-2h-4z"
																		/>
																	</svg>
																	<span
																		class="text-blue-700 font-medium text-sm"
																	>
																		{{
																			calculateDuration(
																				editForms[challenge._id].startDate,
																				editForms[challenge._id].endDate
																			)
																		}}
																	</span>
																</div>
															</div>
														</div>
													</div>

													<div>
														<label
															class="block text-sm font-medium text-gray-700 mb-1"
															>Type d'exercice</label
														>
														<select
															v-model="editForms[challenge._id].exerciseTypeId"
															class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
														>
															<option value="">Aucun type spécifique</option>
															<option
																v-for="type in exerciseTypes"
																:key="type._id"
																:value="type._id"
															>
																{{ type.name }}
															</option>
														</select>
													</div>

													<div>
														<label
															class="block text-sm font-medium text-gray-700 mb-1"
															>Objectifs</label
														>
														<textarea
															v-model="editForms[challenge._id].objectivesText"
															rows="2"
															class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
															placeholder="Un objectif par ligne"
														></textarea>
													</div>

													<div class="flex justify-end gap-2 pt-2">
														<button
															type="button"
															@click="cancelEdit(challenge._id)"
															class="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200"
														>
															Annuler
														</button>
														<button
															type="submit"
															class="px-4 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 flex items-center gap-1"
														>
															<svg
																class="w-4 h-4"
																fill="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"
																/>
															</svg>
															Sauvegarder
														</button>
													</div>
												</form>
											</div>
										</div>
									</div>
								</transition-group>
							</div>
						</transition>
					</div>
				</div>
			</transition>
		</div>
	</div>
</template>

<style scoped>
	/* Animations */
	.fade-enter-active,
	.fade-leave-active {
		transition: all 0.5s ease;
	}
	.fade-enter-from,
	.fade-leave-to {
		opacity: 0;
		transform: translateY(20px);
	}

	.slide-down-enter-active {
		transition: all 0.4s ease;
	}
	.slide-down-leave-active {
		transition: all 0.3s ease;
	}
	.slide-down-enter-from {
		opacity: 0;
		transform: translateY(-10px);
	}
	.slide-down-leave-to {
		opacity: 0;
		transform: translateY(-5px);
	}

	.card-list-enter-active {
		transition: all 0.6s ease;
	}
	.card-list-leave-active {
		transition: all 0.4s ease;
	}
	.card-list-enter-from {
		opacity: 0;
		transform: translateY(30px) scale(0.95);
	}
	.card-list-leave-to {
		opacity: 0;
		transform: translateY(-20px) scale(0.95);
	}
	.card-list-move {
		transition: transform 0.3s ease;
	}

	.animate-spin {
		animation: spin 2s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.card-hover:hover {
		transform: translateY(-4px);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	input:focus,
	textarea:focus,
	select:focus {
		box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
		border-color: rgb(147, 51, 234);
	}

	button:hover {
		transform: translateY(-1px);
	}

	button:active {
		transform: translateY(0);
	}

	@media (max-width: 768px) {
		.container {
			padding-left: 1rem;
			padding-right: 1rem;
		}
		h1 {
			font-size: 2rem;
		}
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
