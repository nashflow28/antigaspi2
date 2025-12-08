-- 🔧 FIX PRODUCTION DATABASE - Add missing columns to merchants table
-- Execute this on production database: antigaspi_fresh

USE antigaspi_fresh;

-- Add description column after business_type
ALTER TABLE merchants
ADD COLUMN description TEXT NULL
COMMENT 'Description du commerce'
AFTER business_type;

-- Add siret column after description
ALTER TABLE merchants
ADD COLUMN siret VARCHAR(14) NULL
COMMENT 'Numéro SIRET du commerce'
AFTER description;

-- Verify columns were added correctly
DESCRIBE merchants;

-- Expected output should show:
-- +-------------------+--------------+------+-----+---------+----------------+
-- | Field             | Type         | Null | Key | Default | Extra          |
-- +-------------------+--------------+------+-----+---------+----------------+
-- | id                | bigint(20)   | NO   | PRI | NULL    | auto_increment |
-- | user_id           | bigint(20)   | NO   | MUL | NULL    |                |
-- | business_name     | varchar(255) | NO   |     | NULL    |                |
-- | business_type     | varchar(100) | NO   |     | NULL    |                |
-- | description       | text         | YES  |     | NULL    |                | ← NEW
-- | siret             | varchar(14)  | YES  |     | NULL    |                | ← NEW
-- | photo_url         | varchar(255) | YES  |     | NULL    |                |
-- | is_verified       | tinyint(1)   | NO   |     | 0       |                |
-- | total_sales       | decimal(10,2)| NO   |     | 0.00    |                |
-- | created_at        | timestamp    | YES  |     | NULL    |                |
-- | updated_at        | timestamp    | YES  |     | NULL    |                |
-- +-------------------+--------------+------+-----+---------+----------------+
