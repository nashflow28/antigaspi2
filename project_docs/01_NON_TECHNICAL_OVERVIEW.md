# Vue d’ensemble non technique (pour tous)

## Résumé en 1 minute
Antigaspi est une plateforme anti‑gaspillage alimentaire qui met en relation des commerçants (boulangeries, supermarchés, restaurants) avec des consommateurs. Les commerçants publient leurs invendus à prix réduit ; les consommateurs réservent, paient et récupèrent (ou se font livrer) les produits. L’application mobile est la plus avancée ; le site web est en cours d’alignement.

## À qui s’adresse le produit ?
- Consommateurs : acheter moins cher, réduire le gaspillage.
- Commerçants : écouler les invendus, gagner des revenus supplémentaires.
- Administrateurs : modérer, piloter l’activité et les statistiques.
- Livreurs : gérer des livraisons à la demande (module livraison).

## Valeur ajoutée
- Réduction du gaspillage alimentaire.
- Économies pour les consommateurs.
- Revenu additionnel pour les commerçants.
- Pilotage opérationnel via dashboards et analytics.

## Parcours utilisateur simplifié
1. Le commerçant publie des produits invendus (ou paniers surprise).
2. Le consommateur explore, réserve et paie (Mobile Money / portefeuille).
3. Récupération sur place ou livraison selon disponibilité.
4. Notifications + historique + fidélité.

## Ce qui est déjà en place
- API backend complète (auth, produits, réservations, paiements, wallet, notifications, livraison, etc.).
- Application mobile riche et moderne (Design System 2025, dark mode, navigation par rôle).
- Site web avec la majorité des écrans, mais encore en migration UI/UX.

## Ce qui manque encore
- Harmonisation totale Web vs Mobile (Design System 2025, parcours utilisateur, tests, cohérence UX).
- Stabilisation finale de certains modules côté Web (notamment temps réel, ergonomie, cohérence des états).
- Documentation et validations systématiques des tests avant production.

## Où lire la suite
- 02_TECHNICAL_ARCHITECTURE.md : architecture globale.
- 06_CURRENT_STATUS_REPORT.md : état d’avancement détaillé.
- 09_ROADMAP_PARITE_FRONTEND_MOBILE.md : plan P0/P1/P2.
