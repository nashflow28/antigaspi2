-- Script d'insertion de données de test pour Antigaspi
-- À exécuter après le schéma principal
USE antigaspi_db;

-- =====================================
-- UTILISATEURS DE TEST
-- =====================================

-- Consommateurs
INSERT INTO users (email, password, first_name, last_name, phone, role, city, address) VALUES
('marie.kouame@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marie', 'Kouamé', '0701234567', 'consumer', 'Abidjan', 'Cocody, Angré 8ème tranche'),
('ibrahim.kone@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Ibrahim', 'Koné', '0712345678', 'consumer', 'Abidjan', 'Yopougon, Sicogi'),
('fatou.diallo@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Fatou', 'Diallo', '0723456789', 'consumer', 'San Pedro', 'Centre-ville'),
('kofi.asante@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Kofi', 'Asante', '0734567890', 'consumer', 'Yamoussoukro', 'Plateau');

-- Commerçants
INSERT INTO users (email, password, first_name, last_name, phone, role, city, address) VALUES
('superette.bella@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bella', 'Traoré', '0745678901', 'merchant', 'Abidjan', 'Marcory, Zone 4'),
('restaurant.chez.tante@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Aminata', 'Ouattara', '0756789012', 'merchant', 'Abidjan', 'Treichville, Rue du Commerce'),
('marche.adjame@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Yao', 'N\'Guessan', '0767890123', 'merchant', 'Abidjan', 'Adjamé, Grand Marché'),
('patisserie.moderne@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Koffi', 'Brou', '0778901234', 'merchant', 'Abidjan', 'Plateau, Avenue Chardy');

-- =====================================
-- PROFILS COMMERÇANTS
-- =====================================

INSERT INTO merchants (user_id, business_name, business_type, siret, latitude, longitude, opening_hours, is_verified, verification_date, total_sales) VALUES
-- Boulangerie Martin (déjà créée dans le schéma)
(6, 'Superette Bella', 'Épicerie', 'CI001234567', 5.3097, -4.0130, '{"monday": "06:00-22:00", "tuesday": "06:00-22:00", "wednesday": "06:00-22:00", "thursday": "06:00-22:00", "friday": "06:00-22:00", "saturday": "06:00-22:00", "sunday": "08:00-20:00"}', TRUE, NOW(), 125000),
(7, 'Restaurant Chez Tante', 'Restaurant', 'CI001234568', 5.2844, -4.0253, '{"monday": "11:00-15:00,18:00-23:00", "tuesday": "11:00-15:00,18:00-23:00", "wednesday": "11:00-15:00,18:00-23:00", "thursday": "11:00-15:00,18:00-23:00", "friday": "11:00-15:00,18:00-23:00", "saturday": "11:00-15:00,18:00-23:00", "sunday": "Fermé"}', TRUE, NOW(), 89000),
(8, 'Marché d\'Adjamé', 'Marché', 'CI001234569', 5.3553, -4.0159, '{"monday": "05:00-18:00", "tuesday": "05:00-18:00", "wednesday": "05:00-18:00", "thursday": "05:00-18:00", "friday": "05:00-18:00", "saturday": "05:00-18:00", "sunday": "05:00-15:00"}', TRUE, NOW(), 78000),
(9, 'Pâtisserie Moderne', 'Pâtisserie', 'CI001234570', 5.3200, -4.0267, '{"monday": "07:00-19:00", "tuesday": "07:00-19:00", "wednesday": "07:00-19:00", "thursday": "07:00-19:00", "friday": "07:00-19:00", "saturday": "07:00-19:00", "sunday": "08:00-17:00"}', FALSE, NULL, 0);

-- =====================================
-- PRODUITS DE TEST
-- =====================================

