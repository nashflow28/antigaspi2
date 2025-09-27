// 🧠 Sequential Thinking Debug: Erreur 500 Internal Server Error
import { chromium } from 'playwright'

class Error500Debugger {
  constructor() {
    this.browser = null
    this.page = null
    this.requestData = null
    this.responseData = null
  }

  logStep(step, status, details = '') {
    const timestamp = new Date().toISOString()
    const emoji = status === 'SUCCESS' ? '✅' : status === 'FAIL' ? '❌' : status === 'INFO' ? 'ℹ️' : '🔍'
    console.log(`${emoji} [${timestamp.slice(11, 19)}] ${step}: ${details}`)
  }

  async initialize() {
    this.logStep('INIT', 'INFO', 'Démarrage du debugging erreur 500')

    this.browser = await chromium.launch({ headless: false })
    this.page = await this.browser.newPage()

    // Capturer les détails de la requête POST
    this.page.on('request', request => {
      if (request.url().includes('/api/surprise-baskets') && request.method() === 'POST') {
        this.requestData = {
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        }
        this.logStep('REQUEST_CAPTURED', 'INFO', `POST ${request.url()}`)

        if (this.requestData.postData) {
          this.logStep('REQUEST_BODY', 'INFO', `Body: ${this.requestData.postData.substring(0, 200)}...`)
        }
      }
    })

    // Capturer la réponse 500
    this.page.on('response', async response => {
      if (response.url().includes('/api/surprise-baskets') && response.status() === 500) {
        try {
          const responseText = await response.text()
          this.responseData = {
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            body: responseText
          }

          this.logStep('ERROR_500_CAPTURED', 'FAIL', `Status: ${response.status()}`)
          this.logStep('ERROR_BODY', 'FAIL', `Body: ${responseText.substring(0, 300)}...`)
        } catch (e) {
          this.logStep('ERROR_CAPTURE_FAILED', 'FAIL', e.message)
        }
      }
    })

    this.logStep('INIT', 'SUCCESS', 'Monitoring configuré')
  }

  async reproduceError() {
    this.logStep('REPRODUCE', 'INFO', 'Reproduction de l\'erreur 500')

    try {
      await this.page.goto('http://localhost:3002')
      await this.page.click('text=Connexion')
      await this.page.fill('input[type="email"]', 'boulangerie.martin@email.com')
      await this.page.fill('input[type="password"]', 'password')
      await this.page.click('button[type="submit"]')
      await this.page.waitForTimeout(3000)

      await this.page.goto('http://localhost:3002/merchant/surprise-baskets')
      await this.page.waitForTimeout(2000)

      // Cliquer sur créer
      await this.page.click('text=Créer')
      await this.page.waitForTimeout(1000)

      // Remplir le formulaire avec des données minimales mais valides
      await this.page.fill('#name', 'Test Debug 500')
      await this.page.fill('#description', 'Panier de test pour debugger erreur 500')

      // Essayer de remplir le prix
      const priceSelectors = [
        'input[name="discounted_price"]',
        '#discounted_price',
        '#price',
        'input[type="number"]'
      ]

      for (const selector of priceSelectors) {
        try {
          const field = this.page.locator(selector).first()
          if (await field.isVisible({ timeout: 1000 })) {
            await field.fill('500')
            this.logStep('PRICE_FILLED', 'SUCCESS', `Prix rempli via: ${selector}`)
            break
          }
        } catch (e) {
          // Continue
        }
      }

      // Date d'expiration
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await this.page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0])

      this.logStep('FORM_FILLED', 'SUCCESS', 'Formulaire rempli')

      // Soumettre pour provoquer l'erreur 500
      await this.page.click('button[type="submit"]')

      // Attendre la réponse
      await this.page.waitForTimeout(5000)

      this.logStep('SUBMISSION', 'SUCCESS', 'Formulaire soumis, attente de l\'erreur 500')

    } catch (error) {
      this.logStep('REPRODUCE', 'FAIL', error.message)
    }
  }

  analyzeError() {
    this.logStep('ANALYSIS', 'INFO', 'Analyse de l\'erreur 500')

    console.log('\n' + '='.repeat(70))
    console.log('🔍 ANALYSE DÉTAILLÉE DE L\'ERREUR 500')
    console.log('='.repeat(70))

    if (this.requestData) {
      console.log('\n📤 REQUÊTE ENVOYÉE:')
      console.log(`URL: ${this.requestData.url}`)
      console.log(`Méthode: ${this.requestData.method}`)
      console.log('Headers:')
      Object.entries(this.requestData.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`)
      })

      if (this.requestData.postData) {
        console.log('\nBody:')
        try {
          const parsed = JSON.parse(this.requestData.postData)
          console.log(JSON.stringify(parsed, null, 2))
        } catch (e) {
          console.log(this.requestData.postData)
        }
      }
    }

    if (this.responseData) {
      console.log('\n📥 RÉPONSE SERVEUR:')
      console.log(`Status: ${this.responseData.status} ${this.responseData.statusText}`)
      console.log('Headers:')
      Object.entries(this.responseData.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`)
      })

      console.log('\nBody:')
      console.log(this.responseData.body)

      // Analyser le type d'erreur
      console.log('\n🎯 DIAGNOSTIC:')
      if (this.responseData.body.includes('ValidationException')) {
        console.log('🚨 ERREUR DE VALIDATION: Données de formulaire invalides')
      } else if (this.responseData.body.includes('QueryException')) {
        console.log('🚨 ERREUR BASE DE DONNÉES: Problème SQL')
      } else if (this.responseData.body.includes('AuthenticationException')) {
        console.log('🚨 ERREUR AUTHENTIFICATION: Token invalide')
      } else if (this.responseData.body.includes('NotFoundHttpException')) {
        console.log('🚨 ERREUR ROUTE: Route non trouvée')
      } else {
        console.log('🚨 ERREUR INCONNUE: Analyser le body complet')
      }
    } else {
      console.log('\n❌ AUCUNE RÉPONSE 500 CAPTURÉE')
      console.log('L\'erreur pourrait être:')
      console.log('- Un timeout')
      console.log('- Une erreur côté proxy')
      console.log('- Un problème de routing')
    }

    console.log('\n💡 ACTIONS RECOMMANDÉES:')
    console.log('1. Vérifier le contrôleur SurpriseBasketController::store()')
    console.log('2. Vérifier les règles de validation')
    console.log('3. Vérifier la structure de la base de données')
    console.log('4. Vérifier les relations de modèles')

    console.log('='.repeat(70))
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async runDebug() {
    try {
      await this.initialize()
      await this.reproduceError()
      this.analyzeError()
    } catch (error) {
      this.logStep('GLOBAL_ERROR', 'FAIL', error.message)
    } finally {
      await this.cleanup()
    }
  }
}

// Lancement du debugging
const error500Debugger = new Error500Debugger()
error500Debugger.runDebug().catch(console.error)
