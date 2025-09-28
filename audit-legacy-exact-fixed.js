#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 AUDIT LEGACY PATTERNS - CORRECTED VERSION');
console.log('================================================\n');

// Compteurs pour le score officiel
let totalLegacyUsages = 0;
let fileCount = 0;
let legacyFiles = [];

const frontendPath = 'C:/xampp/htdocs/antigaspi2/frontend/src';

// VRAIS PATTERNS LEGACY CUSTOM (non-standard Tailwind)
const legacyPatterns = [
  /\btext-heading\b/g,
  /\btext-body\b/g,
  /\btext-muted\b/g,
  /\btext-placeholder\b/g,
  /\bbg-surface\b/g,
  /\bcontainer-2025\b/g,
  /\btext-heading-secondary\b/g,
  /\btext-body-emphasis\b/g,
  /\btext-primary-emphasis\b/g,
  /\bbg-nav-gradient\b/g,
  /\bshadow-card\b/g,
  /\btext-h3\b/g,
  /\btext-display-\w+/g,
  /\bicon-lg\b/g,
  /\bicon-md\b/g,
  /\btext-emphasis\b/g,
  /\bbg-surface-light\b/g,
  /\bbg-surface-dark\b/g,
  /\btext-content\b/g,
  /\bbg-content\b/g,
  /\bborder-content\b/g,
  /\btext-small\b/g,
  /\bpy-spacing-\w+/g,
  /\bmargin-r-md\b/g,
  /\bpx-xs\b/g,
  /\brounded-4xl\b/g,
  /\bshadow-modern-\w+/g,
  /\bshadow-lg-2025\b/g,
  /\bborder-b-sm\b/g
];

function analyzeDirectory(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      analyzeDirectory(fullPath);
    } else if (item.endsWith('.vue') || item.endsWith('.ts') || item.endsWith('.js')) {
      analyzeFile(fullPath);
    }
  }
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  let usages = 0;
  legacyPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    usages += matches.length;
  });

  fileCount++;
  totalLegacyUsages += usages;

  if (usages > 0) {
    legacyFiles.push({
      file: filePath.replace('C:\\xampp\\htdocs\\antigaspi2\\frontend\\src\\', '').replace(/\\/g, '/'),
      usages: usages
    });
  }
}

analyzeDirectory(frontendPath);

// Calcul du score selon la formule officielle
const score = Math.max(0, 100 - (totalLegacyUsages * 0.05));

console.log('🎯 RÉSULTATS AUDIT LEGACY PATTERNS');
console.log('===================================');
console.log(`   Total usages legacy: ${totalLegacyUsages}`);
console.log(`   Fichiers analysés: ${fileCount}`);
console.log(`   Fichiers avec legacy: ${legacyFiles.length}`);
console.log(`   Score: ${score.toFixed(1)}/100`);

if (legacyFiles.length > 0) {
  console.log('\n📊 FICHIERS AVEC PATTERNS LEGACY');
  console.log('=================================');
  legacyFiles
    .sort((a, b) => b.usages - a.usages)
    .slice(0, 10)
    .forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.file}: ${file.usages} usages`);
    });
} else {
  console.log('\n✅ AUCUN PATTERN LEGACY DÉTECTÉ!');
}

// Fichiers complètement migrés
const migratedFiles = fileCount - legacyFiles.length;
console.log(`\n✅ FICHIERS MIGRÉS: ${migratedFiles}/${fileCount}`);

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
    let legacyUsages = 0;
    legacyPatterns.forEach(pattern => {
      legacyUsages += (content.match(pattern) || []).length;
    });
    console.log(`   ${comp}: ${legacyUsages} usages legacy ${legacyUsages === 0 ? '✅' : '❌'}`);
  } else {
    console.log(`   ${comp}: MANQUANT ❌`);
  }
});

console.log('\n🎯 SCORING FINAL');
console.log('================');
console.log(`   Formule: 100 - (${totalLegacyUsages} × 0.05) = ${score.toFixed(1)}/100`);

if (score >= 100) {
  console.log('   🟢 PARFAIT 100/100 - Migration complète!');
} else if (score >= 95) {
  console.log('   🟢 EXCELLENT - Prêt pour production');
} else if (score >= 90) {
  console.log('   🟡 TRÈS BON - Acceptable pour production');
} else if (score >= 80) {
  console.log('   🟠 BON - Nécessite amélioration avant production');
} else {
  console.log('   🔴 INSUFFISANT - Migration critique requise');
}

console.log('\n=== FIN AUDIT CORRIGÉ ===');