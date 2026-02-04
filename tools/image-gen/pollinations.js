const https = require('https');
const fs = require('fs');
const path = require('path');

const prompt = process.argv[2] || "AI assistant avatar";
const width = process.argv[3] || 1024;
const height = process.argv[4] || 1024;

// Encode prompt for URL
const encodedPrompt = encodeURIComponent(prompt);
const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`;

const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = Date.now();
const outputPath = path.join(outputDir, `vienna-${timestamp}.png`);

console.log('🎨 Generating image...');
console.log('📝 Prompt:', prompt);
console.log('📐 Size:', `${width}x${height}`);

const file = fs.createWriteStream(outputPath);

https.get(url, (response) => {
  if (response.statusCode === 302 || response.statusCode === 301) {
    // Follow redirect
    https.get(response.headers.location, (redirectRes) => {
      redirectRes.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ Image saved to:', outputPath);
      });
    });
  } else {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('✅ Image saved to:', outputPath);
    });
  }
}).on('error', (err) => {
  fs.unlink(outputPath, () => {});
  console.error('❌ Error:', err.message);
});
