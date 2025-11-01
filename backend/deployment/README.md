# 📦 Package de Déploiement - Antigaspi Backend API

## 🎯 Contenu du Package

Ce dossier contient **tout le nécessaire** pour déployer l'API Antigaspi sur un serveur VPS Ubuntu.

### 📁 Fichiers Inclus

| Fichier | Taille | Description |
|---------|--------|-------------|
| `database_dump.sql` | 66 KB | Dump complet de la base de données avec données de test |
| `.env.production.example` | 3 KB | Template de configuration production |
| `install.sh` | 6.5 KB | Script d'installation automatique Ubuntu |
| `nginx.conf` | 5.4 KB | Configuration Nginx optimisée |
| `DEPLOY.md` | 11 KB | Guide complet de déploiement étape par étape |
| `POST_DEPLOY_CHECKLIST.md` | 8.5 KB | Checklist de vérification après déploiement |
| `README.md` | Ce fichier | Vue d'ensemble du package |

**Taille totale** : ~100 KB (très léger, facile à transférer)

---

## 🚀 Démarrage Rapide (3 étapes)

### 1️⃣ Transférer le package sur le serveur

```bash
# Depuis votre machine locale
scp -r backend/deployment root@VOTRE_IP_SERVEUR:/tmp/antigaspi-deploy/
```

### 2️⃣ Exécuter le script d'installation

```bash
# Sur le serveur
cd /tmp/antigaspi-deploy
chmod +x install.sh
sudo ./install.sh
```

### 3️⃣ Suivre le guide DEPLOY.md

Le script affichera les instructions finales. Consultez `DEPLOY.md` pour les étapes détaillées.

---

## 📋 Prérequis

### Serveur VPS
- **OS** : Ubuntu 22.04 LTS ou 24.04 LTS
- **RAM** : 2 GB minimum (4 GB recommandé)
- **CPU** : 1 vCPU minimum
- **Stockage** : 20 GB minimum
- **Accès** : SSH avec root ou sudo

### Nom de Domaine
- DNS configuré (ex: `api.antigaspi.tg` → IP du serveur)
- Recommandé pour SSL/HTTPS

---

## 🔧 Ce que le Script d'Installation Fait

Le script `install.sh` automatise l'installation complète :

✅ **Système**
- Mise à jour Ubuntu
- Installation des dépendances essentielles

✅ **PHP 8.2**
- Installation de PHP et toutes les extensions Laravel
- Configuration optimale pour production

✅ **Composer**
- Installation du gestionnaire de dépendances PHP

✅ **MySQL 8.0**
- Installation et sécurisation
- Création de la base de données `antigaspi_production`
- Création de l'utilisateur MySQL avec permissions

✅ **Nginx**
- Installation du serveur web
- Configuration de base

---

## 📚 Documentation

### 1. Guide Complet : `DEPLOY.md`

Documentation complète avec :
- Installation automatique (recommandé)
- Installation manuelle (si besoin)
- Déploiement du code Laravel
- Configuration Nginx
- Configuration SSL/HTTPS
- Maintenance et mises à jour
- Troubleshooting

👉 **Commencer par ce fichier**

### 2. Template Configuration : `.env.production.example`

Fichier `.env` pré-configuré avec :
- Toutes les variables d'environnement
- Commentaires explicatifs
- Valeurs par défaut sécurisées

À copier vers `.env` et personnaliser.

### 3. Configuration Nginx : `nginx.conf`

Configuration optimisée pour Laravel :
- Routing Laravel
- Sécurité (headers, deny .env, etc.)
- Performance (gzip, cache)
- Configuration HTTPS (commentée, à activer après SSL)

### 4. Checklist Validation : `POST_DEPLOY_CHECKLIST.md`

Liste de vérification complète :
- 24 tests à effectuer après déploiement
- Commandes de validation
- Résultats attendus
- Sécurité, performance, données

---

## 🗄️ Base de Données

### Dump SQL : `database_dump.sql`

