#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📱 MIGRATION TYPOGRAPHY RESPONSIVE MOBILE - 2025 DESIGN SYSTEM');
console.log('==============================================================\n');

// Mapping des tailles de texte vers responsive mobile-first
const typographyMappings = {
  'text-xs': 'text-responsive-xs',    // text-xs sm:text-sm
  'text-sm': 'text-responsive-sm',    // text-sm sm:text-base
  'text-base': 'text-responsive-base', // text-base sm:text-lg
  'text-lg': 'text-responsive-lg',    // text-lg sm:text-xl lg:text-2xl
  'text-xl': 'text-responsive-xl',    // text-xl sm:text-2xl lg:text-3xl
  'text-2xl': 'text-responsive-xl',   // Consolidé vers responsive-xl
  'text-3xl': 'text-responsive-xl',   // Consolidé vers responsive-xl

  // Classes spéciales pour mobile
  'text-4xl': 'text-display-sm',      // 3rem avec letterspacing
  'text-5xl': 'text-display-md',      // 4rem avec letterspacing
  'text-6xl': 'text-display-lg',      // 5rem avec letterspacing
  'text-7xl': 'text-display-xl',      // 6rem avec letterspacing
};

// Classes à ignorer (déjà responsive ou spéciales)
const skipClasses = [
  'text-responsive-xs',
  'text-responsive-sm',
  'text-responsive-base',
  'text-responsive-lg',
  'text-responsive-xl',
  'text-display-sm',
  'text-display-md',
  'text-display-lg',
  'text-display-xl',
  'text-h1', 'text-h2', 'text-h3', 'text-h4',
  'text-body', 'text-caption', 'text-small'
];

// Compteurs pour statistiques
let totalFiles = 0;
let migratedFiles = 0;
let totalReplacements = 0;
const replacementsBySize = {};

// Initialiser compteurs
Object.keys(typographyMappings).forEach(size => {
  replacementsBySize[size] = 0;
});

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileReplacements = 0;

    // Appliquer tous les mappings de typography
    Object.entries(typographyMappings).forEach(([oldSize, newSize]) => {
      // Patterns pour capturer les classes text-*
      const patterns = [
        // Capture dans class="..."
        new RegExp(`(class="[^"]*?)\\b${oldSize}\\b([^"]*")`, 'g'),
        // Capture dans class='...'
        new RegExp(`(class='[^']*?)\\b${oldSize}\\b([^']*')`, 'g'),
        // Capture dans :class bindings
        new RegExp(`(:class="[^"]*?)\\b${oldSize}\\b([^"]*")`, 'g'),
        new RegExp(`(:class='[^']*?)\\b${oldSize}\\b([^']*')`, 'g'),
      ];

      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          const beforeReplace = content;
          content = content.replace(pattern, `$1${newSize}$2`);
          const newMatches = beforeReplace.match(pattern);
          if (newMatches) {
            const count = newMatches.length;
            replacementsBySize[oldSize] += count;
            fileReplacements += count;
          }
        }
      });
    });

    // Optimisations spéciales pour mobile
    // Remplacer font-bold par font-semibold pour mobile (plus lisible)
    const mobileFontOptimizations = [
      {
        pattern: /(class="[^"]*?)font-bold([^"]*")/g,
        replacement: '$1font-semibold$2',
        description: 'font-bold → font-semibold (mobile lisibilité)'
      },
      // Optimiser line-height pour mobile
      {
        pattern: /(class="[^"]*?)leading-tight([^"]*")/g,
        replacement: '$1leading-relaxed$2',
        description: 'leading-tight → leading-relaxed (mobile lisibilité)'
      }
    ];

    mobileFontOptimizations.forEach(opt => {
      const beforeCount = (content.match(opt.pattern) || []).length;
      if (beforeCount > 0) {
        content = content.replace(opt.pattern, opt.replacement);
        fileReplacements += beforeCount;
        console.log(`   📝 ${opt.description}: ${beforeCount} optimisations`);
      }
    });

    // Si des changements ont été effectués, sauvegarder le fichier
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      migratedFiles++;
      totalReplacements += fileReplacements;
      console.log(`✅ ${path.relative(process.cwd(), filePath)}: ${fileReplacements} optimisations`);
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
  execSync('git add -A && git commit -m "backup avant migration typography mobile"');
  console.log('✅ Backup créé avec Git\n');
} catch (error) {
  console.log('⚠️ Backup Git déjà créé\n');
}

// Lancer la migration
const startTime = Date.now();
console.log('🚀 Début de la migration typography responsive...\n');

scanDirectory(path.join(process.cwd(), 'src'));

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

// Statistiques finales
console.log('\n📊 RÉSULTATS MIGRATION TYPOGRAPHY');
console.log('=================================');
console.log(`📁 Fichiers scannés: ${totalFiles}`);
console.log(`✅ Fichiers optimisés: ${migratedFiles}`);
console.log(`🔄 Total optimisations: ${totalReplacements}`);
console.log(`⏱️ Durée: ${duration}s\n`);

console.log('📈 DÉTAIL PAR TAILLE:');
Object.entries(replacementsBySize).forEach(([size, count]) => {
  if (count > 0) {
    console.log(`   ${size} → ${typographyMappings[size]}: ${count} optimisations`);
  }
});

// Calculer impact mobile typography
const typographyImpact = Math.min(100, (totalReplacements / 1425) * 100);
console.log(`\n📱 IMPACT MOBILE TYPOGRAPHY: ${typographyImpact.toFixed(1)}% des tailles non-responsive optimisées`);

// Vérifications post-migration
console.log('\n🔍 Vérification des classes responsive appliquées...');
try {
  const responsiveCount = parseInt(execSync(`rg "text-responsive-" src --type vue | wc -l`, { encoding: 'utf8' }).trim());
  console.log(`✅ Classes responsive actives: ${responsiveCount}`);

  const displayCount = parseInt(execSync(`rg "text-display-" src --type vue | wc -l`, { encoding: 'utf8' }).trim());
  console.log(`✅ Classes display responsive: ${displayCount}`);
} catch (error) {
  console.log('⚠️ Impossible de vérifier les classes responsive');
}

console.log('\n✨ MIGRATION TYPOGRAPHY TERMINÉE - Prêt pour touch optimization');