-- Produits Boulangerie Martin
INSERT INTO products (merchant_id, category_id, name, description, original_price, discounted_price, quantity_available, expiration_date, image_url) VALUES
(1, 2, 'Croissants artisanaux', 'Croissants au beurre frais, cuits ce matin', 200, 100, 15, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '/images/croissants.jpg'),
(1, 2, 'Pain de campagne', 'Pain traditionnel au levain naturel', 400, 200, 8, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '/images/pain-campagne.jpg'),
(1, 2, 'Viennoiseries variées', 'Assortiment pain au chocolat, chaussons aux pommes', 150, 75, 20, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '/images/viennoiseries.jpg');

-- Produits Superette Bella
INSERT INTO products (merchant_id, category_id, name, description, original_price, discounted_price, quantity_available, expiration_date, image_url) VALUES
(2, 1, 'Bananes mûres', 'Bananes bien mûres, parfaites pour smoothies', 300, 150, 25, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '/images/bananes.jpg'),
(2, 4, 'Yaourts nature', 'Lot de 4 yaourts nature, DLC proche', 800, 400, 12, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '/images/yaourts.jpg'),
(2, 1, 'Tomates', 'Tomates fraîches, légèrement molles mais consommables', 250, 125, 18, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '/images/tomates.jpg'),
(2, 4, 'Conserves de thon', 'Boîtes de thon, DLC dans 1 mois', 450, 300, 30, DATE_ADD(CURDATE(), INTERVAL 30 DAY), '/images/thon.jpg');

-- Produits Restaurant Chez Tante
INSERT INTO products (merchant_id, category_id, name, description, original_price, discounted_price, quantity_available, expiration_date, image_url) VALUES
(3, 3, 'Poulet braisé complet', 'Poulet entier grillé avec attieké', 2500, 1500, 5, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '/images/poulet-braise.jpg'),
(3, 3, 'Riz gras au poisson', 'Plat traditionnel, portions individuelles', 1800, 1000, 8, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '/images/riz-gras.jpg'),
(3, 3, 'Sauce arachide avec foutou', 'Plat végétarien complet', 1200, 800, 6, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '/images/sauce-arachide.jpg');

-- Produits Marché d\'Adjamé
INSERT INTO products (merchant_id, category_id, name, description, original_price, discounted_price, quantity_available, expiration_date, image_url) VALUES
(4, 1, 'Mangues de saison', 'Mangues bien mûres, à consommer rapidement', 200, 100, 40, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '/images/mangues.jpg'),
(4, 1, 'Légumes variés', 'Mélange légumes verts, fin de marché', 500, 250, 20, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '/images/legumes.jpg'),
(4, 6, 'Poisson fumé', 'Poisson fumé traditionnel, DLC courte', 1500, 900, 12, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '/images/poisson-fume.jpg');

-- =====================================
-- RÉSERVATIONS DE TEST
-- =====================================