Contient :
- **Structure complète** : 40 tables avec indexes
- **Données de test** :
  - 3 utilisateurs (admin, merchant, consumer)
  - 5 catégories
  - 10+ produits
  - Commerçants, réservations, reviews

**Comptes de test inclus** :
```
Admin     : admin@antigaspi.com / password
Merchant  : boulangerie.martin@email.com / password
Consumer  : jean.dupont@email.com / password
```

---

## 🔐 Sécurité

### Variables Sensibles

⚠️ **À modifier IMPÉRATIVEMENT dans `.env`** :
- `APP_KEY` (généré automatiquement)
- `JWT_SECRET` (généré automatiquement)
- `DB_PASSWORD` (choisir un mot de passe fort)

### Bonnes Pratiques

✅ Activer SSL/HTTPS (Let's Encrypt gratuit)
✅ Utiliser des mots de passe forts
✅ Désactiver le mode debug (`APP_DEBUG=false`)
✅ Configurer les sauvegardes automatiques
✅ Monitorer les logs régulièrement

---

## 📱 Intégration Mobile

### Après Déploiement

Mettre à jour l'URL de l'API dans l'application mobile :

**Fichier** : `mobile/app.json`

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.antigaspi.tg/api"
    }
  }
}
```

Puis rebuilder l'APK :
```bash
cd mobile/android
./gradlew :app:assembleRelease
```

---

## 🆘 Support

### En Cas de Problème

1. **Consulter DEPLOY.md** → Section "Troubleshooting"
2. **Vérifier les logs** :
   - Laravel : `/var/www/antigaspi/storage/logs/laravel.log`
   - Nginx : `/var/log/nginx/antigaspi_error.log`
   - MySQL : `/var/log/mysql/error.log`
3. **Utiliser la checklist** → `POST_DEPLOY_CHECKLIST.md`

### Commandes de Diagnostic

```bash
# Statut des services
systemctl status nginx mysql php8.2-fpm

# Test de l'API
curl http://localhost/api/health

# Logs en temps réel
tail -f /var/www/antigaspi/storage/logs/laravel.log
```

---

## 📊 Architecture Déployée

```
┌─────────────────────────────────────┐
│         Internet                    │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │   Nginx (Port 80/443)│  ← Serveur Web
    │   + SSL/HTTPS        │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │   PHP 8.2-FPM        │  ← Traitement PHP
    │   Laravel Framework  │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │   MySQL 8.0          │  ← Base de données
    │   antigaspi_prod     │
    └──────────────────────┘
```

---

## ✅ Checklist Avant de Transférer

Avant de donner le package à votre collègue, vérifier :

- [x] `database_dump.sql` généré et contient les données
- [x] `.env.production.example` configuré
- [x] `install.sh` testé et fonctionnel
- [x] `nginx.conf` avec le bon nom de domaine
- [x] `DEPLOY.md` complet et à jour
- [x] `POST_DEPLOY_CHECKLIST.md` complet
- [x] Ce `README.md` clair et informatif

---

## 🎯 Estimation Temps de Déploiement

| Étape | Durée Estimée |
|-------|---------------|
| Installation stack (script automatique) | 10-15 min |
| Transfert code Laravel | 2-5 min |
| Configuration .env | 5 min |
| Import base de données | 1 min |
| Configuration Nginx | 5 min |
| Configuration SSL | 5 min |
| Tests et validation | 10 min |
| **TOTAL** | **~45 minutes** |

---

## 📞 Contact

Pour toute question sur le déploiement :
- Consulter `DEPLOY.md` en premier
- Vérifier `POST_DEPLOY_CHECKLIST.md`
- Contacter l'équipe technique

---

## 🎉 Bon Déploiement !

Ce package contient tout ce dont vous avez besoin pour un déploiement réussi.

**Ordre recommandé de lecture** :
1. Ce README (pour vue d'ensemble) ✅ Vous êtes ici
2. `DEPLOY.md` (pour les étapes détaillées)
3. `POST_DEPLOY_CHECKLIST.md` (pour la validation)

---

**Version** : 1.0
**Date** : Octobre 2025
**Projet** : Antigaspi - API Backend Laravel
