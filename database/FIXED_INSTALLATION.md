# 🔧 Installation Base de Données - Version Corrigée

## ❌ **Problème Identifié**
Le script original `antigaspi_schema.sql` avait un problème d'ordre de création des tables. Les contraintes de clés étrangères échouaient car elles référençaient des tables pas encore créées.

## ✅ **Solution**

### **1. Utiliser le script corrigé**
```sql
-- Dans phpMyAdmin, exécuter ce fichier dans l'ordre :
SOURCE C:/xampp/htdocs/antigaspi-2/database/antigaspi_schema_fixed.sql;
```

### **2. Puis les données de test**
```sql
SOURCE C:/xampp/htdocs/antigaspi-2/database/sample_data.sql;
```

---

## 🔄 **Ordre Correct des Tables**

Le nouveau script crée les tables dans l'ordre correct des dépendances :

```
1. users              (Base - aucune dépendance)
2. categories          (Base - aucune dépendance)
3. merchants          (Dépend de: users)
4. products           (Dépend de: merchants, categories)
5. reservations       (Dépend de: users, products)  ✅ CORRIGÉ
6. payments           (Dépend de: reservations)
7. reviews            (Dépend de: users, merchants, products)
8. loyalty_points     (Dépend de: users)
9. notifications      (Dépend de: users)
10. analytics_daily   (Dépend de: merchants)
```

---

## 🧪 **Test d'Installation**

### **Étape 1: Nettoyer si nécessaire**
```sql
DROP DATABASE IF EXISTS antigaspi_db;
```

### **Étape 2: Créer avec le script corrigé**
```sql
SOURCE C:/xampp/htdocs/antigaspi-2/database/antigaspi_schema_fixed.sql;
```

### **Étape 3: Vérifier la création**
Vous devriez voir :
```
BASE DE DONNÉES CRÉÉE AVEC SUCCÈS!
Nombre de tables créées: 10
```

### **Étape 4: Ajouter les données de test**
```sql
SOURCE C:/xampp/htdocs/antigaspi-2/database/sample_data.sql;
```

---

## ✅ **Vérification Rapide**

```sql
-- Vérifier que toutes les tables existent
SHOW TABLES;

-- Vérifier quelques données
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as products FROM products;
SELECT COUNT(*) as categories FROM categories;

-- Tester une jointure complexe
SELECT
    p.name as produit,
    c.name as categorie,
    m.business_name as commerce,
    u.city as ville
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN merchants m ON p.merchant_id = m.id
JOIN users u ON m.user_id = u.id
LIMIT 5;
```

---

## 🚨 **Si vous avez encore des erreurs**

### **Erreur : "Table doesn't exist"**
➡️ Vérifiez que vous utilisez bien `antigaspi_schema_fixed.sql`

### **Erreur : "Cannot add foreign key constraint"**
➡️ Supprimez la base et recréez-la complètement :
```sql
DROP DATABASE IF EXISTS antigaspi_db;
SOURCE C:/xampp/htdocs/antigaspi-2/database/antigaspi_schema_fixed.sql;
```

### **Erreur avec les caractères**
➡️ Vérifiez que phpMyAdmin est configuré en UTF-8 :
- Collation : `utf8mb4_unicode_ci`

---

## 🎯 **Après Installation Réussie**

1. **Tester l'API** :
```bash
cd C:\xampp\htdocs\antigaspi-2\backend
php artisan serve
curl http://localhost:8000/api/health
```

2. **Tester une connexion** :
```json
POST http://localhost:8000/api/auth/login
{
  "email": "jean.dupont@email.com",
  "password": "password"
}
```

La base de données est maintenant correctement installée ! 🎉