INSERT INTO reservations (user_id, product_id, quantity_reserved, total_amount, status, reservation_code, expires_at) VALUES
(2, 1, 2, 200, 'confirmed', 'RES001', DATE_ADD(NOW(), INTERVAL 6 HOUR)),
(3, 5, 1, 150, 'completed', 'RES002', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(4, 8, 1, 1500, 'pending', 'RES003', DATE_ADD(NOW(), INTERVAL 4 HOUR)),
(5, 3, 3, 225, 'completed', 'RES004', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2, 11, 2, 200, 'confirmed', 'RES005', DATE_ADD(NOW(), INTERVAL 8 HOUR));

-- =====================================
-- AVIS ET NOTATIONS DE TEST
-- =====================================

INSERT INTO reviews (user_id, merchant_id, product_id, rating, title, comment, is_verified_purchase) VALUES
(2, 1, 1, 5, 'Excellents croissants !', 'Très frais malgré le prix réduit, je recommande !', TRUE),
(3, 2, 5, 4, 'Bon plan bananes', 'Parfaites pour mes smoothies du matin', TRUE),
(4, 3, 8, 5, 'Délicieux poulet', 'Encore chaud et très savoureux, excellent rapport qualité-prix', TRUE),
(5, 1, 3, 4, 'Viennoiseries correctes', 'Un peu sèches mais acceptable pour le prix', TRUE),
(2, 4, 11, 3, 'Légumes corrects', 'Quelques légumes un peu abîmés mais globalement ok', TRUE);

-- =====================================
-- POINTS DE FIDÉLITÉ DE TEST
-- =====================================

INSERT INTO loyalty_points (user_id, points, earned_from, reference_id, description) VALUES
(2, 10, 'reservation', 1, 'Réservation croissants - 10 points'),
(3, 5, 'reservation', 2, 'Réservation bananes - 5 points'),
(4, 20, 'reservation', 3, 'Réservation poulet - 20 points'),
(5, 8, 'reservation', 4, 'Réservation viennoiseries - 8 points'),
(2, 5, 'review', 1, 'Avis sur Boulangerie Martin - 5 points');

-- =====================================
-- NOTIFICATIONS DE TEST
-- =====================================

INSERT INTO notifications (user_id, type, title, message, is_read, sent_via) VALUES
(2, 'reservation', 'Réservation confirmée', 'Votre réservation RES001 a été confirmée. À récupérer avant 18h.', TRUE, 'email'),
(3, 'product', 'Nouveaux produits disponibles', 'De nouveaux produits sont disponibles près de chez vous !', FALSE, 'in_app'),
(4, 'payment', 'Paiement réussi', 'Votre paiement de 1500 XOF a été traité avec succès.', TRUE, 'sms'),
(5, 'system', 'Bienvenue sur Antigaspi !', 'Merci de rejoindre notre communauté anti-gaspillage !', FALSE, 'email');

-- =====================================
-- DONNÉES ANALYTIQUES DE TEST
-- =====================================

INSERT INTO analytics_daily (date, merchant_id, total_reservations, total_revenue, products_saved_from_waste, new_users) VALUES
-- Données pour cette semaine
(CURDATE(), 1, 5, 850, 12, 0),
(CURDATE(), 2, 3, 450, 8, 0),
(CURDATE(), 3, 2, 2500, 3, 0),
(CURDATE(), 4, 4, 600, 15, 0),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 1, 8, 1200, 18, 1),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 2, 6, 750, 14, 2),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), 3, 4, 4000, 8, 0),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), 1, 3, 600, 9, 0),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), 2, 5, 900, 12, 1);

-- Données globales (pas de merchant_id spécifique)
INSERT INTO analytics_daily (date, merchant_id, total_reservations, total_revenue, products_saved_from_waste, new_users) VALUES
(CURDATE(), NULL, 14, 4400, 38, 0),
(DATE_SUB(CURDATE(), INTERVAL 1 DAY), NULL, 18, 5950, 40, 3),
(DATE_SUB(CURDATE(), INTERVAL 2 DAY), NULL, 8, 1500, 21, 1);

COMMIT;

-- =====================================
-- REQUÊTES DE VÉRIFICATION
-- =====================================

-- Vérifier les utilisateurs créés
SELECT 'UTILISATEURS CRÉÉS:' as info;
SELECT role, COUNT(*) as count FROM users GROUP BY role;

-- Vérifier les produits disponibles
SELECT 'PRODUITS DISPONIBLES:' as info;
SELECT
    p.name,
    c.name as category,
    m.business_name,
    p.discounted_price,
    p.quantity_available,
    p.expiration_date
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN merchants m ON p.merchant_id = m.id
WHERE p.is_active = TRUE;

-- Vérifier les réservations
SELECT 'RÉSERVATIONS:' as info;
SELECT
    r.reservation_code,
    CONCAT(u.first_name, ' ', u.last_name) as client,
    p.name as produit,
    r.status,
    r.total_amount
FROM reservations r
JOIN users u ON r.user_id = u.id
JOIN products p ON r.product_id = p.id;

-- Statistiques générales
SELECT 'STATISTIQUES:' as info;
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'consumer') as consommateurs,
    (SELECT COUNT(*) FROM users WHERE role = 'merchant') as commercants,
    (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as produits_disponibles,
    (SELECT COUNT(*) FROM reservations) as reservations_total,
    (SELECT SUM(total_amount) FROM reservations WHERE status = 'completed') as ca_total;