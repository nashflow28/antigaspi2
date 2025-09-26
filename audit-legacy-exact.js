#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 AUDIT LEGACY EXACT - TEST-GUARDIAN PHASE 3');
console.log('================================================\n');

// Compteurs pour le score officiel
let totalLegacyUsages = 0;
let fileCount = 0;
let legacyFiles = [];

// Méthode 1: Compter class="..."
console.log('📊 MÉTHODE 1: Comptage des usages class="..."');
try {
  const result = execSync('cd /c/xampp/htdocs/antigaspi2/frontend && find src -name "*.vue" -exec grep -o "class=\\"[^"]*\\"" {} \\; | wc -l', { encoding: 'utf8' });
  const classUsages = parseInt(result.trim());
  console.log(`   Usages class="...": ${classUsages}`);
  totalLegacyUsages += classUsages;
} catch (e) {
  console.log('   ❌ Erreur comptage class');
}

// Méthode 2: Analyser chaque fichier individuellement
console.log('\n📊 MÉTHODE 2: Analyse fichier par fichier');
const frontendPath = 'C:/xampp/htdocs/antigaspi2/frontend/src';

function analyzeDirectory(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      analyzeDirectory(fullPath);
    } else if (item.endsWith('.vue')) {
      analyzeFile(fullPath);
    }
  }
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const classMatches = content.match(/class="[^"]*"/g) || [];
  const usages = classMatches.length;

  fileCount++;

  if (usages > 0) {
    legacyFiles.push({
      file: filePath.replace('/c/xampp/htdocs/antigaspi2/frontend/src/', ''),
      usages: usages
    });
  }
}

analyzeDirectory(frontendPath);

// Calcul du score selon la formule officielle
const score = Math.max(0, 100 - (totalLegacyUsages * 0.05));

console.log('\n🎯 RÉSULTATS AUDIT EXACT');
console.log('========================');
console.log(`   Total usages legacy: ${totalLegacyUsages}`);
console.log(`   Fichiers analysés: ${fileCount}`);
console.log(`   Fichiers avec legacy: ${legacyFiles.length}`);
console.log(`   Score Phase 3: ${score.toFixed(1)}/100`);

// Fichiers avec le plus d'usages (top 10)
console.log('\n📊 TOP 10 FICHIERS AVEC LE PLUS D\'USAGES LEGACY');
console.log('===============================================');
legacyFiles
  .sort((a, b) => b.usages - a.usages)
  .slice(0, 10)
  .forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.file}: ${file.usages} usages`);
  });

// Fichiers complètement migrés (0 usage)
const migratedFiles = fileCount - legacyFiles.length;
console.log(`\n✅ FICHIERS COMPLÈTEMENT MIGRÉS: ${migratedFiles}/${fileCount}`);

// Analyse des composants 2025
console.log('\n🔍 VÉRIFICATION COMPOSANTS 2025');
console.log('===============================');
const components2025 = [
  'components/ui/2025/Button.vue',
  'components/ui/2025/Input.vue',
  'components/ui/2025/Card.vue',
  'components/ui/2025/Badge.vue',
  'components/ui/2025/Label.vue',
  'components/ui/2025/Select.vue'
];

components2025.forEach(comp => {
  const fullPath = path.join(frontendPath, comp);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const legacyUsages = (content.match(/class="[^"]*"/g) || []).length;
    console.log(`   ${comp}: ${legacyUsages} usages legacy ${legacyUsages === 0 ? '✅' : '❌'}`);
  } else {
    console.log(`   ${comp}: MANQUANT ❌`);
  }
});

console.log('\n🎯 SCORING PHASE 3 OFFICIEL');
console.log('===========================');
console.log(`   Formule: 100 - (${totalLegacyUsages} × 0.05) = ${score.toFixed(1)}/100`);

if (score >= 95) {
  console.log('   🟢 EXCELLENT - Prêt pour production');
} else if (score >= 90) {
  console.log('   🟡 TRÈS BON - Acceptable pour production');
} else if (score >= 80) {
  console.log('   🟠 BON - Nécessite amélioration avant production');
} else {
  console.log('   🔴 INSUFFISANT - Migration critique requise');
}

console.log('\n=== FIN AUDIT EXACT ===');