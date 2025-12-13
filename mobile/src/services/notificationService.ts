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
import { getExpoExtraValue } from '../utils/expoConfig';
// BUG FIX #C-006: Use SecureStore for sensitive authentication data
import { secureStorage } from './secureStorage';
import { captureException, addBreadcrumb } from '../utils/sentryInit';
import { createLogger } from '../utils/logger';

const notificationLogger = createLogger('Notification');

// Configuration dynamique de l'API via app.json
const getApiBaseUrl = (): string => {
  const configUrl = getExpoExtraValue<string>('apiUrl')?.trim();
  if (configUrl) {
    return configUrl;
  }
  // 🐛 FIX: Changed port from 3000 to 8000 to match Laravel backend
  // 10.0.2.2 est l'adresse spéciale pour localhost sur émulateur Android
  return 'http://10.0.2.2:8000/api'
}

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
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

export interface LegacyNotificationPreferences {
  enabled: boolean;
  newProducts: boolean;
  reservations: boolean;
  promotions: boolean;
  expiringProducts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface NotificationChannelPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface ForegroundNotificationEvent {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

export interface NotificationNavigationEvent {
  screen: string;
  params?: Record<string, unknown>;
}

type NotificationEventMap = {
  contactPreferencesChanged: NotificationChannelPreferences;
  navigate: NotificationNavigationEvent;
  notificationReceived: ForegroundNotificationEvent;
};

type NotificationEventName = keyof NotificationEventMap;

type ListenerCallback<T> = (payload: T) => void;

class NotificationService {
  private http: AxiosInstance;
  private baseURL: string;
  private pushToken: string | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private listenersRegistered = false;
  private listeners: Map<NotificationEventName, Set<ListenerCallback<any>>> = new Map();
  private cachedLegacyPreferences: LegacyNotificationPreferences | null = null;
  private readonly legacyPreferencesEndpoint = '/notifications/settings';

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
        // BUG FIX #C-006: Use SecureStore for token retrieval
        const token = await secureStorage.getToken();

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
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
          notificationLogger.log('Les notifications push ne fonctionnent que sur un appareil physique');
          this.initialized = true;
          return;
        }

        const permissionGranted = await this.requestPermissions();

        if (!permissionGranted) {
          notificationLogger.log('Permissions de notification refusées');
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
        addBreadcrumb({
          category: 'notifications',
          message: 'Push notifications initialized',
          level: 'info',
          data: { hasToken: !!this.pushToken },
        });
      } catch (error) {
        captureException(error, { context: 'notification_init' });
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
        notificationLogger.log('Project ID non trouvé');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      return token.data;
    } catch (error) {
      notificationLogger.error('Erreur lors de l\'obtention du token:', error);
      return null;
    }
  }

