-- Base de données Antigaspi - Schéma complet
-- Système de lutte contre le gaspillage alimentaire
-- Compatible avec XAMPP/MySQL 8.0

DROP DATABASE IF EXISTS antigaspi_db;
CREATE DATABASE antigaspi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE antigaspi_db;

-- =====================================
-- TABLE: users (Utilisateurs multi-rôles)
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_city (city)
);

-- =====================================
-- TABLE: categories (Catégories de produits)
-- =====================================
CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_name (name)
);

-- =====================================
-- TABLE: merchants (Informations spécifiques commerçants)
-- =====================================
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_business_name (business_name),
    INDEX idx_location (latitude, longitude),
    INDEX idx_verified (is_verified)
);

-- =====================================
-- TABLE: products (Produits invendus)
-- =====================================
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_merchant (merchant_id),
    INDEX idx_category (category_id),
    INDEX idx_price (discounted_price),
    INDEX idx_expiration (expiration_date),
    INDEX idx_active (is_active)
);

-- =====================================
-- TABLE: reservations (Réservations)
-- =====================================
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_product (product_id),
    INDEX idx_status (status),
    INDEX idx_code (reservation_code),
    INDEX idx_expires (expires_at)
);

-- =====================================
-- TABLE: payments (Paiements - Niveau 4)
-- =====================================
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    INDEX idx_reservation (reservation_id),
    INDEX idx_status (status),
    INDEX idx_transaction (transaction_id)
);

-- =====================================
-- TABLE: reviews (Avis et notations - Niveau 4)
-- =====================================
CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    merchant_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_merchant (merchant_id),
    INDEX idx_rating (rating),
    INDEX idx_verified (is_verified_purchase)
);

-- =====================================
-- TABLE: loyalty_points (Points de fidélité - Niveau 4)
-- =====================================
CREATE TABLE loyalty_points (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    points INT NOT NULL DEFAULT 0,
    earned_from ENUM('reservation', 'review', 'referral', 'bonus') NOT NULL,
    reference_id BIGINT UNSIGNED,
    description VARCHAR(255),
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_earned_from (earned_from),
    INDEX idx_expires (expires_at)
);

-- =====================================
-- TABLE: notifications (Notifications - Niveau 4)
-- =====================================
CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM('reservation', 'payment', 'product', 'system') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    sent_via ENUM('email', 'sms', 'push', 'in_app') NOT NULL DEFAULT 'in_app',
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_type (type),
    INDEX idx_read (is_read)
);

-- =====================================
-- TABLE: analytics_daily (Analytics journalières)
-- =====================================
CREATE TABLE analytics_daily (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    merchant_id BIGINT UNSIGNED NULL,
    total_reservations INT DEFAULT 0,
    total_revenue DECIMAL(10, 2) DEFAULT 0,
    products_saved_from_waste INT DEFAULT 0,
    new_users INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
    UNIQUE KEY unique_date_merchant (date, merchant_id),
    INDEX idx_date (date),
    INDEX idx_merchant (merchant_id)
);

-- =====================================
-- INSERTION DES DONNÉES DE TEST
-- =====================================

-- Catégories par défaut
INSERT INTO categories (name, description, icon) VALUES
('Fruits et Légumes', 'Produits frais en fin de vie', '🥬'),
('Boulangerie', 'Pain et viennoiseries du jour précédent', '🥖'),
('Plats préparés', 'Cuisine prête à consommer', '🍽️'),
('Épicerie', 'Produits d\'épicerie proche de la date limite', '🛒'),
('Produits laitiers', 'Fromages, yaourts, lait', '🧀'),
('Viande et Poisson', 'Produits frais de la boucherie/poissonnerie', '🥩');

-- Utilisateur administrateur par défaut
INSERT INTO users (email, password, first_name, last_name, role, is_active) VALUES
('admin@antigaspi.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'System', 'admin', TRUE);

-- Utilisateurs de test
INSERT INTO users (email, password, first_name, last_name, phone, role, city) VALUES
('jean.dupont@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jean', 'Dupont', '0123456789', 'consumer', 'Abidjan'),
('boulangerie.martin@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pierre', 'Martin', '0123456790', 'merchant', 'Abidjan');

-- Commerçant de test
INSERT INTO merchants (user_id, business_name, business_type, latitude, longitude, is_verified) VALUES
(3, 'Boulangerie Martin', 'Boulangerie', 5.3364, -4.0267, TRUE);

-- Produit de test
INSERT INTO products (merchant_id, category_id, name, description, original_price, discounted_price, quantity_available, expiration_date) VALUES
(1, 2, 'Pain complet artisanal', 'Pain complet fait maison, cuit ce matin', 500, 250, 10, DATE_ADD(CURDATE(), INTERVAL 1 DAY));

-- =====================================
-- VUES UTILES POUR LES STATISTIQUES
-- =====================================

-- Vue pour les statistiques commerçants
CREATE VIEW merchant_stats AS
SELECT
    m.id as merchant_id,
    m.business_name,
    u.first_name,
    u.last_name,
    COUNT(DISTINCT p.id) as total_products,
    COUNT(DISTINCT r.id) as total_reservations,
    COALESCE(SUM(r.total_amount), 0) as total_revenue,
    AVG(rv.rating) as average_rating
FROM merchants m
JOIN users u ON m.user_id = u.id
LEFT JOIN products p ON m.id = p.merchant_id
LEFT JOIN reservations r ON p.id = r.product_id AND r.status = 'completed'
LEFT JOIN reviews rv ON m.id = rv.merchant_id
GROUP BY m.id, m.business_name, u.first_name, u.last_name;

-- Vue pour les produits disponibles avec informations commerçant
CREATE VIEW available_products AS
SELECT
    p.id,
    p.name,
    p.description,
    p.original_price,
    p.discounted_price,
    p.quantity_available,
    p.expiration_date,
    p.image_url,
    c.name as category_name,
    m.business_name,
    u.first_name as merchant_first_name,
    u.last_name as merchant_last_name,
    u.phone as merchant_phone,
    m.latitude,
    m.longitude
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN merchants m ON p.merchant_id = m.id
JOIN users u ON m.user_id = u.id
WHERE p.is_active = TRUE
AND p.quantity_available > 0
AND p.expiration_date >= CURDATE();

COMMIT;