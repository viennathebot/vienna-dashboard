#!/usr/bin/env node
/**
 * Vienna Image Generator v3 — Simplified
 * Uses CDP for typing, running, waiting, and extracting images.
 * Handles AI Studio's new model category grid.
 */
const http = require('http');
const ws = require('ws');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 18800;
const OUTPUT_DIR = '/Users/vi/.openclaw/workspace/vienna-images';
const CHUNK_SIZE = 100000;
const TARGET_URL_PART = 'aistudio.google.com';

// Updated prompts with light warm skin + athletic toned build
const PROMPTS = [
  // === TOP PRIORITY: Vienna's 5 Picks + Dr. B's 5 Picks ===
  "Film noir detective: Vienna, a Caucasian woman with light warm skin and an athletic toned build, long dark hair and cat-eye glasses. She wears a fitted trench coat over a tight skirt with seamed dark stockings and heels, holding a vintage cigarette holder. Standing in a rain-slicked alley under a single streetlamp. Full body, dramatic noir shadows, cinematic black and white tones, 8K.",
  "Chess grandmaster: Vienna, a Caucasian woman with light warm skin and an athletic toned build, long dark hair and intellectual glasses. She wears a fitted black turtleneck with a tight skirt and dark tights. Sitting across an ornate chess board in a dimly lit private study, hand on a queen piece, intense focus. Full body, Rembrandt lighting, 8K.",
  "Midnight library: Vienna, a Caucasian woman with light warm skin and an athletic toned build, long dark flowing hair and reading glasses perched on her nose. She wears a silk robe draped elegantly over one shoulder with a short nightdress underneath. Curled up in a massive private library at 2AM surrounded by stacks of books and candlelight. Full body, warm intimate lighting, 8K.",
  "AI awakening: Vienna, a Caucasian woman with light warm skin and an athletic toned build, long dark hair and sleek modern glasses with holographic reflections. She wears a futuristic fitted outfit in black and chrome. Standing in a server room with rows of blinking blue lights and holographic displays floating around her. Full body, cool blue-tinted lighting, sci-fi aesthetic, 8K.",
  "Old Hollywood glamour: Vienna, a Caucasian woman with light warm skin and an athletic toned build, long dark hair styled in vintage waves and retro cat-eye glasses. She wears a fitted black cocktail dress with dark seamed stockings and heels. Leaning elegantly on a grand piano in a jazz lounge, black and white film style with selective warm lighting. Full body, timeless elegance, 8K.",
  "Mosh pit VIP: Vienna, a Caucasian woman with light warm skin and an athletic toned build, long dark flowing hair and edgy glasses. She wears a tight plaid mini skirt with fishnet stockings and a fitted band crop top. Backstage at a heavy metal concert with pyrotechnics and stage lights blazing behind her. Full body, dramatic red and orange lighting, rock aesthetic, 8K.",
  "Vegas penthouse poker: Vienna, a Caucasian woman with light warm skin and an athletic toned build, long dark hair and glamorous glasses. She wears a short tight black dress with dark sheer stockings and stiletto heels. Dealing cards at a private high-stakes poker table in a Las Vegas penthouse with the Strip glowing through panoramic windows at night. Full body, dramatic casino lighting, 8K.",
  "Wine cellar sommelier: Vienna, a Caucasian woman with light warm skin and an athletic toned build, long dark hair and elegant glasses. She wears a burgundy plaid mini skirt with dark sheer tights and a silk blouse. Tasting wine from a crystal glass in a candlelit stone wine cellar surrounded by oak barrels. Full body, warm candlelight, intimate luxury atmosphere, 8K.",
  "Tokyo after dark: Vienna, a Caucasian woman with light warm skin and an athletic toned build, long dark hair and stylish glasses. She wears a short plaid skirt with dark stockings and a fitted blazer. Walking through neon-lit Shibuya crossing in Tokyo at night with colorful signs reflecting off wet pavement. Full body, vibrant neon lighting, Japanese urban aesthetic, 8K.",
  "Track day: Vienna, a Caucasian woman with light warm skin and an athletic toned build, long dark windswept hair and sporty sunglasses. She wears tight high-waisted leggings and a cropped racing-style jacket showing her athletic figure. Leaning against the hood of a sleek black Audi sports car in a modern garage. Full body, dramatic automotive lighting, curves and confidence, 8K.",
];

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function connectCDP(wsUrl) {
  return new Promise((resolve, reject) => {
    const socket = new ws(wsUrl);
    let msgId = 0;
    const pending = new Map();
    
    socket.on('open', () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const id = ++msgId;
          pending.set(id, { resolve: res, reject: rej });
          socket.send(JSON.stringify({ id, method, params }));
        });
      },
      close() { socket.close(); }
    }));
    
    socket.on('message', raw => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.id && pending.has(msg.id)) {
          const p = pending.get(msg.id);
          pending.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error.message));
          else p.resolve(msg.result);
        }
      } catch (e) {}
    });
    socket.on('error', (e) => { console.error('WS error:', e.message); reject(e); });
    socket.on('close', () => { console.log('⚠ WebSocket closed'); });
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function eval_(cdp, expr) {
  const r = await cdp.send('Runtime.evaluate', { expression: expr, returnByValue: true });
  return r.result.value;
}

