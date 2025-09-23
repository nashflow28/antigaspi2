const { chromium } = require('playwright');

/**
 * 🔍 TEST TOPBAR VISIBILITY
 * Vérifier que la TopBar est maintenant visible
 */

async function testTopBarVisibility() {
  console.log('🔍 TEST TOPBAR VISIBILITY');
  console.log('=========================\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3003/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = await page.url();
    console.log(`🌐 URL: ${currentUrl}`);

    // Vérifier les éléments de la TopBar
    const topBarElements = {
      header: await page.locator('header').count(),
      topBar: await page.locator('.top-bar, [class*="top-bar"]').count(),
      mobileLayout: await page.locator('.mobile-layout').count(),
      logoIcon: await page.locator('header span').count(),
      buttons: await page.locator('header button').count(),
      searchButton: await page.locator('button[aria-label="Rechercher"]').count(),
      notificationButton: await page.locator('button[aria-label="Notifications"]').count()
    };

    console.log('\n📱 ÉLÉMENTS TOPBAR:');
    Object.entries(topBarElements).forEach(([element, count]) => {
      console.log(`${count > 0 ? '✅' : '❌'} ${element}: ${count}`);
    });

    // Vérifier le contenu general
    const content = await page.evaluate(() => {
      return {
        appContent: document.getElementById('app')?.innerHTML.length || 0,
        hasTopBarText: document.body.innerText.includes('Antigaspi'),
        pageHeight: document.body.scrollHeight
      };
    });

    console.log('\n📊 CONTENU:');
    console.log(`📏 App content: ${content.appContent} caractères`);
    console.log(`📝 Contient "Antigaspi": ${content.hasTopBarText ? '✅' : '❌'}`);
    console.log(`📏 Hauteur page: ${content.pageHeight}px`);

    // Screenshot pour diagnostic
    await page.screenshot({
      path: './test-topbar-visibility.png',
      fullPage: true
    });

    // Résumé
    const hasTopBar = topBarElements.header > 0 || topBarElements.mobileLayout > 0;
    const hasButtons = topBarElements.buttons > 0;

    console.log('\n🎯 RÉSUMÉ:');
    console.log(`${hasTopBar ? '✅' : '❌'} TopBar visible`);
    console.log(`${hasButtons ? '✅' : '❌'} Boutons interactifs`);
    console.log(`${content.hasTopBarText ? '✅' : '❌'} Texte d'interface`);

    if (hasTopBar && hasButtons) {
      console.log('\n🎉 SUCCESS! TopBar est maintenant visible et fonctionnelle!');
    } else {
      console.log('\n⚠️ Problème: TopBar toujours manquante');
    }

  } catch (error) {
    console.log(`💥 Erreur: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Test terminé!');
}

testTopBarVisibility().catch(console.error);