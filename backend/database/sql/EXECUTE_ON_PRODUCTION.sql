-- ==========================================
-- SCRIPT DE MISE À JOUR - PRODUCTION ANTIGASPI
-- À EXÉCUTER SUR phpMyAdmin cPanel
-- Base de données: c2621486c_antigaspi_db
-- Date: 13 Janvier 2026
-- ==========================================

-- ATTENTION: Faire une sauvegarde AVANT d'exécuter ce script!

-- ==========================================
-- PARTIE 1: COLONNES SYSTÈME DE PARRAINAGE (CRITIQUE)
-- Ces colonnes sont REQUISES pour que l'inscription fonctionne
-- ==========================================

-- 1.1 Ajouter referral_code
ALTER TABLE users ADD COLUMN referral_code VARCHAR(10) NULL;

-- 1.2 Ajouter referred_by
ALTER TABLE users ADD COLUMN referred_by BIGINT UNSIGNED NULL;

-- 1.3 Ajouter referral_bonus_awarded
ALTER TABLE users ADD COLUMN referral_bonus_awarded TINYINT(1) DEFAULT 0;

-- 1.4 Créer l'index unique sur referral_code
ALTER TABLE users ADD UNIQUE INDEX users_referral_code_unique (referral_code);

-- 1.5 Générer des codes de parrainage pour les utilisateurs existants
UPDATE users SET referral_code = UPPER(SUBSTRING(MD5(CONCAT(id, UUID())), 1, 8)) WHERE referral_code IS NULL;

-- ==========================================
-- PARTIE 2: COLONNES DE FIDÉLITÉ
-- ==========================================

-- 2.1 Ajouter loyalty_tier
ALTER TABLE users ADD COLUMN loyalty_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze';

-- 2.2 Ajouter lifetime_points
ALTER TABLE users ADD COLUMN lifetime_points INT DEFAULT 0;

-- 2.3 Ajouter tier_updated_at
ALTER TABLE users ADD COLUMN tier_updated_at TIMESTAMP NULL;

-- ==========================================
-- PARTIE 3: COLONNES DE NOTIFICATION
-- ==========================================

-- 3.1 Préférences email
ALTER TABLE users ADD COLUMN prefers_email_notifications TINYINT(1) DEFAULT 1;

-- 3.2 Préférences SMS
ALTER TABLE users ADD COLUMN prefers_sms_notifications TINYINT(1) DEFAULT 0;

-- 3.3 Préférences Push
ALTER TABLE users ADD COLUMN prefers_push_notifications TINYINT(1) DEFAULT 0;

-- 3.4 Notification settings JSON
ALTER TABLE users ADD COLUMN notification_settings JSON NULL;

-- ==========================================
-- PARTIE 4: AUTRES COLONNES MANQUANTES
-- ==========================================

-- 4.1 Status (si manquant)
ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive', 'suspended', 'banned') DEFAULT 'active';

-- 4.2 Photo URL (si manquant)
ALTER TABLE users ADD COLUMN photo_url VARCHAR(255) NULL;

-- 4.3 Phone verified at
ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMP NULL;

-- ==========================================
-- PARTIE 5: TABLES REWARDS (si non existantes)
-- ==========================================

CREATE TABLE IF NOT EXISTS rewards (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image_url VARCHAR(255) NULL,
    points_required INT NOT NULL,
    type ENUM('discount', 'product', 'voucher', 'experience') NOT NULL,
    value DECIMAL(10, 2) NULL,
    value_type VARCHAR(50) DEFAULT 'fixed',
    quantity_available INT NULL,
    quantity_redeemed INT DEFAULT 0,
    valid_from DATE NULL,
    valid_until DATE NULL,
    tier_required ENUM('bronze', 'silver', 'gold', 'platinum') NULL,
    is_active TINYINT(1) DEFAULT 1,
    is_featured TINYINT(1) DEFAULT 0,
    merchant_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    reward_id BIGINT UNSIGNED NOT NULL,
    points_spent INT NOT NULL,
    redemption_code VARCHAR(20) NOT NULL,
    status ENUM('pending', 'used', 'expired', 'cancelled') DEFAULT 'pending',
    used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    UNIQUE INDEX redemption_code_unique (redemption_code)
);

-- ==========================================
-- VÉRIFICATION FINALE
-- ==========================================
SELECT 'Migration terminée!' AS result;
DESCRIBE users;
