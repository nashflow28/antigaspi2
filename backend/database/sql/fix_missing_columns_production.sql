-- ==========================================
-- Script SQL pour corriger les colonnes manquantes en production
-- Base de données: c2621486c_antigaspi_db
-- Date: 13 Janvier 2026
-- ==========================================

-- 1. Ajouter la colonne status (si elle n'existe pas)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'suspended', 'banned')
DEFAULT 'active' AFTER role;

-- 2. Ajouter les préférences de notification (si elles n'existent pas)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS prefers_email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS prefers_sms_notifications BOOLEAN DEFAULT FALSE;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS prefers_push_notifications BOOLEAN DEFAULT FALSE;

-- 3. Ajouter notification_settings JSON (si elle n'existe pas)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS notification_settings JSON NULL;

-- 4. Ajouter photo_url (si elle n'existe pas)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255) NULL AFTER address;

-- 5. Ajouter phone_verified_at (si elle n'existe pas)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP NULL;

-- 6. Ajouter le système de parrainage (colonnes referral)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS referral_code VARCHAR(10) NULL AFTER is_active;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS referred_by BIGINT UNSIGNED NULL AFTER referral_code;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS referral_bonus_awarded BOOLEAN DEFAULT FALSE AFTER referred_by;

-- 7. Ajouter les colonnes de fidélité (loyalty)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS loyalty_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze' AFTER referral_bonus_awarded;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS lifetime_points INT DEFAULT 0 AFTER loyalty_tier;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS tier_updated_at TIMESTAMP NULL AFTER lifetime_points;

-- 8. Ajouter l'index unique sur referral_code (seulement si la colonne existe)
-- Note: Ignorer l'erreur si l'index existe déjà
CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique ON users(referral_code);

-- 9. Ajouter la clé étrangère pour referred_by (si elle n'existe pas)
-- Note: MySQL ne supporte pas "ADD CONSTRAINT IF NOT EXISTS" donc on ignore les erreurs
-- ALTER TABLE users
-- ADD CONSTRAINT fk_users_referred_by
-- FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL;

-- 10. Générer des codes de parrainage pour les utilisateurs existants
UPDATE users SET referral_code = UPPER(LEFT(MD5(CONCAT(id, NOW(), RAND())), 8)) WHERE referral_code IS NULL;

-- ==========================================
-- Vérification des tables rewards (créer si nécessaire)
-- ==========================================

-- Table rewards (catalogue des récompenses)
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
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    merchant_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_rewards_active_valid (is_active, valid_until),
    INDEX idx_rewards_tier (tier_required),
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL
);

-- Table reward_redemptions (échanges de récompenses)
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    reward_id BIGINT UNSIGNED NOT NULL,
    points_spent INT NOT NULL,
    redemption_code VARCHAR(20) NOT NULL UNIQUE,
    status ENUM('pending', 'used', 'expired', 'cancelled') DEFAULT 'pending',
    used_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_redemptions_user_status (user_id, status),
    INDEX idx_redemptions_code (redemption_code),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE
);

-- ==========================================
-- Fin du script
-- ==========================================
SELECT 'Migration des colonnes manquantes terminée avec succès!' AS message;
