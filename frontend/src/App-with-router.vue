<template>
  <div>
    <h1>Antigaspi avec Router</h1>
    <nav>
      <router-link to="/">Accueil</router-link> |
      <router-link to="/products">Produits</router-link>
    </nav>
    <hr />
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>