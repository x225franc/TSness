<script setup>
	import { ref, computed, onMounted } from "vue";

	const loading = ref(true);
	const challenges = ref([]);
	const users = ref([]);
	const exerciseTypes = ref([]);
	const success = ref(false);
	const successMessage = ref("");
	const error = ref("");
	const showCreateForm = ref(false);
	const createForm = ref({
		title: "",
		description: "",
		exerciseTypeId: "",
		difficulty: "facile",
		durationInDays: 0,
		objectivesText: "",
		isPublic: false,
		sharedWith: [],
	});
	const userBadges = ref([]);
	const allChallenges = ref([]);
	const filters = ref({
		difficulty: "",
		exerciseTypeId: "",
	});
	const filterOrigin = ref("all");

	const user = computed(() => JSON.parse(localStorage.getItem("user")));
	const userId = computed(() => user.value?.id);
	const userCompleted = ref([]);

	const filteredChallenges = computed(() => {
		const user = JSON.parse(localStorage.getItem("user"));
		return allChallenges.value.filter((challenge) => {
			let matchOrigin = true;
			if (filterOrigin.value === "mine") {
				matchOrigin =
					challenge.createdBy &&
					(challenge.createdBy._id === user.id ||
						challenge.createdBy === user.id);
			} else if (filterOrigin.value === "community") {
				matchOrigin =
					challenge.isPublic &&
					!(
						challenge.createdBy &&
						(challenge.createdBy._id === user.id ||
							challenge.createdBy === user.id)
					);
			} else if (filterOrigin.value === "shared") {
				matchOrigin =
					Array.isArray(challenge.sharedWith) &&
					challenge.sharedWith.includes(user.id);
			} else if (filterOrigin.value === "completed") {
				matchOrigin = userCompleted.value.includes(challenge._id);
			}
			const matchDifficulty =
				!filters.value.difficulty ||
				challenge.difficulty === filters.value.difficulty;
			const matchType =
				!filters.value.exerciseTypeId ||
				(challenge.exerciseTypeId &&
					(challenge.exerciseTypeId._id === filters.value.exerciseTypeId ||
						challenge.exerciseTypeId === filters.value.exerciseTypeId));
			return matchOrigin && matchDifficulty && matchType;
		});
	});

	const loadData = async () => {
		loading.value = true;
		try {
			await Promise.all([loadChallenges(), loadExerciseTypes(), loadUsers()]);
		} catch (e) {
			error.value = e.message;
			window.scrollTo({ top: 0, behavior: "smooth" });
		} finally {
			loading.value = false;
		}
	};

	const loadChallenges = async () => {
		if (!userId.value) throw new Error("Utilisateur non trouvé");
		const res = await fetch(window.config.BACKEND_URL + `/api/challenges`);
		if (!res.ok) throw new Error("Impossible de charger les défis");
		const all = await res.json();
		allChallenges.value = all.filter(
			(ch) =>
				ch.isPublic ||
				(ch.createdBy &&
					(ch.createdBy._id === userId.value ||
						ch.createdBy === userId.value)) ||
				(Array.isArray(ch.sharedWith) && ch.sharedWith.includes(userId.value))
		);
	};

