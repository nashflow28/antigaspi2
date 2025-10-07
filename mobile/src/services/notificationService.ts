/**
 * Service de Notifications Push avec Expo
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { designSystem2025 } from '../theme/designSystem2025';

// Configuration dynamique de l'API via app.json
const getApiBaseUrl = (): string => {
  const configUrl = Constants.expoConfig?.extra?.apiUrl
  if (configUrl && typeof configUrl === 'string') {
    return configUrl
  }
  // Fallback pour développement local
  return 'http://localhost:8000/api'
}

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  id?: string;
  title: string;
  body: string;
  data?: any;
  badge?: number;
  sound?: boolean;
  categoryId?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  newProducts: boolean;
  reservations: boolean;
  promotions: boolean;
  expiringProducts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

class NotificationService {
  private http: AxiosInstance;
  private baseURL: string;
  private pushToken: string | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private listenersRegistered = false;

  constructor() {
    this.baseURL = getApiBaseUrl();
    this.http = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.http.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');

        if (token) {
          if (!config.headers) {
            config.headers = {};
          }

          (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  /**
   * Initialiser le service de notifications
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        if (!Device.isDevice) {
          console.log('Les notifications push ne fonctionnent que sur un appareil physique');
          this.initialized = true;
          return;
        }

        const permissionGranted = await this.requestPermissions();

        if (!permissionGranted) {
          console.log('Permissions de notification refusées');
          this.initialized = true;
          return;
        }

        const token = await this.getExpoPushToken();

        if (token) {
          this.pushToken = token;
          await this.registerTokenIfNeeded(token);
        }

        this.setupNotificationListeners();
        await this.loadPreferences();

        this.initialized = true;
        console.log('Service de notifications initialisé avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des notifications:', error);
        throw error;
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * Demander les permissions de notification
   */
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Sur Android, créer un canal de notification
    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
    }

    return true;
  }

  /**
   * Configurer les canaux Android
   */
  private async setupAndroidChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      // Canal pour les nouveaux produits
      await Notifications.setNotificationChannelAsync('new-products', {
        name: 'Nouveaux Produits',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: designSystem2025.colors.semantic.success,
        sound: 'default',
      });

      // Canal pour les réservations
      await Notifications.setNotificationChannelAsync('reservations', {
        name: 'Réservations',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: designSystem2025.colors.semantic.warning,
        sound: 'default',
      });

      // Canal pour les promotions
      await Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promotions',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: designSystem2025.colors.semantic.info,
        sound: 'default',
      });

      // Canal pour les produits expirant
      await Notifications.setNotificationChannelAsync('expiring-products', {
        name: 'Produits Expirant',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500],
        lightColor: designSystem2025.colors.semantic.error,
        sound: 'default',
      });
    }
  }

  /**
   * Obtenir le token Expo Push
   */
  private async getExpoPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ||
                       Constants.easConfig?.projectId;

      if (!projectId) {
        console.log('Project ID non trouvé');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      return token.data;
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token:', error);
      return null;
    }
  }

  private async registerTokenIfNeeded(token: string): Promise<void> {
    const [storedToken, storedOwner, userDataRaw] = await Promise.all([
      AsyncStorage.getItem('push_token'),
      AsyncStorage.getItem('push_token_user'),
      AsyncStorage.getItem('user_data'),
    ]);

    let currentUserId: string | undefined;

    if (userDataRaw) {
      try {
        const parsed = JSON.parse(userDataRaw);

        if (parsed?.id !== undefined && parsed?.id !== null) {
          currentUserId = String(parsed.id);
        }
      } catch (error) {
        console.error('Impossible de lire les données utilisateur pour les notifications push:', error);
      }
    }

    if (storedToken === token && storedOwner && currentUserId && storedOwner === currentUserId) {
      return;
    }

    await this.registerTokenWithBackend(token, currentUserId);
  }

  /**
   * Enregistrer le token avec le backend
   */
  private async registerTokenWithBackend(token: string, userId?: string): Promise<void> {
    try {
      await this.http.post('/notifications/register', {
        token: token,
        platform: Platform.OS,
        device_model: Device.modelName,
        app_version: Constants.expoConfig?.version,
        project_id: Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId,
      });

      await AsyncStorage.setItem('push_token', token);

      if (userId) {
        await AsyncStorage.setItem('push_token_user', userId);
      } else {
        await AsyncStorage.removeItem('push_token_user');
      }
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token:', error);
      throw error;
    }
  }

  /**
   * Configurer les listeners de notifications
   */
  private setupNotificationListeners(): void {
    if (this.listenersRegistered) {
      return;
    }

    this.listenersRegistered = true;

    // Listener pour les notifications reçues quand l'app est ouverte
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener pour les interactions avec les notifications
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Interaction avec notification:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Gérer une notification reçue
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const { title, body, data } = notification.request.content;

    // Vérifier les heures calmes
    if (this.isInQuietHours()) {
      return;
    }

    // Traiter selon le type de notification
    if (data?.type) {
      switch (data.type) {
        case 'new_product':
          this.handleNewProductNotification(data);
          break;
        case 'reservation_status':
          this.handleReservationNotification(data);
          break;
        case 'promotion':
          this.handlePromotionNotification(data);
          break;
        case 'expiring_product':
          this.handleExpiringProductNotification(data);
          break;
      }
    }

    // Mettre à jour le badge
    this.updateBadge();
  }

  /**
   * Gérer l'interaction avec une notification
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;

    // Navigation selon le type
    if (data?.navigateTo) {
      // Émettre un événement pour la navigation
      this.emit('navigate', data.navigateTo);
    }
  }

  /**
   * Planifier une notification locale
   */
  async scheduleLocalNotification(notification: NotificationData): Promise<string> {
    const trigger = notification.data?.trigger || { seconds: 1 };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data,
        badge: notification.badge,
        sound: notification.sound ? 'default' : undefined,
        categoryIdentifier: notification.categoryId,
      },
      trigger,
    });

    return id;
  }

  /**
   * Annuler une notification planifiée
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Annuler toutes les notifications planifiées
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Obtenir les notifications planifiées
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  /**
   * Mettre à jour le badge de l'application
   */
  async updateBadge(count?: number): Promise<void> {
    if (count !== undefined) {
      await Notifications.setBadgeCountAsync(count);
    } else {
      // NOTE: Endpoint /notifications/badge n'existe pas dans l'API Laravel
      // Utiliser le badge local uniquement ou implémenter l'endpoint backend
      await Notifications.setBadgeCountAsync(0);
    }
  }

  /**
   * Effacer le badge
   */
  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Charger les préférences de notification
   */
  async loadPreferences(): Promise<NotificationPreferences> {
    try {
      const prefs = await AsyncStorage.getItem('notification_preferences');
      return prefs ? JSON.parse(prefs) : this.getDefaultPreferences();
    } catch (error) {
      return this.getDefaultPreferences();
    }
  }

  /**
   * Sauvegarder les préférences de notification
   */
  async savePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_preferences', JSON.stringify(preferences));

      // NOTE: L'API Laravel attend PATCH /users/{id} avec prefers_email_notifications,
      // prefers_sms_notifications, prefers_push_notifications (booléens)
      // POST /notifications/preferences n'existe pas
      // TODO: Implémenter l'appel correct vers /users/{userId} avec PATCH

      // Synchronisation backend désactivée temporairement
      // await this.http.post('/notifications/preferences', preferences);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences:', error);
    }
  }

  /**
   * Obtenir les préférences par défaut
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      newProducts: true,
      reservations: true,
      promotions: true,
      expiringProducts: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    };
  }

  /**
   * Vérifier si on est dans les heures calmes
   */
  private isInQuietHours(): boolean {
    // TODO: Implémenter la logique des heures calmes
    return false;
  }

  /**
   * Gérer les notifications de nouveaux produits
   */
  private handleNewProductNotification(data: any): void {
    // Logique spécifique pour les nouveaux produits
    console.log('Nouveau produit:', data);
  }

  /**
   * Gérer les notifications de réservation
   */
  private handleReservationNotification(data: any): void {
    // Logique spécifique pour les réservations
    console.log('Mise à jour réservation:', data);
  }

  /**
   * Gérer les notifications de promotion
   */
  private handlePromotionNotification(data: any): void {
    // Logique spécifique pour les promotions
    console.log('Nouvelle promotion:', data);
  }

  /**
   * Gérer les notifications de produits expirant
   */
  private handleExpiringProductNotification(data: any): void {
    // Logique spécifique pour les produits expirant
    console.log('Produit expirant:', data);
  }

  /**
   * Émettre un événement (pour la navigation)
   */
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export default new NotificationService();