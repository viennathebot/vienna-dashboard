#!/usr/bin/env node
/**
 * Extract base64 image from Google AI Studio via Chrome DevTools Protocol
 * Usage: node extract-image-cdp.js [output-path]
 */
const http = require('http');
const WebSocket = require('ws') || null;
const fs = require('fs');
const path = require('path');

const CDP_PORT = 18800;
const OUTPUT_DIR = process.argv[2] || '/Users/vi/.openclaw/workspace/vienna-images';
const CHUNK_SIZE = 100000; // 100K chars per chunk

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function connectCDP(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new (require('ws'))(wsUrl);
    let msgId = 0;
    const pending = new Map();
    
    ws.on('open', () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const id = ++msgId;
          pending.set(id, { resolve: res, reject: rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      },
      close() { ws.close(); }
    }));
    
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.id && pending.has(msg.id)) {
        const p = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message));
        else p.resolve(msg.result);
      }
    });
    
    ws.on('error', reject);
  });
}

async function main() {
  try {
    // Find AI Studio target
    const targets = await fetchJSON(`http://127.0.0.1:${CDP_PORT}/json`);
    const aiStudio = targets.find(t => t.url.includes('aistudio.google.com'));
    
    if (!aiStudio) {
      console.error('No AI Studio tab found');
      process.exit(1);
    }
    
    console.log(`Found AI Studio tab: ${aiStudio.title}`);
    const cdp = await connectCDP(aiStudio.webSocketDebuggerUrl);
    
    // Get base64 length - find data URL image (not blob URL)
    const lenResult = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const imgs = document.querySelectorAll('img[alt*="Generated Image"]');
        for (const img of imgs) {
          if (img.src.startsWith('data:')) {
            return JSON.stringify({ length: img.src.length, prefix: img.src.substring(0, 40) });
          }
        }
        // Fallback: find any large data URL image
        const allImgs = document.querySelectorAll('img');
        for (const img of allImgs) {
          if (img.src.startsWith('data:') && img.src.length > 10000) {
            return JSON.stringify({ length: img.src.length, prefix: img.src.substring(0, 40), alt: img.alt });
          }
        }
        return JSON.stringify({ error: 'no data URL image found', imgCount: imgs.length });
      })()`,
      returnByValue: true
    });
    
    const info = JSON.parse(lenResult.result.value);
    if (info.error) {
      console.error(info.error);
      cdp.close();
      process.exit(1);
    }
    
    console.log(`Image data: ${info.length} chars, prefix: ${info.prefix}`);
    
    // Extract base64 data (skip the data:image/png;base64, prefix)
    const prefixLen = 'data:image/png;base64,'.length;
    const totalLen = info.length - prefixLen;
    const numChunks = Math.ceil(totalLen / CHUNK_SIZE);
    
    console.log(`Extracting ${numChunks} chunks of ${CHUNK_SIZE} chars...`);
    
    let base64 = '';
    for (let i = 0; i < numChunks; i++) {
      const start = prefixLen + (i * CHUNK_SIZE);
      const end = Math.min(start + CHUNK_SIZE, info.length);
      
      const chunkResult = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const imgs = document.querySelectorAll('img');
          for (const img of imgs) {
            if (img.src.startsWith('data:') && img.src.length > 10000) {
              return img.src.substring(${start}, ${end});
            }
          }
          return '';
        })()`,
        returnByValue: true
      });
      
      base64 += chunkResult.result.value;
      process.stdout.write(`\r  Chunk ${i + 1}/${numChunks}`);
    }
    
    console.log('\nDecoding and saving...');
    
    // Decode and save
    const buffer = Buffer.from(base64, 'base64');
    const filename = `vienna-${Date.now()}.png`;
    const filepath = path.join(OUTPUT_DIR, filename);
    
    fs.writeFileSync(filepath, buffer);
    console.log(`Saved: ${filepath} (${buffer.length} bytes)`);
    
    cdp.close();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
