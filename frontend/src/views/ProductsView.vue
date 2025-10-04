<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <header class="mb-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Catalogue des produits</h1>
            <p class="mt-2 text-gray-600">
              Découvrez les meilleures offres anti-gaspillage proposées par nos commerçants partenaires.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-full md:w-64">
              <label for="product-search" class="sr-only">Rechercher un produit</label>
              <input
                id="product-search"
                type="search"
                :value="filters.search || ''"
                @input="updateSearch($event)"
                placeholder="Rechercher un produit ou un commerçant"
                class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              @click="onClearFilters"
            >
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>
      </header>

      <section aria-label="Filtrer par catégorie" class="mb-10">
        <div class="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          <span>Catégories</span>
          <span class="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">{{ categories.length }}</span>
        </div>
        <div class="-mx-1 overflow-x-auto pb-2">
          <div class="flex min-w-max items-center gap-3 px-1">
            <CategoryPill
              label="Toutes"
              icon="✨"
              :active="!filters.category"
              @click="setFilters({ category: '' })"
            />
            <CategoryPill
              v-for="category in productsStore.categories"
              :key="category.id"
              :label="category.name"
              :icon="category.icon"
              :active="filters.category === category.name"
              @click="onCategoryClick(category.name)"
            />
          </div>
        </div>
      </section>

      <section aria-live="polite" :aria-busy="loading ? 'true' : 'false'">
        <div v-if="loading" class="flex items-center justify-center rounded-lg border border-dashed border-primary-200 bg-white py-20 text-primary-600">
          <div class="flex flex-col items-center gap-3">
            <svg class="h-8 w-8 animate-spin text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <p class="text-sm font-medium">Chargement des produits…</p>
          </div>
        </div>

        <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="filteredProducts.length === 0" class="rounded-lg border border-gray-200 bg-white p-10 text-center text-gray-600">
          <p class="text-lg font-medium">Aucun produit ne correspond à vos filtres pour le moment.</p>
          <p class="mt-2 text-sm">Essayez d'élargir votre recherche ou de sélectionner une autre catégorie.</p>
        </div>

        <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="product in filteredProducts"
            :key="product.id"
            class="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="relative h-48 w-full bg-gray-100">
              <img
                v-if="product.image_url"
                :src="product.image_url"
                :alt="product.name"
                class="h-full w-full object-cover"
              />
              <div
                v-else
                class="flex h-full w-full items-center justify-center text-4xl"
                aria-hidden="true"
              >
                🛍️
              </div>
              <div class="absolute left-4 top-4 rounded-full bg-primary-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                {{ product.category.name }}
              </div>
            </div>

            <div class="flex flex-1 flex-col gap-4 p-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ product.name }}</h3>
                <p class="mt-1 text-sm text-gray-600 line-clamp-3">{{ product.description }}</p>
              </div>

              <div class="flex flex-wrap items-center gap-3 text-sm">
                <div class="rounded-full bg-primary-50 px-3 py-1 text-primary-700">
                  <span class="font-semibold">{{ product.discount_percentage }}% de réduction</span>
                </div>
                <div class="rounded-full bg-success-50 px-3 py-1 text-success-700">
                  Économie : {{ product.savings.toFixed(2) }} €
                </div>
                <div class="rounded-full bg-warning-50 px-3 py-1 text-warning-700">
                  {{ product.days_until_expiration }} jours restants
                </div>
              </div>

              <div class="mt-auto flex flex-col gap-4">
                <div class="flex items-center justify-between">
                  <div class="text-sm text-gray-500">Prix initial</div>
                  <div class="font-medium text-gray-500 line-through">{{ Number(product.original_price).toFixed(2) }} €</div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="text-base font-semibold text-gray-900">Prix remisé</div>
                  <div class="text-xl font-bold text-primary-600">{{ Number(product.discounted_price).toFixed(2) }} €</div>
                </div>
                <div class="flex items-center justify-between text-sm text-gray-600">
                  <span class="flex items-center gap-1">
                    <span aria-hidden="true">🏪</span>
                    {{ product.merchant.business_name }}
                  </span>
                  <span class="flex items-center gap-1">
                    <span aria-hidden="true">📦</span>
                    {{ product.quantity_available }} restants
                  </span>
                </div>
                <router-link
                  :to="`/products/${product.id}`"
                  class="inline-flex w-full items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2"
                >
                  Voir le détail
                </router-link>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useProductsStore } from '@/stores/products'

const productsStore = useProductsStore()
const { filteredProducts, categories, filters, loading, error } = storeToRefs(productsStore)
const { fetchProducts, setFilters, clearFilters } = productsStore

const CategoryPill = defineComponent({
  name: 'CategoryPill',
  props: {
    label: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: ''
    },
    active: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click'],
  setup(props, { emit }) {
    const handleClick = () => {
      emit('click')
    }

    return () =>
      h(
        'button',
        {
          type: 'button',
          class: [
            'inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2',
            props.active
              ? 'bg-primary-600 text-white shadow'
              : 'bg-white text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-primary-50'
          ],
          onClick: handleClick
        },
        [
          props.icon ? h('span', { 'aria-hidden': 'true' }, props.icon) : null,
          h('span', null, props.label)
        ]
      )
  }
})

const updateSearch = (event: Event) => {
  const target = event.target as HTMLInputElement
  setFilters({ search: target.value })
}

const onCategoryClick = (categoryName: string) => {
  if (filters.value.category === categoryName) {
    setFilters({ category: '' })
  } else {
    setFilters({ category: categoryName })
  }
}

const onClearFilters = () => {
  clearFilters()
}

onMounted(() => {
  fetchProducts()
})
</script>
