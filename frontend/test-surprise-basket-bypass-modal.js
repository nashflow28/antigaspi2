// 🧠 Sequential Thinking: Test contournement modal pour panier surprise
import { chromium } from 'playwright';

class SurpriseBasketBypassTester {
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
    this.logStep('INIT', 'INFO', 'Test contournement modal - Sequential Thinking');

    this.browser = await chromium.launch({ headless: false });
    this.page = await this.browser.newPage();

    // Capturer les requêtes surprise-baskets
    this.page.on('request', request => {
      if (request.url().includes('/api/surprise-baskets') && request.method() === 'POST') {
        this.requestData = {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        };
        this.logStep('REQUEST_CAPTURED', 'INFO', `POST ${request.url()}`);
      }
    });

    // Capturer les réponses
    this.page.on('response', async response => {
      if (response.url().includes('/api/surprise-baskets') && response.request().method() === 'POST') {
        try {
          const responseText = await response.text();
          this.responseData = {
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            body: responseText
          };

          if (response.status() >= 400) {
            this.logStep('ERROR_CAPTURED', 'FAIL', `Status: ${response.status()}`);
          } else {
            this.logStep('SUCCESS_CAPTURED', 'SUCCESS', `Status: ${response.status()}`);
          }
        } catch (e) {
          this.logStep('RESPONSE_ERROR', 'FAIL', e.message);
        }
      }
    });

