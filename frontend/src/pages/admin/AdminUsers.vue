<script setup>
	import { ref, onMounted } from "vue";

	// variable
	const users = ref([]);
	const filteredUsers = ref([]);
	const success = ref(false);
	const successMessage = ref("");
	const error = ref("");
	const selectedRole = ref("");
	const selectedStatus = ref("");
	const searchTerm = ref("");
	const showRoleModal = ref(false);
	const selectedUser = ref(null);
	const newRole = ref("");
	const recalculating = ref(false);
	const recalcSuccess = ref(false);
	const recalcError = ref("");

	// methodes
	const fetchUsers = async () => {
		try {
			const res = await fetch(window.config.BACKEND_URL + "/api/admin/users");
			users.value = await res.json();
			filteredUsers.value = [...users.value];
		} catch (err) {
			error.value = "Erreur lors du chargement des utilisateurs";
		}
	};

	const filterUsers = () => {
		let filtered = [...users.value];

		// Filtre par rôle
		if (selectedRole.value) {
			filtered = filtered.filter((user) => user.role === selectedRole.value);
		}

		// Filtre par statut
		if (selectedStatus.value) {
			const isActive = selectedStatus.value === "active";
			filtered = filtered.filter((user) => user.isActive === isActive);
		}

		// Filtre par recherche
		if (searchTerm.value) {
			const search = searchTerm.value.toLowerCase();
			filtered = filtered.filter(
				(user) =>
					user.firstname.toLowerCase().includes(search) ||
					user.lastname.toLowerCase().includes(search) ||
					user.email.toLowerCase().includes(search)
			);
		}

		filteredUsers.value = filtered;
	};

	const toggleUserStatus = async (user) => {
		try {
			const res = await fetch(
				window.config.BACKEND_URL +
					`/api/admin/users/${user._id}/toggle-status`,
				{
					method: "PATCH",
				}
			);

			if (res.ok) {
				const response = await res.json();
				success.value = true;
				successMessage.value = response.message;
				await fetchUsers();
				filterUsers();

				setTimeout(() => {
					success.value = false;
				}, 3000);
			} else {
				const errorData = await res.json();
				error.value = errorData.erreur || "Erreur lors du changement de statut";
			}
		} catch (e) {
			error.value = "Erreur lors du changement de statut";
		}
	};

	const changeUserRole = (user) => {
		selectedUser.value = user;
		newRole.value = user.role;
		showRoleModal.value = true;
	};

	const closeRoleModal = () => {
		showRoleModal.value = false;
		selectedUser.value = null;
		newRole.value = "";
	};

	const saveRoleChange = async () => {
		try {
			const res = await fetch(
				window.config.BACKEND_URL +
					`/api/admin/users/${selectedUser.value._id}/role`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ role: newRole.value }),
				}
			);

			if (res.ok) {
				const response = await res.json();
				success.value = true;
				successMessage.value = response.message;
				await fetchUsers();
				filterUsers();
				closeRoleModal();

				setTimeout(() => {
					success.value = false;
				}, 3000);
			} else {
				const errorData = await res.json();
				error.value = errorData.erreur || "Erreur lors du changement de rôle";
			}
		} catch (e) {
			error.value = "Erreur lors du changement de rôle";
		}
	};

	const deleteUser = async (user) => {
		try {
			// D'abord, récupérer la prévisualisation de suppression
			const previewRes = await fetch(
				window.config.BACKEND_URL +
					`/api/admin/users/${user._id}/deletion-preview`
			);

			if (!previewRes.ok) {
				const errorData = await previewRes.json();
				error.value =
					errorData.erreur || "Erreur lors de la récupération des informations";
				return;
			}

			const preview = await previewRes.json();

			// Construire le message d'avertissement détaillé
			let warningMessage = `⚠️ SUPPRESSION DÉFINITIVE ⚠️\n\n`;
			warningMessage += `Utilisateur: ${preview.user.name} (${preview.user.email})\n`;
			warningMessage += `Rôle: ${preview.user.role}\n\n`;
			warningMessage += `Cette action supprimera DÉFINITIVEMENT:\n`;

			if (preview.toDelete.gyms > 0) {
				warningMessage += `• ${preview.toDelete.gyms} salle(s) de sport\n`;
			}
			if (preview.toDelete.challenges > 0) {
				warningMessage += `• ${preview.toDelete.challenges} défi(s) créé(s)\n`;
			}
			if (preview.toDelete.notifications > 0) {
				warningMessage += `• ${preview.toDelete.notifications} notification(s)\n`;
			}
			if (preview.toDelete.leaderboardEntries > 0) {
				warningMessage += `• ${preview.toDelete.leaderboardEntries} entrée(s) de classement\n`;
			}
			if (preview.toDelete.friendRelations > 0) {
				warningMessage += `• ${preview.toDelete.friendRelations} relation(s) d'amitié\n`;
			}

			warningMessage += `\n⚠️ CETTE ACTION EST IRRÉVERSIBLE ⚠️\n\n`;
			warningMessage += `Êtes-vous absolument sûr(e) de vouloir continuer ?`;

			if (confirm(warningMessage)) {
				// Procéder à la suppression
				const res = await fetch(
					window.config.BACKEND_URL + `/api/admin/users/${user._id}`,
					{
						method: "DELETE",
					}
				);

				if (res.ok) {
					const result = await res.json();
					success.value = true;
					successMessage.value = result.message;
					await fetchUsers();
					filterUsers();

					setTimeout(() => {
						success.value = false;
					}, 5000);
				} else {
					const errorData = await res.json();
					error.value = errorData.erreur || "Erreur lors de la suppression";
				}
			}
		} catch (e) {
			error.value = "Erreur lors de la suppression: " + e.message;
		}
	};

	const recalculateScores = async () => {
		recalculating.value = true;
		recalcSuccess.value = false;
		recalcError.value = "";
		try {
			const res = await fetch(window.config.BACKEND_URL + "/api/admin/recalculate-scores", {
				method: "POST"
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.erreur || "Erreur lors du recalcul");
			}
			recalcSuccess.value = true;
			successMessage.value = "Scores recalculés avec succès !";
			await fetchUsers();
			filterUsers();
			setTimeout(() => { recalcSuccess.value = false; }, 3000);
		} catch (e) {
			recalcError.value = e.message;
			setTimeout(() => { recalcError.value = ""; }, 4000);
		} finally {
			recalculating.value = false;
		}
	};

	const getRoleLabel = (role) => {
		const labels = {
			client: "Client",
			owner: "Propriétaire",
			superadmin: "Super Admin",
		};
		return labels[role] || role;
	};

	const getRoleGradient = (role) => {
		const gradients = {
			client: "bg-gradient-to-r from-green-500 to-green-600",
			owner: "bg-gradient-to-r from-purple-500 to-purple-600",
			superadmin: "bg-gradient-to-r from-red-500 to-red-600",
		};
		return gradients[role] || "bg-gradient-to-r from-gray-500 to-gray-600";
	};

	const getRoleBadgeClass = (role) => {
		const classes = {
			client: "bg-green-100 text-green-700",
			owner: "bg-purple-100 text-purple-700",
			superadmin: "bg-red-100 text-red-700",
		};
		return classes[role] || "bg-gray-100 text-gray-700";
	};

	const formatDate = (dateString) => {
		if (!dateString) return "N/A";
		return new Date(dateString).toLocaleDateString("fr-FR");
	};

	
	onMounted(async () => {
		await fetchUsers();
	});