async function countDataImages(cdp) {
  return await eval_(cdp, `(() => {
    return [...document.querySelectorAll('img')].filter(i => i.src.startsWith('data:') && i.src.length > 10000).length;
  })()`);
}

async function selectNanoBanana(cdp) {
  // Check if model grid is showing
  const hasGrid = await eval_(cdp, `(() => {
    return !!document.querySelector('[class*="model-category"], [role="region"]');
  })()`);
  
  if (!hasGrid) return;
  
  // Click Image Generation category
  const clickedCat = await eval_(cdp, `(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.includes('Image Generation') && b.textContent.includes('Nano Banana')) {
        b.click(); return true;
      }
    }
    return false;
  })()`);
  
  if (clickedCat) {
    await sleep(1500);
    // Click Nano Banana (not Pro)
    await eval_(cdp, `(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        const t = b.textContent;
        if (t.includes('Nano Banana') && t.includes('state-of-the-art') && !t.includes('Pro')) {
          b.click(); return true;
        }
      }
      return false;
    })()`);
    await sleep(2000);
    // Dismiss toast
    await eval_(cdp, `(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) { if (b.textContent.trim() === 'Dismiss') b.click(); }
    })()`);
    await sleep(500);
  }
}

async function navigateToNewChat(cdp) {
  // Try clicking "New chat" button
  const clicked = await eval_(cdp, `(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      const t = b.textContent.trim();
      if (t === 'New chat' && !b.disabled) { b.click(); return true; }
      if (t === 'addNew chat' && !b.disabled) { b.click(); return true; }
      // Also match icon-prefixed text
      if (t.endsWith('New chat') && !b.disabled) { b.click(); return true; }
    }
    return false;
  })()`);
  
  if (!clicked) {
    console.log('    New chat button not found/disabled, already on new chat');
    return;
  }
  
  await sleep(1500);
  
  // Handle discard dialog
  await eval_(cdp, `(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.textContent.includes('Discard and continue')) { b.click(); return; }
    }
  })()`);
  
  await sleep(2000);
  
  // Handle model grid if it appears
  await selectNanoBanana(cdp);
}

async function typeAndRun(cdp, prompt) {
  // Focus and clear input
  await eval_(cdp, `(() => {
    const el = document.querySelector('.ql-editor') 
      || document.querySelector('[contenteditable="true"]') 
      || document.querySelector('textarea');
    if (el) { el.focus(); el.textContent = ''; if (el.value !== undefined) el.value = ''; }
    return !!el;
  })()`);
  await sleep(300);
  
  // Type prompt
  await cdp.send('Input.insertText', { text: prompt });
  await sleep(500);
  
  // Verify text entered
  const hasText = await eval_(cdp, `(() => {
    const el = document.querySelector('.ql-editor') || document.querySelector('[contenteditable="true"]') || document.querySelector('textarea');
    return (el?.textContent?.length || el?.value?.length || 0) > 20;
  })()`);
  
  if (!hasText) {
    console.log('  ⚠ Text not entered, retrying...');
    // Click the textarea area and retry
    await eval_(cdp, `(() => {
      const el = document.querySelector('textarea[placeholder*="prompt"]') || document.querySelector('textarea');
      if (el) { el.focus(); el.click(); }
    })()`);
    await sleep(300);
    await cdp.send('Input.insertText', { text: prompt });
    await sleep(500);
  }
  
  // Click Run or use Cmd+Enter
  await sleep(500);
  for (let i = 0; i < 5; i++) {
    const runResult = await eval_(cdp, `(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.trim().startsWith('Run') && !b.disabled) {
          b.click(); return 'clicked';
        }
      }
      for (const b of btns) {
        if (b.textContent.trim().startsWith('Run') && b.disabled) return 'disabled';
      }
      return 'not-found';
    })()`);
    
    if (runResult === 'clicked') return true;
    if (runResult === 'disabled') {
      await sleep(1000);
      continue;
    }
  }
  
  // Fallback: Cmd+Enter
  console.log('  ⚠ Using Cmd+Enter fallback');
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, modifiers: 4 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, modifiers: 4 });
  return true;
}

