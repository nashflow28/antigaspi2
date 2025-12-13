/**
 * Cache Manager avec limite de taille et stratégie LRU (Least Recently Used)
 * Évite la saturation d'AsyncStorage en supprimant les entrées les plus anciennes
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createLogger } from './logger'

const cacheLogger = createLogger('Cache')

/**
 * Configuration du cache manager
 */
export interface CacheManagerConfig {
  maxSizeBytes: number // Taille maximale en bytes (défaut: 50MB)
  warningThresholdPercent: number // Seuil d'avertissement en % (défaut: 80%)
}

/**
 * Métadonnées d'une entrée de cache pour LRU
 */
interface CacheMetadata {
  key: string
  size: number // Taille en bytes
  lastAccessed: number // Timestamp dernier accès
  created: number // Timestamp création
}

const DEFAULT_CONFIG: CacheManagerConfig = {
  maxSizeBytes: 50 * 1024 * 1024, // 50 MB
  warningThresholdPercent: 80, // Warn à 80%
}

const METADATA_KEY = 'cache_metadata_index'

class CacheManager {
  private config: CacheManagerConfig

  constructor(config?: Partial<CacheManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Obtenir les métadonnées du cache
   */
  private async getMetadata(): Promise<Record<string, CacheMetadata>> {
    try {
      const metadataStr = await AsyncStorage.getItem(METADATA_KEY)
      return metadataStr ? JSON.parse(metadataStr) : {}
    } catch (error) {
      cacheLogger.error('Error reading cache metadata:', error)
      return {}
    }
  }

  /**
   * Sauvegarder les métadonnées du cache
   */
  private async saveMetadata(metadata: Record<string, CacheMetadata>): Promise<void> {
    try {
      await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(metadata))
    } catch (error) {
      cacheLogger.error('Error saving cache metadata:', error)
    }
  }

  /**
   * Calculer la taille d'une valeur en bytes
   */
  private calculateSize(value: string): number {
    // UTF-16 encoding: 2 bytes per character
    return value.length * 2
  }

  /**
   * Calculer la taille totale du cache
   */
  private calculateTotalSize(metadata: Record<string, CacheMetadata>): number {
    return Object.values(metadata).reduce((total, entry) => total + entry.size, 0)
  }

  /**
   * Appliquer la stratégie LRU: supprimer les entrées les plus anciennes
   */
  private async evictLRU(metadata: Record<string, CacheMetadata>, requiredSpace: number): Promise<void> {
    // Trier par lastAccessed (plus ancien en premier)
    const sortedEntries = Object.values(metadata).sort(
      (a, b) => a.lastAccessed - b.lastAccessed
    )

    let freedSpace = 0
    const keysToRemove: string[] = []

    for (const entry of sortedEntries) {
      if (freedSpace >= requiredSpace) break

      keysToRemove.push(entry.key)
      freedSpace += entry.size
    }

    // Supprimer les entrées
    for (const key of keysToRemove) {
      try {
        await AsyncStorage.removeItem(key)
        delete metadata[key]
        cacheLogger.log(`Evicted LRU entry: ${key} (freed ${metadata[key]?.size || 0} bytes)`)
      } catch (error) {
        cacheLogger.error(`Error removing cache entry ${key}:`, error)
      }
    }

    await this.saveMetadata(metadata)
    cacheLogger.log(`LRU eviction complete. Freed ${freedSpace} bytes (${keysToRemove.length} entries)`)
  }

