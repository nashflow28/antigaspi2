/**
 * Service Analytics pour le tracking et les métriques
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';

export interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export interface UserProperties {
  userId: string;
  email?: string;
  role?: string;
  city?: string;
  createdAt?: Date;
  lastActiveAt?: Date;
  totalReservations?: number;
  totalSavings?: number;
}

export interface ScreenView {
  screenName: string;
  previousScreen?: string;
  duration?: number;
  timestamp: number;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp: number;
}

class AnalyticsService {
  private baseURL: string;
  private sessionId: string;
  private userId: string | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private screenStartTime: number = Date.now();
  private currentScreen: string = 'App';
  private isInitialized: boolean = false;
  private batchTimer: NodeJS.Timeout | null = null;

  // Configuration
  private readonly BATCH_SIZE = 20;
  private readonly BATCH_INTERVAL = 30000; // 30 secondes
  private readonly MAX_QUEUE_SIZE = 100;

  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    this.sessionId = this.generateSessionId();
  }

  /**
   * Initialiser le service analytics
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Définir l'utilisateur
      if (userId) {
        this.userId = userId;
      }

      // Charger les événements en attente
      await this.loadQueuedEvents();

      // Démarrer le batch processing
      this.startBatchProcessing();

      // Enregistrer la session
      await this.trackSessionStart();

      // Collecter les informations de l'appareil
      await this.collectDeviceInfo();

      this.isInitialized = true;
      console.log('Service Analytics initialisé');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation d\'Analytics:', error);
    }
  }

  /**
   * Définir l'utilisateur actuel
   */
  async setUser(properties: UserProperties): Promise<void> {
    this.userId = properties.userId;

    // Sauvegarder les propriétés utilisateur
    await AsyncStorage.setItem('analytics_user', JSON.stringify(properties));

    // Envoyer au backend
    this.track('User Identified', 'User', properties);
  }

  /**
   * Tracker un événement
   */
  async track(
    eventName: string,
    category: string = 'General',
    properties?: Record<string, any>
  ): Promise<void> {
    const event: AnalyticsEvent = {
      name: eventName,
      category,
      properties: {
        ...properties,
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version,
      },
      timestamp: Date.now(),
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
    };

    // Ajouter à la queue
    this.eventQueue.push(event);

    // Sauvegarder localement
    await this.saveQueuedEvents();

    // Si la queue est pleine, forcer l'envoi
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flushEvents();
    }
  }

  /**
   * Tracker une vue d'écran
   */
  async trackScreen(screenName: string, properties?: Record<string, any>): Promise<void> {
    // Calculer la durée sur l'écran précédent
    const duration = Date.now() - this.screenStartTime;

    // Tracker l'écran précédent avec sa durée
    if (this.currentScreen !== screenName) {
      await this.track('Screen View', 'Navigation', {
        screenName: this.currentScreen,
        duration: Math.round(duration / 1000), // en secondes
        nextScreen: screenName,
        ...properties,
      });
    }

    // Mettre à jour l'écran actuel
    this.currentScreen = screenName;
    this.screenStartTime = Date.now();
  }

  /**
   * Tracker un achat/paiement
   */
  async trackPurchase(
    amount: number,
    currency: string,
    paymentMethod: string,
    productId?: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track('Purchase', 'Revenue', {
      amount,
      currency,
      paymentMethod,
      productId,
      ...properties,
    });
  }

  /**
   * Tracker une réservation
   */
  async trackReservation(
    productId: string,
    quantity: number,
    totalAmount: number,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track('Reservation Created', 'Commerce', {
      productId,
      quantity,
      totalAmount,
      ...properties,
    });
  }

  /**
   * Tracker une erreur
   */
  async trackError(
    error: Error,
    context?: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track('Error', 'System', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      context,
      ...properties,
    });
  }

  /**
   * Tracker une métrique de performance
   */
  async trackPerformance(
    metricName: string,
    value: number,
    unit: string = 'ms',
    tags?: Record<string, string>
  ): Promise<void> {
    const metric: PerformanceMetric = {
      name: metricName,
      value,
      unit,
      tags,
      timestamp: Date.now(),
    };

    await this.track('Performance Metric', 'Performance', metric);
  }

  /**
   * Tracker le temps de chargement d'une API
   */
  async trackApiCall(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    success: boolean
  ): Promise<void> {
    await this.track('API Call', 'Performance', {
      endpoint,
      method,
      duration,
      statusCode,
      success,
    });
  }

  /**
   * Tracker une interaction utilisateur
   */
  async trackInteraction(
    element: string,
    action: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track('User Interaction', 'Engagement', {
      element,
      action,
      screen: this.currentScreen,
      ...properties,
    });
  }

  /**
   * Tracker le démarrage de session
   */
  private async trackSessionStart(): Promise<void> {
    await this.track('Session Start', 'Session', {
      sessionId: this.sessionId,
      deviceInfo: await this.getDeviceInfo(),
    });
  }

  /**
   * Tracker la fin de session
   */
  async trackSessionEnd(): Promise<void> {
    const duration = Date.now() - parseInt(this.sessionId.split('-')[0]);

    await this.track('Session End', 'Session', {
      sessionId: this.sessionId,
      duration: Math.round(duration / 1000), // en secondes
    });

    // Forcer l'envoi des événements restants
    await this.flushEvents();
  }

  /**
   * Collecter les informations de l'appareil
   */
  private async collectDeviceInfo(): Promise<void> {
    const info = await this.getDeviceInfo();
    await this.track('Device Info', 'System', info);
  }

  /**
   * Obtenir les informations de l'appareil
   */
  private async getDeviceInfo(): Promise<Record<string, any>> {
    return {
      brand: Device.brand,
      manufacturer: Device.manufacturer,
      modelName: Device.modelName,
      modelId: Device.modelId,
      deviceYearClass: Device.deviceYearClass,
      totalMemory: Device.totalMemory,
      osName: Device.osName,
      osVersion: Device.osVersion,
      platformApiLevel: Device.platformApiLevel,
      deviceType: Device.deviceType,
      isDevice: Device.isDevice,
    };
  }

  /**
   * Générer un ID de session unique
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Démarrer le traitement par batch
   */
  private startBatchProcessing(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.BATCH_INTERVAL);
  }

  /**
   * Arrêter le traitement par batch
   */
  stopBatchProcessing(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Envoyer les événements au backend
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await axios.post(`${this.baseURL}/analytics/events`, {
        events: eventsToSend,
        sessionId: this.sessionId,
        userId: this.userId,
      });

      // Effacer les événements sauvegardés
      await AsyncStorage.removeItem('analytics_queue');
    } catch (error) {
      console.error('Erreur lors de l\'envoi des événements:', error);

      // Remettre les événements dans la queue
      this.eventQueue = [...eventsToSend, ...this.eventQueue];

      // Limiter la taille de la queue
      if (this.eventQueue.length > this.MAX_QUEUE_SIZE) {
        this.eventQueue = this.eventQueue.slice(-this.MAX_QUEUE_SIZE);
      }

      await this.saveQueuedEvents();
    }
  }

  /**
   * Charger les événements en attente
   */
  private async loadQueuedEvents(): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem('analytics_queue');
      if (queueStr) {
        this.eventQueue = JSON.parse(queueStr);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    }
  }

  /**
   * Sauvegarder les événements en attente
   */
  private async saveQueuedEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem('analytics_queue', JSON.stringify(this.eventQueue));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des événements:', error);
    }
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  async getUsageStats(): Promise<Record<string, any>> {
    try {
      const response = await axios.get(`${this.baseURL}/analytics/stats`, {
        params: { userId: this.userId },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'obtention des stats:', error);
      return {};
    }
  }

  /**
   * Réinitialiser les analytics
   */
  async reset(): Promise<void> {
    this.userId = null;
    this.eventQueue = [];
    this.sessionId = this.generateSessionId();
    await AsyncStorage.removeItem('analytics_queue');
    await AsyncStorage.removeItem('analytics_user');
  }
}

export default new AnalyticsService();