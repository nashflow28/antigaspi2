# ✅ Checklist Post-Déploiement - Antigaspi API

## 🔍 Vérifications Immédiatement Après Déploiement

### 1. Services Système
```bash
# Vérifier que tous les services sont actifs
systemctl status nginx
systemctl status mysql
systemctl status php8.2-fpm
```

**Résultat attendu** : Tous les services affichent `active (running)`

---

### 2. Connectivité Base de Données
```bash
cd /var/www/antigaspi
php artisan migrate:status
```

**Résultat attendu** : Liste de toutes les migrations avec statut `Ran`

---

### 3. API Health Check
```bash
curl http://localhost/api/health
# OU avec le domaine:
curl https://api.antigaspi.tg/api/health
```

**Résultat attendu** :
```json
{
  "status": "ok",
  "message": "API is working",
  "timestamp": "2025-10-30T...",
  "version": "1.0.0"
}
```

---

### 4. Test d'Authentification
```bash
curl -X POST https://api.antigaspi.tg/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@antigaspi.com",
    "password": "password"
  }'
```

**Résultat attendu** : Réponse avec `access_token` JWT

---

### 5. Test des Produits
```bash
curl https://api.antigaspi.tg/api/products
```

**Résultat attendu** : Liste de produits (au moins 10)

---

### 6. Test des Catégories
```bash
curl https://api.antigaspi.tg/api/categories
```

**Résultat attendu** : Liste de catégories (Boulangerie, Fruits & Légumes, etc.)

---

### 7. Permissions des Fichiers
```bash
ls -la /var/www/antigaspi/storage
ls -la /var/www/antigaspi/bootstrap/cache
```

**Résultat attendu** :
- Propriétaire : `www-data:www-data`
- Permissions storage : `drwxrwxr-x` (775)
- Permissions bootstrap/cache : `drwxrwxr-x` (775)

---

### 8. Logs Laravel
```bash
tail -20 /var/www/antigaspi/storage/logs/laravel.log
```

**Résultat attendu** : Aucune erreur récente (ou seulement des warnings mineurs)

---

### 9. Certificat SSL (si configuré)
```bash
curl -I https://api.antigaspi.tg
```

**Résultat attendu** :
```
HTTP/2 200
server: nginx
```

Vérifier aussi avec navigateur : https://api.antigaspi.tg (pas de warning SSL)

---

### 10. Variables d'Environnement
```bash
cd /var/www/antigaspi
php artisan tinker
>>> config('app.env')
>>> config('app.debug')
>>> config('app.url')
>>> config('database.connections.mysql.database')
>>> exit
```

**Résultat attendu** :
- `app.env` : `production`
- `app.debug` : `false`
- `app.url` : Votre domaine
- `database` : Nom correct de la base

---

## 🔐 Sécurité

### 11. Fichier .env Non Accessible
```bash
curl https://api.antigaspi.tg/.env
```

**Résultat attendu** : Erreur 403 Forbidden ou 404 Not Found

---

### 12. Dossier storage Non Accessible
```bash
curl https://api.antigaspi.tg/storage/logs/laravel.log
```

**Résultat attendu** : Erreur 404 ou 403

---

### 13. Headers de Sécurité
```bash
curl -I https://api.antigaspi.tg
```

**Vérifier la présence de** :
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`

---

## ⚡ Performance

### 14. Cache Laravel
```bash
cd /var/www/antigaspi

# Vérifier que les caches existent
ls -la bootstrap/cache/config.php
ls -la bootstrap/cache/routes-v7.php
ls -la bootstrap/cache/packages.php
```

**Résultat attendu** : Tous les fichiers existent et sont récents

---

### 15. OPcache PHP (optionnel mais recommandé)
```bash
php -i | grep opcache.enable
```

**Résultat attendu** : `opcache.enable => On => On`

---

### 16. Temps de Réponse API
```bash
time curl https://api.antigaspi.tg/api/products
```

**Résultat attendu** : Temps total < 1 seconde

---

## 📊 Données

### 17. Comptes de Test Disponibles
```bash
mysql -u antigaspi_user -p antigaspi_production \
  -e "SELECT id, email, role FROM users LIMIT 5;"
```

**Résultat attendu** :
```
+----+--------------------------------+----------+
| id | email                          | role     |
+----+--------------------------------+----------+
|  1 | admin@antigaspi.com            | admin    |
|  2 | boulangerie.martin@email.com   | merchant |
|  3 | jean.dupont@email.com          | consumer |
```

---

### 18. Produits avec Images
```bash
mysql -u antigaspi_user -p antigaspi_production \
  -e "SELECT COUNT(*) as total_produits FROM products WHERE image_url IS NOT NULL;"
