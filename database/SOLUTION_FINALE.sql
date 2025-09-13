-- SOLUTION FINALE - Installation Antigaspi sans erreur
-- Exécuter ce script complet dans phpMyAdmin

-- =====================================
-- ÉTAPE 1: NETTOYAGE COMPLET
-- =====================================
SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS antigaspi_db;
CREATE DATABASE antigaspi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE antigaspi_db;

-- =====================================
-- ÉTAPE 2: CRÉATION DES TABLES (ordre correct)
-- =====================================

-- Table 1: users (aucune dépendance)
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

-- Table 2: categories (aucune dépendance)
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table 3: merchants (dépend de users)
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

-- Table 4: products (dépend de merchants et categories)
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

-- Table 5: reservations (dépend de users et products)
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

-- Tables supplémentaires
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
-- ÉTAPE 3: AJOUT DES DONNÉES
-- =====================================

-- Catégories
INSERT INTO categories (name, description, icon) VALUES
('Fruits et Légumes', 'Produits frais en fin de vie', '🥬'),
('Boulangerie', 'Pain et viennoiseries du jour précédent', '🥖'),
('Plats préparés', 'Cuisine prête à consommer', '🍽️'),
('Épicerie', 'Produits d\'épicerie proche de la date limite', '🛒'),
('Produits laitiers', 'Fromages, yaourts, lait', '🧀'),
('Viande et Poisson', 'Produits frais de la boucherie/poissonnerie', '🥩');

-- Utilisateurs
INSERT INTO users (email, password, first_name, last_name, role, is_active) VALUES
('admin@antigaspi.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', 'admin', TRUE);

INSERT INTO users (email, password, first_name, last_name, phone, role, city) VALUES
('jean.dupont@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jean', 'Dupont', '0123456789', 'consumer', 'Abidjan'),
('boulangerie.martin@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pierre', 'Martin', '0123456790', 'merchant', 'Abidjan'),
('superette.bella@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bella', 'Traoré', '0745678901', 'merchant', 'Abidjan'),
('marie.kouame@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marie', 'Kouamé', '0701234567', 'consumer', 'Abidjan');

-- Commerçants
INSERT INTO merchants (user_id, business_name, business_type, is_verified) VALUES
(3, 'Boulangerie Martin', 'Boulangerie', TRUE),
(4, 'Superette Bella', 'Épicerie', TRUE);

-- Produits
INSERT INTO products (merchant_id, category_id, name, description, original_price, discounted_price, quantity_available, expiration_date) VALUES
(1, 2, 'Pain complet artisanal', 'Pain complet fait maison, cuit ce matin', 500, 250, 10, DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
(1, 2, 'Croissants artisanaux', 'Croissants au beurre frais, cuits ce matin', 200, 100, 15, DATE_ADD(CURDATE(), INTERVAL 1 DAY)),
(2, 1, 'Bananes mûres', 'Bananes bien mûres, parfaites pour smoothies', 300, 150, 25, DATE_ADD(CURDATE(), INTERVAL 2 DAY)),
(2, 4, 'Yaourts nature', 'Lot de 4 yaourts nature, DLC proche', 800, 400, 12, DATE_ADD(CURDATE(), INTERVAL 3 DAY));

-- Réservation de test
INSERT INTO reservations (user_id, product_id, quantity_reserved, total_amount, status, reservation_code, expires_at) VALUES
(2, 1, 2, 500, 'confirmed', 'RES001', DATE_ADD(NOW(), INTERVAL 6 HOUR));

-- =====================================
-- ÉTAPE 4: AJOUT DES CONTRAINTES ET INDEX
-- =====================================

-- Contraintes de clés étrangères
ALTER TABLE merchants ADD CONSTRAINT fk_merchants_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE products ADD CONSTRAINT fk_products_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;
ALTER TABLE products ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id);
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE payments ADD CONSTRAINT fk_payments_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE loyalty_points ADD CONSTRAINT fk_loyalty_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE analytics_daily ADD CONSTRAINT fk_analytics_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL;

-- Index pour performance
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE users ADD INDEX idx_role (role);
ALTER TABLE categories ADD INDEX idx_name (name);
ALTER TABLE merchants ADD INDEX idx_business_name (business_name);
ALTER TABLE products ADD INDEX idx_merchant (merchant_id);
ALTER TABLE products ADD INDEX idx_category (category_id);
ALTER TABLE products ADD INDEX idx_active (is_active);
ALTER TABLE reservations ADD INDEX idx_user (user_id);
ALTER TABLE reservations ADD INDEX idx_product (product_id);
ALTER TABLE reservations ADD INDEX idx_status (status);
ALTER TABLE reservations ADD INDEX idx_code (reservation_code);

-- Réactiver les contraintes
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================
-- VÉRIFICATION FINALE
-- =====================================
SELECT '✅ INSTALLATION TERMINÉE AVEC SUCCÈS!' as STATUS;
SELECT
    TABLE_NAME as 'Tables créées',
    TABLE_ROWS as 'Lignes'
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'antigaspi_db'
ORDER BY TABLE_NAME;

-- Test rapide
SELECT
    u.first_name as Utilisateur,
    u.role as Rôle,
    COUNT(p.id) as 'Produits (si commerçant)'
FROM users u
LEFT JOIN merchants m ON u.id = m.user_id
LEFT JOIN products p ON m.id = p.merchant_id
GROUP BY u.id, u.first_name, u.role;

COMMIT;