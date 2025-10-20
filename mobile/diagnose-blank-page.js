const { chromium } = require('playwright');

async function diagnoseBlankPage() {
  console.log('🔍 Diagnostic de la page blanche - Démarrage...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capturer TOUTES les erreurs
  const errors = [];
  const consoleMessages = [];
  
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    console.log(`[${msg.type().toUpperCase()}] ${text}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('❌ PAGE ERROR:', error.message);
  });
  
  page.on('requestfailed', request => {
    console.error('❌ REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('📡 Chargement de http://localhost:9001...\n');
    await page.goto('http://localhost:9001', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Attendre un peu pour voir les erreurs
    await page.waitForTimeout(3000);
    
    // Vérifier si React est monté
    const hasReactRoot = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        exists: !!root,
        hasChildren: root ? root.children.length > 0 : false,
        innerHTML: root ? root.innerHTML.substring(0, 500) : 'NO ROOT'
      };
    });
    
    console.log('\n📊 DIAGNOSTIC:');
    console.log('================');
    console.log('React Root:', hasReactRoot.exists ? '✅' : '❌');
    console.log('Has Children:', hasReactRoot.hasChildren ? '✅' : '❌');
    console.log('Root Content:', hasReactRoot.innerHTML);
    console.log('\n📝 Erreurs capturées:', errors.length);
    errors.forEach((err, i) => console.log(`  ${i+1}. ${err}`));
    
    console.log('\n📋 Messages Console:', consoleMessages.length);
    const errorMessages = consoleMessages.filter(m => m.type === 'error');
    const warningMessages = consoleMessages.filter(m => m.type === 'warning');
    console.log(`  - Errors: ${errorMessages.length}`);
    console.log(`  - Warnings: ${warningMessages.length}`);
    
    if (errorMessages.length > 0) {
      console.log('\n🔴 ERREURS:');
      errorMessages.slice(0, 10).forEach(msg => console.log(`  ${msg.text}`));
    }
    
    // Screenshot
    await page.screenshot({ path: 'mobile/test-results/blank-page-diagnosis.png', fullPage: true });
    console.log('\n📸 Screenshot sauvegardé: mobile/test-results/blank-page-diagnosis.png');
    
    // Attendre un moment pour inspecter
    console.log('\n⏸️  Navigateur ouvert pour inspection manuelle (Appuyez sur Ctrl+C pour fermer)');
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('❌ ERREUR FATALE:', error.message);
  } finally {
    await browser.close();
  }
}

diagnoseBlankPage().catch(console.error);