```

**Résultat attendu** : Au moins 10 produits avec images

---

### 19. Catégories Actives
```bash
mysql -u antigaspi_user -p antigaspi_production \
  -e "SELECT id, name, icon FROM categories WHERE is_active = 1;"
```

**Résultat attendu** : Au moins 5 catégories actives

---

## 🔄 Automatisation

### 20. Cron Job pour Sauvegardes (si configuré)
```bash
crontab -l | grep antigaspi
```

**Résultat attendu** : Ligne de cron pour la sauvegarde quotidienne

---

### 21. Renouvellement SSL Automatique
```bash
systemctl list-timers | grep certbot
```

**Résultat attendu** : Timer actif pour le renouvellement

---

## 📱 Tests Application Mobile

### 22. CORS Configuré
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type, Authorization" \
     -X OPTIONS \
     https://api.antigaspi.tg/api/auth/login -I
```

**Résultat attendu** : Headers CORS présents dans la réponse

---

### 23. Mise à Jour mobile/app.json

**Sur votre machine locale** :
```bash
cd mobile
nano app.json
```

Modifier :
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.antigaspi.tg/api"
    }
  }
}
```

Puis rebuilder l'APK mobile.

---

## 📝 Documentation

### 24. Informations à Noter
```bash
# Créer un fichier avec les informations du serveur
cat > /var/www/antigaspi/SERVER_INFO.txt << EOF
===========================================
ANTIGASPI - Informations Serveur
===========================================
Date de déploiement : $(date)
URL API : https://api.antigaspi.tg
IP Serveur : $(hostname -I | awk '{print $1}')
Version Laravel : $(cd /var/www/antigaspi && php artisan --version)
Version PHP : $(php -v | head -1)
Version MySQL : $(mysql --version)
Version Nginx : $(nginx -v 2>&1)

Base de données : antigaspi_production
Utilisateur DB : antigaspi_user

Comptes de test :
- Admin : admin@antigaspi.com / password
- Merchant : boulangerie.martin@email.com / password
- Consumer : jean.dupont@email.com / password

Logs :
- Laravel : /var/www/antigaspi/storage/logs/laravel.log
- Nginx Access : /var/log/nginx/antigaspi_access.log
- Nginx Error : /var/log/nginx/antigaspi_error.log
- PHP-FPM : /var/log/php8.2-fpm.log

Sauvegarde DB : /backup/antigaspi_*.sql
===========================================
EOF

cat /var/www/antigaspi/SERVER_INFO.txt
```

---

## ✅ Checklist Finale

Cocher chaque élément après vérification :

**Services Système**
- [ ] Nginx actif et fonctionnel
- [ ] MySQL actif et connecté
- [ ] PHP-FPM actif

**API**
- [ ] Health check répond `200 OK`
- [ ] Authentification fonctionne (login admin)
- [ ] Routes produits accessibles
- [ ] Routes catégories accessibles

**Sécurité**
- [ ] `.env` non accessible publiquement
- [ ] Headers de sécurité configurés
- [ ] SSL/HTTPS actif et valide
- [ ] APP_DEBUG=false en production

**Performance**
- [ ] Caches Laravel générés
- [ ] OPcache activé (optionnel)
- [ ] Temps de réponse < 1s

**Données**
- [ ] Base de données importée
- [ ] Comptes de test créés
- [ ] Produits disponibles
- [ ] Catégories actives

**Maintenance**
- [ ] Logs accessibles et propres
- [ ] Sauvegarde DB configurée
- [ ] SSL auto-renew configuré

**Mobile**
- [ ] CORS configuré
- [ ] mobile/app.json mis à jour avec nouvelle URL
- [ ] APK mobile rebuilder et testé

---

## 🎉 Validation Complète

Si tous les éléments de la checklist sont cochés :

```bash
echo "✅ Déploiement Antigaspi API validé avec succès !"
echo "📱 URL API: https://api.antigaspi.tg"
echo "📊 Status: PRODUCTION READY"
```

**Prochaines étapes :**
1. Informer l'équipe frontend de la nouvelle URL API
2. Tester l'application mobile avec l'API en production
3. Monitorer les logs pendant les premières 24h
4. Planifier la première sauvegarde manuelle
5. Documenter tout problème rencontré

---

**Date de validation** : _______________
**Validé par** : _______________
**Signature** : _______________
