const { chromium } = require('playwright');

/**
 * 🎯 TEST TOPBAR STANDALONE
 * Test de la page TopBar indépendante
 */

async function testTopBarStandalone() {
  console.log('🎯 TEST TOPBAR STANDALONE');
  console.log('=========================\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3004/topbar-test', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = await page.url();
    console.log(`🌐 URL: ${currentUrl}`);

    // Vérifier les éléments TopBar
    const topBarElements = {
      header: await page.locator('header').count(),
      logoEmoji: await page.locator('span').filter({ hasText: '🌱' }).count(),
      searchButton: await page.locator('button[aria-label="Rechercher"]').count(),
      notificationButton: await page.locator('button[aria-label="Notifications"]').count(),
      cartButton: await page.locator('button[aria-label="Panier"]').count(),
      userButton: await page.locator('button').filter({ hasText: 'U' }).count(),
      totalButtons: await page.locator('button').count()
    };

    console.log('\n🔝 ÉLÉMENTS TOPBAR:');
    Object.entries(topBarElements).forEach(([element, count]) => {
      console.log(`${count > 0 ? '✅' : '❌'} ${element}: ${count}`);
    });

    // Vérifier le contenu de la page
    const content = await page.evaluate(() => {
      return {
        appContent: document.getElementById('app')?.innerHTML.length || 0,
        hasTopBarTest: document.body.innerText.includes('TopBar Test Standalone'),
        hasAntigaspi: document.body.innerText.includes('Antigaspi'),
        pageHeight: document.body.scrollHeight,
        visibleText: document.body.innerText.substring(0, 200)
      };
    });

    console.log('\n📊 CONTENU PAGE:');
    console.log(`📏 App content: ${content.appContent} caractères`);
    console.log(`📝 "TopBar Test": ${content.hasTopBarTest ? '✅' : '❌'}`);
    console.log(`📝 "Antigaspi": ${content.hasAntigaspi ? '✅' : '❌'}`);
    console.log(`📏 Hauteur: ${content.pageHeight}px`);
    console.log(`📄 Aperçu: "${content.visibleText.replace(/\n/g, ' ').trim()}"`);

    // Test d'interactivité
    console.log('\n🖱️ TEST INTERACTIVITÉ:');

    try {
      // Cliquer sur le bouton de recherche
      const searchButton = page.locator('button[aria-label="Rechercher"]');
      if (await searchButton.count() > 0) {
        await searchButton.click();
        console.log('✅ Clic recherche: OK');
      }

      // Cliquer sur le compteur
      const counterButton = page.locator('button').filter({ hasText: 'Compteur' });
      if (await counterButton.count() > 0) {
        await counterButton.click();
        await page.waitForTimeout(500);
        const counterText = await counterButton.textContent();
        console.log(`✅ Compteur: ${counterText}`);
      }
    } catch (error) {
      console.log(`⚠️ Erreur interactivité: ${error.message}`);
    }

    // Screenshot
    await page.screenshot({
      path: './test-topbar-standalone.png',
      fullPage: true
    });

    // Résumé final
    const hasTopBar = topBarElements.header > 0;
    const hasContent = content.appContent > 0;
    const hasButtons = topBarElements.totalButtons > 0;
    const hasText = content.hasTopBarTest || content.hasAntigaspi;

    console.log('\n🎯 RÉSUMÉ FINAL:');
    console.log(`${hasTopBar ? '✅' : '❌'} TopBar présente`);
    console.log(`${hasContent ? '✅' : '❌'} Contenu rendu`);
    console.log(`${hasButtons ? '✅' : '❌'} Boutons interactifs`);
    console.log(`${hasText ? '✅' : '❌'} Texte interface`);

    if (hasTopBar && hasContent && hasButtons && hasText) {
      console.log('\n🎉 PARFAIT! TopBar standalone fonctionne parfaitement!');
      console.log('💡 Cette approche peut être utilisée pour rétablir la TopBar complète.');
    } else if (hasContent) {
      console.log('\n⚠️ Vue fonctionne mais TopBar incomplète');
    } else {
      console.log('\n❌ Problème de rendu');
    }

  } catch (error) {
    console.log(`💥 Erreur: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Test terminé!');
}

testTopBarStandalone().catch(console.error);