# 📸 Images pour les produits Antigaspi

Ce dossier doit contenir les images des 15 produits au format **512x512 pixels** sur fond neutre.

## 🎯 Liste des images nécessaires

### Boulangerie (Boutique #1)
1. `baguette-traditionnelle.jpg` - Baguette de pain français
2. `croissant-au-beurre.jpg` - Croissant doré
3. `pain-complet.jpg` - Pain aux céréales

### Restaurant (Boutique #2)
4. `plat-poulet-braise-riz.jpg` - Assiette de poulet avec riz
5. `soupe-legumes.jpg` - Bol de soupe aux légumes
6. `tarte-aux-fruits.jpg` - Tarte sucrée aux fruits

### Fruits & Légumes (Boutique #3)
7. `tomates-fraiches.jpg` - Tomates rouges
8. `pommes-rouges.jpg` - Pommes rouges
9. `carottes-bio.jpg` - Carottes orange

### Supermarché (Boutique #4)
10. `sachet-lait.jpg` - Sachet ou bouteille de lait
11. `riz-parfume-5kg.jpg` - Sac de riz
12. `huile-vegetale.jpg` - Bouteille d'huile

### Boucherie (Boutique #5)
13. `steak-boeuf-cru.jpg` - Steak de bœuf cru
14. `poulet-entier-cru.jpg` - Poulet entier cru
15. `cotes-agneau-crues.jpg` - Côtelettes d'agneau crues

---

## 🤖 Option 1: Générateur d'images IA (Recommandé)

Utilise un générateur d'images IA gratuit comme:
- **DALL-E 3** (via Bing Image Creator): https://www.bing.com/images/create
- **Leonardo.ai**: https://leonardo.ai (15 crédits gratuits/jour)
- **Ideogram**: https://ideogram.ai (gratuit)
- **Stable Diffusion** (local ou via Hugging Face)

### Prompt suggéré pour chaque image:
```
professional product photography of [nom du produit],
centered on white background, studio lighting,
high quality, commercial style, 512x512px
```

**Exemples de prompts:**
- `professional product photography of french baguette bread, centered on white background, studio lighting`
- `professional product photography of fresh red tomatoes, centered on white background, studio lighting`
- `professional product photography of raw beef steak, centered on white background, studio lighting`

---

## 📦 Option 2: Images libres de droits

Sites d'images gratuites:
- **Unsplash**: https://unsplash.com (license gratuite)
- **Pexels**: https://www.pexels.com (license gratuite)
- **Pixabay**: https://pixabay.com (license gratuite)

**Recherche recommandée:**
- Chercher le nom du produit en anglais (ex: "french baguette", "raw chicken")
- Filtrer par "Commercial Use" / "No Attribution Required"
- Télécharger en haute qualité
- Redimensionner à 512x512px avec un outil comme:
  - **ImageMagick**: `convert image.jpg -resize 512x512^ -gravity center -extent 512x512 output.jpg`
  - **Photopea** (Photoshop en ligne): https://www.photopea.com
  - **GIMP** (gratuit): https://www.gimp.org

---

## 🛠️ Option 3: Script automatique avec IA

Si tu as accès à Python et une API key OpenAI/Stable Diffusion:

```bash
pip install openai pillow
python generate_images.py
```

**Script Python (generate_images.py):**
```python
import openai
import requests
from PIL import Image
from io import BytesIO

openai.api_key = "YOUR_API_KEY"

products = [
    "baguette-traditionnelle",
    "croissant-au-beurre",
    # ... (liste complète dans produits.json)
]

for product in products:
    prompt = f"professional product photography of {product.replace('-', ' ')}, centered on white background, studio lighting"

    response = openai.Image.create(
        prompt=prompt,
        n=1,
        size="512x512"
    )

    image_url = response['data'][0]['url']
    img_data = requests.get(image_url).content

    with open(f"{product}.jpg", 'wb') as f:
        f.write(img_data)

    print(f"✅ {product}.jpg créé")
```

---

## ✅ Vérification finale

Une fois toutes les images placées dans ce dossier:

```bash
# Vérifier que les 15 images sont présentes
ls -1 | wc -l   # Doit retourner 15

# Vérifier les dimensions
for img in *.jpg; do
    identify -format "%f: %wx%h\n" "$img"
done
```

**Structure attendue:**
```
antigaspi_seed_data/
├── boutiques.json
├── produits.json
└── images/
    ├── README.md (ce fichier)
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

## 📝 Notes

- **Format**: JPG ou PNG (JPG recommandé pour la taille)
- **Taille**: Exactement 512x512 pixels
- **Qualité**: Moyenne à haute (70-90% compression)
- **Style**: Photo réaliste, fond neutre (blanc/gris clair)
- **Licence**: Libre de droits ou générée par IA

Bon courage ! 🚀
