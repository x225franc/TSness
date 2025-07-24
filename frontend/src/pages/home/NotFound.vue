<template>
	<div
		class="flex flex-col items-center justify-center min-h-screen bg-white px-4 text-gray-800"
	>
		<div
			class="w-full max-w-md bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl p-8 flex flex-col items-center text-white"
		>
			<h1 class="text-7xl font-extrabold mb-2">404</h1>
			<h2 class="text-2xl font-semibold mb-3">Page non trouvée</h2>
			<p class="text-center text-lg mb-6">
				Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
			</p>
			<router-link
				to="/"
				class="bg-white text-blue-700 hover:text-white hover:bg-blue-800 transition-colors font-semibold px-6 py-2 rounded-full shadow-md"
			>
				Retour à l'accueil
			</router-link>
		</div>
	</div>
</template>
