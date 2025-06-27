<script setup>
	import Header from "@/components/Header.vue";
	import { RouterLink, RouterView, useRoute } from "vue-router";
	import { watch } from "vue";

	const route = useRoute();
	const updatePageTitle = () => {
		const title = route.meta.title || "TSness";
		document.title = title + " | TSness";
	};
	updatePageTitle();
	watch(() => route.meta.title, updatePageTitle);
</script>

<template>
	<div>
		<Header v-if="route.meta.showheader !== false" />
		<RouterView />
	</div>
</template>

<style scoped></style>
