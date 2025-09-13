# 📋 Règles de Développement - Workflow Antigaspi

> **Guidelines obligatoires pour le développement structuré avec Claude Code**

## 🎯 **Principes Fondamentaux**

### **Développement Méthodique**
- ✅ **Une étape = Une branche** - Pas de développement sur `main`
- ✅ **Tests continus** - Playwright MCP à chaque fonctionnalité
- ✅ **Validation rigoureuse** - Build + Tests + Push obligatoires
- ✅ **Documentation vivante** - CLAUDE.md mis à jour automatiquement

---

## 🌳 **Gestion des Branches Git**

### **Convention de Nommage**
```bash
# Format obligatoire
feature/etape-[numero]-[description-courte]

# Exemples corrects
feature/etape-1-config-tests
feature/etape-2-architecture-frontend
feature/etape-3-auth-frontend

# ❌ Exemples incorrects
feature/frontend
etape-1
auth-system
```

### **Workflow de Branches**
1. **Créer nouvelle branche** avant chaque étape
   ```bash
   git checkout -b feature/etape-X-description
   ```

2. **Développer uniquement sur cette branche**
   - Commits atomiques réguliers
   - Tests Playwright à chaque feature

3. **Valider avant merge**
   - Build successful
   - Tests E2E passants
   - Documentation à jour

4. **Merge vers main** après validation complète
   ```bash
   git checkout main
   git merge feature/etape-X-description
   git push origin main
   ```

---

## ✅ **Processus de Validation Obligatoire**

### **Avant chaque Push**
1. **🧹 Clean Build**
   ```bash
   # Backend Laravel
   composer install --optimize-autoloader
   php artisan config:clear
   php artisan cache:clear

   # Frontend (quand configuré)
   npm ci
   npm run build
   ```

2. **🧪 Tests Automatisés**
   ```bash
   # Tests Backend
   php artisan test

   # Tests E2E Playwright MCP
   npx playwright test
   ```

3. **📋 Contrôle Qualité**
   - [ ] Tous les objectifs de l'étape atteints
   - [ ] Aucune régression détectée
   - [ ] Interface responsive testée
   - [ ] Documentation mise à jour

4. **🚀 Push Distant**
   ```bash
   git add .
   git commit -m "[etape-X] Description des modifications"
   git push origin feature/etape-X-description
   ```

### **Critères de Blocage**
- ❌ **Build échoue** → Pas de push autorisé
- ❌ **Tests E2E échouent** → Correction obligatoire
- ❌ **Régression détectée** → Rollback et correction
- ❌ **Documentation obsolète** → Mise à jour requise

---

## 💬 **Conventions de Commit**

### **Format Obligatoire**
```bash
[etape-X] Description concise et professionnelle

# ✅ Exemples corrects
[etape-1] Configure Playwright MCP testing environment
[etape-2] Set up Vue.js 3 architecture with Tailwind CSS
[etape-3] Implement JWT authentication frontend

# ❌ Exemples incorrects (interdits)
Added some stuff
Fix bug
Update code
[etape-1] Travail fait par Jean-Claude
```

### **Règles Strictes**
- ❌ **Interdiction absolue** de noms personnels dans les commits
- ✅ **Messages en anglais** ou français professionnel
- ✅ **Commits atomiques** - Une fonctionnalité = Un commit
- ✅ **Descriptions précises** - What et Why, pas How

### **Types de Commits Standardisés**
```bash
[etape-X] feat: Nouvelle fonctionnalité
[etape-X] fix: Correction de bug
[etape-X] refactor: Refactorisation de code
[etape-X] test: Ajout/modification de tests
[etape-X] docs: Mise à jour documentation
[etape-X] style: Modifications UI/CSS
[etape-X] perf: Amélioration performance
```

---

## 🧪 **Configuration Tests Playwright MCP**

### **Tests Obligatoires par Étape**

#### **Étape 1 - Configuration**
- [ ] API health check accessible
- [ ] Base de données connectée
- [ ] Authentification JWT fonctionnelle

#### **Étape 2 - Architecture**
- [ ] Application Vue.js démarre
- [ ] Navigation entre pages
- [ ] Styles Tailwind appliqués

