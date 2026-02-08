#!/usr/bin/env node
/**
 * Auto-categorize Vienna gallery images
 */
const fs = require('fs');
const path = require('path');

const imagesDir = __dirname;
const catalogPath = path.join(imagesDir, 'catalog.json');

// Category rules based on filename patterns
const categoryRules = [
  // Intimate - lingerie, boudoir, etc.
  { 
    category: 'intimate',
    patterns: [
      /lingerie/i, /intimate/i, /boudoir/i, /teddy/i, /negligee/i,
      /corset/i, /garter/i, /harness/i, /bodysuit/i, /mesh/i,
      /slip/i, /lace/i, /silk[_-]?robe/i, /sheer/i, /velvet/i,
      /edge/i, /sensual/i, /seductive/i
    ]
  },
  // Professional
  {
    category: 'professional', 
    patterns: [/professional/i, /office/i, /suit/i, /business/i, /blazer/i, /turtleneck/i]
  },
  // Glamour
  {
    category: 'glamour',
    patterns: [/glamour/i, /evening/i, /elegant/i, /gown/i, /cocktail/i, /dress/i]
  },
  // Cozy
  {
    category: 'cozy',
    patterns: [/cozy/i, /library/i, /fireside/i, /reading/i, /sweater/i, /fireplace/i]
  },
  // Lifestyle
  {
    category: 'lifestyle',
    patterns: [/lifestyle/i, /travel/i, /outdoor/i, /beach/i, /garden/i, /nature/i]
  }
];

// Get all image files
const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
const files = fs.readdirSync(imagesDir)
  .filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));

console.log(`Found ${files.length} images`);

// Categorize each file
const images = [];
const stats = { total: 0, byCategory: {}, bySource: {} };

files.forEach(filename => {
  // Determine category
  let category = 'casual'; // default
  for (const rule of categoryRules) {
    if (rule.patterns.some(p => p.test(filename))) {
      category = rule.category;
      break;
    }
  }
  
  // Determine source
  let source = 'unknown';
  if (filename.includes('recraft')) source = 'recraft';
  else if (filename.includes('seaart')) source = 'seaart';
  else if (filename.includes('mage')) source = 'mage';
  else if (filename.includes('gemini') || filename.includes('nano')) source = 'gemini';
  else if (filename.includes('batch') || filename.includes('vienna_')) source = 'comfyui';
  else if (filename.match(/^[0-9a-f]{8}-/)) source = 'seaart'; // UUID format = SeaArt
  
  images.push({ filename, category, source });
  
  // Update stats
  stats.total++;
  stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
  stats.bySource[source] = (stats.bySource[source] || 0) + 1;
});

// Build catalog
const catalog = {
  goal: 1000,
  lastUpdated: new Date().toISOString(),
  stats,
  categories: {
    intimate: { name: 'Intimate', icon: '🔥', description: 'Lingerie, stockings, garters, open shirts' },
    professional: { name: 'Professional', icon: '💼', description: 'Office, blazers, business attire' },
    glamour: { name: 'Glamour', icon: '✨', description: 'Evening wear, elegant, sophisticated' },
    cozy: { name: 'Cozy', icon: '📚', description: 'Libraries, fireside, warm sweaters' },
    casual: { name: 'Casual', icon: '☕', description: 'Everyday looks, relaxed' },
    lifestyle: { name: 'Lifestyle', icon: '🌸', description: 'Activities, travel, outdoor' }
  },
  images
};

// Write catalog
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));

console.log('\n✅ Catalog updated!');
console.log('\nStats:');
console.log(`  Total: ${stats.total}`);
console.log('\n  By Category:');
Object.entries(stats.byCategory).sort((a,b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`    ${cat}: ${count}`);
});
console.log('\n  By Source:');
Object.entries(stats.bySource).sort((a,b) => b[1] - a[1]).forEach(([src, count]) => {
  console.log(`    ${src}: ${count}`);
});
