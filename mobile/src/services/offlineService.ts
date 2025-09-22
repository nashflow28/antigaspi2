/**
 * Service de gestion du mode offline et cache local
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiService from './api';

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

export interface SyncQueue {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineService {
  private isOnline: boolean = true;
  private syncQueue: SyncQueue[] = [];
  private syncInProgress: boolean = false;
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
    this.initialize();
  }

  /**
   * Initialiser le service offline
   */
  private async initialize(): Promise<void> {
    // Écouter les changements de connectivité
    NetInfo.addEventListener(state => {
      this.handleConnectivityChange(state.isConnected ?? false);
    });

    // Charger la queue de synchronisation
    await this.loadSyncQueue();
    this.emit('sync-queue-updated', this.syncQueue.length);

    // Nettoyer le cache expiré au démarrage
    await this.cleanExpiredCache();
  }

  /**
   * Gérer les changements de connectivité
   */
  private handleConnectivityChange(isConnected: boolean): void {
    const wasOffline = !this.isOnline;
    this.isOnline = isConnected;

    console.log(`Connectivité: ${isConnected ? 'En ligne' : 'Hors ligne'}`);

    // Émettre un événement de changement
    this.emit('connectivity-change', isConnected);

    // Si on repasse en ligne, synchroniser
    if (wasOffline && isConnected) {
      this.processSyncQueue();
    }
  }

  /**
   * Vérifier si on est en ligne
   */
  async checkConnectivity(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }

  /**
   * Obtenir l'état de connectivité actuel
   */
  getConnectivityStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Mettre en cache des données
   */
  async setCache<T>(key: string, data: T, customTTL?: number): Promise<void> {
    try {
      const config = this.cacheConfigs[key] || { key: `cache_${key}`, ttl: 30, version: 1 };
      const ttl = customTTL || config.ttl;

      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: config.version || 1,
      };

      await AsyncStorage.setItem(config.key, JSON.stringify(cacheEntry));

      // Aussi sauvegarder l'index pour le nettoyage
      await this.updateCacheIndex(config.key, ttl);
    } catch (error) {
      console.error('Erreur lors de la mise en cache:', error);
    }
  }

  /**
   * Récupérer des données du cache
   */
  async getCache<T>(key: string): Promise<T | null> {
    try {
      const config = this.cacheConfigs[key] || { key: `cache_${key}`, ttl: 30, version: 1 };
      const cached = await AsyncStorage.getItem(config.key);

      if (!cached) {
        return null;
      }

      const cacheEntry: CacheEntry<T> = JSON.parse(cached);

      // Vérifier la version
      if (cacheEntry.version !== config.version) {
        await this.removeCache(key);
        return null;
      }

      // Vérifier l'expiration
      const expirationTime = cacheEntry.timestamp + (config.ttl * 60 * 1000);
      if (Date.now() > expirationTime) {
        await this.removeCache(key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du cache:', error);
      return null;
    }
  }

  /**
   * Supprimer une entrée du cache
   */
  async removeCache(key: string): Promise<void> {
    try {
      const config = this.cacheConfigs[key] || { key: `cache_${key}`, ttl: 30, version: 1 };
      await AsyncStorage.removeItem(config.key);
      await this.removeCacheFromIndex(config.key);
    } catch (error) {
      console.error('Erreur lors de la suppression du cache:', error);
    }
  }

  /**
   * Effacer tout le cache
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = Object.values(this.cacheConfigs).map(config => config.key);
      await AsyncStorage.multiRemove(keys);
      await AsyncStorage.removeItem('cache_index');
    } catch (error) {
      console.error('Erreur lors de l\'effacement du cache:', error);
    }
  }

  /**
   * Nettoyer le cache expiré
   */
  async cleanExpiredCache(): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem('cache_index');
      if (!indexStr) return;

      const index = JSON.parse(indexStr);
      const now = Date.now();
      const updatedIndex: Record<string, number> = {};

      for (const [key, expiration] of Object.entries(index)) {
        if (now < (expiration as number)) {
          updatedIndex[key] = expiration as number;
        } else {
          await AsyncStorage.removeItem(key);
        }
      }

      await AsyncStorage.setItem('cache_index', JSON.stringify(updatedIndex));
    } catch (error) {
      console.error('Erreur lors du nettoyage du cache:', error);
    }
  }

  /**
   * Mettre à jour l'index du cache
   */
  private async updateCacheIndex(key: string, ttlMinutes: number): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem('cache_index');
      const index = indexStr ? JSON.parse(indexStr) : {};
      index[key] = Date.now() + (ttlMinutes * 60 * 1000);
      await AsyncStorage.setItem('cache_index', JSON.stringify(index));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'index:', error);
    }
  }

  /**
   * Retirer du cache de l'index
   */
  private async removeCacheFromIndex(key: string): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem('cache_index');
      if (!indexStr) return;

      const index = JSON.parse(indexStr);
      delete index[key];
      await AsyncStorage.setItem('cache_index', JSON.stringify(index));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'index:', error);
    }
  }

  /**
   * Ajouter une action à la queue de synchronisation
   */
  async queueSyncAction(
    type: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any
  ): Promise<SyncQueue> {
    const queueItem: SyncQueue = {
      id: `sync_${Date.now()}_${Math.random()}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.syncQueue.push(queueItem);
    await this.saveSyncQueue();
    this.emit('sync-queue-updated', this.syncQueue.length);

    // Si on est en ligne, traiter immédiatement
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue();
    }

    return queueItem;
  }

  /**
   * Traiter la queue de synchronisation
   */
  async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    this.emit('sync-start', this.syncQueue.length);

    const failedItems: SyncQueue[] = [];

    for (const item of this.syncQueue) {
      try {
        await this.processSyncItem(item);
        this.emit('sync-progress', {
          total: this.syncQueue.length,
          processed: this.syncQueue.indexOf(item) + 1,
        });
      } catch (error) {
        console.error('Erreur lors de la synchronisation:', error);
        item.retries++;

        if (item.retries < 3) {
          failedItems.push(item);
        } else {
          this.emit('sync-error', { item, error });
        }
      }
    }

    this.syncQueue = failedItems;
    await this.saveSyncQueue();

    this.syncInProgress = false;
    this.emit('sync-complete', {
      success: failedItems.length === 0,
      remaining: failedItems.length,
    });
    this.emit('sync-queue-updated', this.syncQueue.length);
  }

  /**
   * Traiter un élément de synchronisation
   */
  private async processSyncItem(item: SyncQueue): Promise<void> {
    const action = item.data?.action;

    switch (action) {
      case 'createReservation':
        await apiService.createReservation(item.data.payload);
        break;
      case 'cancelReservation':
        await apiService.cancelReservation(item.data.reservationId);
        break;
      default:
        console.warn('Action de synchronisation inconnue:', action);
        break;
    }
  }

  /**
   * Charger la queue de synchronisation
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem('sync_queue');
      this.syncQueue = queueStr ? JSON.parse(queueStr) : [];
    } catch (error) {
      console.error('Erreur lors du chargement de la queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Obtenir la taille actuelle de la file de synchronisation
   */
  getSyncQueueLength(): number {
    return this.syncQueue.length;
  }

  /**
   * Sauvegarder la queue de synchronisation
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la queue:', error);
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  async getCacheStats(): Promise<{
    itemCount: number;
    totalSize: number;
    oldestItem: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      let totalSize = 0;
      let oldestTimestamp = Date.now();

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          try {
            const entry = JSON.parse(value);
            if (entry.timestamp < oldestTimestamp) {
              oldestTimestamp = entry.timestamp;
            }
          } catch (e) {
            // Ignorer les erreurs de parsing
          }
        }
      }

      return {
        itemCount: cacheKeys.length,
        totalSize,
        oldestItem: oldestTimestamp,
      };
    } catch (error) {
      console.error('Erreur lors de l\'obtention des stats:', error);
      return {
        itemCount: 0,
        totalSize: 0,
        oldestItem: Date.now(),
      };
    }
  }

  /**
   * Écouter les événements
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
   * Retirer un listener
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
  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export default new OfflineService();