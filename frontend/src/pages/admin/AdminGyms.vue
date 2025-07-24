<script setup>
	import { ref, onMounted } from "vue";

	const gyms = ref([]);
	const owners = ref([]);
	const exerciseTypes = ref([]);
	const form = ref({
		_id: null,
		name: "",
		capacity: "",
		equipments: "",
		activities: "",
		address: "",
		contact: "",
		description: "",
		ownerId: "",
		exerciseTypeId: "",
		difficulty: "",
	});
	const showTypeForm = ref(false);
	const typeForm = ref({
		_id: "",
		name: "",
		description: "",
		targetedMuscles: "",
	});
	const assignStatus = ref({});
	const showAssignModal = ref(false);
	const assignModalGym = ref(null);
	const assignModalForm = ref({
		ownerId: "",
		exerciseTypeId: "",
		difficulty: "",
	});

	const fetchGyms = async () => {
		const res = await fetch(window.config.BACKEND_URL + "/api/gyms");
		gyms.value = await res.json();
	};

	const fetchOwners = async () => {
		const res = await fetch(window.config.BACKEND_URL + "/api/user/owners");
		owners.value = await res.json();
	};

	const fetchExerciseTypes = async () => {
		const res = await fetch(window.config.BACKEND_URL + "/api/exercisetypes");
		exerciseTypes.value = await res.json();
	};
	const onSubmit = async () => {
		const payload = {
			name: form.value.name,
			capacity: form.value.capacity,
			equipments: form.value.equipments
				.split(",")
				.map((e) => e.trim())
				.filter(Boolean),
			activities: form.value.activities
				.split(",")
				.map((a) => a.trim())
				.filter(Boolean),
			address: form.value.address,
			contact: form.value.contact,
			description: form.value.description,
		};

		if (
			form.value.ownerId &&
			owners.value.find((o) => o._id === form.value.ownerId)
		) {
			payload.ownerId = form.value.ownerId;
		}
		if (form.value.exerciseTypeId) {
			payload.exerciseTypeId = form.value.exerciseTypeId;
		}
		if (form.value.difficulty) {
			payload.difficulty = form.value.difficulty;
		}

		const unset = {};
		if (!form.value.ownerId) unset.ownerId = "";
		if (!form.value.exerciseTypeId) unset.exerciseTypeId = "";
		if (!form.value.difficulty) unset.difficulty = "";

		const finalPayload = Object.keys(unset).length
			? { ...payload, $unset: unset }
			: payload;

		if (form.value._id) {
			await fetch(window.config.BACKEND_URL + `/api/gyms/${form.value._id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(finalPayload),
			});
		} else {
			await fetch(window.config.BACKEND_URL + "/api/gyms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
		}
		resetForm();
		fetchGyms();
	};
	const editGym = (gym) => {
		form.value = {
			_id: gym._id,
			name: gym.name,
			capacity: gym.capacity,
			equipments: gym.equipments?.join(", ") || "",
			activities: gym.activities?.join(", ") || "",
			address: gym.address,
			contact: gym.contact,
			description: gym.description,
			ownerId:
				gym.ownerId && owners.value.some((o) => o._id === gym.ownerId)
					? gym.ownerId
					: "",
			exerciseTypeId: gym.exerciseTypeId || "",
			difficulty: gym.difficulty || "",
		};

		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	const deleteGym = async (gym) => {
		if (confirm("Supprimer cette salle ?")) {
			await fetch(window.config.BACKEND_URL + `/api/gyms/${gym._id}`, {
				method: "DELETE",
			});
			fetchGyms();
		}
	};

	const approveGym = async (gym) => {
		await fetch(window.config.BACKEND_URL + `/api/gyms/${gym._id}/approve`, {
			method: "PATCH",
		});
		fetchGyms();
	};

	const resetForm = () => {
		form.value = {
			_id: null,
			name: "",
			capacity: "",
			equipments: "",
			activities: "",
			address: "",
			contact: "",
			description: "",
			ownerId: "",
			exerciseTypeId: "",
			difficulty: "",
		};
	};
	const onTypeSubmit = async () => {
		const targetedMusclesArray = typeForm.value.targetedMuscles
			.split(",")
			.map((muscle) => muscle.trim())
			.filter(Boolean);

		if (typeForm.value._id) {
			await fetch(
				window.config.BACKEND_URL + `/api/exercisetypes/${typeForm.value._id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: typeForm.value.name,
						description: typeForm.value.description,
						targetedMuscles: targetedMusclesArray,
					}),
				}
			);
		} else {
			await fetch(window.config.BACKEND_URL + "/api/exercisetypes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: typeForm.value.name,
					description: typeForm.value.description,
					targetedMuscles: targetedMusclesArray,
				}),
			});
		}

		typeForm.value = {
			_id: "",
			name: "",
			description: "",
			targetedMuscles: "",
		};
		showTypeForm.value = false;
		fetchExerciseTypes();
	};
	const editType = (type) => {
		typeForm.value = {
			_id: type._id,
			name: type.name,
			description: type.description || "",
			targetedMuscles: (type.targetedMuscles || []).join(", "),
		};
		showTypeForm.value = true;
	};
	const deleteType = async (type) => {
		const linkedGyms = gyms.value.filter(
			(gym) => gym.exerciseTypeId === type._id
		);

		if (linkedGyms.length > 0) {
			const gymNames = linkedGyms.map((gym) => gym.name).join(", ");
			alert(
				`Impossible de supprimer ce type d'exercice.\n\nIl est actuellement assigné à ${linkedGyms.length} salle(s) :\n${gymNames}\n\nVeuillez d'abord désassigner ce type des salles concernées.`
			);
			return;
		}

		if (confirm("Supprimer ce type d'exercice ?")) {
			try {
				const res = await fetch(
					window.config.BACKEND_URL + `/api/exercisetypes/${type._id}`,
					{ method: "DELETE" }
				);

				if (res.ok) {
					fetchExerciseTypes();
				} else {
					const error = await res.json();
					alert(
						`Erreur lors de la suppression : ${
							error.erreur || "Erreur inconnue"
						}`
					);
				}
			} catch (error) {
				alert(`Erreur lors de la suppression : ${error.message}`);
			}
		}
	};
	const assignTypeDifficulty = async (gym) => {
		const payload = {
			exerciseTypeId: gym._assignExerciseTypeId || gym.exerciseTypeId || "",
			difficulty: gym._assignDifficulty || gym.difficulty || "",
		};

		try {
			const res = await fetch(
				window.config.BACKEND_URL + `/api/gyms/${gym._id}/assign`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				}
			);
			if (res.ok) {
				assignStatus.value = { ...assignStatus.value, [gym._id]: "success" };
				fetchGyms();
			} else {
				assignStatus.value = { ...assignStatus.value, [gym._id]: "error" };
			}
		} catch (e) {
			assignStatus.value = { ...assignStatus.value, [gym._id]: "error" };
		}

		setTimeout(() => {
			assignStatus.value = { ...assignStatus.value, [gym._id]: null };
		}, 2000);
	};
	const openAssignModal = (gym) => {
		assignModalGym.value = gym;
		let ownerId = gym.ownerId;
		if (!ownerId || !owners.value.some((o) => o._id === ownerId)) ownerId = "";
		assignModalForm.value = {
			ownerId,
			exerciseTypeId: gym.exerciseTypeId || "",
			difficulty: gym.difficulty || "",
		};
		showAssignModal.value = true;
	};

	const saveAssignModal = async () => {
		if (!assignModalGym.value) return;
		const payload = {};
		if (
			assignModalForm.value.ownerId &&
			owners.value.find((o) => o._id === assignModalForm.value.ownerId)
		) {
			payload.ownerId = assignModalForm.value.ownerId;
		}
		if (assignModalForm.value.exerciseTypeId) {
			payload.exerciseTypeId = assignModalForm.value.exerciseTypeId;
		}
		if (assignModalForm.value.difficulty) {
			payload.difficulty = assignModalForm.value.difficulty;
		}
		const unset = {};
		if (!assignModalForm.value.ownerId) unset.ownerId = "";
		if (!assignModalForm.value.exerciseTypeId) unset.exerciseTypeId = "";
		if (!assignModalForm.value.difficulty) unset.difficulty = "";
		const finalPayload = Object.keys(unset).length
			? { ...payload, $unset: unset }
			: payload;
		try {
			const res = await fetch(
				window.config.BACKEND_URL +
					`/api/gyms/${assignModalGym.value._id}/assign`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(finalPayload),
				}
			);
			if (res.ok) {
				assignStatus.value = {
					...assignStatus.value,
					[assignModalGym.value._id]: "success",
				};
				showAssignModal.value = false;
				assignModalGym.value = null;
				assignModalForm.value = {
					ownerId: "",
					exerciseTypeId: "",
					difficulty: "",
				};
				await fetchGyms();
			} else {
				assignStatus.value = {
					...assignStatus.value,
					[assignModalGym.value._id]: "error",
				};
			}
		} catch (e) {
			assignStatus.value = {
				...assignStatus.value,
				[assignModalGym.value._id]: "error",
			};
		}
		setTimeout(() => {
			if (assignModalGym.value && assignModalGym.value._id) {
				assignStatus.value = {
					...assignStatus.value,
					[assignModalGym.value._id]: null,
				};
			}
		}, 2000);
	};

	const closeAssignModal = () => {
		showAssignModal.value = false;
	};

	onMounted(() => {
		fetchGyms();
		fetchOwners();
		fetchExerciseTypes();
		setTimeout(() => {
			gyms.value.forEach((gym) => {
				gym._assignExerciseTypeId = gym.exerciseTypeId || "";
				gym._assignDifficulty = gym.difficulty || "";
			});
		}, 500);
	});
