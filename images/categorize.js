#!/usr/bin/env node
// Auto-categorize Vienna gallery images based on filename patterns
const fs = require('fs');
const path = require('path');

const imagesDir = __dirname;
const catalogPath = path.join(imagesDir, 'catalog.json');

// Category patterns (order matters - first match wins)
const patterns = [
  // Intimate - lingerie, revealing
  { category: 'intimate', patterns: [
    /lingerie/i, /bodysuit/i, /harness/i, /corset/i, /garter/i, 
    /mesh/i, /bustier/i, /babydoll/i, /negligee/i, /teddy/i,
    /bikini/i, /maid/i, /nurse/i, /spicy/i, /slip-/i, /lace-vanity/i,
    /velvet-0/i, /highcut/i, /silk-robe/i
  ]},
  // Cozy - library, fireside, reading
  { category: 'cozy', patterns: [
    /library/i, /fireside/i, /fireplace/i, /bookshop/i, /reading/i,
    /before-bed/i, /winding/i
  ]},
  // Professional - office, work
  { category: 'professional', patterns: [
    /office/i, /secretary/i, /workplace/i, /professional/i
  ]},
  // Glamour - night, wine, bar, cocktail, date
  { category: 'glamour', patterns: [
    /night/i, /wine/i, /bar-/i, /cocktail/i, /date-night/i,
    /jazzclub/i, /rooftop/i, /hotel/i, /cellar/i, /getting-ready/i,
    /noir/i
  ]},
  // Lifestyle - fitness, travel, outdoor, activities
  { category: 'lifestyle', patterns: [
    /fitness/i, /gym/i, /yoga/i, /boxing/i, /beach/i, /museum/i,
    /street/i, /campus/i, /train/i, /london/i, /sakura/i, /paris/i,
    /tokyo/i, /prague/i, /scottish/i, /vespa/i, /vinyl/i, /eiffel/i,
    /autumn/i, /gallery/i, /cobblestone/i, /neon/i, /zen/i
  ]},
  // Casual - cafe, coffee, weekend, everyday
  { category: 'casual', patterns: [
    /cafe/i, /coffee/i, /casual/i, /weekend/i, /early-morning/i
  ]}
];

// Get all image files
const imageFiles = fs.readdirSync(imagesDir)
  .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f) && f !== 'index.html');

// Categorize each image
const categorized = imageFiles.map(filename => {
  let category = 'casual'; // default
  
  for (const p of patterns) {
    if (p.patterns.some(regex => regex.test(filename))) {
      category = p.category;
      break;
    }
  }
  
  return { filename, category };
});

// Load existing catalog
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Update with categorized images
catalog.images = categorized;
catalog.updated = new Date().toISOString();
catalog.stats = {
  total: categorized.length,
  byCategory: {}
};

// Count by category
for (const img of categorized) {
  catalog.stats.byCategory[img.category] = (catalog.stats.byCategory[img.category] || 0) + 1;
}

// Write updated catalog
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));

console.log('Categorized', categorized.length, 'images');
console.log('By category:', catalog.stats.byCategory);