const loadExerciseTypes = async () => {
  const res = await fetch(
    window.config.BACKEND_URL + "/api/exercise-types"
  );
  if (!res.ok) throw new Error("Impossible de charger les types d'exercices");
  exerciseTypes.value = await res.json();
};

	const loadUsers = async () => {
		const res = await fetch(window.config.BACKEND_URL + "/api/user/clients");
		if (!res.ok) throw new Error("Impossible de charger les clients");
		users.value = await res.json();
	};

	const loadUserBadges = async () => {
		const user = JSON.parse(localStorage.getItem("user"));
		if (!user || !user.id) return;
		const res = await fetch(window.config.BACKEND_URL + `/api/user/${user.id}`);
		if (res.ok) {
			const data = await res.json();
			userBadges.value = data.badges || [];
		}
	};

	const loadUserCompleted = async () => {
		if (!userId.value) return;
		const res = await fetch(
			window.config.BACKEND_URL + `/api/user/${userId.value}`
		);
		if (res.ok) {
			const data = await res.json();
			userCompleted.value = data.challenges_completed || [];
		}
	};

	const createChallenge = async () => {
		success.value = false;
		error.value = "";
		try {
			const user = JSON.parse(localStorage.getItem("user"));
			if (!user || !user.id) throw new Error("Utilisateur non trouvé");
			if (
				!createForm.value.title ||
				!createForm.value.description ||
				!createForm.value.durationInDays
			) {
				throw new Error("Veuillez remplir tous les champs obligatoires");
			}
			const objectives = createForm.value.objectivesText
				.split("\n")
				.map((obj) => obj.trim())
				.filter(Boolean);
			const payload = {
				title: createForm.value.title,
				description: createForm.value.description,
				exerciseTypeId: createForm.value.exerciseTypeId || null,
				difficulty: createForm.value.difficulty,
				durationInDays: Number(createForm.value.durationInDays),
				objectives,
				isPublic: createForm.value.isPublic,
				sharedWith: createForm.value.sharedWith,
			};
			const res = await fetch(
				window.config.BACKEND_URL + `/api/challenges?user_id=${user.id}`,
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
			allChallenges.value.unshift(newChallenge);
			createForm.value = {
				title: "",
				description: "",
				exerciseTypeId: "",
				difficulty: "facile",
				durationInDays: 0,
				objectivesText: "",
				isPublic: false,
				sharedWith: [],
			};
			showCreateForm.value = false;
			success.value = true;
			successMessage.value = `Défi "${newChallenge.title}" créé avec succès !`;
			setTimeout(() => {
				success.value = false;
			}, 3000);
			await loadChallenges();
		} catch (e) {
			error.value = e.message;
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	const completeChallenge = async (challengeId) => {
		try {
			const res = await fetch(
				window.config.BACKEND_URL +
					`/api/challenges/complete/${challengeId}?user_id=${userId.value}`,
				{
					method: "POST",
				}
			);
			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.erreur || "Erreur lors de la complétion");
			}
			await loadUserCompleted();
			await loadChallenges();
			success.value = true;
			successMessage.value = "Défi complété avec succès !";
			setTimeout(() => {
				success.value = false;
			}, 3000);
		} catch (e) {
			error.value = e.message;
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	const formatDuration = (days) => {
		if (!days || days < 1) return "Moins d’un jour";
		if (days === 1) return "1 jour";
		if (days < 7) return `${days} jours`;
		if (days < 30) return `${Math.round(days / 7)} semaine(s)`;
		if (days < 365) return `${Math.round(days / 30)} mois`;
		return `${Math.round(days / 365)} an(s)`;
	};

	onMounted(async () => {
		await loadData();
		await loadUserBadges();
		await loadUserCompleted();
	});
</script>

<template>
	<div
		class="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-8"
	>
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-8">
				<h1 class="text-4xl font-bold text-gray-900 mb-2">
					Défis de la Communauté
				</h1>
				<p class="text-lg text-gray-600">
					Créez et partagez vos propres défis d'entraînement !
				</p>
			</div>
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
				<div v-else key="content">
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
					<div class="mb-8 text-center">
						<button
							@click="showCreateForm = !showCreateForm"
							class="font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform flex items-center gap-2 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white hover:shadow-xl hover:scale-105"
						>
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M13 10h7v2h-7v7h-2v-7H4v-2h7V3h2v7z" />
							</svg>
							{{ showCreateForm ? "Annuler" : "Créer un nouveau défi" }}
						</button>
					</div>
					<transition name="fade" mode="out-in">
						<div
							v-if="showCreateForm"
							key="create-form"
							class="bg-white shadow rounded-xl overflow-hidden border border-gray-200 mb-6"
						>
							<div
								class="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3"
							>
								<h2
									class="text-lg font-bold text-white flex items-center gap-2"
								>
									<div
										class="w-8 h-8 bg-white/20 rounded flex items-center justify-center"
									>
										<svg
											class="w-5 h-5 text-white"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
											/>
										</svg>
									</div>
									Créer un nouveau défi
								</h2>
								<p class="text-purple-100 mt-1 text-xs">
									Définissez un défi, partagez-le avec la communauté ou des
									membres spécifiques.
								</p>
							</div>
							<div class="p-4">
								<form @submit.prevent="createChallenge" class="space-y-3">
									<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div>
											<label
												class="block text-xs font-semibold text-gray-700 mb-1"
												>Titre du défi *</label
											>
											<input
												v-model="createForm.title"
												type="text"
												required
												class="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent text-sm"
												placeholder="Ex: Défi Cardio Intensif"
											/>
										</div>
										<div>
											<label
												class="block text-xs font-semibold text-gray-700 mb-1"
												>Type d'exercice</label
											>
											<select
												v-model="createForm.exerciseTypeId"
												class="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent text-sm"
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
									</div>
									<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div>
											<label
												class="block text-xs font-semibold text-gray-700 mb-1"
												>Difficulté</label
											>
											<select
												v-model="createForm.difficulty"
												class="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent text-sm"
											>
												<option value="facile">🟢 Facile</option>
												<option value="intermédiaire">🟡 Intermédiaire</option>
												<option value="difficile">🔴 Difficile</option>
											</select>
										</div>
										<div>
											<label
												class="block text-xs font-semibold text-gray-700 mb-1"
												>Durée du défi (en jours) *</label
											>
											<input
												v-model="createForm.durationInDays"
												type="number"
												min="1"
												required
												class="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent text-sm"
												placeholder="Ex : 7 pour 7 jours"
											/>
										</div>
									</div>
									<div
										v-if="createForm.durationInDays"
										class="bg-blue-50 border border-blue-200 rounded p-2 text-xs flex items-center gap-2 mt-1"
									>
										<svg
											class="w-4 h-4 text-blue-600"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6h6v-2h-4z"
											/>
										</svg>
										<span class="text-blue-700 font-medium"
											>Durée :
											{{ formatDuration(createForm.durationInDays) }}</span
										>
									</div>
									<div>
										<label
											class="block text-xs font-semibold text-gray-700 mb-1"
											>Description du défi *</label
										>
										<textarea
											v-model="createForm.description"
											rows="2"
											required
											class="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent text-sm"
											placeholder="Décrivez le défi, ses objectifs, les exercices recommandés..."
										></textarea>
									</div>
									<div>
										<label
											class="block text-xs font-semibold text-gray-700 mb-1"
											>Objectifs (optionnel)</label
										>
										<textarea
											v-model="createForm.objectivesText"
											rows="2"
											class="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 focus:border-transparent text-sm"
											placeholder="Un objectif par ligne : Ex: Faire 30 min de cardio, Brûler 300 calories..."
										></textarea>
										<p class="text-xs text-gray-400 mt-0.5">
											Séparez chaque objectif par une nouvelle ligne
										</p>
									</div>
									<div class="flex items-center gap-3">
										<div>
											<label
												class="inline-flex items-center cursor-pointer text-xs"
											>
												<input
													type="checkbox"
													v-model="createForm.isPublic"
													class="form-checkbox h-4 w-4 text-purple-600"
												/>
												<span class="ml-2 text-gray-700">Défi public</span>
											</label>
										</div>
										<div class="flex-1">
											<label
												class="block text-xs font-semibold text-gray-700 mb-1"
												>Inviter des membres</label
											>
											<div
												class="max-h-40 overflow-y-auto border border-gray-300 rounded p-2 bg-white"
											>
												<div
													v-for="u in users"
													:key="u._id"
													class="flex items-center gap-2 py-1"
												>
													<input
														type="checkbox"
														:id="'invite-' + u._id"
														:value="u._id"
														v-model="createForm.sharedWith"
														class="form-checkbox h-4 w-4 text-violet-600"
													/>
													<label
														:for="'invite-' + u._id"
														class="text-sm text-gray-800 cursor-pointer font-medium"
														>{{ u.firstname }} {{ u.lastname }}</label
													>
												</div>
											</div>
											<p class="text-xs text-gray-400 mt-0.5">
												Cochez les membres à inviter
											</p>
											<div
												v-if="createForm.sharedWith.length"
												class="mt-2 flex flex-wrap gap-2"
											>
												<span
													v-for="id in createForm.sharedWith"
													:key="id"
													class="inline-flex items-center bg-violet-100 text-violet-800 font-semibold px-3 py-1 rounded-full text-sm shadow-sm border border-violet-200"
												>
													<svg
														class="w-3 h-3 mr-1 text-violet-300"
														fill="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
														/>
													</svg>
													{{ users.find((u) => u._id === id)?.firstname }}
													{{ users.find((u) => u._id === id)?.lastname }}
												</span>
											</div>
										</div>
									</div>
									<div class="flex justify-end gap-2 pt-2">
										<button
											type="button"
											@click="showCreateForm = false"
											class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-1 rounded transition-all duration-150 text-sm"
										>
											Annuler
										</button>
										<button
											type="submit"
											class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-1.5 rounded shadow-md hover:shadow-lg transition-all duration-150 text-sm flex items-center gap-1"
										>
											<svg
												class="w-4 h-4"
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
					<div class="mb-6 flex flex-wrap gap-4 items-center justify-between">
						<div class="flex gap-2 items-center">
							<label class="text-xs font-semibold text-gray-700"
								>Afficher :</label
							>
							<button
								@click="filterOrigin = 'all'"
								:class="[
									'px-3 py-1 rounded-full text-xs font-semibold transition',
									filterOrigin === 'all'
										? 'bg-violet-600 text-white shadow'
										: 'bg-gray-100 text-gray-700',
								]"
							>
								Tous
							</button>
							<button
								@click="filterOrigin = 'mine'"
								:class="[
									'px-3 py-1 rounded-full text-xs font-semibold transition',
									filterOrigin === 'mine'
										? 'bg-violet-600 text-white shadow'
										: 'bg-gray-100 text-gray-700',
								]"
							>
								Mes défis
							</button>
							<button
								@click="filterOrigin = 'community'"
								:class="[
									'px-3 py-1 rounded-full text-xs font-semibold transition',
									filterOrigin === 'community'
										? 'bg-violet-600 text-white shadow'
										: 'bg-gray-100 text-gray-700',
								]"
							>
								Communauté
							</button>
							<button
								@click="filterOrigin = 'shared'"
								:class="[
									'px-3 py-1 rounded-full text-xs font-semibold transition',
									filterOrigin === 'shared'
										? 'bg-violet-600 text-white shadow'
										: 'bg-gray-100 text-gray-700',
								]"
							>
								Partagés
							</button>
							<button
								@click="filterOrigin = 'completed'"
								:class="[
									'px-3 py-1 rounded-full text-xs font-semibold transition',
									filterOrigin === 'completed'
										? 'bg-green-600 text-white shadow'
										: 'bg-gray-100 text-gray-700',
								]"
							>
								Terminés
							</button>
						</div>
						<div class="flex gap-2 items-center">
							<label class="text-xs font-semibold text-gray-700"
								>Difficulté :</label
							>
							<select
								v-model="filters.difficulty"
								class="border border-gray-300 rounded px-2 py-1 text-sm"
							>
								<option value="">Toutes</option>
								<option value="facile">Facile</option>
								<option value="intermédiaire">Intermédiaire</option>
								<option value="difficile">Difficile</option>
							</select>
						</div>
						<div class="flex gap-2 items-center">
							<label class="text-xs font-semibold text-gray-700"
								>Type d'exercice :</label
							>
							<select
								v-model="filters.exerciseTypeId"
								class="border border-gray-300 rounded px-2 py-1 text-sm"
							>
								<option value="">Tous</option>
								<option
									v-for="type in exerciseTypes"
									:key="type._id"
									:value="type._id"
								>
									{{ type.name }}
								</option>
							</select>
						</div>
					</div>
					<div v-if="filteredChallenges.length === 0" class="text-center py-12">
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
								Aucun défi trouvé
							</h3>
							<p class="text-gray-600">Aucun défi ne correspond à ce filtre.</p>
						</div>
					</div>
					<transition-group
						v-if="filteredChallenges.length > 0"
						name="card-list"
						tag="div"
						class="grid grid-cols-1 lg:grid-cols-2 gap-6"
					>
						<div
							v-for="challenge in filteredChallenges"
							:key="challenge._id"
							class="bg-white shadow-lg rounded-3xl overflow-hidden border border-gray-200 transform transition-all duration-300 hover:shadow-xl card-hover"
						>
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
										<span
											v-if="challenge.isPublic"
											class="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold"
											>Public</span
										>
										<span
											v-else-if="
												challenge.sharedWith && challenge.sharedWith.length
											"
											class="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold"
											>Partagé</span
										>
										<span
											v-else
											class="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold"
											>Privé</span
										>
									</div>
								</div>
								<div class="mt-2 text-sm text-purple-100">
									<span class="font-medium">Créé par :</span>
									<span>{{
										challenge.createdBy?.firstname || "Utilisateur"
									}}</span>
								</div>
							</div>
							<div class="p-6">
								<div class="space-y-4">
									<div class="flex items-center gap-4 text-sm flex-wrap">
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
										<span
											v-if="challenge.durationInDays"
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
											{{ challenge.durationInDays }}
										</span>
									</div>
									<div v-if="challenge.exerciseTypeId" class="text-sm">
										<span class="font-medium text-gray-700"
											>Type d'exercice :</span
										>
										<span class="text-purple-600 ml-1">{{
											challenge.exerciseTypeId.name || challenge.exerciseTypeId
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
										v-if="challenge.objectives && challenge.objectives.length"
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
									<div
										v-if="
											userId &&
											!userCompleted.includes(challenge._id) &&
											((Array.isArray(challenge.sharedWith) &&
												challenge.sharedWith.includes(userId)) ||
												challenge.isPublic ||
												(challenge.createdBy &&
													(challenge.createdBy._id === userId ||
														challenge.createdBy === userId)))
										"
										class="mt-3"
									>
										<button
											@click="completeChallenge(challenge._id)"
											class="bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1.5 rounded shadow-sm transition-all duration-150 flex items-center gap-1 text-sm"
										>
											<svg
												class="w-4 h-4"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
												/>
											</svg>
											Compléter
										</button>
									</div>
								</div>
							</div>
						</div>
					</transition-group>
				</div>
			</transition>
		</div>
	</div>
</template>

<style scoped>
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