</script>

<template>
	<div
		class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8"
	>
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="text-center mb-8">
				<h1 class="text-4xl font-bold text-gray-900 mb-2">
					Gestion des Salles
				</h1>
				<p class="text-lg text-gray-600">
					Gérez vos salles de sport et types d'exercices
				</p>
			</div>

			<div
				class="bg-white shadow-2xl rounded-3xl mb-12 overflow-hidden border border-gray-200"
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
								<path d="M13 10h7v2h-7v7h-2v-7H4v-2h7V3h2v7z" />
							</svg>
						</div>
						{{ form._id ? "Modifier la salle" : "Ajouter une nouvelle salle" }}
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
									Nom de la salle
								</label>
								<input
									v-model="form.name"
									type="text"
									required
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
									placeholder="Ex: Fitness Club Premium"
								/>
							</div>
							<div>
								<label class="block text-sm font-semibold text-gray-700 mb-2">
									<svg
										class="inline w-4 h-4 mr-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2z"
										/>
									</svg>
									Capacité
								</label>
								<input
									v-model.number="form.capacity"
									type="number"
									required
									min="1"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
									placeholder="50"
								/>
							</div>
							<div>
								<label class="block text-sm font-semibold text-gray-700 mb-2">
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
									v-model="form.equipments"
									type="text"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
									placeholder="Haltères, Tapis, Vélos..."
								/>
							</div>
							<div>
								<label class="block text-sm font-semibold text-gray-700 mb-2">
									<svg
										class="inline w-4 h-4 mr-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"
										/>
									</svg>
									Activités
								</label>
								<input
									v-model="form.activities"
									type="text"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
									placeholder="Cardio, Yoga, Musculation..."
								/>
							</div>
						</div>

						<div class="grid grid-cols-1">
							<div>
								<label class="block text-sm font-semibold text-gray-700 mb-2">
									<svg
										class="inline w-4 h-4 mr-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
										/>
									</svg>
									Adresse
								</label>
								<input
									v-model="form.address"
									type="text"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
									placeholder="123 Rue du Sport, 75001 Paris"
								/>
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div>
								<label class="block text-sm font-semibold text-gray-700 mb-2">
									<svg
										class="inline w-4 h-4 mr-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
										/>
									</svg>
									Contact
								</label>
								<input
									v-model="form.contact"
									type="text"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
									placeholder="contact@gym.com"
								/>
							</div>
							<div>
								<label class="block text-sm font-semibold text-gray-700 mb-2">
									<svg
										class="inline w-4 h-4 mr-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9Z"
										/>
									</svg>
									Responsable de salle
								</label>
								<select
									v-model="form.ownerId"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
								>
									<option value="">Aucun responsable</option>
									<option
										v-for="owner in owners"
										:key="owner._id"
										:value="owner._id"
									>
										{{ owner.firstname }} {{ owner.lastname }} ({{
											owner.email
										}})
									</option>
								</select>
							</div>
							<div>
								<label class="block text-sm font-semibold text-gray-700 mb-2">
									<svg
										class="inline w-4 h-4 mr-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l-2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"
										/>
									</svg>
									Type d'exercice
								</label>
								<select
									v-model="form.exerciseTypeId"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

						<div class="grid grid-cols-1">
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
									Niveau de difficulté
								</label>
								<select
									v-model="form.difficulty"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
								>
									<option value="">Aucun niveau spécifique</option>
									<option value="facile">🟢 Facile</option>
									<option value="intermédiaire">🟡 Intermédiaire</option>
									<option value="difficile">🔴 Difficile</option>
								</select>
							</div>
						</div>

						<div class="grid grid-cols-1">
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
									Description
								</label>
								<textarea
									v-model="form.description"
									rows="3"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
									placeholder="Décrivez l'ambiance, les spécialités, les horaires..."
								></textarea>
							</div>
						</div>

						<div class="flex justify-end pt-4">
							<button
								type="button"
								@click="resetForm"
								class="mr-4 bg-gray-200 text-gray-700 font-semibold px-8 py-3 rounded-xl shadow hover:bg-gray-300 transition-all duration-200 transform hover:scale-105"
							>
								<svg
									class="inline w-5 h-5 mr-2"
									fill="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M19 7v4H5V7H3v10h2v-4h14v4h2V7h-2zm-2 6H7v2h10v-2z"
									/>
								</svg>
								Réinitialiser
							</button>
							<button
								type="submit"
								class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
								{{ form._id ? "Modifier la salle" : "Ajouter la salle" }}
							</button>
						</div>
					</form>
				</div>
			</div>
			<div
				class="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200 mb-12"
			>
				<div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
					<h3 class="text-2xl font-bold text-white flex items-center gap-3">
						<div
							class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
						>
							<svg
								class="w-6 h-6 text-white"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
								/>
							</svg>
						</div>
						Salles enregistrées ({{ gyms.length }})
					</h3>
				</div>
				<div v-if="gyms.length === 0" class="text-center text-gray-500 py-12">
					<div
						class="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center"
					>
						<svg
							class="w-12 h-12 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10"
							/>
						</svg>
					</div>
					<p class="text-xl font-medium text-gray-600">
						Aucune salle enregistrée
					</p>
					<p class="text-gray-500 mt-2">
						Commencez par ajouter votre première salle de sport
					</p>
				</div>

				<div v-else class="p-6">
					<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
						<div
							v-for="gym in gyms"
							:key="gym._id"
							class="group bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
						>
							<div
								class="relative bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white"
							>
								<div class="flex items-start justify-between">
									<div class="flex-1 min-w-0">
										<h3 class="text-xl font-bold text-white truncate mb-2">
											{{ gym.name }}
										</h3>
										<div
											v-if="gym.address"
											class="flex items-center text-blue-100 text-sm"
										>
											<svg
												class="w-4 h-4 mr-1 flex-shrink-0"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
												/>
											</svg>
											<span class="truncate">{{ gym.address }}</span>
										</div>
									</div>
									<div class="flex flex-col items-end gap-2 ml-4">
										<span
											v-if="gym.isApproved"
											class="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg"
										>
											<svg
												class="w-3 h-3 mr-1"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.2z"
												/>
											</svg>
											Approuvée
										</span>
										<span
											v-else
											class="inline-flex items-center px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-bold shadow-lg animate-pulse"
										>
											<svg
												class="w-3 h-3 mr-1"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
												/>
											</svg>
											En attente
										</span>
									</div>
								</div>
							</div>

							<div class="p-6 space-y-4">
								<div class="grid grid-cols-2 gap-4">
									<div class="flex items-center space-x-2">
										<div
											class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"
										>
											<svg
												class="w-5 h-5 text-blue-600"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-6h2.5l6 6H4zm16.5-9.5L19 7l-3.5-1.5L14 9l1.5 3.5L19 14l1.5-3.5L22 9l-1.5-1.5z"
												/>
											</svg>
										</div>
										<div>
											<p class="text-xs text-gray-500">Capacité</p>
											<p class="font-bold text-gray-900">
												{{ gym.capacity }} pers.
											</p>
										</div>
									</div>
									<div class="flex items-center space-x-2">
										<div
											class="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"
										>
											<svg
												class="w-5 h-5 text-indigo-600"
												fill="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
												/>
											</svg>
										</div>
										<div>
											<p class="text-xs text-gray-500">Propriétaire</p>
											<p class="font-bold text-gray-900 text-sm">
												<span
													v-if="
														gym.ownerId &&
														owners.find((o) => o._id === gym.ownerId)
													"
												>
													{{
														owners.find((o) => o._id === gym.ownerId).firstname
													}}
													{{
														owners.find((o) => o._id === gym.ownerId).lastname
													}}
												</span>
												<span v-else class="text-gray-400 italic">Aucun</span>
											</p>
										</div>
									</div>
								</div>

								<div>
									<p class="text-xs text-gray-500 mb-2 font-medium">
										Équipements
									</p>
									<div class="flex flex-wrap gap-1">
										<span
											v-if="gym.equipments && gym.equipments.length"
											v-for="equipment in gym.equipments.slice(0, 3)"
											:key="equipment"
											class="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs"
										>
											{{ equipment }}
										</span>
										<span
											v-if="gym.equipments && gym.equipments.length > 3"
											class="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-600 rounded-lg text-xs font-medium"
										>
											+{{ gym.equipments.length - 3 }}
										</span>
										<span
											v-if="!gym.equipments || !gym.equipments.length"
											class="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-xs"
										>
											Aucun équipement
										</span>
									</div>
								</div>

								<div>
									<p class="text-xs text-gray-500 mb-2 font-medium">
										Activités
									</p>
									<div class="flex flex-wrap gap-1">
										<span
											v-if="gym.activities && gym.activities.length"
											v-for="activity in gym.activities.slice(0, 3)"
											:key="activity"
											class="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs"
										>
											{{ activity }}
										</span>
										<span
											v-if="gym.activities && gym.activities.length > 3"
											class="inline-flex items-center px-2 py-1 bg-indigo-200 text-indigo-600 rounded-lg text-xs font-medium"
										>
											+{{ gym.activities.length - 3 }}
										</span>
										<span
											v-if="!gym.activities || !gym.activities.length"
											class="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-400 rounded-lg text-xs"
										>
											Aucune activité
										</span>
									</div>
								</div>

								<div
									class="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100"
								>
									<div>
										<p class="text-xs text-gray-500 mb-1">Type d'exercice</p>
										<p class="text-sm font-medium text-gray-900">
											{{
												gym.exerciseTypeId &&
												exerciseTypes.find((t) => t._id === gym.exerciseTypeId)
													? exerciseTypes.find(
															(t) => t._id === gym.exerciseTypeId
													  ).name
													: "Aucun"
											}}
										</p>
									</div>
									<div>
										<p class="text-xs text-gray-500 mb-1">Difficulté</p>
										<span
											v-if="gym.difficulty"
											:class="{
												'bg-green-100 text-green-800':
													gym.difficulty === 'facile',
												'bg-yellow-100 text-yellow-800':
													gym.difficulty === 'intermédiaire',
												'bg-red-100 text-red-800':
													gym.difficulty === 'difficile',
											}"
											class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize"
										>
											<span v-if="gym.difficulty === 'facile'">🟢</span>
											<span v-else-if="gym.difficulty === 'intermédiaire'"
												>🟡</span
											>
											<span v-else-if="gym.difficulty === 'difficile'">🔴</span>
											{{ gym.difficulty }}
										</span>
										<span
											v-else
											class="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs"
										>
											Aucune
										</span>
									</div>
								</div>
							</div>

							<div class="px-6 pb-6 flex flex-wrap gap-2">
								<button
									v-if="!gym.isApproved"
									@click="approveGym(gym)"
									class="flex-1 min-w-0 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center justify-center"
								>
									<svg
										class="w-4 h-4 mr-1"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.2z"
										/>
									</svg>
									Approuver
								</button>
								<button
									v-if="gym.isApproved"
									@click="openAssignModal(gym)"
									class="flex-1 min-w-0 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center justify-center"
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
									Attribuer
								</button>
								<button
									@click="editGym(gym)"
									class="flex-1 min-w-0 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center justify-center"
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
									@click="deleteGym(gym)"
									class="flex-1 min-w-0 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center justify-center"
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

							<div v-if="assignStatus[gym._id]" class="px-6 pb-4">
								<div
									v-if="assignStatus[gym._id] === 'success'"
									class="flex items-center text-green-600 text-sm bg-green-50 rounded-lg p-3"
								>
									<svg
										class="w-4 h-4 mr-2"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
										/>
									</svg>
									Attribution réussie !
								</div>
								<div
									v-if="assignStatus[gym._id] === 'error'"
									class="flex items-center text-red-600 text-sm bg-red-50 rounded-lg p-3"
								>
									<svg
										class="w-4 h-4 mr-2"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
										/>
									</svg>
									Erreur lors de l'attribution
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div
				class="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200"
			>
				<div
					class="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 flex items-center justify-between"
				>
					<div class="flex items-center gap-3">
						<div
							class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
						>
							<svg
								class="w-6 h-6 text-white"
								fill="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6h6v-2h-4z"
								/>
							</svg>
						</div>
						<h3 class="text-2xl font-bold text-white">
							Types d'exercices ({{ exerciseTypes.length }})
						</h3>
					</div>
					<button
						@click="showTypeForm = !showTypeForm"
						class="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-200 backdrop-blur-sm"
					>
						{{ showTypeForm ? "Fermer" : "➕ Ajouter un type" }}
					</button>
				</div>

				<div
					v-if="showTypeForm"
					class="p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white"
				>
					<form @submit.prevent="onTypeSubmit" class="space-y-6">
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
									Nom du type d'exercice
								</label>
								<input
									v-model="typeForm.name"
									type="text"
									required
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
									placeholder="Ex: Cardio, Musculation, Yoga..."
								/>
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
									Description
								</label>
								<input
									v-model="typeForm.description"
									type="text"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
									placeholder="Description détaillée (optionnel)"
								/>
							</div>
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
									Muscles ciblés
								</label>
								<input
									v-model="typeForm.targetedMuscles"
									type="text"
									class="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
									placeholder="Ex: Pectoraux, Biceps, Quadriceps (séparés par des virgules)"
								/>
								<p class="text-xs text-gray-500 mt-1">
									Séparez les muscles par des virgules
								</p>
							</div>
						</div>
						<div class="flex justify-end">
							<button
								type="submit"
								class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
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
								{{ typeForm._id ? "Modifier le type" : "Ajouter le type" }}
							</button>
						</div>
					</form>
				</div>

				<div class="block md:hidden p-4 space-y-6">
					<div
						v-for="type in exerciseTypes"
						:key="type._id"
						class="rounded-2xl border border-gray-200 shadow p-4 bg-white flex flex-col gap-2"
					>
						<div class="flex items-center justify-between">
							<div class="font-bold text-lg text-gray-900">{{ type.name }}</div>
							<div class="flex gap-2">
								<button
									@click="editType(type)"
									class="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
								>
									✏️
								</button>
								<button
									@click="deleteType(type)"
									class="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
								>
									🗑️
								</button>
							</div>
						</div>
						<div class="text-xs text-gray-500" v-if="type.description">
							{{ type.description }}
						</div>
						<div class="text-xs text-gray-400 italic" v-else>
							Aucune description
						</div>
						<div
							v-if="type.targetedMuscles && type.targetedMuscles.length > 0"
							class="mt-2"
						>
							<div class="text-xs font-semibold text-gray-600 mb-1">
								Muscles ciblés :
							</div>
							<div class="flex flex-wrap gap-1">
								<span
									v-for="muscle in type.targetedMuscles"
									:key="muscle"
									class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
								>
									{{ muscle }}
								</span>
							</div>
						</div>
					</div>
					<div
						v-if="exerciseTypes.length === 0"
						class="text-center text-gray-500 py-8"
					>
						Aucun type d'exercice
					</div>
				</div>

				<div
					v-if="exerciseTypes.length === 0"
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
								d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6h6v-2h-4z"
							/>
						</svg>
					</div>
					<p class="text-xl font-medium text-gray-600">Aucun type d'exercice</p>
					<p class="text-gray-500 mt-2">
						Ajoutez des types d'exercices pour organiser vos salles
					</p>
				</div>

				<div v-else class="p-6">
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						<div
							v-for="type in exerciseTypes"
							:key="type._id"
							class="group bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
						>
							<div
								class="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white"
							>
								<h4 class="text-lg font-bold truncate">{{ type.name }}</h4>
							</div>

							<div class="p-4">
								<p v-if="type.description" class="text-gray-600 text-sm mb-3">
									{{ type.description }}
								</p>
								<p v-else class="text-gray-400 text-sm italic mb-3">
									Aucune description
								</p>

								<div
									v-if="type.targetedMuscles && type.targetedMuscles.length > 0"
									class="mb-4"
								>
									<h5 class="text-xs font-semibold text-gray-600 mb-2">
										Muscles ciblés :
									</h5>
									<div class="flex flex-wrap gap-1">
										<span
											v-for="muscle in type.targetedMuscles"
											:key="muscle"
											class="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
										>
											{{ muscle }}
										</span>
									</div>
								</div>

								<div class="flex gap-2">
									<button
										@click="editType(type)"
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
										@click="deleteType(type)"
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

	<div
		v-if="showAssignModal"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
	>
		<div
			class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in"
		>
			<h3 class="text-xl font-bold mb-4 text-gray-900">
				Modifier l'attribution
			</h3>
			<form @submit.prevent="saveAssignModal" class="space-y-4">
				<div>
					<label class="block text-sm font-semibold mb-1">Propriétaire</label>
					<select
						v-model="assignModalForm.ownerId"
						class="w-full border border-gray-300 rounded-xl px-4 py-3"
					>
						<option value="">Aucun</option>
						<option v-for="owner in owners" :key="owner._id" :value="owner._id">
							{{ owner.firstname }} {{ owner.lastname }} ({{ owner.email }})
						</option>
					</select>
				</div>
				<div>
					<label class="block text-sm font-semibold mb-1"
						>Type d'exercice</label
					>
					<select
						v-model="assignModalForm.exerciseTypeId"
						class="w-full border border-gray-300 rounded-xl px-4 py-3"
					>
						<option value="">Aucun type</option>
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
					<label class="block text-sm font-semibold mb-1">Difficulté</label>
					<select
						v-model="assignModalForm.difficulty"
						class="w-full border border-gray-300 rounded-xl px-4 py-3"
					>
						<option value="">Aucune difficulté</option>
						<option value="facile">🟢 Facile</option>
						<option value="intermédiaire">🟡 Intermédiaire</option>
						<option value="difficile">🔴 Difficile</option>
					</select>
				</div>
				<div class="flex justify-end gap-2 pt-4">
					<button
						type="button"
						@click="closeAssignModal"
						class="px-6 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
					>
						Annuler
					</button>
					<button
						type="submit"
						class="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow hover:from-indigo-700 hover:to-blue-700 transition"
					>
						Enregistrer
					</button>
				</div>
			</form>
		</div>
	</div>
