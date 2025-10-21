# ✅ Plan de Rétablissement des Tests Jest Mobile

## 1. Remettre le slice d'authentification en conformité
- **Fichier(s) cibles :** `src/store/slices/authSlice.ts`, `src/store/slices/__tests__/authSlice.test.ts`.
- **Actions prévues :**
  - Restaurer `authInitialState.loading` à `false` et documenter le mécanisme d'affichage du SplashScreen autrement (hook ou selector), afin que l'état initial corresponde aux attentes de test.
  - Modifier le reducer `logoutUser.rejected` pour qu'il conserve `user`, `token` et `isAuthenticated` (le test simule un échec réseau et attend une session intacte).
  - Ajuster les assertions de test annexes si nécessaire (ex. réinitialisation d'erreurs) pour refléter le nouveau comportement.

## 2. Réintroduire le pont CacheManager dans `offlineService`
- **Fichier(s) cibles :** `src/services/offlineService.ts`, `src/services/__tests__/offlineService.test.ts`.
- **Actions prévues :**
  - Injecter un adaptateur de cache optionnel (`cacheManager`) avec méthodes `set`, `get`, `remove`, `clear`, en conservant AsyncStorage comme fallback.
  - Réimplémenter un verrou de promesse `syncLock` distinct de `syncInProgress`, que les tests inspectent pour s'assurer de la libération du lock (valeur `null` en fin de traitement).
  - Faire transiter toutes les opérations de cache (`setCache`, `getCache`, `removeCache`, `clearAllCache`) par l'adaptateur lorsque disponible, en retournant les promesses pour permettre `await` côté test.
  - Mettre à jour les tests pour initialiser un faux `cacheManager` via un setter et vérifier les nouvelles promesses/événements sans bruit de console.

## 3. Réactiver le cache offline côté réservations
- **Fichier(s) cibles :** `src/store/slices/reservationsSlice.ts`, `src/store/slices/__tests__/reservationsSlice.test.ts`.
- **Actions prévues :**
  - Dé-commenter l'import `offlineService` et rétablir les appels `setCache`, `getCache` et `queueSyncAction` aux endroits attendus (création, fetch, cancel).
  - Veiller à ce que les appels soient `await`-és et chainés pour que les mocks de test capturent bien les invocations.
  - Dans la suite de tests, reconfigurer les mocks d'`offlineService` pour exposer `setCache`, `getCache`, `queueSyncAction`, `removeCache` cohérents avec la nouvelle signature adaptateur.
  - Ajuster les tests offline (`should use cached reservations when offline`, etc.) afin qu'ils n'exigent plus d'appels inexistants ou de listes incorrectes (ex. précharger `offlineService.getCache` avec des données réalistes).

## 4. Réactiver le cache offline côté produits
- **Fichier(s) cibles :** `src/store/slices/productsSlice.ts`, `src/store/slices/__tests__/productsSlice.test.ts`.
- **Actions prévues :**
  - Rétablir l'utilisation d'`offlineService` pour la récupération et la mise en cache dans `fetchProducts`, `fetchMoreProducts`, `fetchProduct`, `fetchCategories`.
  - Mettre à jour la logique `hasMore` pour la calculer à partir de la taille des listes retournées (condition `< 20` ➝ `false`).
  - Conserver la construction du cache key avec `filters` sérialisés pour satisfaire les assertions de test.
  - Adapter les tests afin qu'ils fournissent des mocks cohérents (données de cache simplifiées) et qu'ils n'injectent plus de tableaux surdimensionnés lorsqu'on simule l'offline.

## 5. Séparer Playwright des suites Jest
- **Fichier(s) cibles :** `debug-web.spec.ts`, `jest.config.js`.
- **Actions prévues :**
  - Renommer le fichier Playwright (`debug-web.spec.ts`) vers un suffixe ignoré par Jest (`debug-web.pw.ts`) ou le déplacer sous `playwright/`.
  - Ajouter un pattern `testPathIgnorePatterns` dans `jest.config.js` pour exclure `*.pw.ts` et la racine Playwright, empêchant Jest de charger la suite Playwright.

## 6. Vérifications finales
- **Documentation interne :** consigner le rétablissement du cache dans `MOBILE_TEST_CORRECTION_REPORT.md` pour historiser les changements.
- **Tests à relancer (après implémentation) :** `npm test`, `npm run test:coverage`, et audit ciblé sur les suites offline (pas exécuté dans le cadre de cette demande, mais à planifier).
