#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 AUDIT VRAIS PATTERNS LEGACY - VERSION CORRIGÉE');
console.log('=================================================\n');

// Compteurs pour le score officiel
let totalLegacyUsages = 0;
let fileCount = 0;
let legacyFiles = [];
let legacyClassCounts = {};

const frontendPath = 'C:/xampp/htdocs/antigaspi2/frontend/src';

// VRAIS PATTERNS LEGACY selon le rapport officiel phase3-validation-report.json
const legacyPatterns = [
  /\bcard\b/g,
  /\bbadge\b/g,
  /\bshadow-glow\b/g,
  /\bbtn\b/g,
  /\bbtn-outline\b/g,
  /\bbtn-primary\b/g,
  /\bbtn-ghost\b/g,
  /\bform-label\b/g,
  /\bform-select\b/g,
  /\bbtn-sm\b/g,
  /\bform-input\b/g,
  /\bbtn-lg\b/g,
  /\bform-group\b/g
];

const legacyClassNames = [
  'card', 'badge', 'shadow-glow', 'btn', 'btn-outline',
  'btn-primary', 'btn-ghost', 'form-label', 'form-select',
  'btn-sm', 'form-input', 'btn-lg', 'form-group'
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
  legacyPatterns.forEach((pattern, index) => {
    const matches = content.match(pattern) || [];
    const className = legacyClassNames[index];

    if (matches.length > 0) {
      usages += matches.length;
      legacyClassCounts[className] = (legacyClassCounts[className] || 0) + matches.length;
    }
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

// Calcul du score selon la formule officielle du rapport
const score = Math.max(0, 100 - (totalLegacyUsages * 0.5));

console.log('🎯 RÉSULTATS AUDIT VRAIS PATTERNS LEGACY');
console.log('========================================');
console.log(`   Total usages legacy: ${totalLegacyUsages}`);
console.log(`   Fichiers analysés: ${fileCount}`);
console.log(`   Fichiers avec legacy: ${legacyFiles.length}`);
console.log(`   Score: ${score.toFixed(1)}/100`);

if (Object.keys(legacyClassCounts).length > 0) {
  console.log('\n📊 RÉPARTITION PAR CLASSE LEGACY');
  console.log('=================================');
  Object.entries(legacyClassCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([className, count]) => {
      console.log(`   ${className}: ${count} usages`);
    });
}

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

console.log('\n🎯 SCORING FINAL (Comparaison avec rapport officiel)');
console.log('====================================================');
console.log(`   Formule: 100 - (${totalLegacyUsages} × 0.5) = ${score.toFixed(1)}/100`);
console.log(`   Rapport officiel du 27/09: 169 usages → 92/100`);
console.log(`   Audit actuel: ${totalLegacyUsages} usages → ${score.toFixed(1)}/100`);

if (totalLegacyUsages === 0) {
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

console.log('\n=== FIN AUDIT VRAIS PATTERNS LEGACY ===');