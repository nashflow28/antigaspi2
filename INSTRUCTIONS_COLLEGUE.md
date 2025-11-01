# 📦 Instructions pour le Déploiement - Antigaspi Backend

## 🎯 2 Options pour Récupérer le Code

### ✅ OPTION 1 : Via Git (RECOMMANDÉ si le repo est à jour)

**Avantages** :
- ✅ Plus rapide (pas de gros fichier à transférer)
- ✅ Historique Git conservé (pour futures mises à jour)
- ✅ Toujours la dernière version
- ✅ Peut pull les mises à jour facilement

**Sur le serveur VPS** :

```bash
# Se connecter au serveur
ssh root@VOTRE_IP_SERVEUR

# Installer Git si nécessaire
apt install -y git

# Cloner le repository
cd /var/www
git clone https://github.com/nashflow28/antigaspi2.git antigaspi-temp
mv antigaspi-temp/backend antigaspi
rm -rf antigaspi-temp

# OU si le repo backend est séparé :
git clone https://github.com/VOTRE_USERNAME/antigaspi-backend.git antigaspi

# Installer les dépendances
cd /var/www/antigaspi
composer install --optimize-autoloader --no-dev
```

---

### ✅ OPTION 2 : Archive Compressée (Si pas d'accès Git ou connexion lente)

**Avantages** :
- ✅ Pas besoin d'accès GitHub
- ✅ Tout est inclus dans un seul fichier
- ✅ Transfert unique et simple

**Fichier à transférer** :
```
antigaspi-backend-production.tar.gz (22 MB)
```

**Contenu de l'archive** :
- ✅ Tout le code Laravel
- ✅ Dossier `deployment/` avec scripts et dump SQL
- ✅ Configuration `.gitignore`, `composer.json`, etc.
- ❌ SANS `vendor/` (sera installé sur le serveur)
- ❌ SANS `.git/` (pour alléger)
- ❌ SANS logs

**Transfert vers le serveur** :

```bash
# Depuis votre machine locale
scp antigaspi-backend-production.tar.gz root@VOTRE_IP_SERVEUR:/tmp/

# Sur le serveur
ssh root@VOTRE_IP_SERVEUR
cd /var/www
tar -xzf /tmp/antigaspi-backend-production.tar.gz
mv backend antigaspi
rm /tmp/antigaspi-backend-production.tar.gz

# Installer les dépendances
cd /var/www/antigaspi
composer install --optimize-autoloader --no-dev
```

---

## 📋 Ce qui est Inclus dans l'Archive

### Dossier `deployment/` (Scripts de déploiement)
```
deployment/
├── database_dump.sql              # Base de données complète (66 KB)
├── .env.production.example        # Template configuration (4 KB)
├── install.sh                     # Script installation automatique (7 KB)
├── nginx.conf                     # Configuration Nginx (5 KB)
├── DEPLOY.md                      # Guide complet (11 KB)
├── POST_DEPLOY_CHECKLIST.md       # Checklist validation (8 KB)
└── README.md                      # Vue d'ensemble (8 KB)
```

### Code Laravel
```
app/                    # Contrôleurs, Models, Middleware
config/                 # Configuration Laravel
database/               # Migrations, Seeders, Factories
routes/                 # Routes API
public/                 # Point d'entrée (index.php)
storage/                # Logs, cache, uploads
.env.example            # Template .env développement
composer.json           # Dépendances PHP
artisan                 # CLI Laravel
```

---

## 🚀 Étapes Après Récupération du Code

**Quelle que soit l'option choisie, suivre ces étapes :**

### 1. Exécuter le Script d'Installation

```bash
cd /var/www/antigaspi/deployment
chmod +x install.sh
sudo ./install.sh
```

**Le script va** :
- Installer PHP 8.2 + MySQL 8.0 + Nginx
- Créer la base de données
- Configurer les permissions

### 2. Configuration Laravel

```bash
cd /var/www/antigaspi

# Copier et éditer le fichier .env
cp deployment/.env.production.example .env
nano .env

# Modifier ces variables critiques :
# - APP_URL=https://votre-domaine.com
# - DB_PASSWORD=mot_de_passe_fort
# - FRONTEND_URL=https://votre-frontend.com
```

### 3. Générer les Clés

```bash
# Clé d'application Laravel
php artisan key:generate

# Clé JWT pour authentification
php artisan jwt:secret
```

### 4. Importer la Base de Données

```bash
mysql -u antigaspi_user -p antigaspi_production < deployment/database_dump.sql
```

### 5. Optimiser pour Production

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 6. Configurer les Permissions

```bash
chown -R www-data:www-data /var/www/antigaspi
chmod -R 755 /var/www/antigaspi
chmod -R 775 /var/www/antigaspi/storage
chmod -R 775 /var/www/antigaspi/bootstrap/cache
```

### 7. Configurer Nginx

```bash
cp /var/www/antigaspi/deployment/nginx.conf /etc/nginx/sites-available/antigaspi
ln -s /etc/nginx/sites-available/antigaspi /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 8. Tester l'API

```bash
curl http://localhost/api/health

# Résultat attendu:
# {"status":"ok","message":"API is working",...}
```

---

## 📚 Documentation Complète

Tout est documenté dans le dossier `deployment/` :

1. **README.md** → Vue d'ensemble du package (START HERE)
2. **DEPLOY.md** → Guide complet pas à pas (45 min)
3. **POST_DEPLOY_CHECKLIST.md** → Validation (24 tests)

---

## 🔐 Comptes de Test Inclus

**Dans database_dump.sql** :

| Rôle | Email | Password |
|------|-------|----------|
| Admin | admin@antigaspi.com | password |
| Merchant | boulangerie.martin@email.com | password |
| Consumer | jean.dupont@email.com | password |

**⚠️ À CHANGER EN PRODUCTION !**

---

## ⏱️ Temps Estimé

| Étape | Durée |
|-------|-------|
| Transfert fichiers (Option 1 ou 2) | 5-10 min |
| Installation stack (script) | 10-15 min |
| Configuration Laravel | 5 min |
| Configuration Nginx + SSL | 10 min |
| Tests et validation | 10 min |
| **TOTAL** | **~45 minutes** |

---

## 🆘 En Cas de Problème

Consulter dans l'ordre :

1. **DEPLOY.md** → Section "Troubleshooting"
2. **POST_DEPLOY_CHECKLIST.md** → Tests de validation
3. **Logs système** :
   - `/var/www/antigaspi/storage/logs/laravel.log`
   - `/var/log/nginx/antigaspi_error.log`
   - `/var/log/mysql/error.log`

---

## ✅ Checklist Finale

Après déploiement, vérifier :

- [ ] API accessible : `curl https://api.antigaspi.tg/api/health`
- [ ] Authentification fonctionne (login admin)
- [ ] Produits retournés : `curl https://api.antigaspi.tg/api/products`
- [ ] SSL/HTTPS actif et valide
- [ ] Logs propres (pas d'erreurs critiques)

---

## 🎉 C'est Prêt !

**Quelle que soit l'option choisie, tout est inclus pour un déploiement réussi.**

**Bon déploiement ! 🚀**