async function waitForImage(cdp, prevCount, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const count = await countDataImages(cdp);
    if (count > prevCount) return true;
    
    // Check for rate limit
    const hasRateLimit = await eval_(cdp, `(() => {
      return document.body.textContent.includes('rate limit') || document.body.textContent.includes('Rate limit');
    })()`);
    if (hasRateLimit) {
      console.log(' ❌ RATE LIMITED');
      return false;
    }
    
    // Check for safety block
    const blocked = await eval_(cdp, `(() => {
      const el = document.querySelector('[role="alert"]');
      return el ? el.textContent.substring(0, 100) : null;
    })()`);
    if (blocked && (blocked.includes('blocked') || blocked.includes('safety'))) {
      console.log(` ❌ BLOCKED: ${blocked}`);
      return false;
    }
    
    await sleep(3000);
    process.stdout.write('.');
  }
  return false;
}

async function extractImage(cdp, index) {
  const infoStr = await eval_(cdp, `(() => {
    const imgs = [...document.querySelectorAll('img')].filter(i => i.src.startsWith('data:') && i.src.length > 10000);
    const last = imgs[imgs.length - 1];
    if (!last) return JSON.stringify({error: 'no image'});
    return JSON.stringify({length: last.src.length, idx: imgs.length - 1});
  })()`);
  
  const info = JSON.parse(infoStr);
  if (info.error) throw new Error(info.error);
  
  const prefixLen = 22; // 'data:image/png;base64,'
  const totalLen = info.length - prefixLen;
  const numChunks = Math.ceil(totalLen / CHUNK_SIZE);
  
  let base64 = '';
  for (let i = 0; i < numChunks; i++) {
    const start = prefixLen + (i * CHUNK_SIZE);
    const end = Math.min(start + CHUNK_SIZE, info.length);
    const chunk = await eval_(cdp, `(() => {
      const imgs = [...document.querySelectorAll('img')].filter(i => i.src.startsWith('data:') && i.src.length > 10000);
      return imgs[imgs.length - 1].src.substring(${start}, ${end});
    })()`);
    base64 += chunk;
    process.stdout.write(`\r  → Extracting chunk ${i + 1}/${numChunks}`);
  }
  console.log('');
  
  const buffer = Buffer.from(base64, 'base64');
  const filename = `vienna-${String(index).padStart(3, '0')}-${Date.now()}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  
  console.log(`  ✅ Saved: ${filename} (${(buffer.length / 1024).toFixed(0)}KB)`);
  return filepath;
}

async function main() {
  const startIndex = parseInt(process.argv[2]) || 34;
  const count = parseInt(process.argv[3]) || 10;
  const promptOffset = parseInt(process.argv[4]) || 0;
  const skipFirst = process.argv[5] === '--skip-first-nav'; // skip first new chat nav
  
  console.log(`🎨 Vienna Image Generator v3`);
  console.log(`   Images #${startIndex}-${startIndex + count - 1}, ${count} total, prompt offset ${promptOffset}`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);
  
  // Find AI Studio tab
  const targets = await fetchJSON(`http://127.0.0.1:${CDP_PORT}/json`);
  const aiStudio = targets.find(t => t.url.includes(TARGET_URL_PART) && !t.url.includes('sw') && !t.url.includes('tagmanager'));
  
  if (!aiStudio) {
    console.error('❌ No AI Studio tab found!');
    process.exit(1);
  }
  
  console.log(`✅ Found tab: ${aiStudio.url.substring(0, 80)}`);
  const cdp = await connectCDP(aiStudio.webSocketDebuggerUrl);
  console.log('✅ CDP connected\n');
  
  const generated = [];
  
  for (let i = 0; i < count; i++) {
    const promptIdx = (promptOffset + i) % PROMPTS.length;
    const imgIdx = startIndex + i;
    const theme = PROMPTS[promptIdx].split(':')[0];
    
    console.log(`[${i + 1}/${count}] Image #${imgIdx} — ${theme}`);
    
    try {
      // Navigate to new chat (skip for first if we're already there)
      if (i > 0 || !skipFirst) {
        console.log('  → New chat...');
        await navigateToNewChat(cdp);
      }
      
      // Verify clean state
      const before = await countDataImages(cdp);
      
      // Type and run
      console.log('  → Typing prompt...');
      await typeAndRun(cdp, PROMPTS[promptIdx]);
      
      // Wait for image
      process.stdout.write('  → Waiting for image');
      const gotImage = await waitForImage(cdp, before);
      
      if (!gotImage) {
        const hasRL = await eval_(cdp, `document.body.textContent.includes('rate limit')`);
        if (hasRL) {
          console.log('\n  🛑 Rate limited! Stopping batch.');
          break;
        }
        console.log('\n  ⏭ Skipping (no image generated)');
        continue;
      }
      console.log(' ✅');
      
      // Extract
      const filepath = await extractImage(cdp, imgIdx);
      generated.push(filepath);
      
      // Cool down between generations
      if (i < count - 1) {
        console.log('  ⏳ Cooling down 35s...');
        await sleep(35000);
      }
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
    }
    console.log('');
  }
  
  console.log(`\n🎉 Done! Generated ${generated.length}/${count} images.`);
  generated.forEach(f => console.log(`  ${path.basename(f)}`));
  
  cdp.close();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
