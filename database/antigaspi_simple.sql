-- Base de données Antigaspi - Version Simplifiée
-- Création sans contraintes de clés étrangères d'abord

DROP DATABASE IF EXISTS antigaspi_db;
CREATE DATABASE antigaspi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE antigaspi_db;

-- =====================================
-- ÉTAPE 1: CRÉER TOUTES LES TABLES SANS CONTRAINTES
-- =====================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('consumer', 'merchant', 'admin') NOT NULL DEFAULT 'consumer',
    city VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE merchants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    siret VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    opening_hours JSON,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP NULL,
    total_sales DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    merchant_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    original_price DECIMAL(8, 2) NOT NULL,
    discounted_price DECIMAL(8, 2) NOT NULL,
    quantity_available INT NOT NULL DEFAULT 0,
    expiration_date DATE NOT NULL,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity_reserved INT NOT NULL DEFAULT 1,
    total_amount DECIMAL(8, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    reservation_code VARCHAR(20) NOT NULL UNIQUE,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reservation_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(8, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    payment_method ENUM('mobile_money', 'paystack', 'flutterwave', 'cash') NOT NULL,
    transaction_id VARCHAR(255),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    provider_response JSON,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    merchant_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NULL,
    rating TINYINT NOT NULL,
    title VARCHAR(255),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE loyalty_points (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    points INT NOT NULL DEFAULT 0,
    earned_from ENUM('reservation', 'review', 'referral', 'bonus') NOT NULL,
    reference_id BIGINT UNSIGNED,
    description VARCHAR(255),
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM('reservation', 'payment', 'product', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_via ENUM('email', 'sms', 'push', 'in_app') NOT NULL DEFAULT 'in_app',
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE analytics_daily (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    merchant_id BIGINT UNSIGNED NULL,
    total_reservations INT DEFAULT 0,
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    products_saved_from_waste INT DEFAULT 0,
    new_users INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- ÉTAPE 2: AJOUTER LES INDEX
-- =====================================

-- Index pour users
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE users ADD INDEX idx_role (role);
ALTER TABLE users ADD INDEX idx_city (city);

-- Index pour categories
ALTER TABLE categories ADD INDEX idx_name (name);

-- Index pour merchants
ALTER TABLE merchants ADD INDEX idx_business_name (business_name);
ALTER TABLE merchants ADD INDEX idx_verified (is_verified);

-- Index pour products
ALTER TABLE products ADD INDEX idx_merchant (merchant_id);
ALTER TABLE products ADD INDEX idx_category (category_id);
ALTER TABLE products ADD INDEX idx_price (discounted_price);
ALTER TABLE products ADD INDEX idx_expiration (expiration_date);
ALTER TABLE products ADD INDEX idx_active (is_active);

-- Index pour reservations
ALTER TABLE reservations ADD INDEX idx_user (user_id);
ALTER TABLE reservations ADD INDEX idx_product (product_id);
ALTER TABLE reservations ADD INDEX idx_status (status);
ALTER TABLE reservations ADD INDEX idx_code (reservation_code);
ALTER TABLE reservations ADD INDEX idx_expires (expires_at);

-- =====================================
-- ÉTAPE 3: DONNÉES DE BASE
-- =====================================

-- Catégories
INSERT INTO categories (name, description, icon) VALUES
('Fruits et Légumes', 'Produits frais en fin de vie', '🥬'),
('Boulangerie', 'Pain et viennoiseries du jour précédent', '🥖'),
('Plats préparés', 'Cuisine prête à consommer', '🍽️'),
('Épicerie', 'Produits d\'épicerie proche de la date limite', '🛒'),
('Produits laitiers', 'Fromages, yaourts, lait', '🧀'),
('Viande et Poisson', 'Produits frais de la boucherie/poissonnerie', '🥩');

-- Admin par défaut
INSERT INTO users (email, password, first_name, last_name, role, is_active) VALUES
('admin@antigaspi.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', 'admin', TRUE);

-- Utilisateurs de test
INSERT INTO users (email, password, first_name, last_name, phone, role, city) VALUES
('jean.dupont@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jean', 'Dupont', '0123456789', 'consumer', 'Abidjan'),
('boulangerie.martin@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pierre', 'Martin', '0123456790', 'merchant', 'Abidjan');

-- Commerçant
INSERT INTO merchants (user_id, business_name, business_type, is_verified) VALUES
(3, 'Boulangerie Martin', 'Boulangerie', TRUE);

-- Produit de test
INSERT INTO products (merchant_id, category_id, name, description, original_price, discounted_price, quantity_available, expiration_date) VALUES
(1, 2, 'Pain complet artisanal', 'Pain complet fait maison, cuit ce matin', 500, 250, 10, DATE_ADD(CURDATE(), INTERVAL 1 DAY));

-- =====================================
-- VÉRIFICATION
-- =====================================
SELECT 'INSTALLATION SIMPLIFIÉE RÉUSSIE!' as STATUS;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'antigaspi_db';

COMMIT;