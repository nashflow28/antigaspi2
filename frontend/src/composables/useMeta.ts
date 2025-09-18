import { onMounted, onUnmounted, watch, Ref } from 'vue'
import { useRouter } from 'vue-router'

interface MetaTag {
  name?: string
  property?: string
  content: string
  key?: string
}

interface MetaConfig {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: string
  siteName?: string
  author?: string
  locale?: string
  twitterCard?: 'summary' | 'summary_large_image'
  customTags?: MetaTag[]
}

const defaultConfig: Partial<MetaConfig> = {
  siteName: 'Antigaspi - Lutte contre le gaspillage alimentaire',
  author: 'Antigaspi Team',
  locale: 'fr_FR',
  type: 'website',
  twitterCard: 'summary_large_image',
  image: '/images/antigaspi-og-image.jpg'
}

export const useMeta = (config: MetaConfig | Ref<MetaConfig>) => {
  const router = useRouter()
  const addedTags = new Set<HTMLElement>()

  const getMetaConfig = (): MetaConfig => {
    const resolvedConfig = typeof config === 'object' && 'value' in config ? config.value : config
    return { ...defaultConfig, ...resolvedConfig }
  }

  const removeExistingTags = () => {
    addedTags.forEach(tag => {
      if (tag.parentNode) {
        tag.parentNode.removeChild(tag)
      }
    })
    addedTags.clear()
  }

  const createMetaTag = (tag: MetaTag): HTMLMetaElement => {
    const meta = document.createElement('meta')

    if (tag.name) meta.setAttribute('name', tag.name)
    if (tag.property) meta.setAttribute('property', tag.property)
    meta.setAttribute('content', tag.content)

    if (tag.key) meta.setAttribute('data-key', tag.key)

    return meta
  }

  const updateTitle = (title: string) => {
    document.title = title
  }

  const updateMeta = () => {
    const metaConfig = getMetaConfig()
    const currentUrl = window.location.origin + router.currentRoute.value.fullPath

    // Remove existing tags
    removeExistingTags()

    // Update title
    if (metaConfig.title) {
      updateTitle(`${metaConfig.title} | ${metaConfig.siteName}`)
    }

    const tags: MetaTag[] = []

    // Basic SEO meta tags
    if (metaConfig.description) {
      tags.push({ name: 'description', content: metaConfig.description })
    }

    if (metaConfig.keywords) {
      tags.push({ name: 'keywords', content: metaConfig.keywords })
    }

    if (metaConfig.author) {
      tags.push({ name: 'author', content: metaConfig.author })
    }

    // Open Graph meta tags
    if (metaConfig.title) {
      tags.push({ property: 'og:title', content: metaConfig.title })
    }

    if (metaConfig.description) {
      tags.push({ property: 'og:description', content: metaConfig.description })
    }

    if (metaConfig.image) {
      const imageUrl = metaConfig.image.startsWith('http')
        ? metaConfig.image
        : window.location.origin + metaConfig.image
      tags.push({ property: 'og:image', content: imageUrl })
    }

    tags.push({ property: 'og:url', content: metaConfig.url || currentUrl })

    if (metaConfig.type) {
      tags.push({ property: 'og:type', content: metaConfig.type })
    }

    if (metaConfig.siteName) {
      tags.push({ property: 'og:site_name', content: metaConfig.siteName })
    }

    if (metaConfig.locale) {
      tags.push({ property: 'og:locale', content: metaConfig.locale })
    }

    // Twitter Card meta tags
    if (metaConfig.twitterCard) {
      tags.push({ name: 'twitter:card', content: metaConfig.twitterCard })
    }

    if (metaConfig.title) {
      tags.push({ name: 'twitter:title', content: metaConfig.title })
    }

    if (metaConfig.description) {
      tags.push({ name: 'twitter:description', content: metaConfig.description })
    }

    if (metaConfig.image) {
      const imageUrl = metaConfig.image.startsWith('http')
        ? metaConfig.image
        : window.location.origin + metaConfig.image
      tags.push({ name: 'twitter:image', content: imageUrl })
    }

    // Additional meta tags
    tags.push({ name: 'viewport', content: 'width=device-width, initial-scale=1' })
    tags.push({ name: 'robots', content: 'index, follow' })
    tags.push({ property: 'og:locale:alternate', content: 'en_US' })

    // Custom tags
    if (metaConfig.customTags) {
      tags.push(...metaConfig.customTags)
    }

    // Add all tags to document head
    const head = document.head
    tags.forEach(tag => {
      const metaElement = createMetaTag(tag)
      head.appendChild(metaElement)
      addedTags.add(metaElement)
    })
  }

  // Watch for config changes if it's reactive
  if (typeof config === 'object' && 'value' in config) {
    watch(config, updateMeta, { immediate: false })
  }

  onMounted(() => {
    updateMeta()
  })

  onUnmounted(() => {
    removeExistingTags()
  })

  return {
    updateMeta
  }
}

