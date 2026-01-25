<template>
  <div class="min-h-screen bg-gradient-to-b from-emerald-50 to-white text-neutral-900">
    <header class="relative overflow-hidden sm:block bg-white">
      <div class="relative sm:absolute inset-0 bg-emerald-500/10" />
      <div class="relative mx-auto flex max-w-full sm:max-w-6xl flex-col gap-8 sm:gap-12 px-4 py-16 sm:py-16 lg:py-16 md:flex-row md:items-center md:py-16-3">
        <div class="md:w-1/2">
          <span class="inline-flex items-center rounded-full bg-emerald-100 px-3 py-3 text-sm font-medium text-emerald-700">
            🌍 Anti-gaspillage alimentaire
          </span>
          <h1 class="mt-6 text-3xl font-semibold leading-relaxed md:text-3xl">
            Réinventons la lutte contre le gaspillage avec une expérience inspirée de Gaspiz
          </h1>
          <p class="mt-4 text-lg text-neutral-600">
            Découvrez des paniers surprises, soutenez les commerces locaux et faites un geste pour la planète. Une navigation fluide, un design soigné et une mission responsable.
          </p>
          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <router-link
              to="/products"
              class="inline-flex items-center justify-center rounded bg-emerald-500 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600"
            >
              Explorer les offres
            </router-link>
            <router-link
              to="/onboarding"
              class="inline-flex items-center justify-center rounded border border-emerald-200 px-4 py-3 text-base font-semibold text-primary-600 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              Commencer l'expérience
            </router-link>
          </div>
        </div>
        <div class="md:w-1/2">
          <div class="relative mx-auto max-w-xl rounded bg-white p-6 shadow-80">
            <div class="flex items-center gap-3">
              <div class="h-6 w-6 rounded-full bg-emerald-100" />
              <div>
                <p class="text-sm font-semibold text-neutral-700">Boulangerie du Marché</p>
                <p class="text-xs text-neutral-500">Panier surprise du soir</p>
              </div>
              <span class="ml-auto rounded-full bg-emerald-100 px-3 py-3 text-xs font-semibold text-emerald-700">-65%</span>
            </div>
            <ul class="mt-6 space-y-4 text-sm text-neutral-600">
              <li class="flex items-center justify-start sm:justify-between rounded bg-neutral-50 p-3">
                <span>Boulangerie artisanale</span>
                <span class="font-semibold text-primary-600">3213 XOF</span>
              </li>
              <li class="flex items-center justify-start sm:justify-between rounded bg-neutral-50 p-3">
                <span>Supérette bio locale</span>
                <span class="font-semibold text-primary-600">3606 XOF</span>
              </li>
              <li class="flex items-center justify-start sm:justify-between rounded bg-neutral-50 p-3">
                <span>Restaurant végétarien</span>
                <span class="font-semibold text-primary-600">4065 XOF</span>
              </li>
            </ul>
            <button class="mt-6 w-full rounded bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600">
              Réserver un panier
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-full sm:max-w-6xl px-4 py-16 sm:py-16 lg:py-16">
      <section>
        <h2 class="text-xl font-semibold text-neutral-900">Pourquoi nos utilisateurs adorent</h2>
        <p class="mt-2 text-neutral-600">
          Une interface pensée pour inspirer confiance, guider rapidement vers les meilleures offres et mettre en avant l'impact positif de chaque réservation.
        </p>
        <div class="spacing-xs0 grid gap-3 sm:gap-6 md:grid-cols-3">
          <article class="rounded border border-neutral-100 bg-white p-6 shadow-sm">
            <div class="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-primary-600">1</div>
            <h3 class="mt-4 text-lg font-semibold">Découverte en un clin d'œil</h3>
            <p class="mt-2 text-sm text-neutral-600">
              Une carte intuitive, des filtres efficaces et des recommandations personnalisées pour trouver les meilleurs paniers près de chez vous.
            </p>
          </article>
          <article class="rounded border border-neutral-100 bg-white p-6 shadow-sm">
            <div class="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-primary-600">2</div>
            <h3 class="mt-4 text-lg font-semibold">Expérience fluide</h3>
            <p class="mt-2 text-sm text-neutral-600">
              Un parcours d'achat simplifié, inspiré des meilleurs standards UX, pour réserver en quelques clics et gérer ses paniers facilement.
            </p>
          </article>
          <article class="rounded border border-neutral-100 bg-white p-6 shadow-sm">
            <div class="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-primary-600">3</div>
            <h3 class="mt-4 text-lg font-semibold">Impact concret</h3>
            <p class="mt-2 text-sm text-neutral-600">
              Visualisez les kilos de nourriture sauvés et les émissions évitées grâce à votre engagement anti-gaspi.
            </p>
          </article>
        </div>
      </section>

      <section class="mt-20 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="rounded bg-white p-4 sm:p-6 lg:p-12 shadow-lg">
          <h2 class="text-xl font-semibold">Fonctionnalités phares</h2>
          <ul class="mt-6 space-y-4 text-sm text-neutral-600">
            <li class="flex items-stretch sm:items-start gap-3">
              <span class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">UX</span>
              <p>
                Tableau de bord personnalisé, modules de recommandation et suivi des réservations avec une interface inspirée des applications grand public.
              </p>
            </li>
            <li class="flex items-stretch sm:items-start gap-3">
              <span class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">UI</span>
              <p>
                Couleurs chaleureuses, typographies lisibles et composants soignés rappelant l'univers de Gaspiz tout en conservant l'identité GÊLADAL.
              </p>
            </li>
            <li class="flex items-stretch sm:items-start gap-3">
              <span class="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">Data</span>
              <p>
                Indicateurs d'impact en temps réel, historique des économies réalisées et objectifs mensuels pour encourager la fidélité.
              </p>
            </li>
          </ul>
        </div>
        <div class="rounded bg-gradient-to-br from-emerald-500 via-emerald-400 to-teal-500 p-4 sm:p-6 lg:p-12 text-white shadow-xl">
          <h2 class="text-xl font-semibold">Construisons la suite</h2>
          <p class="mt-4 text-sm text-emerald-50">
            Ce prototype illustre l'ambition de notre refonte produit : une expérience moderne, rassurante et engagée pour accélérer la lutte contre le gaspillage alimentaire.
          </p>
          <div class="mt-6 space-y-2 text-sm">
            <p class="flex items-center gap-2"><span class="text-lg">✅</span> Modules prêts pour l'intégration API</p>
            <p class="flex items-center gap-2"><span class="text-lg">✅</span> Composants responsive et accessibles</p>
            <p class="flex items-center gap-2"><span class="text-lg">✅</span> Parcours utilisateur testé</p>
          </div>
          <router-link
            to="/onboarding"
            class="mt-8 inline-flex items-center justify-center rounded bg-white/10 px-xl py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            Lancer un test utilisateur
          </router-link>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
// Vue 3 SFC sans logique spécifique pour cette vue de démonstration
</script>
