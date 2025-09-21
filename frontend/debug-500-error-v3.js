// 🧠 Sequential Thinking Debug: Erreur 500 avec workflow modal complet
import { chromium } from 'playwright';

class Error500DebuggerV3 {
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
    this.logStep('INIT', 'INFO', 'Démarrage du debugging erreur 500 v3');

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
          this.logStep('REQUEST_BODY', 'INFO', `Body: ${this.requestData.postData.substring(0, 300)}...`);
        }
      }
    });

    // Capturer toutes les réponses d'erreur
    this.page.on('response', async response => {
      if (response.url().includes('/api/surprise-baskets')) {
        if (response.status() >= 400) {
          try {
            const responseText = await response.text();
            this.responseData = {
              status: response.status(),
              statusText: response.statusText(),
              headers: response.headers(),
              body: responseText
            };

            this.logStep('ERROR_CAPTURED', 'FAIL', `Status: ${response.status()}`);
            this.logStep('ERROR_BODY', 'FAIL', `Body: ${responseText.substring(0, 400)}...`);
          } catch (e) {
            this.logStep('ERROR_CAPTURE_FAILED', 'FAIL', e.message);
          }
        } else {
          this.logStep('SUCCESS_RESPONSE', 'SUCCESS', `Status: ${response.status()}`);
        }
      }
    });

    this.logStep('INIT', 'SUCCESS', 'Monitoring configuré');
  }

  async reproduceError() {
    this.logStep('REPRODUCE', 'INFO', 'Reproduction complète du workflow panier surprise');

    try {
      // Phase 1: Authentification
      this.logStep('AUTH_START', 'INFO', 'Démarrage authentification');
      await this.page.goto('http://localhost:3002');
      await this.page.click('text=Connexion');
      await this.page.fill('input[type="email"]', 'boulangerie.martin@email.com');
      await this.page.fill('input[type="password"]', 'password');
      await this.page.click('button[type="submit"]');
      await this.page.waitForTimeout(3000);
      this.logStep('AUTH_SUCCESS', 'SUCCESS', 'Authentification terminée');

      // Phase 2: Navigation vers les paniers surprise
      this.logStep('NAVIGATION', 'INFO', 'Navigation vers les paniers surprise');
      await this.page.goto('http://localhost:3002/merchant/surprise-baskets');
      await this.page.waitForTimeout(2000);

      // Phase 3: Ouverture du formulaire de création
      this.logStep('FORM_OPEN', 'INFO', 'Ouverture formulaire de création');
      await this.page.click('text=Créer');
      await this.page.waitForTimeout(1000);

      // Phase 4: Remplissage des informations de base
      this.logStep('BASIC_INFO', 'INFO', 'Remplissage informations de base');
      await this.page.fill('#name', 'Test Debug 500 V3');
      await this.page.fill('#description', 'Panier de test pour debugger erreur 500');
      await this.page.fill('#price', '750');
      await this.page.fill('#quantity', '3');

      // Date d'expiration
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await this.page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);

      this.logStep('BASIC_INFO_SUCCESS', 'SUCCESS', 'Informations de base remplies');

      // Phase 5: Ouverture de la modal de sélection de produits
      this.logStep('MODAL_OPEN', 'INFO', 'Ouverture modal sélection produits');
      await this.page.click('text=Ajouter des produits');
      await this.page.waitForTimeout(2000);

      // Vérifier que la modal est ouverte
      const modalVisible = await this.page.isVisible('.fixed.inset-0.bg-black.bg-opacity-50');
      if (!modalVisible) {
        throw new Error('Modal de sélection de produits non trouvée');
      }
      this.logStep('MODAL_VISIBLE', 'SUCCESS', 'Modal de sélection visible');

      // Phase 6: Attendre le chargement des produits
      this.logStep('PRODUCTS_LOADING', 'INFO', 'Attente chargement des produits');
      await this.page.waitForTimeout(3000);

      // Vérifier si des produits sont affichés
      const productsGrid = await this.page.locator('.grid.grid-cols-1.md\\:grid-cols-2.gap-4 > div').count();
      this.logStep('PRODUCTS_COUNT', 'INFO', `${productsGrid} produits trouvés`);

      if (productsGrid === 0) {
        this.logStep('NO_PRODUCTS', 'FAIL', 'Aucun produit disponible');
        // Fermer la modal et continuer quand même
        await this.page.click('text=Annuler');
        await this.page.waitForTimeout(1000);
      } else {
        // Phase 7: Sélection d'un produit
        this.logStep('PRODUCT_SELECT', 'INFO', 'Sélection du premier produit');

        // Cliquer sur le bouton "Ajouter" du premier produit
        await this.page.click('text=Ajouter >> nth=0');
        await this.page.waitForTimeout(500);

        // Optionnel: Ajuster la quantité
        const quantityInput = this.page.locator('input[type="number"]').first();
        if (await quantityInput.isVisible({ timeout: 1000 })) {
          await quantityInput.fill('2');
          this.logStep('QUANTITY_SET', 'SUCCESS', 'Quantité ajustée à 2');
        }

        // Phase 8: Confirmation de la sélection
        this.logStep('CONFIRM_SELECTION', 'INFO', 'Confirmation de la sélection');
        await this.page.click('text=Confirmer la sélection');
        await this.page.waitForTimeout(2000);

        // Vérifier que la modal est fermée
        const modalClosed = await this.page.isHidden('.fixed.inset-0.bg-black.bg-opacity-50', { timeout: 3000 });
        if (modalClosed) {
          this.logStep('MODAL_CLOSED', 'SUCCESS', 'Modal fermée avec succès');
        } else {
          this.logStep('MODAL_STILL_OPEN', 'FAIL', 'Modal toujours ouverte');
        }
      }

      // Phase 9: Vérification de l'état du formulaire
      this.logStep('FORM_VALIDATION', 'INFO', 'Validation de l\'état du formulaire');

      // Vérifier si des produits sont affichés dans le formulaire
      const selectedProductsVisible = await this.page.isVisible('.space-y-4 > div', { timeout: 2000 });
      this.logStep('PRODUCTS_IN_FORM', selectedProductsVisible ? 'SUCCESS' : 'FAIL',
        selectedProductsVisible ? 'Produits affichés dans le formulaire' : 'Aucun produit dans le formulaire');

      // Vérifier l'état du bouton submit
      const submitButton = this.page.locator('button[type="submit"]').last();
      const isDisabled = await submitButton.getAttribute('disabled');

      if (isDisabled !== null) {
        this.logStep('SUBMIT_DISABLED', 'FAIL', 'Bouton submit disabled');

        // Afficher les valeurs du formulaire pour diagnostic
        const formValues = {
          name: await this.page.inputValue('#name'),
          price: await this.page.inputValue('#price'),
          quantity: await this.page.inputValue('#quantity'),
          date: await this.page.inputValue('input[type="date"]')
        };

        this.logStep('FORM_VALUES', 'INFO', JSON.stringify(formValues));

        // Si pas de produits sélectionnés, essayer de forcer l'ajout
        if (!selectedProductsVisible) {
          this.logStep('FORCE_PRODUCT', 'INFO', 'Tentative de forcer l\'ajout de produit');
          // Simuler l'ajout d'un produit via JavaScript
          await this.page.evaluate(() => {
            // Simuler l'état avec un produit sélectionné
            const event = new CustomEvent('force-product-selection', {
              detail: [{ id: 1, quantity: 1 }]
            });
            window.dispatchEvent(event);
          });
          await this.page.waitForTimeout(1000);
        }

        // Forcer l'activation du bouton pour le test
        await this.page.evaluate(() => {
          const submitBtn = document.querySelector('button[type="submit"]:last-of-type');
          if (submitBtn) {
            submitBtn.removeAttribute('disabled');
            submitBtn.classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
          }
        });
        this.logStep('SUBMIT_FORCED', 'INFO', 'Bouton submit forcé pour test');
      } else {
        this.logStep('SUBMIT_ENABLED', 'SUCCESS', 'Bouton submit activé naturellement');
      }

      // Phase 10: Soumission du formulaire
      this.logStep('FORM_SUBMIT', 'INFO', 'Soumission du formulaire');

      // Attendre que tous les overlays soient fermés
      await this.page.waitForTimeout(1000);

      // Essayer différentes méthodes de clic
      try {
        await this.page.click('button[type="submit"]:last-of-type', { timeout: 5000 });
      } catch (e) {
        this.logStep('CLICK_FAILED', 'FAIL', `Clic normal échoué: ${e.message}`);

        // Essayer un clic forcé
        await this.page.evaluate(() => {
          const submitBtn = document.querySelector('button[type="submit"]:last-of-type');
          if (submitBtn) {
            submitBtn.click();
          }
        });
        this.logStep('CLICK_FORCED', 'INFO', 'Clic JavaScript forcé');
      }

      // Phase 11: Attendre la réponse
      this.logStep('WAITING_RESPONSE', 'INFO', 'Attente de la réponse du serveur');
      await this.page.waitForTimeout(8000);

    } catch (error) {
      this.logStep('REPRODUCE', 'FAIL', error.message);
    }
  }

  analyzeError() {
    this.logStep('ANALYSIS', 'INFO', 'Analyse des résultats');

    console.log('\n' + '='.repeat(80));
    console.log('🔍 ANALYSE DÉTAILLÉE DU WORKFLOW PANIER SURPRISE');
    console.log('='.repeat(80));

    if (this.requestData) {
      console.log('\n📤 REQUÊTE ENVOYÉE:');
      console.log(`URL: ${this.requestData.url}`);
      console.log(`Méthode: ${this.requestData.method}`);
      console.log('\nHeaders:');
      Object.entries(this.requestData.headers).forEach(([key, value]) => {
        if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('content')) {
          console.log(`  ${key}: ${value}`);
        }
      });

      if (this.requestData.postData) {
        console.log('\nBody de la requête:');
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

      console.log('\nBody de la réponse:');
      console.log(this.responseData.body);

      // Diagnostic précis
      console.log('\n🎯 DIAGNOSTIC:');
      const body = this.responseData.body;

      if (body.includes('ValidationException') || body.includes('validation')) {
        console.log('🚨 ERREUR DE VALIDATION: Vérifier les règles de validation du contrôleur');
      } else if (body.includes('QueryException') || body.includes('SQLSTATE')) {
        console.log('🚨 ERREUR BASE DE DONNÉES: Problème dans la structure SQL ou contraintes');
      } else if (body.includes('AuthenticationException') || body.includes('Unauthenticated')) {
        console.log('🚨 ERREUR AUTHENTIFICATION: Token JWT invalide ou expiré');
      } else if (body.includes('MethodNotAllowedHttpException')) {
        console.log('🚨 ERREUR ROUTE: Méthode HTTP non autorisée sur cette route');
      } else if (body.includes('NotFoundHttpException')) {
        console.log('🚨 ERREUR ROUTE: Route /api/surprise-baskets non trouvée');
      } else if (body.includes('FatalError') || body.includes('ParseError')) {
        console.log('🚨 ERREUR PHP: Erreur de syntaxe dans le code backend');
      } else {
        console.log('🚨 ERREUR INCONNUE: Analyser le détail de la réponse ci-dessus');
      }
    } else {
      console.log('\n❌ AUCUNE ERREUR SERVEUR CAPTURÉE');
      console.log('Résultats possibles:');
      console.log('✅ La requête a peut-être réussi (status 200/201)');
      console.log('⚠️  Erreur côté client (validation, modal, etc.)');
      console.log('⚠️  Timeout ou problème réseau');
    }

    console.log('\n💡 PROCHAINES ÉTAPES:');
    console.log('1. Vérifier les logs Laravel (/storage/logs/laravel.log)');
    console.log('2. Vérifier la route POST /api/surprise-baskets dans routes/api.php');
    console.log('3. Vérifier SurpriseBasketController::store()');
    console.log('4. Vérifier les migrations de la table surprise_baskets');

    console.log('='.repeat(80));
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
const error500DebuggerV3 = new Error500DebuggerV3();
error500DebuggerV3.runDebug().catch(console.error);