</script>

<template>
	<div
		class="min-h-screen bg-gradient-to-br from-green-50 via-white to-indigo-50 py-8"
	>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<!-- Header -->
			<div class="text-center mb-8">
				<h1 class="text-4xl font-bold text-gray-900 mb-2">
					Gestion des Utilisateurs
				</h1>
				<p class="text-lg text-gray-600">
					Administrez les comptes utilisateurs de la plateforme
				</p>
				<div class="mt-6 flex flex-col items-center gap-2">
					<button @click="recalculateScores" :disabled="recalculating" class="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
						<svg v-if="!recalculating" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.3-.42 2.5-1.13 3.47l1.46 1.46A7.963 7.963 0 0020 12c0-4.42-3.58-8-8-8zm-6.87.13L3.13 5.59A7.963 7.963 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6 0-1.3.42-2.5 1.13-3.47z"/></svg>
						<svg v-else class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
						<span>Recalculer tous les scores</span>
					</button>
					<div v-if="recalcSuccess" class="text-green-700 text-sm font-semibold mt-1">Scores recalculés avec succès !</div>
					<div v-if="recalcError" class="text-red-600 text-sm font-semibold mt-1">{{ recalcError }}</div>
				</div>
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

			<!-- Filtres -->
			<div
				class="bg-white shadow-lg rounded-2xl mb-8 p-6 border border-gray-200"
			>
				<div class="flex flex-wrap gap-4 items-center">
					<div class="flex-1 min-w-64">
						<label class="block text-sm font-medium text-gray-700 mb-2"
							>Filtrer par rôle</label
						>
						<select
							v-model="selectedRole"
							@change="filterUsers"
							class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Tous les rôles</option>
							<option value="client">Clients</option>
							<option value="owner">Propriétaires</option>
							<option value="superadmin">Super Admins</option>
						</select>
					</div>
					<div class="flex-1 min-w-64">
						<label class="block text-sm font-medium text-gray-700 mb-2"
							>Filtrer par statut</label
						>
						<select
							v-model="selectedStatus"
							@change="filterUsers"
							class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="">Tous les statuts</option>
							<option value="active">Actifs</option>
							<option value="inactive">Inactifs</option>
						</select>
					</div>
					<div class="flex-1 min-w-64">
						<label class="block text-sm font-medium text-gray-700 mb-2"
							>Rechercher</label
						>
						<input
							v-model="searchTerm"
							@input="filterUsers"
							type="text"
							placeholder="Nom, email..."
							class="w-full border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
			</div>

			<!-- Statistiques -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<div
					class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500"
				>
					<div class="flex items-center">
						<div
							class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"
						>
							<svg
								class="w-5 h-5 text-blue-600"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
								/>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">Total</p>
							<p class="text-2xl font-bold text-gray-900">{{ users.length }}</p>
						</div>
					</div>
				</div>
				<div
					class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500"
				>
					<div class="flex items-center">
						<div
							class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"
						>
							<svg
								class="w-5 h-5 text-green-600"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">Clients</p>
							<p class="text-2xl font-bold text-gray-900">
								{{ users.filter((u) => u.role === "client").length }}
							</p>
						</div>
					</div>
				</div>
				<div
					class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500"
				>
					<div class="flex items-center">
						<div
							class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"
						>
							<svg
								class="w-5 h-5 text-purple-600"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
								/>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">Propriétaires</p>
							<p class="text-2xl font-bold text-gray-900">
								{{ users.filter((u) => u.role === "owner").length }}
							</p>
						</div>
					</div>
				</div>
				<div
					class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500"
				>
					<div class="flex items-center">
						<div
							class="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"
						>
							<svg
								class="w-5 h-5 text-red-600"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"
								/>
							</svg>
						</div>
						<div class="ml-4">
							<p class="text-sm font-medium text-gray-500">Admins</p>
							<p class="text-2xl font-bold text-gray-900">
								{{ users.filter((u) => u.role === "superadmin").length }}
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Liste des utilisateurs -->
			<div
				class="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200"
			>
				<div class="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
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
									d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-6h2.5l6 6H4zm16.5-9.5L19 7l-3.5-1.5L14 9l1.5 3.5L19 14l1.5-3.5L22 9l-1.5-1.5z"
								/>
							</svg>
						</div>
						Utilisateurs ({{ filteredUsers.length }})
					</h2>
				</div>

				<div
					v-if="filteredUsers.length === 0"
					class="text-center text-gray-500 py-12"
				>
					<div
						class="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
					>
						<svg
							class="w-12 h-12 text-gray-400"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-6h2.5l6 6H4zm16.5-9.5L19 7l-3.5-1.5L14 9l1.5 3.5L19 14l1.5-3.5L22 9l-1.5-1.5z"
							/>
						</svg>
					</div>
					<p class="text-xl font-medium text-gray-600">
						Aucun utilisateur trouvé
					</p>
					<p class="text-gray-500 mt-2">
						Essayez de modifier vos filtres de recherche
					</p>
				</div>

				<div v-else class="p-6">
					<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
						<div
							v-for="user in filteredUsers"
							:key="user._id"
							class="group bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
						>
							<!-- Header de la carte utilisateur -->
							<div :class="['p-4 text-white', getRoleGradient(user.role)]">
								<div class="flex items-center justify-between">
									<div>
										<h4 class="text-lg font-bold">
											{{ user.firstname }} {{ user.lastname }}
										</h4>
										<p class="text-sm opacity-90">{{ user.email }}</p>
									</div>
									<div class="flex flex-col items-end gap-1">
										<span
											:class="[
												'px-2 py-1 rounded-full text-xs font-semibold',
												getRoleBadgeClass(user.role),
											]"
										>
											{{ getRoleLabel(user.role) }}
										</span>
										<span
											:class="[
												'px-2 py-1 rounded-full text-xs font-semibold',
												user.isActive
													? 'bg-green-100 text-green-700'
													: 'bg-red-100 text-red-700',
											]"
										>
											{{ user.isActive ? "Actif" : "Inactif" }}
										</span>
									</div>
								</div>
							</div>

							<!-- Corps de la carte -->
							<div class="p-4">
								<div class="space-y-2 mb-4">
									<div class="flex items-center text-sm text-gray-600">
										<svg
											class="w-4 h-4 mr-2"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
											/>
										</svg>
										Score: {{ user.score || 0 }}
									</div>
									<div class="flex items-center text-sm text-gray-600">
										<svg
											class="w-4 h-4 mr-2"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										Inscrit: {{ formatDate(user.createdAt) }}
									</div>
								</div>

								<!-- Actions -->
								<div class="flex gap-2">
									<button
										@click="toggleUserStatus(user)"
										:disabled="user.role === 'superadmin'"
										:class="[
											'flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center justify-center',
											user.isActive
												? 'bg-orange-600 text-white hover:bg-orange-700'
												: 'bg-green-600 text-white hover:bg-green-700',
											user.role === 'superadmin'
												? 'opacity-50 cursor-not-allowed'
												: '',
										]"
									>
										<svg
											class="w-4 h-4 mr-1"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												v-if="user.isActive"
												d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
											/>
											<path
												v-else
												d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
											/>
										</svg>
										{{ user.isActive ? "Désactiver" : "Activer" }}
									</button>
									<button
										@click="changeUserRole(user)"
										:disabled="user.role === 'superadmin'"
										:class="[
											'flex-1 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center justify-center',
											user.role === 'superadmin'
												? 'opacity-50 cursor-not-allowed'
												: '',
										]"
									>
										<svg
											class="w-4 h-4 mr-1"
											fill="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
											/>
										</svg>
										Rôle
									</button>
									<button
										@click="deleteUser(user)"
										:disabled="user.role === 'superadmin'"
										:class="[
											'flex-1 px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center justify-center',
											user.role === 'superadmin'
												? 'opacity-50 cursor-not-allowed'
												: '',
										]"
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

		<!-- Modal de changement de rôle -->
		<div
			v-if="showRoleModal"
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
		>
			<div
				class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in"
			>
				<h3 class="text-xl font-bold mb-4 text-gray-900">Modifier le rôle</h3>
				<div class="mb-4">
					<p class="text-gray-600 mb-2">
						Utilisateur:
						<strong
							>{{ selectedUser?.firstname }}
							{{ selectedUser?.lastname }}</strong
						>
					</p>
					<p class="text-gray-600 mb-4">
						Rôle actuel: <strong>{{ getRoleLabel(selectedUser?.role) }}</strong>
					</p>
				</div>
				<div class="mb-6">
					<label class="block text-sm font-medium text-gray-700 mb-2"
						>Nouveau rôle</label
					>
					<select
						v-model="newRole"
						class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="client">Client</option>
						<option value="owner">Propriétaire</option>
						<option value="superadmin">Super Admin</option>
					</select>
				</div>
				<div class="flex justify-end gap-2">
					<button
						@click="closeRoleModal"
						class="px-4 py-2 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50"
					>
						Annuler
					</button>
					<button
						@click="saveRoleChange"
						class="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
					>
						Confirmer
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
	/* Animations */
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

	/* Hover effects */
	.group:hover {
		transform: translateY(-2px);
	}

	button {
		transition: all 0.2s ease;
	}

	button:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	input:focus,
	select:focus {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
	}
</style>