  /**
   * Vérifier et appliquer la limite de taille du cache
   */
  private async enforceSizeLimit(newEntrySize: number): Promise<void> {
    const metadata = await this.getMetadata()
    const currentSize = this.calculateTotalSize(metadata)
    const totalAfterAdd = currentSize + newEntrySize

    if (totalAfterAdd > this.config.maxSizeBytes) {
      const requiredSpace = totalAfterAdd - this.config.maxSizeBytes
      cacheLogger.warn(
        `Cache size limit exceeded. Current: ${this.formatSize(currentSize)}, ` +
          `After add: ${this.formatSize(totalAfterAdd)}, ` +
          `Max: ${this.formatSize(this.config.maxSizeBytes)}. ` +
          `Evicting ${this.formatSize(requiredSpace)}...`
      )
      await this.evictLRU(metadata, requiredSpace)
    } else {
      const usagePercent = (totalAfterAdd / this.config.maxSizeBytes) * 100
      if (usagePercent >= this.config.warningThresholdPercent) {
        cacheLogger.warn(
          `Cache usage at ${usagePercent.toFixed(1)}% ` +
            `(${this.formatSize(totalAfterAdd)} / ${this.formatSize(this.config.maxSizeBytes)})`
        )
      }
    }
  }

  /**
   * Enregistrer une entrée dans le cache avec tracking de taille
   */
  async set(key: string, value: string): Promise<void> {
    const size = this.calculateSize(value)

    // Vérifier et libérer de l'espace si nécessaire
    await this.enforceSizeLimit(size)

    // Sauvegarder la valeur
    await AsyncStorage.setItem(key, value)

    // Mettre à jour les métadonnées
    const metadata = await this.getMetadata()
    metadata[key] = {
      key,
      size,
      lastAccessed: Date.now(),
      created: Date.now(),
    }
    await this.saveMetadata(metadata)
  }

  /**
   * Récupérer une entrée du cache et mettre à jour lastAccessed
   */
  async get(key: string): Promise<string | null> {
    const value = await AsyncStorage.getItem(key)

    if (value) {
      // Mettre à jour lastAccessed pour LRU
      const metadata = await this.getMetadata()
      if (metadata[key]) {
        metadata[key].lastAccessed = Date.now()
        await this.saveMetadata(metadata)
      }
    }

    return value
  }

  /**
   * Supprimer une entrée du cache
   */
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key)

    // Mettre à jour les métadonnées
    const metadata = await this.getMetadata()
    delete metadata[key]
    await this.saveMetadata(metadata)
  }

  /**
   * Obtenir les statistiques du cache
   */
  async getStats(): Promise<{
    totalSize: number
    totalSizeFormatted: string
    maxSize: number
    maxSizeFormatted: string
    usagePercent: number
    entryCount: number
    oldestEntry: CacheMetadata | null
    newestEntry: CacheMetadata | null
  }> {
    const metadata = await this.getMetadata()
    const entries = Object.values(metadata)
    const totalSize = this.calculateTotalSize(metadata)
    const usagePercent = (totalSize / this.config.maxSizeBytes) * 100

    const oldestEntry = entries.length
      ? entries.reduce((oldest, entry) =>
          entry.lastAccessed < oldest.lastAccessed ? entry : oldest
        )
      : null

    const newestEntry = entries.length
      ? entries.reduce((newest, entry) =>
          entry.lastAccessed > newest.lastAccessed ? entry : newest
        )
      : null

    return {
      totalSize,
      totalSizeFormatted: this.formatSize(totalSize),
      maxSize: this.config.maxSizeBytes,
      maxSizeFormatted: this.formatSize(this.config.maxSizeBytes),
      usagePercent: Math.round(usagePercent * 10) / 10,
      entryCount: entries.length,
      oldestEntry,
      newestEntry,
    }
  }

  /**
   * Nettoyer tout le cache
   */
  async clear(): Promise<void> {
    const metadata = await this.getMetadata()
    const keys = Object.keys(metadata)

    for (const key of keys) {
      await AsyncStorage.removeItem(key)
    }

    await AsyncStorage.removeItem(METADATA_KEY)
    cacheLogger.log(`Cleared ${keys.length} cache entries`)
  }

  /**
   * Formater une taille en bytes vers format lisible
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }
}

// Singleton instance
export const cacheManager = new CacheManager()
export default cacheManager
