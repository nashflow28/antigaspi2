#!/bin/bash

#############################################
# ANTIGASPI - Script d'installation VPS Ubuntu
# Version: 1.0
# Testé sur: Ubuntu 22.04 / 24.04 LTS
#############################################

set -e  # Arrêter le script en cas d'erreur

echo "========================================="
echo "   ANTIGASPI - Installation VPS"
echo "========================================="
echo ""

# Couleurs pour output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables à configurer
DB_NAME="antigaspi_production"
DB_USER="antigaspi_user"
DB_PASSWORD=""  # Sera demandé de manière sécurisée
DOMAIN="api.antigaspi.tg"
APP_DIR="/var/www/antigaspi"

#############################################
# Fonction pour afficher les messages
#############################################
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}➜ $1${NC}"
}

#############################################
# Vérifier que le script est exécuté en root
#############################################
if [ "$EUID" -ne 0 ]; then
    print_error "Ce script doit être exécuté en tant que root (sudo)"
    exit 1
fi

print_info "Demande du mot de passe base de données..."
read -sp "Mot de passe pour l'utilisateur MySQL '$DB_USER': " DB_PASSWORD
echo ""

if [ -z "$DB_PASSWORD" ]; then
    print_error "Le mot de passe ne peut pas être vide"
    exit 1
fi

#############################################
# 1. Mise à jour du système
#############################################
print_info "Mise à jour du système..."
apt update && apt upgrade -y
print_success "Système mis à jour"

#############################################
# 2. Installation des dépendances
#############################################
print_info "Installation des dépendances..."
apt install -y software-properties-common curl git unzip

# Ajouter le repository PHP
add-apt-repository ppa:ondrej/php -y
apt update

# Installer PHP 8.2 et extensions
apt install -y php8.2 php8.2-fpm php8.2-cli php8.2-mysql php8.2-mbstring \
    php8.2-xml php8.2-curl php8.2-zip php8.2-bcmath php8.2-intl \
    php8.2-gd php8.2-redis php8.2-imagick

print_success "PHP 8.2 et extensions installés"

#############################################
# 3. Installation de Composer
#############################################
if ! command -v composer &> /dev/null; then
    print_info "Installation de Composer..."
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    print_success "Composer installé"
else
    print_success "Composer déjà installé"
fi

#############################################
# 4. Installation de MySQL
#############################################
print_info "Installation de MySQL..."
apt install -y mysql-server

# Sécuriser MySQL
print_info "Configuration sécurisée de MySQL..."
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';"
mysql -uroot -p${DB_PASSWORD} -e "DELETE FROM mysql.user WHERE User='';"
mysql -uroot -p${DB_PASSWORD} -e "DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');"
mysql -uroot -p${DB_PASSWORD} -e "DROP DATABASE IF EXISTS test;"
mysql -uroot -p${DB_PASSWORD} -e "DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';"
mysql -uroot -p${DB_PASSWORD} -e "FLUSH PRIVILEGES;"

print_success "MySQL installé et sécurisé"

#############################################
# 5. Créer la base de données et l'utilisateur
#############################################
print_info "Création de la base de données..."
mysql -uroot -p${DB_PASSWORD} <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

print_success "Base de données '${DB_NAME}' créée"

#############################################
# 6. Installation de Nginx
#############################################
print_info "Installation de Nginx..."
apt install -y nginx

# Démarrer et activer Nginx
systemctl start nginx
systemctl enable nginx

print_success "Nginx installé et démarré"

#############################################
# 7. Créer le dossier d'application
#############################################
print_info "Création du dossier d'application..."
mkdir -p ${APP_DIR}
cd ${APP_DIR}

print_success "Dossier ${APP_DIR} créé"

#############################################
# 8. Instructions pour l'utilisateur
#############################################
echo ""
echo "========================================="
echo "   INSTALLATION RÉUSSIE !"
echo "========================================="
echo ""
print_success "Stack LEMP installée avec succès"
echo ""
echo "Prochaines étapes :"
echo ""
echo "1. Copier les fichiers Laravel dans ${APP_DIR}"
echo "   scp -r backend/* user@server:${APP_DIR}/"
echo ""
echo "2. Configurer le fichier .env"
echo "   cp .env.production.example .env"
echo "   nano .env"
echo ""
echo "3. Installer les dépendances Composer"
echo "   cd ${APP_DIR}"
echo "   composer install --optimize-autoloader --no-dev"
echo ""
echo "4. Générer la clé d'application"
echo "   php artisan key:generate"
echo ""
echo "5. Générer la clé JWT"
echo "   php artisan jwt:secret"
echo ""
echo "6. Importer la base de données"
echo "   mysql -u${DB_USER} -p ${DB_NAME} < deployment/database_dump.sql"
echo ""
echo "7. Exécuter les migrations (si nécessaire)"
echo "   php artisan migrate --force"
echo ""
echo "8. Configurer les permissions"
echo "   chown -R www-data:www-data ${APP_DIR}"
echo "   chmod -R 755 ${APP_DIR}"
echo "   chmod -R 775 ${APP_DIR}/storage ${APP_DIR}/bootstrap/cache"
echo ""
echo "9. Optimiser Laravel pour production"
echo "   php artisan config:cache"
echo "   php artisan route:cache"
echo "   php artisan view:cache"
echo ""
echo "10. Configurer Nginx (voir nginx.conf)"
echo ""
echo "========================================="
echo "Informations de connexion MySQL :"
echo "  Base de données : ${DB_NAME}"
echo "  Utilisateur     : ${DB_USER}"
echo "  Mot de passe    : (celui que vous avez saisi)"
echo "========================================="
echo ""
