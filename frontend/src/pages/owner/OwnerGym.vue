<script setup>
	import { ref, computed, onMounted } from "vue";
	
	const loading = ref(true);
	const gyms = ref([]);
	const success = ref(false);
	const successMessage = ref("");
	const error = ref("");
	const showCreateForm = ref(false);
	const editMode = ref({});
	const editForms = ref({});
	const createForm = ref({
		name: "",
		capacity: "",
		address: "",
		contact: "",
		equipments: "",
		activities: "",
		description: "",
	});

	const hasPendingGym = computed(() => {
		return gyms.value.some((gym) => !gym.isApproved);
	});

	const hasReachedGymLimit = computed(() => {
		return gyms.value.length >= 4;
	});

	const canCreateNewGym = computed(() => {
		return !hasPendingGym.value && !hasReachedGymLimit.value;
	});

	const loadGyms = async () => {
		loading.value = true;
		try {
			const user = JSON.parse(localStorage.getItem("user"));
			if (!user || !user.id) throw new Error("Utilisateur non trouvé");

			const res = await fetch(
				window.config.BACKEND_URL + `/api/gyms/owner?owner_id=${user.id}`
			);

			if (!res.ok) throw new Error("Impossible de charger les salles");

			const gymsData = await res.json();
			gyms.value = gymsData;

			initEditForms();
		} catch (e) {
			error.value = e.message;
		} finally {
			loading.value = false;
		}
	};

	const initEditForms = () => {
		editForms.value = {};
		editMode.value = {};

		gyms.value.forEach((gym) => {
			editMode.value[gym._id] = false;
			editForms.value[gym._id] = {
				name: gym.name || "",
				capacity: gym.capacity || "",
				address: gym.address || "",
				contact: gym.contact || "",
				equipments: (gym.equipments || []).join(", "),
				activities: (gym.activities || []).join(", "),
				description: gym.description || "",
			};
		});
	};
	const toggleEdit = (gymId) => {
		if (hasPendingGym.value) {
			return;
		}

		editMode.value[gymId] = !editMode.value[gymId];

		if (!editMode.value[gymId]) {
			cancelEdit(gymId);
		}
	};

	const cancelEdit = (gymId) => {
		editMode.value[gymId] = false;

		const gym = gyms.value.find((g) => g._id === gymId);
		if (gym) {
			editForms.value[gymId] = {
				name: gym.name || "",
				capacity: gym.capacity || "",
				address: gym.address || "",
				contact: gym.contact || "",
				equipments: (gym.equipments || []).join(", "),
				activities: (gym.activities || []).join(", "),
				description: gym.description || "",
			};
		}
	};

	const updateGym = async (gym) => {
		if (hasPendingGym.value) {
			error.value =
				"Vous ne pouvez pas modifier vos salles tant qu'une salle est en attente de validation.";
			return;
		}

		success.value = false;
		error.value = "";

		try {
			const user = JSON.parse(localStorage.getItem("user"));
			if (!user || !user.id) throw new Error("Utilisateur non trouvé");

			const formData = editForms.value[gym._id];
			const payload = {
				name: formData.name,
				capacity: Number(formData.capacity),
				address: formData.address,
				contact: formData.contact,
				equipments: formData.equipments
					.split(",")
					.map((e) => e.trim())
					.filter(Boolean),
				activities: formData.activities
					.split(",")
					.map((a) => a.trim())
					.filter(Boolean),
				description: formData.description,
				isApproved: gym.isApproved,
			};

			const res = await fetch(
				window.config.BACKEND_URL +
					`/api/gyms/owner/${gym._id}?owner_id=${user.id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);

			if (!res.ok) throw new Error("Erreur lors de la sauvegarde");

			const updatedGym = await res.json();
			const index = gyms.value.findIndex((g) => g._id === gym._id);
			if (index !== -1) {
				gyms.value[index] = updatedGym;
			}

			editMode.value[gym._id] = false;

			success.value = true;
			successMessage.value = `Salle "${updatedGym.name}" mise à jour avec succès.`;

			initEditForms();

			setTimeout(() => {
				success.value = false;
			}, 3000);
		} catch (e) {
			error.value = e.message;
		}
	};
	const onCreate = async () => {
		if (hasPendingGym.value) {
			error.value =
				"Vous ne pouvez pas créer de nouvelle salle tant qu'une salle est en attente de validation.";
			return;
		}

		if (hasReachedGymLimit.value) {
			error.value =
				"Vous avez atteint la limite maximale de 4 salles de sport par propriétaire.";
			return;
		}

		success.value = false;
		error.value = "";

		try {
			const user = JSON.parse(localStorage.getItem("user"));
			if (!user || !user.id) throw new Error("Utilisateur non trouvé");

			const payload = {
				name: createForm.value.name,
				capacity: Number(createForm.value.capacity),
				address: createForm.value.address,
				contact: createForm.value.contact,
				equipments: createForm.value.equipments
					.split(",")
					.map((e) => e.trim())
					.filter(Boolean),
				activities: createForm.value.activities
					.split(",")
					.map((a) => a.trim())
					.filter(Boolean),
				description: createForm.value.description,
				isApproved: false,
			};

			const res = await fetch(
				window.config.BACKEND_URL + `/api/gyms/owner?owner_id=${user.id}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);

			if (!res.ok) throw new Error("Erreur lors de la création de la salle");

			const newGym = await res.json();

			gyms.value.push(newGym);

			createForm.value = {
				name: "",
				capacity: "",
				address: "",
				contact: "",
				equipments: "",
				activities: "",
				description: "",
			};

			showCreateForm.value = false;

			success.value = true;
			successMessage.value = `Salle "${newGym.name}" créée avec succès. Elle est en attente de validation.`;

			initEditForms();

			setTimeout(() => {
				success.value = false;
			}, 3000);
		} catch (e) {
			error.value = e.message;
		}
	};

	const deleteGym = async (gym) => {
		if (hasPendingGym.value) {
			error.value =
				"Vous ne pouvez pas supprimer vos salles tant qu'une salle est en attente de validation.";
			return;
		}

		const confirmMessage = `⚠️ SUPPRESSION DÉFINITIVE ⚠️\n\nÊtes-vous absolument sûr(e) de vouloir supprimer la salle "${gym.name}" ?\n\n❌ Cette action est IRRÉVERSIBLE\n❌ Toutes les données liées à cette salle seront perdues\n❌ Les défis associés à cette salle seront supprimés\n\nTapez "SUPPRIMER" pour confirmer ou annulez cette action.`;

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
				window.config.BACKEND_URL +
					`/api/gyms/owner/${gym._id}?owner_id=${user.id}`,
				{
					method: "DELETE",
				}
			);

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.erreur || "Erreur lors de la suppression");
			}

			const result = await res.json();

			gyms.value = gyms.value.filter((g) => g._id !== gym._id);

			initEditForms();

			success.value = true;
			successMessage.value =
				result.message || `Salle "${gym.name}" supprimée avec succès.`;

			setTimeout(() => {
				success.value = false;
			}, 4000);
		} catch (e) {
			error.value = e.message;
		}
	};

	onMounted(() => {
		loadGyms();
	});
