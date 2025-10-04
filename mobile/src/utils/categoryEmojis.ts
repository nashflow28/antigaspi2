export const categoryEmojis: Record<string, string> = {
  boulangerie: '🥖',
  bakery: '🥖',
  boucherie: '🥩',
  butcher: '🥩',
  poissonnerie: '🐟',
  fishmonger: '🐟',
  "fruits et légumes": '🥬',
  "fruits & légumes": '🥬',
  produce: '🥬',
  epicerie: '🛒',
  "épicerie": '🛒',
  "épicerie fine": '🧀',
  patisserie: '🧁',
  pâtisserie: '🧁',
  traiteur: '🍽️',
  restaurant: '🍽️',
  "fast food": '🍔',
  "produits laitiers": '🥛',
  laitier: '🥛',
  laiterie: '🥛',
  fromagerie: '🧀',
  primeur: '🥕',
  "fruits": '🍎',
  legumes: '🥕',
  "légumes": '🥕',
  "fruits secs": '🥜',
  boissons: '🥤',
  "boissons alcoolisées": '🍷',
  caviste: '🍷',
  chocolaterie: '🍫',
  poisson: '🐟',
  surgelés: '🧊',
  charcuterie: '🥓',
  "plats préparés": '🥘',
  "produits bio": '🌿',
  bio: '🌿',
  vegan: '🥗',
  vegetarien: '🥗',
  "végétarien": '🥗',
}

export const getCategoryEmoji = (categoryNameOrId: string): string => {
  if (!categoryNameOrId) {
    return '🛍️'
  }

  const normalized = categoryNameOrId.trim().toLowerCase()
  return categoryEmojis[normalized] ?? '🛍️'
}
