const { generateImageFile } = require('ai-freeimage');
const path = require('path');
const fs = require('fs');

const prompt = process.argv[2] || "Elegant AI assistant avatar, sophisticated woman with warm smile, subtle holographic tech elements, professional executive aesthetic, soft lighting, navy and gold color scheme, minimalist background, digital art style, high quality";

const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = Date.now();
const outputPath = path.join(outputDir, `vienna-${timestamp}.png`);

console.log('Generating image with prompt:', prompt);
console.log('Output path:', outputPath);

generateImageFile(prompt, outputPath)
  .then(() => {
    console.log('✅ Image generated successfully!');
    console.log('File:', outputPath);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
  });
