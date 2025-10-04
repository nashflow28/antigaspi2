# 🌱 Antigaspi - Données de seed

Ce dossier contient les données de test pour peupler la base de données Antigaspi avec des boutiques et produits réalistes.

## 📁 Structure

```
antigaspi_seed_data/
├── README.md              # Ce fichier
├── boutiques.json         # 5 boutiques de test
├── produits.json          # 15 produits répartis entre les boutiques
└── images/                # Images 512x512 des produits
    ├── README.md          # Guide pour obtenir les images
    ├── baguette-traditionnelle.jpg
    ├── croissant-au-beurre.jpg
    ├── pain-complet.jpg
    ├── plat-poulet-braise-riz.jpg
    ├── soupe-legumes.jpg
    ├── tarte-aux-fruits.jpg
    ├── tomates-fraiches.jpg
    ├── pommes-rouges.jpg
    ├── carottes-bio.jpg
    ├── sachet-lait.jpg
    ├── riz-parfume-5kg.jpg
    ├── huile-vegetale.jpg
    ├── steak-boeuf-cru.jpg
    ├── poulet-entier-cru.jpg
    └── cotes-agneau-crues.jpg
```

---

## 🏪 Boutiques (boutiques.json)

### 5 catégories de boutiques:

1. **Boulangerie Soleil** - Boulangerie artisanale
   - Catégorie: `boulangerie`
   - Produits: Pain, viennoiseries

2. **Restaurant Le Gourmet** - Restaurant local
   - Catégorie: `restaurant`
   - Produits: Plats cuisinés, desserts

3. **Marché Vert** - Marché de fruits et légumes
   - Catégorie: `fruits_legumes`
   - Produits: Fruits, légumes frais

4. **SuperMarché Togo+** - Supermarché général
   - Catégorie: `supermarche`
   - Produits: Épicerie, produits de base

5. **Boucherie Centrale** - Boucherie traditionnelle
   - Catégorie: `boucherie`
   - Produits: Viandes crues

---

## 📦 Produits (produits.json)

### 15 produits avec réductions anti-gaspillage:

| ID | Produit | Boutique | Prix | Réduction | Expire |
|----|---------|----------|------|-----------|--------|
| 1 | Baguette traditionnelle | Boulangerie Soleil | 500 F | -33% | 2025-10-04 |
| 2 | Croissant au beurre | Boulangerie Soleil | 300 F | -40% | 2025-10-03 |
| 3 | Pain complet | Boulangerie Soleil | 800 F | -33% | 2025-10-05 |
| 4 | Plat poulet braisé avec riz | Restaurant Le Gourmet | 2500 F | -37% | 2025-10-03 |
| 5 | Soupe de légumes | Restaurant Le Gourmet | 1200 F | -40% | 2025-10-03 |
| 6 | Tarte aux fruits | Restaurant Le Gourmet | 1500 F | -40% | 2025-10-04 |
| 7 | Tomates fraîches | Marché Vert | 800 F | -33% | 2025-10-05 |
| 8 | Pommes rouges | Marché Vert | 1500 F | -25% | 2025-10-08 |
| 9 | Carottes bio | Marché Vert | 700 F | -30% | 2025-10-06 |
| 10 | Sachet de lait | SuperMarché Togo+ | 600 F | -25% | 2025-10-06 |
| 11 | Riz parfumé 5kg | SuperMarché Togo+ | 8000 F | -20% | 2025-12-31 |
| 12 | Huile végétale | SuperMarché Togo+ | 2200 F | -21% | 2026-03-15 |
| 13 | Steak de bœuf cru | Boucherie Centrale | 3500 F | -30% | 2025-10-04 |
| 14 | Poulet entier cru | Boucherie Centrale | 4000 F | -33% | 2025-10-04 |
| 15 | Côtes d'agneau crues | Boucherie Centrale | 5500 F | -31% | 2025-10-04 |

