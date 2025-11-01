# 🚀 Guide de Déploiement - Antigaspi Backend API

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Installation automatique](#installation-automatique)
3. [Configuration manuelle](#configuration-manuelle)
4. [Déploiement du code](#déploiement-du-code)
5. [Configuration SSL](#configuration-ssl)
6. [Maintenance](#maintenance)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prérequis

### Serveur VPS
- **OS** : Ubuntu 22.04 LTS ou 24.04 LTS
- **RAM** : Minimum 2 GB (recommandé 4 GB)
- **CPU** : 1 vCPU minimum (recommandé 2 vCPU)
- **Stockage** : 20 GB minimum
- **Accès** : SSH avec utilisateur root ou sudo

### Nom de domaine
- DNS configuré pour pointer vers l'IP du VPS
- Exemple : `api.antigaspi.tg` → IP du serveur

### Fichiers à transférer au serveur
Tous les fichiers se trouvent dans le dossier `backend/deployment/` :
- ✅ `database_dump.sql` - Dump complet de la base de données
- ✅ `.env.production.example` - Template de configuration
- ✅ `install.sh` - Script d'installation automatique
- ✅ `nginx.conf` - Configuration Nginx
- ✅ `DEPLOY.md` - Ce guide

---

## ⚡ Installation automatique (RECOMMANDÉ)

### Étape 1 : Connexion au serveur

```bash
ssh root@VOTRE_IP_SERVEUR
```

### Étape 2 : Créer un dossier pour l'installation

```bash
mkdir -p /tmp/antigaspi-deploy
cd /tmp/antigaspi-deploy
```

### Étape 3 : Transférer les fichiers de déploiement

**Depuis votre machine locale :**

```bash
scp -r backend/deployment/* root@VOTRE_IP_SERVEUR:/tmp/antigaspi-deploy/
```

### Étape 4 : Exécuter le script d'installation

**Sur le serveur :**

```bash
cd /tmp/antigaspi-deploy
chmod +x install.sh
sudo ./install.sh
```

Le script va :
- ✅ Mettre à jour le système
- ✅ Installer PHP 8.2 + extensions
- ✅ Installer Composer
- ✅ Installer MySQL
- ✅ Installer Nginx
- ✅ Créer la base de données
- ✅ Créer l'utilisateur MySQL
- ✅ Configurer les permissions

**Suivez les instructions affichées à la fin du script.**

---

## 📦 Déploiement du code Laravel

### Étape 1 : Transférer le code Laravel

**Depuis votre machine locale :**

```bash
# Compresser le backend (sans node_modules, vendor, .git)
cd backend
tar --exclude='node_modules' --exclude='vendor' --exclude='.git' --exclude='storage/logs/*' -czf ../antigaspi-backend.tar.gz .
cd ..

# Transférer vers le serveur
scp antigaspi-backend.tar.gz root@VOTRE_IP_SERVEUR:/var/www/
```

**Sur le serveur :**

```bash
cd /var/www
mkdir -p antigaspi
cd antigaspi
tar -xzf ../antigaspi-backend.tar.gz
rm ../antigaspi-backend.tar.gz
```

### Étape 2 : Configuration de l'environnement

```bash
cd /var/www/antigaspi

# Copier le template .env
cp deployment/.env.production.example .env

# Éditer le fichier .env
nano .env
```

**Variables critiques à modifier :**

```env
APP_URL=https://api.antigaspi.tg
APP_DEBUG=false

DB_DATABASE=antigaspi_production
DB_USERNAME=antigaspi_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_FORT

FRONTEND_URL=https://antigaspi.tg
```

### Étape 3 : Installer les dépendances

```bash
cd /var/www/antigaspi

# Installer Composer dependencies (sans dev)
composer install --optimize-autoloader --no-dev

# Générer la clé d'application
php artisan key:generate

# Générer la clé JWT
php artisan jwt:secret
```

### Étape 4 : Importer la base de données

```bash
cd /var/www/antigaspi

# Importer le dump SQL
mysql -u antigaspi_user -p antigaspi_production < deployment/database_dump.sql

# OU exécuter les migrations (si préféré)
# php artisan migrate --force --seed
```

### Étape 5 : Configurer les permissions

```bash
cd /var/www/antigaspi

# Propriétaire des fichiers
chown -R www-data:www-data .

# Permissions des dossiers
chmod -R 755 .

# Permissions storage et cache
chmod -R 775 storage bootstrap/cache

# Créer le lien symbolique storage
php artisan storage:link
```

### Étape 6 : Optimiser Laravel pour production

```bash
cd /var/www/antigaspi

# Cache de configuration
php artisan config:cache

# Cache des routes
php artisan route:cache

# Cache des vues
php artisan view:cache

# Optimiser l'autoloader
composer dump-autoload --optimize
```

---

## 🌐 Configuration Nginx

### Étape 1 : Copier la configuration

```bash
# Copier le fichier de configuration
cp /var/www/antigaspi/deployment/nginx.conf /etc/nginx/sites-available/antigaspi

# Créer un lien symbolique
ln -s /etc/nginx/sites-available/antigaspi /etc/nginx/sites-enabled/

# Désactiver le site par défaut
rm -f /etc/nginx/sites-enabled/default
```

### Étape 2 : Modifier la configuration si nécessaire

```bash
nano /etc/nginx/sites-available/antigaspi
```

Vérifier que :
- `server_name` correspond à votre domaine
- `root` pointe vers `/var/www/antigaspi/public`
- `fastcgi_pass` utilise la bonne version PHP (php8.2-fpm)

### Étape 3 : Tester et recharger Nginx

```bash
# Tester la configuration
nginx -t

# Si OK, recharger Nginx
systemctl reload nginx

# Vérifier le statut
systemctl status nginx
```

---

## 🔒 Configuration SSL (HTTPS avec Let's Encrypt)

### Étape 1 : Installer Certbot

```bash
apt install -y certbot python3-certbot-nginx
```

### Étape 2 : Obtenir un certificat SSL

```bash
certbot --nginx -d api.antigaspi.tg -d www.api.antigaspi.tg
```

Suivez les instructions de Certbot :
- Entrez votre email
- Acceptez les conditions
- Choisissez si vous voulez rediriger HTTP vers HTTPS (recommandé : OUI)

### Étape 3 : Vérifier le renouvellement automatique

```bash
# Tester le renouvellement
certbot renew --dry-run

# Le renouvellement automatique est déjà configuré via cron
```

### Étape 4 : Décommenter la configuration HTTPS dans Nginx

```bash
nano /etc/nginx/sites-available/antigaspi
```

Décommentez les sections :
- Redirection HTTP → HTTPS
- Configuration server HTTPS (port 443)

```bash
nginx -t
systemctl reload nginx
```

---

## ✅ Vérification du déploiement

### Tester l'API

```bash
# Test de santé de l'API
curl https://api.antigaspi.tg/api/health

# Résultat attendu:
# {"status":"ok","message":"API is working","timestamp":"...","version":"1.0.0"}
```

### Tester l'authentification

```bash
# Login avec le compte admin
curl -X POST https://api.antigaspi.tg/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@antigaspi.com",
    "password": "password"
  }'

# Résultat attendu: Token JWT
```

### Vérifier les logs

```bash
# Logs Laravel
tail -f /var/www/antigaspi/storage/logs/laravel.log

# Logs Nginx
tail -f /var/log/nginx/antigaspi_access.log
tail -f /var/log/nginx/antigaspi_error.log

# Logs PHP-FPM
tail -f /var/log/php8.2-fpm.log
```

---

## 🔄 Maintenance et mises à jour

### Mettre à jour le code

```bash
cd /var/www/antigaspi

# Pull les nouvelles modifications (si Git est utilisé)
git pull origin main

# OU transférer la nouvelle archive et extraire
# scp antigaspi-backend.tar.gz root@server:/var/www/
# tar -xzf antigaspi-backend.tar.gz

# Installer les nouvelles dépendances
composer install --optimize-autoloader --no-dev

# Exécuter les migrations
php artisan migrate --force

# Recacher la configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Redémarrer PHP-FPM
systemctl restart php8.2-fpm
```

### Sauvegarder la base de données

```bash
# Créer un dump
mysqldump -u antigaspi_user -p antigaspi_production > /backup/antigaspi_$(date +%Y%m%d_%H%M%S).sql

# Automatiser avec cron (tous les jours à 2h du matin)
crontab -e
# Ajouter:
# 0 2 * * * mysqldump -u antigaspi_user -pMOT_DE_PASSE antigaspi_production > /backup/antigaspi_$(date +\%Y\%m\%d).sql
```

### Nettoyer les logs

```bash
# Nettoyer les vieux logs Laravel
php artisan log:clear

# OU manuellement
rm -f /var/www/antigaspi/storage/logs/*.log

# Nettoyer les logs Nginx (garder les 7 derniers jours)
find /var/log/nginx/ -name "*.log*" -mtime +7 -delete
```

---

## 🐛 Troubleshooting

### Erreur 500 - Internal Server Error

```bash
# Vérifier les logs Laravel
tail -50 /var/www/antigaspi/storage/logs/laravel.log

# Vérifier les logs Nginx
tail -50 /var/log/nginx/antigaspi_error.log

# Vérifier les permissions
ls -la /var/www/antigaspi/storage
ls -la /var/www/antigaspi/bootstrap/cache

# Recréer les permissions si nécessaire
chown -R www-data:www-data /var/www/antigaspi
chmod -R 775 /var/www/antigaspi/storage
chmod -R 775 /var/www/antigaspi/bootstrap/cache
```

### Erreur de connexion à la base de données

```bash
# Vérifier que MySQL est démarré
systemctl status mysql

# Tester la connexion
mysql -u antigaspi_user -p antigaspi_production

# Vérifier les credentials dans .env
cat /var/www/antigaspi/.env | grep DB_

# Vider le cache de configuration
php artisan config:clear
```

### Performance lente

```bash
# Activer l'OPcache pour PHP
nano /etc/php/8.2/fpm/php.ini

# Ajouter/modifier:
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000

# Redémarrer PHP-FPM
systemctl restart php8.2-fpm

# Installer Redis pour le cache
apt install redis-server
systemctl start redis
systemctl enable redis

# Modifier .env
CACHE_DRIVER=redis
SESSION_DRIVER=redis
```

### Nginx n'accepte pas les gros fichiers

```bash
# Modifier nginx.conf
nano /etc/nginx/sites-available/antigaspi

# Augmenter la limite:
client_max_body_size 50M;

# Aussi modifier php.ini
nano /etc/php/8.2/fpm/php.ini

upload_max_filesize = 50M
post_max_size = 50M

# Redémarrer les services
systemctl reload nginx
systemctl restart php8.2-fpm
```

---

## 📞 Support

En cas de problème, vérifier :
1. Logs Laravel : `/var/www/antigaspi/storage/logs/laravel.log`
2. Logs Nginx : `/var/log/nginx/antigaspi_error.log`
3. Logs PHP-FPM : `/var/log/php8.2-fpm.log`
4. Statut des services : `systemctl status nginx mysql php8.2-fpm`

---

## ✅ Checklist finale

- [ ] Stack LEMP installée (Linux, Nginx, MySQL, PHP)
- [ ] Code Laravel transféré et déployé
- [ ] Fichier .env configuré avec les bonnes valeurs
- [ ] Dépendances Composer installées
- [ ] Base de données importée
- [ ] Permissions correctes sur storage/ et bootstrap/cache/
- [ ] Caches Laravel générés (config, route, view)
- [ ] Nginx configuré et redémarré
- [ ] SSL/HTTPS activé avec Let's Encrypt
- [ ] API accessible et fonctionnelle
- [ ] Tests de connexion réussis
- [ ] Sauvegarde automatique configurée

🎉 **Déploiement réussi !**
