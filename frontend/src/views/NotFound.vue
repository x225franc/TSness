<template>
    <div class="not-found d-flex flex-column justify-content-center align-items-center min-vh-100 bg-white text-dark px-4">
        <div class="bg-primary rounded-4 shadow-lg p-5 d-flex flex-column align-items-center w-100" style="max-width: 32rem;">
            <h1 class="display-1 fw-bold mb-3 text-white">404</h1>
            <h2 class="h4 fw-bold mb-3 text-white">Page non trouvée</h2>
            <p class="mb-4 fs-5 text-white text-center">
                Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
            </p>
            <router-link
                to="/"
                class="btn btn-light fw-semibold px-4 py-2 shadow"
            >
                Retour à l'accueil
            </router-link>
        </div>
    </div>
</template>

<script>
export default {
    name: "NotFound",
};
</script>

<style scoped>
.not-found {
    min-height: 100vh;
}
</style>
