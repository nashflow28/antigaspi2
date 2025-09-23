const { chromium } = require('playwright');

/**
 * 🏠 TEST MAIN HOMEPAGE
 * Validation de la nouvelle page principale avec TopBar intégrée
 */

async function testMainHomepage() {
  console.log('🏠 TEST MAIN HOMEPAGE');
  console.log('=====================\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3004/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const currentUrl = await page.url();
    console.log(`🌐 URL: ${currentUrl}`);

    // Vérifier TopBar
    const topBarElements = {
      header: await page.locator('header').count(),
      logo: await page.locator('span').filter({ hasText: '🌱' }).count(),
      title: await page.locator('h1').filter({ hasText: 'Antigaspi' }).count(),
      searchBtn: await page.locator('button[aria-label="Rechercher"]').count(),
      notifBtn: await page.locator('button[aria-label="Notifications"]').count(),
      cartBtn: await page.locator('button[aria-label="Panier"]').count()
    };

    console.log('\n🔝 TOPBAR:');
    Object.entries(topBarElements).forEach(([element, count]) => {
      console.log(`${count > 0 ? '✅' : '❌'} ${element}: ${count}`);
    });

    // Vérifier contenu principal
    const mainContent = {
      heroSection: await page.locator('text=Bienvenue sur Antigaspi').count(),
      categories: await page.locator('text=Catégories populaires').count(),
      products: await page.locator('text=Produits disponibles').count(),
      categoryButtons: await page.locator('button').filter({ hasText: 'Boulangerie' }).count(),
      productCards: await page.locator('text=Pain artisanal').count(),
      totalButtons: await page.locator('button').count()
    };

    console.log('\n📱 CONTENU PRINCIPAL:');
    Object.entries(mainContent).forEach(([element, count]) => {
      console.log(`${count > 0 ? '✅' : '❌'} ${element}: ${count}`);
    });

    // Vérifier Bottom Navigation
    const bottomNav = {
      navigation: await page.locator('nav').count(),
      homeBtn: await page.locator('text=Accueil').count(),
      discoverBtn: await page.locator('text=Découvrir').count(),
      favoritesBtn: await page.locator('text=Favoris').count(),
      profileBtn: await page.locator('text=Profil').count()
    };

    console.log('\n⬇️ BOTTOM NAVIGATION:');
    Object.entries(bottomNav).forEach(([element, count]) => {
      console.log(`${count > 0 ? '✅' : '❌'} ${element}: ${count}`);
    });

    // Test d'interactivité
    console.log('\n🖱️ TEST INTERACTIVITÉ:');

    try {
      // Cliquer sur le bouton notification
      const notifButton = page.locator('button[aria-label="Notifications"]');
      if (await notifButton.count() > 0) {
        await notifButton.click();
        await page.waitForTimeout(500);
        console.log('✅ Clic notifications: OK');
      }

      // Cliquer sur une catégorie
      const categoryBtn = page.locator('button').filter({ hasText: 'Boulangerie' });
      if (await categoryBtn.count() > 0) {
        await categoryBtn.click();
        await page.waitForTimeout(500);
        console.log('✅ Clic catégorie: OK');
      }

      // Cliquer sur actualiser
      const refreshBtn = page.locator('button').filter({ hasText: 'Actualiser' });
      if (await refreshBtn.count() > 0) {
        await refreshBtn.click();
        await page.waitForTimeout(1500); // Attendre l'animation
        console.log('✅ Actualisation: OK');
      }

    } catch (error) {
      console.log(`⚠️ Erreur interactivité: ${error.message}`);
    }

    // Vérifications de l'interface mobile
    const mobileFeatures = await page.evaluate(() => {
      return {
        viewportWidth: window.innerWidth,
        hasFixedHeader: !!document.querySelector('header.fixed'),
        hasFixedBottomNav: !!document.querySelector('nav.fixed'),
        totalContent: document.body.scrollHeight,
        hasScrollableContent: document.body.scrollHeight > window.innerHeight
      };
    });

    console.log('\n📱 INTERFACE MOBILE:');
    console.log(`📐 Largeur viewport: ${mobileFeatures.viewportWidth}px`);
    console.log(`🔝 Header fixe: ${mobileFeatures.hasFixedHeader ? '✅' : '❌'}`);
    console.log(`⬇️ Bottom nav fixe: ${mobileFeatures.hasFixedBottomNav ? '✅' : '❌'}`);
    console.log(`📏 Contenu scrollable: ${mobileFeatures.hasScrollableContent ? '✅' : '❌'}`);

    // Screenshot
    await page.screenshot({
      path: './test-main-homepage.png',
      fullPage: true
    });

    // Résumé final
    const hasTopBar = topBarElements.header > 0 && topBarElements.logo > 0;
    const hasContent = mainContent.heroSection > 0 && mainContent.products > 0;
    const hasBottomNav = bottomNav.navigation > 0 && bottomNav.homeBtn > 0;
    const isInteractive = mainContent.totalButtons > 5;

    console.log('\n🎯 RÉSUMÉ FINAL:');
    console.log(`${hasTopBar ? '✅' : '❌'} TopBar complète`);
    console.log(`${hasContent ? '✅' : '❌'} Contenu principal`);
    console.log(`${hasBottomNav ? '✅' : '❌'} Navigation bottom`);
    console.log(`${isInteractive ? '✅' : '❌'} Interface interactive`);

    if (hasTopBar && hasContent && hasBottomNav && isInteractive) {
      console.log('\n🎉 PARFAIT! Interface mobile complète et utilisable!');
      console.log('🚀 L\'application Antigaspi est maintenant fonctionnelle!');
    } else if (hasTopBar && hasContent) {
      console.log('\n⭐ TRÈS BON! Interface principale fonctionne');
    } else {
      console.log('\n⚠️ Interface incomplète');
    }

  } catch (error) {
    console.log(`💥 Erreur: ${error.message}`);
  }

  await browser.close();
  console.log('\n🏁 Test terminé!');
}

testMainHomepage().catch(console.error);