---

## 🚀 Utilisation

### Option 1: Import manuel via Laravel Seeder

Créer un seeder Laravel pour importer ces données:

```php
// database/seeders/AntigaspiSeedDataSeeder.php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Merchant;
use App\Models\Product;
use App\Models\Category;

class AntigaspiSeedDataSeeder extends Seeder
{
    public function run()
    {
        $boutiquesData = json_decode(file_get_contents(base_path('antigaspi_seed_data/boutiques.json')), true);
        $produitsData = json_decode(file_get_contents(base_path('antigaspi_seed_data/produits.json')), true);

        // Créer les boutiques et produits
        // ... (logique d'import)
    }
}
```

Exécuter:
```bash
php artisan db:seed --class=AntigaspiSeedDataSeeder
```

---

### Option 2: Import via script Node.js

```javascript
// scripts/import-seed-data.js
const fs = require('fs');
const axios = require('axios');

const boutiques = JSON.parse(fs.readFileSync('./antigaspi_seed_data/boutiques.json'));
const produits = JSON.parse(fs.readFileSync('./antigaspi_seed_data/produits.json'));

async function importData() {
  const API_URL = 'http://localhost:8000/api';

  // Import boutiques
  for (const boutique of boutiques.boutiques) {
    await axios.post(`${API_URL}/merchants`, boutique);
  }

  // Import produits
  for (const produit of produits.produits) {
    await axios.post(`${API_URL}/products`, produit);
  }

  console.log('✅ Import terminé');
}

importData();
```

---

### Option 3: Import direct MySQL

```bash
# Créer un script SQL d'import
node scripts/generate-sql.js > import.sql

# Exécuter le script
mysql -u root antigaspi_fresh < import.sql
```

---

## 🖼️ Images

Les images doivent être:
- **Format**: JPG ou PNG
- **Dimensions**: 512x512 pixels
- **Style**: Photo produit sur fond neutre
- **Taille fichier**: 50-200 KB recommandé

**Pour obtenir les images**, consulte: `images/README.md`

Options:
1. Générateur IA (DALL-E, Leonardo.ai, Ideogram)
2. Sites libres de droits (Unsplash, Pexels, Pixabay)
3. Script Python automatique avec OpenAI API

---

## 📊 Statistiques

- **Boutiques**: 5 (5 catégories différentes)
- **Produits**: 15 (répartis équitablement)
- **Réductions moyennes**: 20-40% (anti-gaspillage)
- **Prix moyens**: 300 F à 8000 F CFA
- **Dates expiration**: 1-7 jours (sauf produits longue conservation)

---

## 🔧 Maintenance

Pour mettre à jour les données:

1. **Modifier** `boutiques.json` ou `produits.json`
2. **Régénérer** les seeders/scripts d'import
3. **Réimporter** dans la base de données

---

## 📝 Notes

- Tous les prix sont en **Francs CFA (F)** pour le marché togolais
- Les adresses sont situées à **Lomé, Togo**
- Les réductions simulent des produits proches de la date d'expiration
- Les quantités disponibles varient selon le type de produit

---

## ✅ Checklist d'utilisation

- [ ] Vérifier que `boutiques.json` et `produits.json` sont présents
- [ ] Télécharger/générer les 15 images dans `images/`
- [ ] Vérifier les dimensions des images (512x512)
- [ ] Créer le seeder Laravel ou script d'import
- [ ] Exécuter l'import dans la base de données
- [ ] Vérifier que les données sont correctement importées
- [ ] Tester l'affichage des produits dans l'application

---

## 🤝 Contribution

Pour ajouter plus de données:

1. Ajouter les boutiques dans `boutiques.json`
2. Ajouter les produits dans `produits.json`
3. Ajouter les images dans `images/`
4. Mettre à jour ce README

---

**Date de création**: 2025-10-03
**Version**: 1.0
**Auteur**: Claude Code