    this.logStep('INIT', 'SUCCESS', 'Monitoring configuré');
  }

  async authenticate() {
    this.logStep('AUTH_START', 'INFO', 'Authentification');

    await this.page.goto('http://localhost:3002');
    await this.page.click('text=Connexion');
    await this.page.fill('input[type="email"]', 'boulangerie.martin@email.com');
    await this.page.fill('input[type="password"]', 'password');
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(3000);

    // Vérifier la redirection après login
    const currentUrl = this.page.url();
    if (currentUrl.includes('/login')) {
      this.logStep('AUTH_FAIL', 'FAIL', 'Toujours sur la page de login');
      throw new Error('Authentification échouée');
    } else {
      this.logStep('AUTH_SUCCESS', 'SUCCESS', `Redirigé vers: ${currentUrl}`);
    }
  }

  async bypassModalAndCreateBasket() {
    this.logStep('BYPASS_START', 'INFO', 'Contournement de la modal');

    // Aller à la page de création
    await this.page.goto('http://localhost:3002/merchant/surprise-baskets');
    await this.page.waitForTimeout(2000);
    await this.page.click('text=Créer');
    await this.page.waitForTimeout(1000);

    // Remplir le formulaire de base
    await this.page.fill('#name', 'Test Bypass Modal');
    await this.page.fill('#description', 'Test contournement modal problématique');
    await this.page.fill('#price', '600');
    await this.page.fill('#quantity', '2');

    // Date d'expiration
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await this.page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);

    this.logStep('FORM_BASIC_FILLED', 'SUCCESS', 'Formulaire de base rempli');

    // CONTOURNEMENT: Injecter directement des produits sélectionnés via JavaScript
    this.logStep('BYPASSING_MODAL', 'INFO', 'Injection directe de produits sélectionnés');

    const injectionResult = await this.page.evaluate(() => {
      try {
        // Trouver l'instance Vue du composant CreateSurpriseBasket
        const createBasketElement = document.querySelector('.create-surprise-basket');
        if (!createBasketElement) {
          return { success: false, error: 'Élément create-surprise-basket non trouvé' };
        }

        // Simuler l'ajout de produits directement dans le reactive data
        // En utilisant l'événement Vue pour forcer la mise à jour
        const event = new CustomEvent('vue-update-selected-products', {
          detail: {
            products: [
              {
                product: {
                  id: 1,
                  name: 'Pain artisanal test',
                  description: 'Pain de test pour bypass modal',
                  original_price: 300,
                  discounted_price: 250,
                  image_url: ''
                },
                quantity: 2
              },
              {
                product: {
                  id: 2,
                  name: 'Croissant test',
                  description: 'Croissant de test',
                  original_price: 150,
                  discounted_price: 100,
                  image_url: ''
                },
                quantity: 1
              }
            ]
          }
        });

        // Dispatcher l'événement
        window.dispatchEvent(event);

        // Également essayer de modifier directement l'état en utilisant les classes CSS
        const selectedProductsContainer = document.querySelector('.space-y-4');
        if (selectedProductsContainer) {
          selectedProductsContainer.innerHTML = `
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span>📦</span>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">Pain artisanal test</h4>
                  <p class="text-sm text-gray-500">300 XOF l'unité</p>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <span class="font-medium text-gray-900 w-8 text-center">2</span>
              </div>
            </div>
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span>🥐</span>
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">Croissant test</h4>
                  <p class="text-sm text-gray-500">150 XOF l'unité</p>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <span class="font-medium text-gray-900 w-8 text-center">1</span>
              </div>
            </div>
          `;
        }

        // Forcer l'activation du bouton submit en supprimant l'attribut disabled
        const submitButton = document.querySelector('button[type="submit"]:last-of-type');
        if (submitButton) {
          submitButton.removeAttribute('disabled');
          submitButton.classList.remove('disabled:opacity-50', 'disabled:cursor-not-allowed');
          submitButton.style.opacity = '1';
          submitButton.style.cursor = 'pointer';
        }

        return { success: true, message: 'Produits injectés avec succès' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    if (injectionResult.success) {
      this.logStep('INJECTION_SUCCESS', 'SUCCESS', injectionResult.message);
    } else {
      this.logStep('INJECTION_FAIL', 'FAIL', injectionResult.error);
    }

    // Attendre un peu pour que les changements prennent effet
    await this.page.waitForTimeout(2000);

    // Vérifier l'état du bouton
    const buttonEnabled = await this.page.evaluate(() => {
      const submitButton = document.querySelector('button[type="submit"]:last-of-type');
      return submitButton && !submitButton.hasAttribute('disabled');
    });

    if (buttonEnabled) {
      this.logStep('BUTTON_ENABLED', 'SUCCESS', 'Bouton submit activé');
    } else {
      this.logStep('BUTTON_DISABLED', 'FAIL', 'Bouton submit toujours disabled');

      // Forcer l'activation une fois de plus
      await this.page.evaluate(() => {
        const submitButton = document.querySelector('button[type="submit"]:last-of-type');
        if (submitButton) {
          submitButton.removeAttribute('disabled');
          submitButton.disabled = false;
        }
      });
    }

    // Intercepter la soumission et modifier les données si nécessaire
    await this.page.evaluate(() => {
      // Intercepter les requêtes fetch pour s'assurer que les bonnes données sont envoyées
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;

        if (url.includes('/api/surprise-baskets') && options.method === 'POST') {
          // Modifier les données pour inclure des produits valides
          try {
            const data = JSON.parse(options.body);
            data.products = [
              { id: 1, quantity: 2 },
              { id: 2, quantity: 1 }
            ];
            options.body = JSON.stringify(data);
            console.log('Données modifiées pour l\'envoi:', data);
          } catch (e) {
            console.error('Erreur modification données:', e);
          }
        }

        return originalFetch.apply(this, args);
      };
    });

    // Tentative de soumission
    this.logStep('SUBMITTING', 'INFO', 'Soumission du formulaire');

    try {
      // Essayer plusieurs méthodes de clic
      await this.page.click('button[type="submit"]:last-of-type', { timeout: 5000 });
    } catch (e) {
      this.logStep('CLICK_FAILED', 'FAIL', `Clic normal échoué: ${e.message}`);

      // Forcer le clic via JavaScript
      await this.page.evaluate(() => {
        const submitButton = document.querySelector('button[type="submit"]:last-of-type');
        if (submitButton) {
          submitButton.click();
        }
      });
      this.logStep('CLICK_FORCED', 'INFO', 'Clic forcé via JavaScript');
    }

    // Attendre la réponse
    await this.page.waitForTimeout(8000);
  }

  analyzeResults() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 ANALYSE DU TEST DE CONTOURNEMENT MODAL');
    console.log('='.repeat(80));

    if (this.requestData) {
      console.log('\n📤 REQUÊTE ENVOYÉE:');
      console.log(`URL: ${this.requestData.url}`);
      console.log('Body:');
      if (this.requestData.postData) {
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
      console.log('Body:');
      console.log(this.responseData.body);

      console.log('\n🎯 DIAGNOSTIC:');
      if (this.responseData.status >= 400) {
        console.log('❌ ERREUR CONFIRMÉE');

        if (this.responseData.body.includes('products')) {
          console.log('🔍 Problème avec le champ products');
        }
        if (this.responseData.body.includes('foreign key')) {
          console.log('🔍 Problème de contrainte de clé étrangère');
        }
        if (this.responseData.body.includes('validation')) {
          console.log('🔍 Erreur de validation');
        }
      } else {
        console.log('✅ SUCCÈS: Le contournement a fonctionné');
      }
    } else {
      console.log('\n❌ AUCUNE REQUÊTE CAPTURÉE');
      console.log('Le formulaire n\'a pas été soumis correctement');
    }

    console.log('\n💡 RECOMMANDATIONS:');
    console.log('1. Simplifier la modal de sélection de produits');
    console.log('2. Réduire les overlays qui interfèrent avec les clics');
    console.log('3. Ajouter des data-testid pour faciliter les tests');
    console.log('4. Corriger les contraintes de base de données si nécessaire');

    console.log('='.repeat(80));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runTest() {
    try {
      await this.initialize();
      await this.authenticate();
      await this.bypassModalAndCreateBasket();
      this.analyzeResults();
    } catch (error) {
      this.logStep('GLOBAL_ERROR', 'FAIL', error.message);
    } finally {
      await this.cleanup();
    }
  }
}

// Lancement du test
const tester = new SurpriseBasketBypassTester();
tester.runTest().catch(console.error);