#### **Étape 3 - Authentification**
- [ ] Login/Register avec validation
- [ ] Redirection selon rôle
- [ ] Gestion des erreurs

#### **Étapes 4-7 - Interfaces**
- [ ] CRUD fonctionnalités complètes
- [ ] Responsive design validé
- [ ] Performance acceptable

#### **Étape 8 - Déploiement**
- [ ] Tests E2E complets
- [ ] Score Lighthouse > 90
- [ ] PWA fonctionnelle

### **Scripts de Test Automatisés**
```javascript
// Exemple test Playwright MCP
test('User can login and access dashboard', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('[data-testid="email"]', 'jean.dupont@email.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
});
```

---

## 📊 **Outils de Qualité**

### **Linting et Formatting**
```bash
# PHP (Laravel)
composer require --dev laravel/pint
./vendor/bin/pint

# JavaScript/TypeScript (Vue.js)
npm install --save-dev eslint @typescript-eslint/parser
npm install --save-dev prettier

# Auto-format avant commit
npm run lint:fix
npm run format
```

### **Performance Monitoring**
- **Lighthouse CI** intégré
- **Bundle Analyzer** pour optimisation
- **Core Web Vitals** surveillance

### **Security Checks**
- **PHP Security Checker** pour Laravel
- **npm audit** pour dépendances JS
- **OWASP guidelines** respectées

---

## 🔄 **Cycle de Développement Type**

### **Démarrage d'Étape**
1. Créer branche feature depuis main
2. Configurer environnement de test
3. Implémenter fonctionnalités étape par étape
4. Tests Playwright en continu

### **Validation d'Étape**
1. **Build complet** sans erreurs
2. **Tests E2E** 100% passants
3. **Code review** automatique
4. **Performance check** OK

### **Finalisation d'Étape**
1. **Documentation** mise à jour
2. **CLAUDE.md** actualisé
3. **Commit final** avec message standardisé
4. **Push vers GitHub** validé

---

## 🚨 **Gestion des Erreurs**

### **En Cas d'Échec de Build**
1. ❌ **STOP** - Ne pas pousser le code
2. 🔍 **Analyser** les logs d'erreur
3. 🔧 **Corriger** les problèmes identifiés
4. ✅ **Revalider** le build complet

### **En Cas d'Échec des Tests**
1. 🧪 **Identifier** le test qui échoue
2. 🐛 **Débugger** en mode interactif
3. 🔨 **Corriger** la fonctionnalité
4. 🔄 **Relancer** tous les tests

### **En Cas de Régression**
1. 🔄 **Rollback** vers le dernier commit stable
2. 📝 **Documenter** la régression
3. 🎯 **Plan de correction** avant de continuer
4. 🧪 **Tests supplémentaires** pour éviter récidive

---

## 📈 **Métriques de Qualité**

### **Objectifs par Étape**
- **Test Coverage** > 80%
- **Performance Score** > 85
- **Accessibility Score** > 90
- **SEO Score** > 90

### **KPIs de Développement**
- Temps par étape respecté
- Zéro régression entre étapes
- Documentation toujours à jour
- Code review automatique réussi

---

## 🎯 **Checklist de Fin d'Étape**

### **Avant de Clôturer une Étape**
- [ ] ✅ Tous les objectifs de l'étape accomplis
- [ ] 🧪 Tests Playwright MCP passants
- [ ] 🏗️ Build production successful
- [ ] 📱 Interface responsive validée
- [ ] 📚 Documentation CLAUDE.md mise à jour
- [ ] 🔄 Branch mergée vers main
- [ ] 🚀 Code poussé vers GitHub
- [ ] 📊 Métriques qualité respectées

**❌ Une seule case non cochée = Étape non validée**

---

**📝 Document vivant mis à jour à chaque étape**
**🤖 Maintenu par Claude Code pour assurer la cohérence**

---

## 🔗 **Ressources Complémentaires**

- [CLAUDE.md](./CLAUDE.md) - Contexte technique du projet
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Documentation API
- [Playwright MCP Docs](https://playwright.dev/) - Guide des tests E2E
- [Vue.js Style Guide](https://vuejs.org/style-guide/) - Conventions Vue.js