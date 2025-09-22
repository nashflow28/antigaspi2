/**
 * Service de Notifications Push avec Expo
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

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
  private baseURL: string;
  private pushToken: string | null = null;

  constructor() {
    this.baseURL = 'http://localhost:8000/api';
  }

  /**
   * Initialiser le service de notifications
   */
  async initialize(): Promise<void> {
    try {
      // Vérifier si c'est un appareil physique
      if (!Device.isDevice) {
        console.log('Les notifications push ne fonctionnent que sur un appareil physique');
        return;
      }

      // Demander les permissions
      const permission = await this.requestPermissions();
      if (!permission) {
        console.log('Permissions de notification refusées');
        return;
      }

      // Obtenir le token Expo Push
      const token = await this.getExpoPushToken();
      if (token) {
        this.pushToken = token;
        await this.registerTokenWithBackend(token);
      }

      // Configurer les listeners
      this.setupNotificationListeners();

      // Charger les préférences
      await this.loadPreferences();

      console.log('Service de notifications initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
    }
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
        lightColor: '#10B981',
        sound: 'default',
      });

      // Canal pour les réservations
      await Notifications.setNotificationChannelAsync('reservations', {
        name: 'Réservations',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F59E0B',
        sound: 'default',
      });

      // Canal pour les promotions
      await Notifications.setNotificationChannelAsync('promotions', {
        name: 'Promotions',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3B82F6',
        sound: 'default',
      });

      // Canal pour les produits expirant
      await Notifications.setNotificationChannelAsync('expiring-products', {
        name: 'Produits Expirant',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500],
        lightColor: '#EF4444',
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

  /**
   * Enregistrer le token avec le backend
   */
  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/notifications/register`, {
        token: token,
        platform: Platform.OS,
        device_model: Device.modelName,
        app_version: Constants.expoConfig?.version,
      });

      // Sauvegarder localement
      await AsyncStorage.setItem('push_token', token);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token:', error);
    }
  }

  /**
   * Configurer les listeners de notifications
   */
  private setupNotificationListeners(): void {
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
      // Obtenir le nombre depuis le backend
      try {
        const response = await axios.get(`${this.baseURL}/notifications/badge`);
        await Notifications.setBadgeCountAsync(response.data.count || 0);
      } catch (error) {
        console.error('Erreur lors de la mise à jour du badge:', error);
      }
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
      // Synchroniser avec le backend
      await axios.post(`${this.baseURL}/notifications/preferences`, preferences);
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