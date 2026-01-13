-- ==========================================
-- CORRECTIF URGENT - INSCRIPTION BLOQUÉE
-- À EXÉCUTER SUR phpMyAdmin (cPanel)
-- Base de données: c2621486c_antigaspi_db
-- Date: 13 Janvier 2026
--
-- PROBLÈME: L'inscription échoue avec l'erreur:
-- "Unknown column 'referral_code' in 'WHERE'"
-- ==========================================

-- ÉTAPE 1: Ajouter la colonne referral_code
ALTER TABLE users ADD COLUMN referral_code VARCHAR(10) NULL;

-- ÉTAPE 2: Ajouter l'index unique
ALTER TABLE users ADD UNIQUE INDEX users_referral_code_unique (referral_code);

-- ÉTAPE 3: Générer des codes pour les utilisateurs existants
UPDATE users SET referral_code = UPPER(SUBSTRING(MD5(CONCAT(id, NOW(), RAND())), 1, 8)) WHERE referral_code IS NULL;

-- ÉTAPE 4: Ajouter les colonnes dépendantes (referral system)
ALTER TABLE users ADD COLUMN referred_by BIGINT UNSIGNED NULL;
ALTER TABLE users ADD COLUMN referral_bonus_awarded TINYINT(1) DEFAULT 0;

-- VÉRIFICATION
SELECT id, email, referral_code FROM users LIMIT 5;
