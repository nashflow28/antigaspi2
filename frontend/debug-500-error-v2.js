// 🧠 Sequential Thinking Debug: Erreur 500 avec sélection de produits
import { chromium } from 'playwright';

class Error500DebuggerV2 {
  constructor() {
    this.browser = null;
    this.page = null;
    this.requestData = null;
    this.responseData = null;
  }

  logStep(step, status, details = '') {
    const timestamp = new Date().toISOString();
    const emoji = status === 'SUCCESS' ? '✅' : status === 'FAIL' ? '❌' : status === 'INFO' ? 'ℹ️' : '🔍';
    console.log(`${emoji} [${timestamp.slice(11, 19)}] ${step}: ${details}`);
  }

  async initialize() {
    this.logStep('INIT', 'INFO', 'Démarrage du debugging erreur 500 v2');

    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();

    // Capturer les détails de la requête POST
    this.page.on('request', request => {
      if (request.url().includes('/api/surprise-baskets') && request.method() === 'POST') {
        this.requestData = {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        };
        this.logStep('REQUEST_CAPTURED', 'INFO', `POST ${request.url()}`);

        if (this.requestData.postData) {
          this.logStep('REQUEST_BODY', 'INFO', `Body: ${this.requestData.postData.substring(0, 200)}...`);
        }
      }
    });

    // Capturer la réponse 500
    this.page.on('response', async response => {
      if (response.url().includes('/api/surprise-baskets') && response.status() === 500) {
        try {
          const responseText = await response.text();
          this.responseData = {
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            body: responseText
          };

          this.logStep('ERROR_500_CAPTURED', 'FAIL', `Status: ${response.status()}`);
          this.logStep('ERROR_BODY', 'FAIL', `Body: ${responseText.substring(0, 300)}...`);
        } catch (e) {
          this.logStep('ERROR_CAPTURE_FAILED', 'FAIL', e.message);
        }
      }
    });

    this.logStep('INIT', 'SUCCESS', 'Monitoring configuré');
  }

