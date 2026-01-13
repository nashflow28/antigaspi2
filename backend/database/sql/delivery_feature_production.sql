-- ============================================================================
-- ANTIGASPI - DELIVERY FEATURE - SCRIPTS SQL PRODUCTION
-- ============================================================================
-- A exécuter sur la base de données en ligne: c2621486c_antigaspi_db
-- Date: 12 Janvier 2025
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Modifier la table users pour ajouter le rôle driver
-- ============================================================================

ALTER TABLE users
MODIFY COLUMN role ENUM('consumer', 'merchant', 'admin', 'driver') DEFAULT 'consumer';

-- ============================================================================
-- ÉTAPE 2: Créer la table delivery_zones (zones de livraison)
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_zones (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    base_fee DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
    price_per_km DECIMAL(10, 2) NOT NULL DEFAULT 150.00,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_distance_km DECIMAL(5, 2) DEFAULT 15.00,
    is_active BOOLEAN DEFAULT TRUE,
    polygon JSON NULL COMMENT 'GeoJSON polygon pour définir la zone',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_delivery_zones_city (city),
    INDEX idx_delivery_zones_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ÉTAPE 3: Créer la table delivery_drivers (profils livreurs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_drivers (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    vehicle_type ENUM('moto', 'velo', 'voiture', 'pied') DEFAULT 'moto',
    vehicle_plate VARCHAR(20) NULL,
    license_number VARCHAR(50) NULL,

    -- Statut
    is_available BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Position actuelle
    current_latitude DECIMAL(10, 8) NULL,
    current_longitude DECIMAL(11, 8) NULL,
    last_location_update TIMESTAMP NULL,

    -- Zone de travail
    delivery_zone_id BIGINT UNSIGNED NULL,

    -- Statistiques
    rating DECIMAL(3, 2) DEFAULT 5.00,
    total_deliveries INT UNSIGNED DEFAULT 0,
    total_earnings DECIMAL(12, 2) DEFAULT 0,

    -- Documents (URLs)
    id_card_url VARCHAR(500) NULL,
    license_url VARCHAR(500) NULL,
    photo_url VARCHAR(500) NULL,

    -- Vérification
    verified_at TIMESTAMP NULL,
    verified_by BIGINT UNSIGNED NULL,
    rejection_reason TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (delivery_zone_id) REFERENCES delivery_zones(id) ON DELETE SET NULL,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_drivers_available (is_available, is_verified, is_active),
    INDEX idx_drivers_location (current_latitude, current_longitude),
    INDEX idx_drivers_zone (delivery_zone_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ÉTAPE 4: Créer la table deliveries (livraisons)
-- ============================================================================

CREATE TABLE IF NOT EXISTS deliveries (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    reservation_id BIGINT UNSIGNED NOT NULL,
    driver_id BIGINT UNSIGNED NULL,
    delivery_zone_id BIGINT UNSIGNED NULL,

    -- Code unique de livraison
    delivery_code VARCHAR(20) NOT NULL UNIQUE,

    -- Statut
    status ENUM(
        'pending',           -- En attente d'un livreur
        'searching',         -- Recherche d'un livreur
        'assigned',          -- Livreur assigné
        'picking_up',        -- Livreur en route vers merchant
        'picked_up',         -- Colis récupéré
        'delivering',        -- En cours de livraison
        'delivered',         -- Livré
        'cancelled',         -- Annulé
        'failed'             -- Échec de livraison
    ) DEFAULT 'pending',

    -- Adresse de pickup (merchant)
    pickup_address TEXT NOT NULL,
    pickup_latitude DECIMAL(10, 8) NOT NULL,
    pickup_longitude DECIMAL(11, 8) NOT NULL,
    pickup_instructions TEXT NULL,

    -- Adresse de livraison (consumer)
    delivery_address TEXT NOT NULL,
    delivery_latitude DECIMAL(10, 8) NOT NULL,
    delivery_longitude DECIMAL(11, 8) NOT NULL,
    delivery_instructions TEXT NULL,

    -- Contact consumer (optionnel - utilise info de l'utilisateur si absent)
    recipient_name VARCHAR(100) NULL,
    recipient_phone VARCHAR(20) NULL,

    -- Tarification
    delivery_fee DECIMAL(10, 2) NOT NULL,
    driver_commission DECIMAL(10, 2) NOT NULL,
    platform_commission DECIMAL(10, 2) NOT NULL,
    distance_km DECIMAL(5, 2) NULL,
    estimated_duration_min INT UNSIGNED NULL,

    -- Timestamps d'événements
    assigned_at TIMESTAMP NULL,
    picked_up_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    cancelled_at TIMESTAMP NULL,

    -- ETA
    estimated_pickup_at TIMESTAMP NULL,
    estimated_delivery_at TIMESTAMP NULL,

    -- Notes et feedback
    cancellation_reason TEXT NULL,
    cancelled_by ENUM('consumer', 'merchant', 'driver', 'system') NULL,
    failure_reason TEXT NULL,
    driver_notes TEXT NULL,

    -- Rating
    consumer_rating TINYINT UNSIGNED NULL CHECK (consumer_rating BETWEEN 1 AND 5),
    consumer_feedback TEXT NULL,
    merchant_rating TINYINT UNSIGNED NULL CHECK (merchant_rating BETWEEN 1 AND 5),

    -- Proof of delivery
    delivery_photo_url VARCHAR(500) NULL,
    signature_url VARCHAR(500) NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES delivery_drivers(id) ON DELETE SET NULL,
    FOREIGN KEY (delivery_zone_id) REFERENCES delivery_zones(id) ON DELETE SET NULL,

    INDEX idx_deliveries_status (status),
    INDEX idx_deliveries_driver (driver_id, status),
    INDEX idx_deliveries_reservation (reservation_id),
    INDEX idx_deliveries_created (created_at),
    INDEX idx_deliveries_code (delivery_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ÉTAPE 5: Créer la table delivery_tracking (historique GPS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_tracking (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    delivery_id BIGINT UNSIGNED NOT NULL,
    driver_id BIGINT UNSIGNED NOT NULL,

    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(6, 2) NULL COMMENT 'Précision GPS en mètres',
    speed DECIMAL(5, 2) NULL COMMENT 'Vitesse en km/h',
    heading DECIMAL(5, 2) NULL COMMENT 'Direction en degrés',
    altitude DECIMAL(7, 2) NULL,

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES delivery_drivers(id) ON DELETE CASCADE,

    INDEX idx_tracking_delivery (delivery_id, recorded_at),
    INDEX idx_tracking_driver (driver_id, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ÉTAPE 6: Créer la table driver_earnings (gains livreurs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS driver_earnings (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    driver_id BIGINT UNSIGNED NOT NULL,
    delivery_id BIGINT UNSIGNED NULL,

    type ENUM('delivery', 'bonus', 'tip', 'adjustment', 'withdrawal') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) NULL,

    -- Pour les withdrawals
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    processed_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (driver_id) REFERENCES delivery_drivers(id) ON DELETE CASCADE,
    FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE SET NULL,

    INDEX idx_earnings_driver (driver_id, created_at),
    INDEX idx_earnings_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- ÉTAPE 7: Modifier la table reservations pour la livraison
-- ============================================================================
-- Note: Exécuter ces commandes une par une si des erreurs "Duplicate column"
-- apparaissent (car MySQL ne supporte pas IF NOT EXISTS pour ADD COLUMN)

-- Vérifier et ajouter les colonnes manquantes
SET @dbname = DATABASE();
SET @tablename = 'reservations';

-- Ajouter delivery_type si manquant
SET @col = 'delivery_type';
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) = 0,
    CONCAT('ALTER TABLE reservations ADD COLUMN ', @col, " ENUM('pickup', 'delivery') DEFAULT 'pickup' AFTER status"),
    'SELECT 1'
));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter delivery_address si manquant
SET @col = 'delivery_address';
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) = 0,
    CONCAT('ALTER TABLE reservations ADD COLUMN ', @col, ' TEXT NULL'),
    'SELECT 1'
));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter delivery_latitude si manquant
SET @col = 'delivery_latitude';
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) = 0,
    CONCAT('ALTER TABLE reservations ADD COLUMN ', @col, ' DECIMAL(10, 8) NULL'),
    'SELECT 1'
));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter delivery_longitude si manquant
SET @col = 'delivery_longitude';
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) = 0,
    CONCAT('ALTER TABLE reservations ADD COLUMN ', @col, ' DECIMAL(11, 8) NULL'),
    'SELECT 1'
));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter delivery_fee si manquant
SET @col = 'delivery_fee';
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) = 0,
    CONCAT('ALTER TABLE reservations ADD COLUMN ', @col, ' DECIMAL(10, 2) DEFAULT 0'),
    'SELECT 1'
));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter delivery_instructions si manquant
SET @col = 'delivery_instructions';
SET @query = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @col) = 0,
    CONCAT('ALTER TABLE reservations ADD COLUMN ', @col, ' TEXT NULL'),
    'SELECT 1'
));
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- ÉTAPE 8: Insérer les zones de livraison par défaut (Lomé)
-- ============================================================================

