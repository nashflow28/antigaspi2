/**
 * Service de gestion du mode offline - Version simplifiée pour le web
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CacheConfig {
  key: string;
  ttl: number; // Time to live en minutes
  version?: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

class OfflineServiceSafe {
  private isOnline: boolean = true;
  private listeners: Map<string, Function[]> = new Map();

  // Configuration du cache par type de données
  private cacheConfigs: Record<string, CacheConfig> = {
    products: { key: 'cache_products', ttl: 30, version: 1 },
    categories: { key: 'cache_categories', ttl: 60, version: 1 },
    reservations: { key: 'cache_reservations', ttl: 15, version: 1 },
    user: { key: 'cache_user', ttl: 120, version: 1 },
    merchants: { key: 'cache_merchants', ttl: 45, version: 1 },
  };

  constructor() {
    console.log('🔌 OfflineService (Safe Mode) initialisé');
    this.initialize();
  }

  /**
   * Initialiser le service offline
   */
  private async initialize(): Promise<void> {
    // En mode web, on utilise navigator.onLine pour la connectivité
    if (typeof window !== 'undefined' && window.navigator) {
      this.isOnline = navigator.onLine;

      // Écouter les changements de connectivité
      window.addEventListener('online', () => {
        console.log('📡 Connexion rétablie');
        this.handleConnectivityChange(true);
      });

      window.addEventListener('offline', () => {
        console.log('📵 Connexion perdue');
        this.handleConnectivityChange(false);
      });
    }

    // Nettoyer le cache expiré au démarrage
    await this.cleanExpiredCache();
  }

  /**
   * Gérer les changements de connectivité
   */
  private handleConnectivityChange(isConnected: boolean): void {
    this.isOnline = isConnected;
    console.log(`Connectivité: ${isConnected ? 'En ligne' : 'Hors ligne'}`);
    this.emit('connectivity-change', isConnected);
  }

  /**
   * Vérifier si on est en ligne
   */
  async checkConnectivity(): Promise<boolean> {
    if (typeof window !== 'undefined' && window.navigator) {
      this.isOnline = navigator.onLine;
    }
    return this.isOnline;
  }

  /**
   * Obtenir l'état de connectivité actuel
   */
  getConnectivityStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Sauvegarder des données en cache
   */
  async saveToCache<T>(key: string, data: T, customTTL?: number): Promise<void> {
    const config = this.cacheConfigs[key] || { key: `cache_${key}`, ttl: 30, version: 1 };
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: config.version || 1,
    };

    try {
      await AsyncStorage.setItem(config.key, JSON.stringify(cacheEntry));
      console.log(`✅ Cache saved: ${config.key}`);
    } catch (error) {
      console.error(`❌ Error saving cache: ${config.key}`, error);
    }
  }

  /**
   * Récupérer des données du cache
   */
  async getFromCache<T>(key: string): Promise<T | null> {
    const config = this.cacheConfigs[key] || { key: `cache_${key}`, ttl: 30, version: 1 };

    try {
      const cached = await AsyncStorage.getItem(config.key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);

      // Vérifier si le cache est expiré
      const ttlMs = config.ttl * 60 * 1000;
      const isExpired = Date.now() - entry.timestamp > ttlMs;

      if (isExpired) {
        console.log(`⏰ Cache expired: ${config.key}`);
        await AsyncStorage.removeItem(config.key);
        return null;
      }

      console.log(`✅ Cache hit: ${config.key}`);
      return entry.data;
    } catch (error) {
      console.error(`❌ Error reading cache: ${config.key}`, error);
      return null;
    }
  }

  /**
   * Nettoyer tout le cache
   */
  async clearAllCache(): Promise<void> {
    const keys = Object.values(this.cacheConfigs).map(config => config.key);
    try {
      await AsyncStorage.multiRemove(keys);
      console.log('🧹 All cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache', error);
    }
  }

  /**
   * Nettoyer le cache expiré
   */
  private async cleanExpiredCache(): Promise<void> {
    for (const [name, config] of Object.entries(this.cacheConfigs)) {
      try {
        const cached = await AsyncStorage.getItem(config.key);
        if (!cached) continue;

        const entry: CacheEntry<any> = JSON.parse(cached);
        const ttlMs = config.ttl * 60 * 1000;
        const isExpired = Date.now() - entry.timestamp > ttlMs;

        if (isExpired) {
          await AsyncStorage.removeItem(config.key);
          console.log(`🧹 Expired cache cleaned: ${config.key}`);
        }
      } catch (error) {
        console.error(`❌ Error cleaning cache: ${config.key}`, error);
      }
    }
  }

  /**
   * S'abonner à un événement
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
   * Se désabonner d'un événement
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Émettre un événement
   */
  private emit(event: string, ...args: any[]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
}

// Export singleton
const offlineService = new OfflineServiceSafe();
export default offlineService;