const fs = require('fs');
const path = require('path');

const catalogPath = './catalog.json';
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Get intimate images in current order
const intimateImages = catalog.images.filter(img => img.category === 'intimate');
console.log(`Current intimate images: ${intimateImages.length}`);

// Dr. B's ratings (by position 1-155)
const loved = [1, 3, 4, 10, 11, 12, 39, 40, 46, 61, 62, 67, 68, 126, 127, 135];
const liked = [7, 8, 9, 13, 14, 21, 22, 23, 24, 25, 26, 27, 28, 29, 33, 34, 35, 36, 45, 53, 54, 55, 57, 58, 97, 98, 103, 104, 131, 134, 148, 149, 153, 154];
const disliked = [2, 5, 6, 15, 16, 17, 18, 19, 20, 30, 31, 32, 37, 38, 41, 42, 43, 44, 47, 48, 49, 50, 51, 52, 56, 63, 64, 65, 66, 69, 70, 77, 81, 82, 83, 84, 93, 119, 130, 132, 133, 150, 151, 152, 155];

// Images to DELETE
const toDelete = [
  59, 60,           // too small
  71, 72, 73, 74, 75, 76,  // batch3-03 to 08
  78, 79, 80,       // batch3-10 to 12
  85, 86, 87, 88, 89, 90, 91, 92,  // batch3-17 to 24
  94, 95, 96,       // batch3-26 to 28
  99, 100, 101, 102,  // new-1, 10, 11, 12
  105, 106, 107, 108, 109, 110, 111, 112,  // new-2 to 9
  113, 114, 115,    // seaart
  116, 117, 118,    // edge-01 to 03
  120, 121, 122, 123, 124, 125,  // edge-05 to 10
  128, 129,         // edge-13, 14
  136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147  // edge-21 to 30, final-01 to 02
];

console.log(`\nImages to delete: ${toDelete.length}`);

// Map position to filename for deletion
const deleteFiles = [];
toDelete.forEach(pos => {
  const img = intimateImages[pos - 1];
  if (img) {
    deleteFiles.push(img.filename);
    console.log(`  DELETE ${pos}: ${img.filename}`);
  }
});

// Delete actual files
deleteFiles.forEach(filename => {
  const filepath = path.join('.', filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    console.log(`  Deleted: ${filename}`);
  }
});

// Remove deleted images from catalog
const remainingIntimate = intimateImages.filter((img, idx) => !toDelete.includes(idx + 1));
console.log(`\nRemaining intimate images: ${remainingIntimate.length}`);

// Add ratings to remaining images
remainingIntimate.forEach((img, idx) => {
  const originalPos = intimateImages.indexOf(img) + 1;
  if (loved.includes(originalPos)) {
    img.rating = 'loved';
  } else if (liked.includes(originalPos)) {
    img.rating = 'liked';
  } else if (disliked.includes(originalPos)) {
    img.rating = 'disliked';
  } else {
    img.rating = 'unrated';
  }
});

// Sort: loved first, then liked, then disliked, then unrated
const ratingOrder = { 'loved': 0, 'liked': 1, 'disliked': 2, 'unrated': 3 };
remainingIntimate.sort((a, b) => ratingOrder[a.rating] - ratingOrder[b.rating]);

// Count by rating
const lovedCount = remainingIntimate.filter(i => i.rating === 'loved').length;
const likedCount = remainingIntimate.filter(i => i.rating === 'liked').length;
const dislikedCount = remainingIntimate.filter(i => i.rating === 'disliked').length;
console.log(`\nRatings: 💖 Loved: ${lovedCount}, 👍 Liked: ${likedCount}, 👎 Disliked: ${dislikedCount}`);

// Rebuild catalog with sorted intimate images
const nonIntimate = catalog.images.filter(img => img.category !== 'intimate');
catalog.images = [...nonIntimate, ...remainingIntimate];

// Save reference images (loved ones) for future generation
const lovedImages = remainingIntimate.filter(i => i.rating === 'loved');
console.log('\n💖 LOVED reference images:');
lovedImages.forEach((img, i) => console.log(`  ${i+1}. ${img.filename}`));

// Write updated catalog
fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log('\n✅ Catalog updated!');
console.log(`Total images now: ${catalog.images.length}`);
