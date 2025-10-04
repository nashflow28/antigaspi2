# 🎨 Prompts ChatGPT/DALL-E pour générer les 15 images

## 📋 Instructions

1. Ouvre **ChatGPT Plus** (avec accès à DALL-E 3): https://chat.openai.com
2. Copie-colle **UN PROMPT À LA FOIS** dans ChatGPT
3. ChatGPT générera automatiquement l'image avec DALL-E 3
4. **Télécharge l'image** (clic droit > Enregistrer sous)
5. **Renomme le fichier** avec le nom exact indiqué
6. **Place-le dans** `C:\xampp\htdocs\antigaspi2\antigaspi_seed_data\images\`

---

## 🥖 Boulangerie (Boutique #1)

### Image 1: baguette-traditionnelle.jpg
```
Generate a professional product photography of a traditional French baguette bread, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo
```

### Image 2: croissant-au-beurre.jpg
```
Generate a professional product photography of a golden butter croissant, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo, perfectly baked
```

### Image 3: pain-complet.jpg
```
Generate a professional product photography of a whole grain bread loaf with visible seeds, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo
```

---

## 🍽️ Restaurant (Boutique #2)

### Image 4: plat-poulet-braise-riz.jpg
```
Generate a professional product photography of a grilled chicken dish with white rice on a plate, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo, appetizing presentation
```

### Image 5: soupe-legumes.jpg
```
Generate a professional product photography of a vegetable soup in a white bowl, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo, fresh vegetables visible
```

### Image 6: tarte-aux-fruits.jpg
```
Generate a professional product photography of a fruit tart with mixed fresh fruits on top, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo, bakery quality
```

---

## 🥕 Fruits & Légumes (Boutique #3)

### Image 7: tomates-fraiches.jpg
```
Generate a professional product photography of fresh red tomatoes, 3-4 tomatoes grouped together, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo, ripe and glossy
```

### Image 8: pommes-rouges.jpg
```
Generate a professional product photography of red apples, 3 apples grouped together, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo, fresh and shiny
```

### Image 9: carottes-bio.jpg
```
Generate a professional product photography of fresh organic carrots with green tops, 4-5 carrots grouped together, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo
```

---

## 🛒 Supermarché (Boutique #4)

### Image 10: sachet-lait.jpg
```
Generate a professional product photography of a milk carton or plastic pouch, 1 liter, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo, clean packaging
```

### Image 11: riz-parfume-5kg.jpg
```
Generate a professional product photography of a 5kg bag of white rice, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo, commercial packaging
```

### Image 12: huile-vegetale.jpg
```
Generate a professional product photography of a vegetable oil bottle, 1 liter, clear or yellow oil visible, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo
```

---

## 🥩 Boucherie (Boutique #5)

### Image 13: steak-boeuf-cru.jpg
```
Generate a professional product photography of raw beef steak, fresh red meat, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo, butcher quality
```

### Image 14: poulet-entier-cru.jpg
```
Generate a professional product photography of a whole raw chicken, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo, butcher quality
```

### Image 15: cotes-agneau-crues.jpg
```
Generate a professional product photography of raw lamb chops, 3-4 pieces, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo, butcher quality
```

---

## ✅ Checklist après génération

Après avoir généré toutes les images, vérifie:

- [ ] 15 fichiers JPG dans le dossier `images/`
- [ ] Noms de fichiers exacts (respecte les tirets et extensions)
- [ ] Dimensions proches de 512x512 (DALL-E génère 1024x1024, tu peux les redimensionner)
- [ ] Fond blanc/neutre sur toutes les images

### Commandes pour redimensionner (optionnel):

#### Avec ImageMagick (Windows):
```bash
cd C:\xampp\htdocs\antigaspi2\antigaspi_seed_data\images
for %f in (*.jpg) do magick "%f" -resize 512x512^ -gravity center -extent 512x512 "resized_%f"
```

#### Avec un outil en ligne:
- **Photopea**: https://www.photopea.com (gratuit, comme Photoshop)
- **Pixlr**: https://pixlr.com/express
- **ILoveIMG**: https://www.iloveimg.com/resize-image

---

## 📝 Exemple de conversation ChatGPT

**Toi:**
```
Generate a professional product photography of a traditional French baguette bread, centered on a clean white background, studio lighting, high quality commercial style, 512x512 pixels, realistic photo
```

**ChatGPT:**
[Génère l'image avec DALL-E]

**Toi:**
- Télécharge l'image
- Renomme en `baguette-traditionnelle.jpg`
- Place dans `C:\xampp\htdocs\antigaspi2\antigaspi_seed_data\images\`

**Répète pour les 14 autres images** 🔄

---

## 🚀 Après avoir placé toutes les images

Vérifie que tout est prêt:

```bash
cd C:\xampp\htdocs\antigaspi2\antigaspi_seed_data\images
dir *.jpg
```

Tu devrais voir:
```
baguette-traditionnelle.jpg
carottes-bio.jpg
cotes-agneau-crues.jpg
croissant-au-beurre.jpg
huile-vegetale.jpg
pain-complet.jpg
plat-poulet-braise-riz.jpg
pommes-rouges.jpg
poulet-entier-cru.jpg
riz-parfume-5kg.jpg
sachet-lait.jpg
soupe-legumes.jpg
steak-boeuf-cru.jpg
tarte-aux-fruits.jpg
tomates-fraiches.jpg
```

**15 fichiers = ✅ Prêt pour l'import dans la base de données!**

---

## 💡 Astuces

- **Génération par lot**: Tu peux générer 2-3 images dans une même conversation ChatGPT
- **Reformulation**: Si l'image ne te plaît pas, demande "Can you regenerate this with better lighting?"
- **Variantes**: DALL-E génère 4 variantes par défaut, choisis la meilleure
- **Qualité**: DALL-E 3 génère en 1024x1024 par défaut (très bon)

---

**Bonne génération! 🎨**
