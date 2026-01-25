import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { PromoBannerItem } from '../components/PromoBanner'
import { NativeAdData } from '../components/NativeAdCard'

/**
 * Hook pour gérer les promotions et publicités
 *
 * Pour l'instant, utilise des données statiques/mockées.
 * À terme, peut être connecté à:
 * - API backend pour les commerçants sponsorisés
 * - Google AdMob pour les pubs natives
 * - Facebook Audience Network
 */
export const usePromos = () => {
  const { merchants } = useSelector((state: RootState) => state.merchants)

  // Bannières promotionnelles (carousel en haut)
  const promoBanners = useMemo<PromoBannerItem[]>(() => {
    const banners: PromoBannerItem[] = []

    // Bannière de bienvenue / promo générale
    banners.push({
      id: 'welcome-promo',
      title: 'Bienvenue sur GÊLADAL !',
      subtitle: 'Économisez jusqu\'à 70% sur vos courses tout en luttant contre le gaspillage',
      backgroundColor: '#10B981',
      icon: 'leaf',
      textColor: '#FFFFFF',
    })

    // Offre spéciale
    banners.push({
      id: 'special-offer',
      title: 'Offre de lancement',
      subtitle: 'Première réservation ? Profitez de -10% avec le code GELADAL10',
      backgroundColor: '#F59E0B',
      icon: 'gift',
      textColor: '#FFFFFF',
    })

    // Commerçants sponsorisés (exemple avec les merchants existants)
    if (merchants && merchants.length > 0) {
      const sponsoredMerchant = merchants[0]
      banners.push({
        id: `merchant-${sponsoredMerchant.id}`,
        title: sponsoredMerchant.business_name || 'Commerçant partenaire',
        subtitle: `Découvrez les offres de ${sponsoredMerchant.business_name}`,
        imageUrl: sponsoredMerchant.logo_url || undefined,
        backgroundColor: '#3B82F6',
        icon: 'storefront',
        textColor: '#FFFFFF',
        isAd: true,
        adType: 'sponsored',
        merchantId: sponsoredMerchant.id,
        merchantName: sponsoredMerchant.business_name,
      })
    }

    // Bannière fidélité
    banners.push({
      id: 'loyalty-promo',
      title: 'Programme de fidélité',
      subtitle: 'Gagnez des points à chaque achat et économisez encore plus !',
      backgroundColor: '#8B5CF6',
      icon: 'star',
      textColor: '#FFFFFF',
    })

    return banners
  }, [merchants])

  // Publicités natives (entre les produits)
  const nativeAds = useMemo<NativeAdData[]>(() => {
    const ads: NativeAdData[] = []

    // Publicité pour recharger le portefeuille
    ads.push({
      id: 'wallet-promo',
      headline: 'Rechargez votre portefeuille',
      body: 'Payez plus rapidement avec votre solde GÊLADAL',
      ctaText: 'Recharger',
      advertiser: 'GÊLADAL',
      adType: 'custom',
      iconUrl: undefined,
    })

    // Publicité pour inviter des amis
    ads.push({
      id: 'referral-promo',
      headline: 'Parrainez vos amis',
      body: 'Gagnez 500 XOF pour chaque ami qui s\'inscrit',
      ctaText: 'Inviter',
      advertiser: 'GÊLADAL',
      adType: 'custom',
    })

    // Publicité commerçant sponsorisé
    if (merchants && merchants.length > 1) {
      const sponsoredMerchant = merchants[1]
      ads.push({
        id: `native-merchant-${sponsoredMerchant.id}`,
        headline: sponsoredMerchant.business_name || 'Découvrir ce commerce',
        body: `${sponsoredMerchant.business_type || 'Commerce'} • ${sponsoredMerchant.user?.city || 'Lomé'}`,
        iconUrl: sponsoredMerchant.logo_url || undefined,
        ctaText: 'Voir les offres',
        advertiser: sponsoredMerchant.business_name,
        adType: 'sponsored_merchant',
        merchantId: sponsoredMerchant.id,
      })
    }

    // Publicité pour devenir commerçant
    ads.push({
      id: 'become-merchant',
      headline: 'Vous êtes commerçant ?',
      body: 'Rejoignez GÊLADAL et vendez vos invendus',
      ctaText: 'En savoir plus',
      advertiser: 'GÊLADAL Pro',
      adType: 'custom',
    })

    return ads
  }, [merchants])

  /**
   * Récupère une publicité native pour un index donné
   * Retourne null si aucune pub ne doit être affichée à cet index
   *
   * @param productIndex - Index du produit après lequel afficher la pub
   * @param interval - Intervalle entre les pubs (ex: 6 = une pub tous les 6 produits)
   */
  const getNativeAdForIndex = (productIndex: number, interval: number = 6): NativeAdData | null => {
    // Afficher une pub après chaque "interval" produits
    if ((productIndex + 1) % interval !== 0) {
      return null
    }

    // Calculer quel index de pub utiliser
    const adIndex = Math.floor((productIndex + 1) / interval) - 1
    return nativeAds[adIndex % nativeAds.length] || null
  }

  return {
    promoBanners,
    nativeAds,
    getNativeAdForIndex,
  }
}

export default usePromos
