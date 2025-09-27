#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 MIGRATION AUTOMATISÉE COULEURS MOBILE - 2025 DESIGN SYSTEM');
console.log('=============================================================\n');

// Mapping des couleurs gray-* vers neutral-* pour 2025 Design System
const colorMappings = {
  'gray-50': 'neutral-50',
  'gray-100': 'neutral-100',
  'gray-200': 'neutral-200',
  'gray-300': 'neutral-300',
  'gray-400': 'neutral-400',
  'gray-500': 'neutral-500',
  'gray-600': 'neutral-600',
  'gray-700': 'neutral-700',
  'gray-800': 'neutral-800',
  'gray-900': 'neutral-900'
};

// Compteurs pour statistiques
let totalFiles = 0;
let migratedFiles = 0;
let totalReplacements = 0;
const replacementsByColor = {};

// Initialiser compteurs
Object.keys(colorMappings).forEach(color => {
  replacementsByColor[color] = 0;
});

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileReplacements = 0;

    // Appliquer tous les mappings de couleurs
    Object.entries(colorMappings).forEach(([oldColor, newColor]) => {
      // Pattern pour capturer les classes avec gray-*
      const patterns = [
        // Capture dans class="..."
        new RegExp(`(class="[^"]*?)\\b${oldColor}\\b([^"]*")`, 'g'),
        // Capture dans class='...'
        new RegExp(`(class='[^']*?)\\b${oldColor}\\b([^']*')`, 'g'),
        // Capture dans :class bindings
        new RegExp(`(:class="[^"]*?)\\b${oldColor}\\b([^"]*")`, 'g'),
        new RegExp(`(:class='[^']*?)\\b${oldColor}\\b([^']*')`, 'g'),
      ];

      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          const beforeReplace = content;
          content = content.replace(pattern, `$1${newColor}$2`);
          const newMatches = beforeReplace.match(pattern);
          if (newMatches) {
            const count = newMatches.length;
            replacementsByColor[oldColor] += count;
            fileReplacements += count;
          }
        }
      });
    });

    // Si des changements ont été effectués, sauvegarder le fichier
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      migratedFiles++;
      totalReplacements += fileReplacements;
      console.log(`✅ ${path.relative(process.cwd(), filePath)}: ${fileReplacements} remplacements`);
    }

  } catch (error) {
    console.error(`❌ Erreur lors de la migration de ${filePath}:`, error.message);
  }
}

function scanDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  items.forEach(item => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Ignorer node_modules et .git
      if (!['node_modules', '.git', 'dist'].includes(item)) {
        scanDirectory(fullPath);
      }
    } else if (item.endsWith('.vue')) {
      totalFiles++;
      migrateFile(fullPath);
    }
  });
}

// Créer backup avant migration
console.log('📦 Création d\'un backup...');
try {
  execSync('git add -A && git commit -m "backup avant migration couleurs mobile"');
  console.log('✅ Backup créé avec Git\n');
} catch (error) {
  console.log('⚠️ Impossible de créer backup Git (changements déjà commitées)\n');
}

// Lancer la migration
const startTime = Date.now();
console.log('🚀 Début de la migration...\n');

scanDirectory(path.join(process.cwd(), 'src'));

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

// Statistiques finales
console.log('\n📊 RÉSULTATS DE LA MIGRATION');
console.log('============================');
console.log(`📁 Fichiers scannés: ${totalFiles}`);
console.log(`✅ Fichiers migrés: ${migratedFiles}`);
console.log(`🔄 Total remplacements: ${totalReplacements}`);
console.log(`⏱️ Durée: ${duration}s\n`);

console.log('📈 DÉTAIL PAR COULEUR:');
Object.entries(replacementsByColor).forEach(([color, count]) => {
  if (count > 0) {
    console.log(`   ${color} → ${colorMappings[color]}: ${count} remplacements`);
  }
});

// Calculer impact mobile
const mobileImpact = Math.min(100, (totalReplacements / 856) * 100);
console.log(`\n📱 IMPACT MOBILE: ${mobileImpact.toFixed(1)}% des couleurs legacy migrées`);

// Lancer audit après migration
console.log('\n🔍 Lancement audit post-migration...');
try {
  execSync('node ../audit-legacy-exact.js', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️ Impossible de lancer l\'audit automatique');
}

console.log('\n✨ MIGRATION TERMINÉE - Prêt pour validation agents CLAUDE.md');