</script>

<template>
	<div
		class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8"
	>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-8">
				<h1 class="text-4xl font-bold text-gray-900 mb-2">
					{{ gyms.length === 0 ? "Ma Salle de Sport" : "Mes Salles de Sport" }}
				</h1>
				<p class="text-lg text-gray-600">
					{{
						gyms.length === 0
							? "Créez et gérez votre salle de sport"
							: `Vous gérez ${gyms.length} salle${gyms.length > 1 ? "s" : ""}`
					}}
				</p>
			</div>

			<transition name="fade" mode="out-in">
				<div v-if="loading" key="loading" class="text-center py-20">
					<div
						class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 animate-spin"
					>
						<svg
							class="w-8 h-8 text-blue-600"
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
					<p class="text-gray-500 mt-2">
						Récupération des informations de vos salles
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
									<p class="text-green-700 text-sm">
										{{ successMessage }}
									</p>
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

					<transition name="slide-down">
						<div v-if="hasPendingGym" class="mb-6">
							<div
								class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start"
							>
								<div
									class="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3 mt-0.5"
								>
									<svg
										class="w-6 h-6 text-amber-600"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2v-2zm0-6h2v4h-2v-4z"
										/>
									</svg>
								</div>
								<div>
									<h3 class="text-amber-800 font-semibold">
										Salle en attente de validation
									</h3>
									<p class="text-amber-700 text-sm mt-1">
										Vous avez une ou plusieurs salles en attente de validation
										par nos équipes. Vous ne pouvez pas créer de nouvelle salle
										ni modifier vos salles existantes tant que toutes vos salles
										ne sont pas approuvées.
									</p>
									<p class="text-amber-600 text-xs mt-2 font-medium">
										💡 Les modifications seront à nouveau disponibles une fois
										la validation terminée.
									</p>
								</div>
							</div>
						</div>
					</transition>

					<transition name="slide-down">
						<div v-if="hasReachedGymLimit && !hasPendingGym" class="mb-6">
							<div
								class="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start"
							>
								<div
									class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5"
								>
									<svg
										class="w-6 h-6 text-purple-600"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
										/>
									</svg>
								</div>
								<div>
									<h3 class="text-purple-800 font-semibold">
										Limite maximale atteinte
									</h3>
									<p class="text-purple-700 text-sm mt-1">
										Vous avez atteint la limite maximale de 4 salles de sport
										par propriétaire. Pour créer une nouvelle salle, vous devez
										d'abord supprimer une salle existante.
									</p>
									<p class="text-purple-600 text-xs mt-2 font-medium">
										🎯 Contactez notre équipe si vous souhaitez augmenter cette
										limite.
									</p>
								</div>
							</div>
						</div>
					</transition>
					<div v-if="gyms.length > 0" class="mb-8 text-center">
						<button
							@click="canCreateNewGym && (showCreateForm = !showCreateForm)"
							:disabled="!canCreateNewGym"
							:class="[
								'font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-200 transform flex items-center gap-2 mx-auto',
								canCreateNewGym
									? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl hover:scale-105'
									: 'bg-gray-300 text-gray-500 cursor-not-allowed',
							]"
						>
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M13 10h7v2h-7v7h-2v-7H4v-2h7V3h2v7z" />
							</svg>
							{{ showCreateForm ? "Annuler" : "Ajouter une nouvelle salle" }}
							<span v-if="hasReachedGymLimit" class="text-xs ml-1"
								>({{ gyms.length }}/4)</span
							>
						</button>
					</div>

					<transition name="fade" mode="out-in">
						<div key="main-content">
							<div
								v-if="gyms.length === 0 || (showCreateForm && canCreateNewGym)"
								class="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200 mb-8"
							>
								<div
									class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6"
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
												<path d="M13 10h7v2h-7v7h-2v-7H4v-2h7V3h2v7z" />
											</svg>
										</div>
										{{
											gyms.length === 0
												? "Créer votre salle de sport"
												: "Ajouter une nouvelle salle"
										}}
									</h2>
									<p class="text-blue-100 mt-2">
										{{
											gyms.length === 0
												? "Aucune salle n'est associée à votre compte. Créez votre salle ci-dessous pour commencer."
												: "Ajoutez une nouvelle salle à votre portefeuille."
										}}
									</p>
								</div>

								<div class="p-8">
									<form @submit.prevent="onCreate" class="space-y-6">
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
													Nom de la salle
												</label>
												<input
													v-model="createForm.name"
													type="text"
													required
													class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
													placeholder="Ex: Fitness Club Premium"
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
															d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-6h2.5l6 6H4zm16.5-9.5L19 7l-3.5-1.5L14 9l1.5 3.5L19 14l1.5-3.5L22 9l-1.5-1.5z"
														/>
													</svg>
													Capacité
												</label>
												<input
													v-model.number="createForm.capacity"
													type="number"
													min="1"
													required
													class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
													placeholder="50"
												/>
											</div>
										</div>

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
															d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h18v8z"
														/>
													</svg>
													Équipements
												</label>
												<input
													v-model="createForm.equipments"
													type="text"
													class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
													placeholder="Haltères, Tapis, Vélos..."
												/>
												<p class="text-xs text-gray-500 mt-1">
													Séparez chaque équipement par une virgule
												</p>
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
															d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6h6v-2h-4z"
														/>
													</svg>
													Activités
												</label>
												<input
													v-model="createForm.activities"
													type="text"
													class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
													placeholder="Cardio, Yoga, Musculation..."
												/>
												<p class="text-xs text-gray-500 mt-1">
													Séparez chaque activité par une virgule
												</p>
											</div>
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
														d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
													/>
												</svg>
												Adresse
											</label>
											<input
												v-model="createForm.address"
												type="text"
												class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
												placeholder="123 Rue du Sport, 75001 Paris"
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
														d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
													/>
												</svg>
												Contact
											</label>
											<input
												v-model="createForm.contact"
												type="text"
												class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
												placeholder="contact@gym.com ou +33 1 23 45 67 89"
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
														d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
													/>
												</svg>
												Description
											</label>
											<textarea
												v-model="createForm.description"
												rows="4"
												class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
												placeholder="Décrivez votre salle de sport, ses spécialités, son ambiance..."
											></textarea>
										</div>

										<div class="flex justify-end gap-4 pt-4">
											<button
												v-if="gyms.length > 0"
												type="button"
												@click="showCreateForm = false"
												class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-all duration-200"
											>
												Annuler
											</button>
											<button
												type="submit"
												class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
											>
												<svg
													class="w-5 h-5"
													fill="currentColor"
													viewBox="0 0 24 24"
												>
													<path d="M13 10h7v2h-7v7h-2v-7H4v-2h7V3h2v7z" />
												</svg>
												{{
													gyms.length === 0
														? "Créer la salle"
														: "Ajouter la salle"
												}}
											</button>
										</div>
									</form>
								</div>
							</div>

							<div
								v-if="gyms.length > 0 && !showCreateForm"
								key="gyms-list"
								class="space-y-6"
							>
								<transition-group
									name="card-list"
									tag="div"
									class="grid grid-cols-1 lg:grid-cols-2 gap-6"
								>
									<div
										v-for="gym in gyms"
										:key="gym._id"
										class="bg-white shadow-lg rounded-3xl overflow-hidden border border-gray-200 transform transition-all duration-300 hover:shadow-xl card-hover"
									>
										<div
											:class="[
												'px-6 py-4',
												gym.isApproved
													? 'bg-gradient-to-r from-green-600 to-emerald-600'
													: 'bg-gradient-to-r from-yellow-500 to-orange-500',
											]"
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
													{{ gym.name }}
												</h3>
												<div class="flex items-center gap-2">
													<span
														:class="[
															'px-3 py-1 rounded-full text-xs font-medium',
															gym.isApproved
																? 'bg-green-100 text-green-800'
																: 'bg-yellow-100 text-yellow-800',
														]"
													>
														{{ gym.isApproved ? "Approuvée" : "En attente" }}
													</span>
													<button
														@click="!hasPendingGym && toggleEdit(gym._id)"
														:disabled="hasPendingGym"
														:class="[
															'p-2 rounded-lg transition-colors duration-200',
															hasPendingGym
																? 'bg-gray-100 text-gray-400 cursor-not-allowed'
																: editMode[gym._id]
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
																v-if="!editMode[gym._id]"
																d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
															/>
															<path
																v-else
																d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
															/>
														</svg>
													</button>
													<button
														@click="!hasPendingGym && deleteGym(gym)"
														:disabled="hasPendingGym"
														:class="[
															'p-2 rounded-lg transition-colors duration-200',
															hasPendingGym
																? 'bg-red-100 text-gray-400 cursor-not-allowed'
																: 'bg-red-500/20 hover:bg-red-500/30 text-red-600 hover:text-red-700',
														]"
														title="Supprimer cette salle"
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
										</div>

										<div class="p-6">
											<div v-if="!editMode[gym._id]">
												<div class="space-y-4">
													<div class="grid grid-cols-2 gap-4 text-sm">
														<div class="flex items-center gap-2">
															<svg
																class="w-4 h-4 text-gray-500"
																fill="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-6h2.5l6 6H4zm16.5-9.5L19 7l-3.5-1.5L14 9l1.5 3.5L19 14l1.5-3.5L22 9l-1.5-1.5z"
																/>
															</svg>
															<span class="text-gray-600"
																>{{ gym.capacity }} personnes</span
															>
														</div>
														<div
															v-if="gym.address"
															class="flex items-center gap-2"
														>
															<svg
																class="w-4 h-4 text-gray-500"
																fill="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
																/>
															</svg>
															<span class="text-gray-600 truncate">{{
																gym.address
															}}</span>
														</div>
													</div>

													<div
														v-if="gym.contact"
														class="flex items-center gap-2 text-sm"
													>
														<svg
															class="w-4 h-4 text-gray-500"
															fill="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
															/>
														</svg>
														<span class="text-gray-600">{{ gym.contact }}</span>
													</div>

													<div
														v-if="gym.equipments && gym.equipments.length"
														class="space-y-1"
													>
														<span class="text-sm font-medium text-gray-700"
															>Équipements :</span
														>
														<div class="flex flex-wrap gap-1">
															<span
																v-for="equipment in gym.equipments"
																:key="equipment"
																class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
															>
																{{ equipment }}
															</span>
														</div>
													</div>

													<div
														v-if="gym.activities && gym.activities.length"
														class="space-y-1"
													>
														<span class="text-sm font-medium text-gray-700"
															>Activités :</span
														>
														<div class="flex flex-wrap gap-1">
															<span
																v-for="activity in gym.activities"
																:key="activity"
																class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
															>
																{{ activity }}
															</span>
														</div>
													</div>

													<div v-if="gym.description" class="space-y-1">
														<span class="text-sm font-medium text-gray-700"
															>Description :</span
														>
														<p class="text-sm text-gray-600 leading-relaxed">
															{{ gym.description }}
														</p>
													</div>
												</div>
											</div>

											<div v-else>
												<form
													@submit.prevent="updateGym(gym)"
													class="space-y-4"
												>
													<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
														<div>
															<label
																class="block text-sm font-medium text-gray-700 mb-1"
																>Nom</label
															>
															<input
																v-model="editForms[gym._id].name"
																type="text"
																required
																class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
															/>
														</div>
														<div>
															<label
																class="block text-sm font-medium text-gray-700 mb-1"
																>Capacité</label
															>
															<input
																v-model.number="editForms[gym._id].capacity"
																type="number"
																min="1"
																required
																class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
															/>
														</div>
													</div>

													<div>
														<label
															class="block text-sm font-medium text-gray-700 mb-1"
															>Adresse</label
														>
														<input
															v-model="editForms[gym._id].address"
															type="text"
															class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
														/>
													</div>

													<div>
														<label
															class="block text-sm font-medium text-gray-700 mb-1"
															>Contact</label
														>
														<input
															v-model="editForms[gym._id].contact"
															type="text"
															class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
														/>
													</div>

													<div>
														<label
															class="block text-sm font-medium text-gray-700 mb-1"
															>Équipements</label
														>
														<input
															v-model="editForms[gym._id].equipments"
															type="text"
															class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
															placeholder="Séparez par des virgules"
														/>
													</div>

													<div>
														<label
															class="block text-sm font-medium text-gray-700 mb-1"
															>Activités</label
														>
														<input
															v-model="editForms[gym._id].activities"
															type="text"
															class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
															placeholder="Séparez par des virgules"
														/>
													</div>

													<div>
														<label
															class="block text-sm font-medium text-gray-700 mb-1"
															>Description</label
														>
														<textarea
															v-model="editForms[gym._id].description"
															rows="3"
															class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
														></textarea>
													</div>

													<div class="flex justify-end gap-2 pt-2">
														<button
															type="button"
															@click="cancelEdit(gym._id)"
															class="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors duration-200"
														>
															Annuler
														</button>
														<button
															type="submit"
															:disabled="!gym.isApproved"
															:class="[
																'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1',
																gym.isApproved
																	? 'bg-green-600 hover:bg-green-700 text-white'
																	: 'bg-gray-400 text-gray-200 cursor-not-allowed',
															]"
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
						</div>
					</transition>
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

	.animate-fade-in {
		animation: fadeInUp 0.6s ease-out;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
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

	input:focus,
	textarea:focus,
	select:focus {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		border-color: rgb(59, 130, 246);
	}

	button:hover {
		transform: translateY(-1px);
	}

	button:active {
		transform: translateY(0);
	}

	.notification-enter-active {
		transition: all 0.3s ease;
	}
	.notification-leave-active {
		transition: all 0.5s ease;
	}
	.notification-enter-from {
		opacity: 0;
		transform: translateX(100%);
	}
	.notification-leave-to {
		opacity: 0;
		transform: translateX(-100%);
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

	.card-hover:hover {
		transform: translateY(-4px);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.gradient-blue {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}

	.gradient-green {
		background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
	}

	.gradient-yellow {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.tag {
		transition: all 0.2s ease;
	}

	.tag:hover {
		transform: scale(1.05);
	}

	.compact-form input,
	.compact-form textarea {
		padding: 8px 12px;
		font-size: 14px;
	}

	.edit-transition {
		transition: all 0.3s ease;
	}

	.card-action-btn {
		transition: all 0.2s ease;
		backdrop-filter: blur(10px);
	}

	.card-action-btn:hover {
		backdrop-filter: blur(15px);
		transform: scale(1.1);
	}
</style>
