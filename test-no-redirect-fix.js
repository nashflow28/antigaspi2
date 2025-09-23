const { chromium } = require('playwright');

/**
 * 🎯 TEST NO REDIRECT FIX
 * Valider que la route principale ne redirige plus vers onboarding
 */

async function testNoRedirectFix() {
  console.log('🎯 TEST NO REDIRECT FIX');
  console.log('========================\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // ÉTAPE 1: Aller directement sur la page principale
    console.log('📱 ÉTAPE 1: Accès direct à la page principale');
    await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = await page.url();
    const currentPath = new URL(currentUrl).pathname;

    console.log(`🌐 URL actuelle: ${currentUrl}`);
    console.log(`📍 Path: ${currentPath}`);

    const noRedirect = currentPath === '/';
    console.log(`✅ Pas de redirect: ${noRedirect ? 'OUI' : 'NON'}`);

    // ÉTAPE 2: Vérifier le contenu Vue
    console.log('\n🔧 ÉTAPE 2: Vérification du contenu Vue');

    const vueContent = await page.evaluate(() => {
      return {
        appExists: !!document.getElementById('app'),
        appContent: document.getElementById('app')?.innerHTML.length || 0,
        hasElements: document.querySelectorAll('*').length,
        bodyHeight: document.body.scrollHeight,
        hasVue: !!window.__VUE__ || typeof window.Vue !== 'undefined'
      };
    });

    console.log(`🎯 App element: ${vueContent.appExists ? '✅' : '❌'}`);
    console.log(`📏 App content: ${vueContent.appContent} caractères`);
    console.log(`🧩 Total éléments: ${vueContent.hasElements}`);
    console.log(`📏 Body height: ${vueContent.bodyHeight}px`);
    console.log(`🔧 Vue actif: ${vueContent.hasVue ? '✅' : '❌'}`);

    // ÉTAPE 3: Chercher des éléments d'interface
    console.log('\n🎨 ÉTAPE 3: Éléments d\'interface');

    const uiElements = {
      headers: await page.locator('header').count(),
      buttons: await page.locator('button').count(),
      navigation: await page.locator('nav').count(),
      mobileLayout: await page.locator('.mobile-layout').count(),
      topBar: await page.locator('.top-bar, [class*="top-bar"]').count(),
      bottomNav: await page.locator('.bottom-navigation, [class*="bottom-nav"]').count()
    };

    Object.entries(uiElements).forEach(([element, count]) => {
      console.log(`${count > 0 ? '✅' : '❌'} ${element}: ${count}`);
    });

    // ÉTAPE 4: Capture d'écran
    await page.screenshot({
      path: './test-no-redirect-fix.png',
      fullPage: true
    });

    // RÉSUMÉ
    console.log('\n📊 RÉSUMÉ');
    console.log('=========');

    const success = {
      noRedirect: noRedirect,
      hasContent: vueContent.appContent > 0,
      vueWorks: vueContent.hasVue,
      hasUI: Object.values(uiElements).some(count => count > 0)
    };

    Object.entries(success).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}`);
    });

    if (success.noRedirect && success.hasContent) {
      console.log('\n🎉 SUCCESS! Page principale accessible avec contenu!');
    } else if (success.noRedirect) {
      console.log('\n⚠️ Redirect fixé mais contenu Vue manquant');
    } else {
      console.log('\n❌ Redirect toujours présent');
    }

  } catch (error) {
    console.log(`💥 Erreur: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Test terminé!');
}

testNoRedirectFix().catch(console.error);