INSERT INTO delivery_zones (name, city, base_fee, price_per_km, min_order_amount, max_distance_km, is_active) VALUES
('Centre-ville Lomé', 'Lomé', 500.00, 150.00, 1000.00, 5.00, TRUE),
('Bè - Adidogomé', 'Lomé', 600.00, 175.00, 1500.00, 8.00, TRUE),
('Agoè - Zongo', 'Lomé', 750.00, 200.00, 2000.00, 10.00, TRUE),
('Périphérie Lomé', 'Lomé', 1000.00, 250.00, 2500.00, 15.00, TRUE),
('Kara Centre', 'Kara', 500.00, 150.00, 1000.00, 5.00, FALSE),
('Sokodé Centre', 'Sokodé', 500.00, 150.00, 1000.00, 5.00, FALSE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- ÉTAPE 9: Créer les index supplémentaires pour les performances
-- ============================================================================

-- Index pour recherche de livreurs disponibles par proximité
CREATE INDEX IF NOT EXISTS idx_drivers_geo_available
ON delivery_drivers (is_available, is_active, is_verified, current_latitude, current_longitude);

-- Index pour statistiques journalières
CREATE INDEX IF NOT EXISTS idx_deliveries_daily_stats
ON deliveries (status, created_at, driver_id);

-- ============================================================================
-- ÉTAPE 10: Créer la vue pour les statistiques livreur
-- ============================================================================

CREATE OR REPLACE VIEW v_driver_stats AS
SELECT
    dd.id AS driver_id,
    dd.user_id,
    u.first_name,
    u.last_name,
    u.phone,
    dd.vehicle_type,
    dd.rating,
    dd.total_deliveries,
    dd.total_earnings,
    dd.is_available,
    dd.is_verified,
    -- Stats du jour
    (SELECT COUNT(*) FROM deliveries d WHERE d.driver_id = dd.id AND DATE(d.created_at) = CURDATE() AND d.status = 'delivered') AS deliveries_today,
    (SELECT COALESCE(SUM(d.driver_commission), 0) FROM deliveries d WHERE d.driver_id = dd.id AND DATE(d.created_at) = CURDATE() AND d.status = 'delivered') AS earnings_today,
    -- Stats de la semaine
    (SELECT COUNT(*) FROM deliveries d WHERE d.driver_id = dd.id AND YEARWEEK(d.created_at) = YEARWEEK(CURDATE()) AND d.status = 'delivered') AS deliveries_week,
    (SELECT COALESCE(SUM(d.driver_commission), 0) FROM deliveries d WHERE d.driver_id = dd.id AND YEARWEEK(d.created_at) = YEARWEEK(CURDATE()) AND d.status = 'delivered') AS earnings_week
FROM delivery_drivers dd
JOIN users u ON dd.user_id = u.id;

-- ============================================================================
-- VÉRIFICATION: Afficher les tables créées
-- ============================================================================

SELECT 'Tables créées avec succès!' AS status;

SHOW TABLES LIKE 'delivery%';
SHOW TABLES LIKE 'driver%';

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