// Predefined meta configurations for common pages
export const metaConfigs = {
  home: {
    title: 'Accueil',
    description: 'Luttez contre le gaspillage alimentaire en Côte d\'Ivoire. Découvrez des produits à prix réduits et aidez les commerçants à éviter le gaspillage.',
    keywords: 'antigaspi, gaspillage alimentaire, côte d\'ivoire, abidjan, économies, produits réduits',
    type: 'website'
  },

  products: {
    title: 'Produits Anti-gaspillage',
    description: 'Découvrez des produits frais à prix réduits près de chez vous. Faites des économies tout en luttant contre le gaspillage alimentaire.',
    keywords: 'produits, antigaspi, réductions, alimentaire, frais, abidjan',
    type: 'website'
  },

  merchants: {
    title: 'Carte des Commerçants',
    description: 'Trouvez les commerçants partenaires près de chez vous qui proposent des produits anti-gaspillage.',
    keywords: 'commerçants, carte, localisation, partenaires, antigaspi',
    type: 'website'
  },

  login: {
    title: 'Connexion',
    description: 'Connectez-vous à votre compte Antigaspi pour accéder à vos réservations et découvrir des offres exclusives.',
    keywords: 'connexion, login, compte, utilisateur',
    type: 'website'
  },

  register: {
    title: 'Inscription',
    description: 'Rejoignez la communauté Antigaspi ! Inscrivez-vous gratuitement pour lutter contre le gaspillage alimentaire.',
    keywords: 'inscription, register, nouveau compte, communauté',
    type: 'website'
  },

  dashboard: {
    title: 'Tableau de Bord',
    description: 'Gérez votre compte, consultez vos réservations et suivez votre impact environnemental.',
    keywords: 'dashboard, compte, réservations, profil',
    type: 'website'
  }
}

// Helper pour créer des meta tags de produit
export const createProductMeta = (product: {
  name: string
  description?: string
  image?: string
  price?: number
  originalPrice?: number
  merchant?: { name: string }
}): MetaConfig => {
  const discount = product.price && product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  return {
    title: product.name,
    description: product.description || `${product.name} disponible à prix réduit${discount ? ` (-${discount}%)` : ''} chez ${product.merchant?.name || 'nos commerçants partenaires'}.`,
    image: product.image,
    type: 'product',
    keywords: `${product.name}, antigaspi, réduction, ${product.merchant?.name || 'commerçant'}, produit`,
    customTags: [
      { property: 'product:price:amount', content: product.price?.toString() || '0' },
      { property: 'product:price:currency', content: 'XOF' }
    ]
  }
}

// Helper pour créer des meta tags de commerçant
export const createMerchantMeta = (merchant: {
  name: string
  businessType?: string
  city?: string
  productsCount?: number
}): MetaConfig => {
  return {
    title: merchant.name,
    description: `${merchant.name}${merchant.businessType ? ` - ${merchant.businessType}` : ''} ${merchant.city ? `à ${merchant.city}` : ''}. ${merchant.productsCount || 0} produit(s) anti-gaspillage disponible(s).`,
    type: 'business.business',
    keywords: `${merchant.name}, ${merchant.businessType || 'commerçant'}, ${merchant.city || 'côte d\'ivoire'}, antigaspi`,
    customTags: [
      { property: 'business:contact_data:locality', content: merchant.city || 'Côte d\'Ivoire' }
    ]
  }
}