</template>

<style scoped>
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

	.group:hover {
		transform: translateY(-4px);
	}

	button,
	.group,
	input,
	textarea,
	select {
		transition: all 0.3s ease;
	}

	input:focus,
	textarea:focus,
	select:focus {
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
		transform: translateY(-1px);
	}

	button:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
	}

	button:active {
		transform: translateY(0);
	}

	.modal-enter-active {
		transition: all 0.3s ease;
	}
	.modal-leave-active {
		transition: all 0.5s ease;
	}
	.modal-enter-from {
		opacity: 0;
		transform: scale(0.9);
	}
	.modal-leave-to {
		opacity: 0;
		transform: scale(1.1);
	}

	@media (max-width: 768px) {
		.grid {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.group {
			margin-bottom: 1rem;
		}

		.flex {
			flex-direction: column;
		}

		.flex button {
			margin-bottom: 0.5rem;
		}
	}

	.status-badge {
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.8;
		}
	}

	.shadow-card {
		box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
		transition: box-shadow 0.3s ease;
	}

	.shadow-card:hover {
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}

	.gradient-border {
		background: linear-gradient(white, white) padding-box,
			linear-gradient(45deg, #667eea, #764ba2) border-box;
		border: 2px solid transparent;
	}

	.loading-spinner {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.notification {
		animation: slideInFromTop 0.4s ease-out;
	}

	@keyframes slideInFromTop {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.container {
		max-width: 100%;
		overflow-x: hidden;
	}

	@media (max-width: 640px) {
		.table-container {
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
		}

		table {
			min-width: 600px;
		}
	}
</style>
