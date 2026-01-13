-- ==========================================
-- Script SQL pour corriger les colonnes manquantes en production
-- Compatible MySQL (cPanel phpMyAdmin)
-- Base de données: c2621486c_antigaspi_db
-- Date: 13 Janvier 2026
-- INSTRUCTIONS: Exécuter chaque bloc séparément dans phpMyAdmin
-- ==========================================

-- ÉTAPE 1: Vérifier la structure actuelle de la table users
DESCRIBE users;

-- ==========================================
-- ÉTAPE 2: Ajouter les colonnes manquantes
-- Exécuter UNIQUEMENT les lignes pour les colonnes qui n'existent pas
-- ==========================================

-- 2.1 Colonne status (vérifier si elle existe d'abord)
-- ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'suspended', 'banned') DEFAULT 'active' AFTER role;

-- 2.2 Préférences de notification
-- ALTER TABLE users ADD COLUMN prefers_email_notifications TINYINT(1) DEFAULT 1;
-- ALTER TABLE users ADD COLUMN prefers_sms_notifications TINYINT(1) DEFAULT 0;
-- ALTER TABLE users ADD COLUMN prefers_push_notifications TINYINT(1) DEFAULT 0;

-- 2.3 Notification settings JSON
-- ALTER TABLE users ADD COLUMN notification_settings JSON NULL;

-- 2.4 Photo URL
-- ALTER TABLE users ADD COLUMN photo_url VARCHAR(255) NULL AFTER address;

-- 2.5 Phone verified at
-- ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMP NULL;

-- 2.6 Système de parrainage (CRITIQUE - bloque l'inscription)
-- ALTER TABLE users ADD COLUMN referral_code VARCHAR(10) NULL AFTER is_active;
-- ALTER TABLE users ADD COLUMN referred_by BIGINT UNSIGNED NULL;
-- ALTER TABLE users ADD COLUMN referral_bonus_awarded TINYINT(1) DEFAULT 0;

-- 2.7 Système de fidélité
-- ALTER TABLE users ADD COLUMN loyalty_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze';
-- ALTER TABLE users ADD COLUMN lifetime_points INT DEFAULT 0;
-- ALTER TABLE users ADD COLUMN tier_updated_at TIMESTAMP NULL;

-- ==========================================
-- ÉTAPE 3: Générer les codes de parrainage pour les utilisateurs existants
-- À exécuter APRÈS avoir ajouté la colonne referral_code
-- ==========================================

-- UPDATE users SET referral_code = UPPER(LEFT(MD5(CONCAT(id, NOW(), RAND())), 8)) WHERE referral_code IS NULL;

-- ==========================================
-- ÉTAPE 4: Ajouter l'index unique sur referral_code
-- ==========================================

-- CREATE UNIQUE INDEX users_referral_code_unique ON users(referral_code);

-- ==========================================
-- ÉTAPE 5: Vérifier le résultat final
-- ==========================================

-- DESCRIBE users;

-- ==========================================
-- FIN DU SCRIPT
-- ==========================================
