-- ============================================================================
-- ANTIGASPI - Migration Production Database Structure
-- Date: 2025-11-22
-- Description: Corrections complètes de la structure de base de données
--              suite aux bugs identifiés en production
-- ============================================================================

-- Utiliser la base de données
USE c2621486c_antigaspi_db;

-- ============================================================================
-- 1. CORRECTIONS TABLE: reservations
-- ============================================================================

-- 1.1 Ajouter 'ready' au status ENUM
ALTER TABLE reservations
MODIFY COLUMN status ENUM('pending', 'confirmed', 'ready', 'completed', 'cancelled')
NOT NULL DEFAULT 'pending';

-- 1.2 Ajouter colonnes timestamps manquantes (ready_at, completed_at)
-- Note: cancelled_at déjà ajouté dans migration précédente
ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS ready_at TIMESTAMP NULL DEFAULT NULL AFTER confirmed_at,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP NULL DEFAULT NULL AFTER ready_at;

-- 1.3 Rendre expires_at nullable (était NOT NULL sans default)
ALTER TABLE reservations
MODIFY COLUMN expires_at DATETIME NULL DEFAULT NULL;

-- 1.4 Ajouter 'success' au payment_status ENUM
ALTER TABLE reservations
MODIFY COLUMN payment_status ENUM('pending', 'success', 'failed')
NOT NULL DEFAULT 'pending';

-- ============================================================================
-- 2. CORRECTIONS TABLE: notifications
-- ============================================================================

-- 2.1 Ajouter 'reservation_status' au type ENUM
ALTER TABLE notifications
MODIFY COLUMN type ENUM('reservation', 'reservation_status', 'payment', 'product', 'system')
NOT NULL;

-- 2.2 Changer sent_via de ENUM vers SET (pour multi-channels)
ALTER TABLE notifications
MODIFY COLUMN sent_via SET('email', 'sms', 'push', 'in_app')
NOT NULL DEFAULT 'in_app';

-- ============================================================================
-- 3. VÉRIFICATION FINALE
-- ============================================================================

-- Afficher la structure finale de reservations
SHOW COLUMNS FROM reservations;

-- Afficher la structure finale de notifications
SHOW COLUMNS FROM notifications;

-- Compter les réservations par statut
SELECT status, COUNT(*) as count
FROM reservations
GROUP BY status;

-- ============================================================================
-- NOTES:
-- ============================================================================
--
-- BUGS CORRIGÉS:
-- 1. ✅ reservations.status manquait 'ready'
-- 2. ✅ reservations.ready_at et completed_at manquants
-- 3. ✅ reservations.expires_at NOT NULL causait des erreurs
-- 4. ✅ reservations.payment_status manquait 'success'
-- 5. ✅ notifications.type manquait 'reservation_status'
-- 6. ✅ notifications.sent_via était ENUM au lieu de SET
--
-- WORKFLOW RÉSERVATIONS MAINTENANT FONCTIONNEL:
-- pending → confirm() → confirmed
-- confirmed → markReady() → ready
-- ready → complete() → completed (+ payment_status: success)
--
-- TESTÉ EN PRODUCTION: 2025-11-22 ✅
-- ============================================================================
