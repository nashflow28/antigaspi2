const { chromium } = require('playwright');

/**
 * 🔍 TEST TOPBAR PORT 3004
 * Test avec le nouveau serveur sans erreurs CSS
 */

async function testTopBar3004() {
  console.log('🔍 TEST TOPBAR PORT 3004');
  console.log('========================\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3004/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = await page.url();
    console.log(`🌐 URL: ${currentUrl}`);

    // Vérifier les éléments de la TopBar
    const topBarElements = {
      header: await page.locator('header').count(),
      mobileLayout: await page.locator('.mobile-layout').count(),
      buttons: await page.locator('button').count(),
      emojis: await page.locator('span').filter({ hasText: '🌱' }).count(),
      searchEmoji: await page.locator('button').filter({ hasText: '🔍' }).count(),
      cartEmoji: await page.locator('button').filter({ hasText: '🛒' }).count(),
      notificationEmoji: await page.locator('button').filter({ hasText: '🔔' }).count()
    };

    console.log('\n📱 ÉLÉMENTS TOPBAR:');
    Object.entries(topBarElements).forEach(([element, count]) => {
      console.log(`${count > 0 ? '✅' : '❌'} ${element}: ${count}`);
    });

    // Vérifier le contenu général
    const content = await page.evaluate(() => {
      return {
        appContent: document.getElementById('app')?.innerHTML.length || 0,
        hasAntigaspiText: document.body.innerText.includes('Antigaspi'),
        hasSimpleTest: document.body.innerText.includes('Simple Test'),
        pageHeight: document.body.scrollHeight,
        hasTopBarText: document.body.innerText.includes('Simple Test') || document.body.innerText.includes('Antigaspi')
      };
    });

    console.log('\n📊 CONTENU:');
    console.log(`📏 App content: ${content.appContent} caractères`);
    console.log(`📝 Texte "Antigaspi": ${content.hasAntigaspiText ? '✅' : '❌'}`);
    console.log(`📝 Simple Test View: ${content.hasSimpleTest ? '✅' : '❌'}`);
    console.log(`📏 Hauteur page: ${content.pageHeight}px`);

    // Screenshot
    await page.screenshot({
      path: './test-topbar-3004.png',
      fullPage: true
    });

    // Résumé
    const hasTopBar = topBarElements.header > 0 || topBarElements.mobileLayout > 0;
    const hasContent = content.appContent > 0;
    const hasButtons = topBarElements.buttons > 0;

    console.log('\n🎯 RÉSUMÉ:');
    console.log(`${hasTopBar ? '✅' : '❌'} TopBar/MobileLayout détecté`);
    console.log(`${hasContent ? '✅' : '❌'} Contenu Vue rendu`);
    console.log(`${hasButtons ? '✅' : '❌'} Boutons interactifs`);
    console.log(`${content.hasTopBarText ? '✅' : '❌'} Interface textuelle`);

    if (hasTopBar && hasContent && hasButtons) {
      console.log('\n🎉 SUCCESS! TopBar avec MobileLayout fonctionne!');
    } else if (hasContent) {
      console.log('\n⚠️ Contenu fonctionne mais TopBar manquante');
    } else {
      console.log('\n❌ Problème de rendu général');
    }

  } catch (error) {
    console.log(`💥 Erreur: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Test terminé!');
}

testTopBar3004().catch(console.error);