  async reproduceError() {
    this.logStep('REPRODUCE', 'INFO', 'Reproduction de l\'erreur 500 avec produits');

    try {
      await this.page.goto('http://localhost:3002');
      await this.page.click('text=Connexion');
      await this.page.fill('input[type="email"]', 'boulangerie.martin@email.com');
      await this.page.fill('input[type="password"]', 'password');
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(3000);

      await this.page.goto('http://localhost:3002/merchant/surprise-baskets');
      await this.page.waitForTimeout(2000);

      // Cliquer sur créer
      await this.page.click('text=Créer');
      await this.page.waitForTimeout(1000);

      // Remplir le formulaire avec des données minimales mais valides
      await this.page.fill('#name', 'Test Debug 500 V2');
      await this.page.fill('#description', 'Panier de test pour debugger erreur 500');

      // Remplir le prix
      await this.page.fill('#price', '500');

      // Quantité
      await this.page.fill('#quantity', '2');

      // Date d'expiration
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await this.page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);

      this.logStep('BASIC_FORM_FILLED', 'SUCCESS', 'Formulaire de base rempli');

      // ÉTAPE CRITIQUE: Ajouter des produits au panier
      this.logStep('ADDING_PRODUCTS', 'INFO', 'Ajout de produits au panier surprise');

      // Cliquer sur "Ajouter des produits"
      await this.page.click('text=Ajouter des produits');
      await this.page.waitForTimeout(2000);

      // Vérifier si la modal est ouverte
      const modalVisible = await this.page.isVisible('.modal, [role="dialog"], .product-selector');
      if (modalVisible) {
        this.logStep('MODAL_OPENED', 'SUCCESS', 'Modal de sélection de produits ouverte');

        // Essayer de sélectionner des produits
        const productCheckboxes = await this.page.locator('input[type="checkbox"]').count();
        this.logStep('PRODUCTS_FOUND', 'INFO', `${productCheckboxes} produits trouvés`);

        if (productCheckboxes > 0) {
          // Sélectionner le premier produit
          await this.page.click('input[type="checkbox"]');
          await this.page.waitForTimeout(500);

          // Chercher le bouton de validation
          const confirmSelectors = [
            'text=Valider',
            'text=Confirmer',
            'text=Ajouter',
            'button[type="submit"]',
            '[data-testid="confirm-selection"]'
          ];

          for (const selector of confirmSelectors) {
            try {
              if (await this.page.isVisible(selector, { timeout: 1000 })) {
                await this.page.click(selector);
                this.logStep('PRODUCTS_SELECTED', 'SUCCESS', `Produits sélectionnés via: ${selector}`);
                break;
              }
            } catch (e) {
              // Continue
            }
          }

          await this.page.waitForTimeout(1000);
        }
      } else {
        this.logStep('MODAL_NOT_FOUND', 'FAIL', 'Modal de sélection non trouvée');
      }

      // Vérifier si des produits sont maintenant affichés
      const selectedProductsVisible = await this.page.isVisible('.space-y-4 > div', { timeout: 2000 });
      if (selectedProductsVisible) {
        this.logStep('PRODUCTS_DISPLAYED', 'SUCCESS', 'Produits sélectionnés affichés');
      } else {
        this.logStep('NO_PRODUCTS_DISPLAYED', 'FAIL', 'Aucun produit affiché après sélection');
      }

      // Vérifier l'état du bouton submit
      const submitButton = this.page.locator('button[type="submit"]').last();
      const isDisabled = await submitButton.getAttribute('disabled');

      if (isDisabled !== null) {
        this.logStep('SUBMIT_DISABLED', 'FAIL', 'Bouton submit toujours disabled');

        // Debug: Afficher l'état des champs requis
        const nameValue = await this.page.inputValue('#name');
        const priceValue = await this.page.inputValue('#price');
        const quantityValue = await this.page.inputValue('#quantity');

        this.logStep('FORM_DEBUG', 'INFO', `Name: "${nameValue}", Price: "${priceValue}", Qty: "${quantityValue}"`);

        // Forcer l'activation si nécessaire (pour test)
        await this.page.evaluate(() => {
          const submitBtn = document.querySelector('button[type="submit"]:last-of-type');
          if (submitBtn) {
            submitBtn.removeAttribute('disabled');
            submitBtn.classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
          }
        });

        this.logStep('SUBMIT_FORCED', 'INFO', 'Bouton submit forcé pour test');
      } else {
        this.logStep('SUBMIT_ENABLED', 'SUCCESS', 'Bouton submit activé');
      }

      // Soumettre le formulaire
      await this.page.click('button[type="submit"]:last-of-type');
      this.logStep('FORM_SUBMITTED', 'SUCCESS', 'Formulaire soumis');

      // Attendre la réponse
      await this.page.waitForTimeout(5000);

    } catch (error) {
      this.logStep('REPRODUCE', 'FAIL', error.message);
    }
  }

  analyzeError() {
    this.logStep('ANALYSIS', 'INFO', 'Analyse de l\'erreur 500');

    console.log('\n' + '='.repeat(70));
    console.log('🔍 ANALYSE DÉTAILLÉE DE L\'ERREUR 500 V2');
    console.log('='.repeat(70));

    if (this.requestData) {
      console.log('\n📤 REQUÊTE ENVOYÉE:');
      console.log(`URL: ${this.requestData.url}`);
      console.log(`Méthode: ${this.requestData.method}`);
      console.log('Headers:');
      Object.entries(this.requestData.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });

      if (this.requestData.postData) {
        console.log('\nBody:');
        try {
          const parsed = JSON.parse(this.requestData.postData);
          console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(this.requestData.postData);
        }
      }
    }

    if (this.responseData) {
      console.log('\n📥 RÉPONSE SERVEUR:');
      console.log(`Status: ${this.responseData.status} ${this.responseData.statusText}`);
      console.log('Headers:');
      Object.entries(this.responseData.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });

      console.log('\nBody:');
      console.log(this.responseData.body);

      // Analyser le type d'erreur
      console.log('\n🎯 DIAGNOSTIC:');
      if (this.responseData.body.includes('ValidationException')) {
        console.log('🚨 ERREUR DE VALIDATION: Données de formulaire invalides');
      } else if (this.responseData.body.includes('QueryException')) {
        console.log('🚨 ERREUR BASE DE DONNÉES: Problème SQL');
      } else if (this.responseData.body.includes('AuthenticationException')) {
        console.log('🚨 ERREUR AUTHENTIFICATION: Token invalide');
      } else if (this.responseData.body.includes('NotFoundHttpException')) {
        console.log('🚨 ERREUR ROUTE: Route non trouvée');
      } else {
        console.log('🚨 ERREUR INCONNUE: Analyser le body complet');
      }
    } else {
      console.log('\n❌ AUCUNE RÉPONSE 500 CAPTURÉE');
      console.log('L\'erreur pourrait être:');
      console.log('- Le bouton était disabled (pas de produits sélectionnés)');
      console.log('- Un timeout côté frontend');
      console.log('- Une erreur de validation côté client');
      console.log('- Un problème de modal de sélection de produits');
    }

    console.log('\n💡 ACTIONS RECOMMANDÉES:');
    console.log('1. Vérifier la modal ProductSelectorModal');
    console.log('2. Vérifier la sélection de produits dans le formulaire');
    console.log('3. Vérifier les données envoyées dans la requête POST');
    console.log('4. Vérifier le contrôleur SurpriseBasketController::store()');

    console.log('='.repeat(70));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runDebug() {
    try {
      await this.initialize();
      await this.reproduceError();
      this.analyzeError();
    } catch (error) {
      this.logStep('GLOBAL_ERROR', 'FAIL', error.message);
    } finally {
      await this.cleanup();
    }
  }
}

// Lancement du debugging
const error500DebuggerV2 = new Error500DebuggerV2();
error500DebuggerV2.runDebug().catch(console.error);