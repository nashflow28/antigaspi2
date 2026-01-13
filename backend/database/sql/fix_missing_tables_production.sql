-- =====================================================
-- Fix Missing Tables in Production
-- Date: 2026-01-13
-- Issues: GET /api/rewards and POST /api/surprise-baskets return Server Error
-- =====================================================

-- =====================================================
-- 1. CREATE REWARDS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS `rewards` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `points_required` INT NOT NULL,
    `type` ENUM('discount', 'product', 'voucher', 'experience') NOT NULL,
    `value` DECIMAL(10, 2) NULL,
    `value_type` VARCHAR(255) DEFAULT 'fixed',
    `quantity_available` INT NULL,
    `quantity_redeemed` INT DEFAULT 0,
    `valid_from` DATE NULL,
    `valid_until` DATE NULL,
    `tier_required` ENUM('bronze', 'silver', 'gold', 'platinum') NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    `is_featured` TINYINT(1) DEFAULT 0,
    `merchant_id` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    INDEX `rewards_is_active_valid_until_index` (`is_active`, `valid_until`),
    INDEX `rewards_tier_required_index` (`tier_required`),
    CONSTRAINT `rewards_merchant_id_foreign` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. CREATE REWARD_REDEMPTIONS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS `reward_redemptions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `reward_id` BIGINT UNSIGNED NOT NULL,
    `points_spent` INT NOT NULL,
    `redemption_code` VARCHAR(20) NOT NULL,
    `status` ENUM('pending', 'used', 'expired', 'cancelled') DEFAULT 'pending',
    `used_at` TIMESTAMP NULL,
    `expires_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `reward_redemptions_redemption_code_unique` (`redemption_code`),
    INDEX `reward_redemptions_user_id_status_index` (`user_id`, `status`),
    INDEX `reward_redemptions_redemption_code_index` (`redemption_code`),
    CONSTRAINT `reward_redemptions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `reward_redemptions_reward_id_foreign` FOREIGN KEY (`reward_id`) REFERENCES `rewards`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. CREATE SURPRISE_BASKET_ITEMS TABLE (if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS `surprise_basket_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `surprise_basket_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `quantity` INT DEFAULT 1,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    PRIMARY KEY (`id`),
    INDEX `surprise_basket_items_surprise_basket_id_index` (`surprise_basket_id`),
    INDEX `surprise_basket_items_product_id_index` (`product_id`),
    CONSTRAINT `surprise_basket_items_surprise_basket_id_foreign` FOREIGN KEY (`surprise_basket_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    CONSTRAINT `surprise_basket_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. ADD MISSING COLUMNS TO USERS TABLE
-- =====================================================

-- Add loyalty_tier column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'users';
SET @columnname = 'loyalty_tier';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    "ALTER TABLE users ADD COLUMN `loyalty_tier` ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze' AFTER `is_active`"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add lifetime_points column if it doesn't exist
SET @columnname = 'lifetime_points';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    "ALTER TABLE users ADD COLUMN `lifetime_points` INT DEFAULT 0 AFTER `loyalty_tier`"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add tier_updated_at column if it doesn't exist
SET @columnname = 'tier_updated_at';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    "ALTER TABLE users ADD COLUMN `tier_updated_at` TIMESTAMP NULL AFTER `lifetime_points`"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- 5. INSERT SAMPLE REWARDS (optional - for testing)
-- =====================================================
INSERT INTO `rewards` (`name`, `description`, `points_required`, `type`, `value`, `value_type`, `is_active`, `is_featured`, `created_at`, `updated_at`)
SELECT 'Réduction 10%', 'Obtenez 10% de réduction sur votre prochaine commande', 100, 'discount', 10, 'percentage', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `rewards` WHERE `name` = 'Réduction 10%');

INSERT INTO `rewards` (`name`, `description`, `points_required`, `type`, `value`, `value_type`, `is_active`, `is_featured`, `created_at`, `updated_at`)
SELECT 'Livraison gratuite', 'Livraison gratuite sur votre prochaine commande', 50, 'voucher', 500, 'fixed', 1, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `rewards` WHERE `name` = 'Livraison gratuite');

INSERT INTO `rewards` (`name`, `description`, `points_required`, `type`, `value`, `value_type`, `tier_required`, `is_active`, `is_featured`, `created_at`, `updated_at`)
SELECT 'Réduction 25%', 'Réduction VIP de 25% réservée aux membres Gold', 300, 'discount', 25, 'percentage', 'gold', 1, 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM `rewards` WHERE `name` = 'Réduction 25%');

-- =====================================================
-- VERIFICATION QUERIES (run after to confirm)
-- =====================================================
-- SELECT 'rewards' as table_name, COUNT(*) as row_count FROM rewards
-- UNION ALL
-- SELECT 'reward_redemptions', COUNT(*) FROM reward_redemptions
-- UNION ALL
-- SELECT 'surprise_basket_items', COUNT(*) FROM surprise_basket_items;

-- SHOW COLUMNS FROM users LIKE 'loyalty%';
-- SHOW COLUMNS FROM users LIKE 'lifetime%';
-- SHOW COLUMNS FROM users LIKE 'tier_updated%';