  private async registerTokenIfNeeded(token: string): Promise<void> {
    // BUG FIX #12: Use secureStorage for user_data instead of AsyncStorage
    const [storedToken, storedOwner, userData] = await Promise.all([
      AsyncStorage.getItem('push_token'),
      AsyncStorage.getItem('push_token_user'),
      secureStorage.getUserData<{ id?: number | string }>(),
    ]);

    let currentUserId: string | undefined;

    if (userData?.id !== undefined && userData?.id !== null) {
      currentUserId = String(userData.id);
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

      addBreadcrumb({
        category: 'notifications',
        message: 'Push token registered with backend',
        level: 'info',
      });
    } catch (error) {
      captureException(error, { context: 'push_token_registration' });
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
      notificationLogger.log('Notification reçue:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listener pour les interactions avec les notifications
    Notifications.addNotificationResponseReceivedListener(response => {
      notificationLogger.log('Interaction avec notification:', response);
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

    const preferences = this.getLegacyPreferencesSnapshot();

    if (!preferences.enabled) {
      return;
    }

    // Traiter selon le type de notification
    if (data?.type) {
      if (data.type === 'new_product' && !preferences.newProducts) {
        return;
      }

      if (data.type === 'reservation_status' && !preferences.reservations) {
        return;
      }

      if (data.type === 'promotion' && !preferences.promotions) {
        return;
      }

      if (data.type === 'expiring_product' && !preferences.expiringProducts) {
        return;
      }

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

    this.emit('notificationReceived', {
      title: typeof title === 'string' ? title : undefined,
      body: typeof body === 'string' ? body : undefined,
      data,
    });
  }

  /**
   * Gérer l'interaction avec une notification
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { data } = response.notification.request.content;

    // Navigation selon le type
    if (data?.navigateTo) {
      const navigationPayload = this.normalizeNavigationTarget(data.navigateTo);

      if (navigationPayload) {
        // Émettre un événement pour la navigation
        this.emit('navigate', navigationPayload);
      }
    }
  }

  private normalizeNavigationTarget(
    navigateTo: unknown
  ): NotificationNavigationEvent | null {
    if (typeof navigateTo === 'string' && navigateTo.trim().length > 0) {
      return { screen: navigateTo };
    }

    if (navigateTo && typeof navigateTo === 'object') {
      const target = navigateTo as Record<string, unknown>;

      const screen = target.screen ?? target.name;

      if (typeof screen === 'string' && screen.trim().length > 0) {
        const params = target.params && typeof target.params === 'object'
          ? (target.params as Record<string, unknown>)
          : undefined;

        return {
          screen,
          params,
        };
      }
    }

    return null;
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
  private readonly legacyPreferencesStorageKey = 'notification_preferences';
  private readonly channelPreferencesStorageKey = 'notification_contact_preferences';

  async loadPreferences(): Promise<LegacyNotificationPreferences> {
    try {
      const response = await this.http.get(this.legacyPreferencesEndpoint);
      const payload = response.data?.data;
      const normalized = this.normalizeLegacyPreferences(payload);
      await this.persistLegacyPreferences(normalized);
      return normalized;
    } catch (error) {
      notificationLogger.warn('Impossible de synchroniser les préférences de notification distantes:', error);

      const cached = await this.getCachedLegacyPreferences();
      if (cached) {
        return cached;
      }

      const defaults = this.getDefaultPreferences();
      await this.persistLegacyPreferences(defaults);
      return defaults;
    }
  }

  /**
   * Sauvegarder les préférences de notification
   */
  async savePreferences(
    preferences: LegacyNotificationPreferences
  ): Promise<LegacyNotificationPreferences> {
    const normalizedInput = this.normalizeLegacyPreferences(preferences);

    try {
      const response = await this.http.patch(
        this.legacyPreferencesEndpoint,
        this.mapLegacyPreferencesToPayload(normalizedInput)
      );

      const payload = response.data?.data ?? normalizedInput;
      const normalized = this.normalizeLegacyPreferences(payload);
      await this.persistLegacyPreferences(normalized);
      return normalized;
    } catch (error) {
      notificationLogger.error('Erreur lors de la sauvegarde des préférences:', error);
      throw this.toError(error, "Impossible de sauvegarder vos préférences pour le moment.");
    }
  }

  /**
   * Obtenir les préférences par défaut
   */
  private getDefaultPreferences(): LegacyNotificationPreferences {
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

  private async persistLegacyPreferences(
    preferences: LegacyNotificationPreferences
  ): Promise<void> {
    this.cachedLegacyPreferences = preferences;

    try {
      await AsyncStorage.setItem(
        this.legacyPreferencesStorageKey,
        JSON.stringify(preferences)
      );
    } catch (error) {
      notificationLogger.warn('Impossible de mettre en cache les préférences de notification:', error);
    }
  }

  private async getCachedLegacyPreferences(): Promise<LegacyNotificationPreferences | null> {
    if (this.cachedLegacyPreferences) {
      return this.cachedLegacyPreferences;
    }

    try {
      const cached = await AsyncStorage.getItem(this.legacyPreferencesStorageKey);

      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached);
      const normalized = this.normalizeLegacyPreferences(parsed);
      this.cachedLegacyPreferences = normalized;
      return normalized;
    } catch (error) {
      notificationLogger.warn('Impossible de charger les préférences de notification en cache:', error);
      return null;
    }
  }

  private normalizeLegacyPreferences(
    input: unknown
  ): LegacyNotificationPreferences {
    const defaults = this.getDefaultPreferences();

    if (!input || typeof input !== 'object') {
      return { ...defaults };
    }

    const source = input as Record<string, unknown>;
    const getValue = (primary: string, secondary: string): unknown => {
      if (primary in source) {
        return source[primary];
      }
      if (secondary in source) {
        return source[secondary];
      }
      return undefined;
    };

    return {
      enabled: this.normalizeBoolean(
        getValue('enabled', 'enabled'),
        defaults.enabled
      ),
      newProducts: this.normalizeBoolean(
        getValue('new_products', 'newProducts'),
        defaults.newProducts
      ),
      reservations: this.normalizeBoolean(
        getValue('reservations', 'reservations'),
        defaults.reservations
      ),
      promotions: this.normalizeBoolean(
        getValue('promotions', 'promotions'),
        defaults.promotions
      ),
      expiringProducts: this.normalizeBoolean(
        getValue('expiring_products', 'expiringProducts'),
        defaults.expiringProducts
      ),
      quietHoursEnabled: this.normalizeBoolean(
        getValue('quiet_hours_enabled', 'quietHoursEnabled'),
        defaults.quietHoursEnabled
      ),
      quietHoursStart: this.normalizeTimeString(
        getValue('quiet_hours_start', 'quietHoursStart'),
        defaults.quietHoursStart
      ),
      quietHoursEnd: this.normalizeTimeString(
        getValue('quiet_hours_end', 'quietHoursEnd'),
        defaults.quietHoursEnd
      ),
    };
  }

  private mapLegacyPreferencesToPayload(
    preferences: LegacyNotificationPreferences
  ): Record<string, boolean | string> {
    return {
      enabled: preferences.enabled,
      new_products: preferences.newProducts,
      reservations: preferences.reservations,
      promotions: preferences.promotions,
      expiring_products: preferences.expiringProducts,
      quiet_hours_enabled: preferences.quietHoursEnabled,
      quiet_hours_start: preferences.quietHoursStart,
      quiet_hours_end: preferences.quietHoursEnd,
    };
  }

  private normalizeBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return ['true', '1', 'yes', 'on'].includes(normalized);
    }

    return fallback;
  }

  private normalizeTimeString(value: unknown, fallback: string): string {
    if (typeof value !== 'string') {
      return fallback;
    }

    const trimmed = value.trim();

    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    return fallback;
  }

  private timeStringToMinutes(value: string): number | null {
    if (!/^\d{2}:\d{2}$/.test(value)) {
      return null;
    }

    const [hours, minutes] = value.split(':').map(Number);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return hours * 60 + minutes;
  }

  private getLegacyPreferencesSnapshot(): LegacyNotificationPreferences {
    return this.cachedLegacyPreferences ?? this.getDefaultPreferences();
  }

  /**
   * Charger les préférences de communication (email / SMS / push) depuis l'API
   */
  async loadContactPreferences(): Promise<NotificationChannelPreferences> {
    try {
      const response = await this.http.get('/auth/me');
      const payload = response.data?.data ?? {};

      const preferences = this.normalizeChannelPreferences({
        email: payload.prefers_email_notifications,
        sms: payload.prefers_sms_notifications,
        push: payload.prefers_push_notifications,
      });

      await AsyncStorage.setItem(
        this.channelPreferencesStorageKey,
        JSON.stringify(preferences)
      );

      return preferences;
    } catch (error) {
      const cached = await this.getCachedChannelPreferences();
      if (cached) {
        return cached;
      }

      throw this.toError(error, 'Impossible de récupérer vos préférences pour le moment.');
    }
  }

  /**
   * Sauvegarder les préférences de communication côté API
   */
  async saveContactPreferences(
    preferences: NotificationChannelPreferences
  ): Promise<NotificationChannelPreferences> {
    try {
      const response = await this.http.patch('/notifications/preferences', {
        email: preferences.email,
        sms: preferences.sms,
        push: preferences.push,
      });

      const payload = response.data?.data ?? {};

      const normalized = this.normalizeChannelPreferences({
        email: payload.prefers_email_notifications ?? preferences.email,
        sms: payload.prefers_sms_notifications ?? preferences.sms,
        push: payload.prefers_push_notifications ?? preferences.push,
      });

      await AsyncStorage.setItem(
        this.channelPreferencesStorageKey,
        JSON.stringify(normalized)
      );

      this.emit('contactPreferencesChanged', normalized);

      return normalized;
    } catch (error) {
      throw this.toError(error, 'Impossible de sauvegarder vos préférences pour le moment.');
    }
  }

  private async getCachedChannelPreferences(): Promise<NotificationChannelPreferences | null> {
    try {
      const cached = await AsyncStorage.getItem(this.channelPreferencesStorageKey);
      if (!cached) {
        return null;
      }

      return this.normalizeChannelPreferences(JSON.parse(cached));
    } catch (error) {
      notificationLogger.warn('Impossible de charger les préférences de notification en cache:', error);
      return null;
    }
  }

  private normalizeChannelPreferences(
    preferences: Partial<NotificationChannelPreferences>
  ): NotificationChannelPreferences {
    return {
      email: preferences.email ?? true,
      sms: preferences.sms ?? false,
      push: preferences.push ?? true,
    };
  }

  private toError(error: unknown, fallbackMessage: string): Error {
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      (error as any).response?.data?.message
    ) {
      return new Error((error as any).response.data.message as string);
    }

    if (error instanceof Error && error.message) {
      return error;
    }

    return new Error(fallbackMessage);
  }

  /**
   * Vérifier si on est dans les heures calmes
   */
  private isInQuietHours(): boolean {
    const preferences = this.getLegacyPreferencesSnapshot();

    if (!preferences.quietHoursEnabled) {
      return false;
    }

    const startMinutes = this.timeStringToMinutes(preferences.quietHoursStart);
    const endMinutes = this.timeStringToMinutes(preferences.quietHoursEnd);

    if (startMinutes === null || endMinutes === null) {
      return false;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (startMinutes === endMinutes) {
      return true;
    }

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  /**
   * Gérer les notifications de nouveaux produits
   */
  private handleNewProductNotification(data: any): void {
    // Logique spécifique pour les nouveaux produits
    notificationLogger.log('Nouveau produit:', data);
  }

  /**
   * Gérer les notifications de réservation
   */
  private handleReservationNotification(data: any): void {
    // Logique spécifique pour les réservations
    notificationLogger.log('Mise à jour réservation:', data);
  }

  /**
   * Gérer les notifications de promotion
   */
  private handlePromotionNotification(data: any): void {
    // Logique spécifique pour les promotions
    notificationLogger.log('Nouvelle promotion:', data);
  }

  /**
   * Gérer les notifications de produits expirant
   */
  private handleExpiringProductNotification(data: any): void {
    // Logique spécifique pour les produits expirant
    notificationLogger.log('Produit expirant:', data);
  }

  /**
   * Émettre un événement (pour la navigation)
   */
  on<K extends NotificationEventName>(
    event: K,
    callback: ListenerCallback<NotificationEventMap[K]>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)?.add(callback as ListenerCallback<any>);
  }

  off<K extends NotificationEventName>(
    event: K,
    callback: ListenerCallback<NotificationEventMap[K]>
  ): void {
    const callbacks = this.listeners.get(event);

    if (!callbacks) {
      return;
    }

    callbacks.delete(callback as ListenerCallback<any>);

    if (callbacks.size === 0) {
      this.listeners.delete(event);
    }
  }

  private emit<K extends NotificationEventName>(
    event: K,
    data: NotificationEventMap[K]
  ): void {
    const callbacks = this.listeners.get(event);

    if (!callbacks) {
      return;
    }

    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        notificationLogger.error('Erreur lors du traitement de l\'événement de notification:', error);
      }
    });
  }

  async syncPushTokenOwnership(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    const tokenFromMemory = this.pushToken;
    let tokenToValidate = tokenFromMemory;

    if (!tokenToValidate) {
      tokenToValidate = await AsyncStorage.getItem('push_token');
    }

    if (!tokenToValidate) {
      return;
    }

    try {
      await this.registerTokenIfNeeded(tokenToValidate);
    } catch (error) {
      notificationLogger.error('Erreur lors de la synchronisation du token push:', error);
    }
  }
}

export default new NotificationService();