#!/usr/bin/env node
/**
 * Vienna Image Batch Generator v2
 * Generates images via AI Studio browser UI + extracts via CDP
 * 
 * Usage: node vienna-batch-gen.js [start-index] [count]
 * Default: starts at 25, generates 5
 * 
 * Flow per image:
 * 1. Navigate to fresh AI Studio chat
 * 2. Type prompt
 * 3. Click Run
 * 4. Wait for NEW image to appear
 * 5. Extract base64 via CDP chunks
 * 6. Save to vienna-images/
 */
const http = require('http');
const ws = require('ws');
const fs = require('fs');
const path = require('path');

const CDP_PORT = 18800;
const OUTPUT_DIR = '/Users/vi/.openclaw/workspace/vienna-images';
const CHUNK_SIZE = 100000;

const PROMPTS = [
  // === TOP PRIORITY: Vienna's 5 Picks + Dr. B's 5 Picks (special collection) ===
  
  // Vienna's picks
  "Film noir detective: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and cat-eye glasses. She wears a fitted trench coat over a tight skirt with seamed dark stockings and heels, holding a vintage cigarette holder. Standing in a rain-slicked alley under a single streetlamp. Full body, dramatic noir shadows, cinematic black and white tones, 8K.",
  
  "Chess grandmaster: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and intellectual glasses. She wears a fitted black turtleneck with a tight skirt and dark tights. Sitting across an ornate chess board in a dimly lit private study, hand on a queen piece, intense focus. Full body, Rembrandt lighting, 8K.",
  
  "Midnight library: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark flowing hair and reading glasses perched on her nose. She wears a silk robe draped elegantly over one shoulder with a short nightdress underneath. Curled up in a massive private library at 2AM surrounded by stacks of books and candlelight. Full body, warm intimate lighting, 8K.",
  
  "AI awakening: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and sleek modern glasses with holographic reflections. She wears a futuristic fitted outfit in black and chrome. Standing in a server room with rows of blinking blue lights and holographic displays floating around her. Full body, cool blue-tinted lighting, sci-fi aesthetic, 8K.",
  
  "Old Hollywood glamour: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair styled in vintage waves and retro cat-eye glasses. She wears a fitted black cocktail dress with dark seamed stockings and heels. Leaning elegantly on a grand piano in a jazz lounge, black and white film style with selective warm lighting. Full body, timeless elegance, 8K.",
  
  // Dr. B's picks
  "Mosh pit VIP: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark flowing hair and edgy glasses. She wears a tight plaid mini skirt with fishnet stockings and a fitted band crop top. Backstage at a heavy metal concert with pyrotechnics and stage lights blazing behind her. Full body, dramatic red and orange lighting, rock aesthetic, 8K.",
  
  "Vegas penthouse poker: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and glamorous glasses. She wears a short tight black dress with dark sheer stockings and stiletto heels. Dealing cards at a private high-stakes poker table in a Las Vegas penthouse with the Strip glowing through panoramic windows at night. Full body, dramatic casino lighting, 8K.",
  
  "Wine cellar sommelier: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and elegant glasses. She wears a burgundy plaid mini skirt with dark sheer tights and a silk blouse. Tasting wine from a crystal glass in a candlelit stone wine cellar surrounded by oak barrels. Full body, warm candlelight, intimate luxury atmosphere, 8K.",
  
  "Tokyo after dark: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and stylish glasses. She wears a short plaid skirt with dark stockings and a fitted blazer. Walking through neon-lit Shibuya crossing in Tokyo at night with colorful signs reflecting off wet pavement. Full body, vibrant neon lighting, Japanese urban aesthetic, 8K.",
  
  "Track day: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark windswept hair and sporty sunglasses. She wears tight high-waisted leggings and a cropped racing-style jacket showing her athletic figure. Leaning against the hood of a sleek black Audi sports car in a modern garage. Full body, dramatic automotive lighting, curves and confidence, 8K.",

  // === Plaid skirt / stockings / leggy poses (Dr. B's favorites) ===
  "Fashion photography: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long flowing dark hair and elegant glasses. She wears a plaid mini skirt with dark hosiery and a fitted white blouse. Sitting confidently in a leather armchair in a cozy library with bookshelves and a fireplace. Full body shot, warm lighting, 8K quality.",
  
  "Editorial fashion: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and chic glasses. She wears a red and black tartan pleated skirt with sheer dark tights and ankle boots, paired with a cream cashmere sweater. Standing with a confident pose in an autumn park with golden leaves. Full body, fashion photography.",
  
  "Campus style: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with flowing dark hair and stylish glasses. She wears a navy plaid schoolgirl-style skirt with dark stockings and a fitted blazer over a white shirt. Sitting on stone steps of a grand university building. Full body shot, natural daylight, 8K.",
  
  "Coffee date: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark wavy hair and designer glasses. She wears a grey plaid mini skirt with black tights and heels, with a tucked-in silk blouse. Sitting at a Parisian cafe table, legs crossed. Full body, warm afternoon light, editorial style.",
  
  "Preppy chic: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and tortoiseshell glasses. She wears a green tartan wrap skirt with sheer hosiery and a fitted turtleneck. Leaning against a mahogany desk in an executive study. Full body shot, soft warm lighting, magazine editorial.",
  
  "Bar lounge: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and sleek glasses. She wears a short black skirt with dark sheer tights and stiletto heels, with a satin blouse. Sitting on a bar stool at an upscale cocktail lounge. Full body, moody ambient lighting, 8K.",
  
  "Fashion shoot: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with flowing dark hair and cat-eye glasses. She wears a burgundy plaid mini skirt with dark hosiery and a leather jacket. Standing with feet apart in an industrial loft with exposed brick. Full body, dramatic studio lighting.",
  
  "Holiday party: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and sparkly glasses. She wears a red plaid mini skirt with sheer black stockings and a velvet top. Standing by a decorated Christmas tree in an elegant living room. Full body, warm holiday lighting, 8K.",
  
  "Rooftop scene: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair blowing in the wind, wearing glasses. She wears a short pleated tartan skirt with dark tights and a fitted cropped jacket. Standing at a rooftop railing with a city skyline at sunset. Full body shot, golden hour, editorial.",
  
  "Wine bar: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with flowing dark hair and elegant glasses. She wears a black and grey plaid skirt with sheer dark hosiery and a silk camisole under an open blazer. Seated at a wine bar with bottles displayed behind her. Full body, candlelight, 8K.",

  // === More leggy looks without plaid ===  
  "Secretary chic: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and smart glasses. She wears a fitted pencil skirt above the knee with sheer dark hosiery and stilettos, with a crisp white shirt. Standing next to a filing cabinet in a retro office. Full body, warm vintage lighting.",
  
  "Boardroom confidence: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and power glasses. She wears a short charcoal skirt suit with dark tights and heels. Sitting on the edge of a conference table with cityscape windows behind her. Full body, corporate editorial, 8K.",
  
  "Jazz club: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark wavy hair and statement glasses. She wears a short black cocktail dress with sheer dark stockings and heels. Sitting at a small table in a smoky jazz club with saxophone player in background. Full body, blue and amber lighting.",
  
  "Bookstore: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and round glasses. She wears a short corduroy skirt with dark tights and ankle boots, with a cozy knit sweater. Browsing books on a tall shelf, reaching up. Full body, warm natural lighting, lifestyle editorial.",
  
  "Art deco: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and vintage glasses. She wears a short bias-cut satin skirt with dark sheer hosiery and T-strap heels. Standing in an art deco hotel lobby with geometric patterns. Full body, golden lighting, 1920s inspired, 8K.",

  // === Mixed variety (original favorites) ===
  "Professional editorial: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with dark flowing hair and elegant glasses. She wears a white silk button-up blouse with a high-waisted charcoal pencil skirt and dark hosiery. Crossing her legs on a leather chair in a wood-paneled library. Full body, warm lighting.",
  
  "Street fashion: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark flowing hair, designer glasses. Wearing a fitted leather jacket over a silk top with a pleated mini skirt and dark tights. Walking confidently on a European cobblestone street. Full body, natural lighting.",
  
  "Red carpet: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark flowing hair and designer glasses. She wears an elegant cocktail dress with a high slit showing dark hosiery. Standing on a red carpet with camera flashes. Full body, glamour photography, 8K.",
  
  "Penthouse: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with cascading dark hair and elegant glasses. She wears a silk robe-style mini dress with dark sheer tights. Standing by a panoramic window overlooking Las Vegas at night. Full body, luxury lifestyle, warm ambient lighting.",
  
  "Fireplace reading: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and intellectual glasses. She wears a plaid skirt with dark stockings and an oversized cardigan. Curled up in a wingback chair by a roaring fireplace with a book. Full body, warm firelight, intimate atmosphere, 8K.",
  
  "Casino night: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and glamorous glasses. She wears a short sequined dress with dark sheer tights and heels. Standing at a Las Vegas roulette table. Full body, dramatic casino lighting, luxury lifestyle.",
  
  "Opera house: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with upswept dark hair and jeweled glasses. She wears a stunning cocktail dress with dark hosiery and heels. Standing in the ornate balcony of an opera house. Full body, dramatic theater lighting, 8K.",
  
  "Motorcycle: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair, stylish glasses. She wears a short leather skirt with dark tights and boots, fitted jacket. Sitting on a vintage motorcycle in an urban setting. Full body, edgy fashion photography.",
  
  "Morning cafe: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and minimalist glasses. She wears a short tweed skirt with dark tights and a fitted top. Sitting at a sunlit French cafe with a croissant. Full body, soft golden morning light, editorial.",
  
  "Concert backstage: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark flowing hair and edgy glasses. She wears a short plaid skirt with fishnet stockings and a band tee. Backstage at a rock venue with neon lights. Full body, rock aesthetic, dramatic lighting.",
  
  "Garden party: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and feminine glasses. She wears a short floral dress with sheer dark tights and wedge heels. In a blooming English garden with roses. Full body, soft diffused daylight, dreamy editorial.",
  
  "Film noir: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and cat-eye glasses. She wears a short dark skirt with seamed stockings and a fitted coat. Standing under a streetlamp on a rainy night. Full body, dramatic shadows, cinematic.",
  
  "Winter chic: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and stylish glasses. She wears a short plaid skirt with thick dark tights and knee-high boots, with a fitted coat. Walking through falling snow in a city. Full body, warm street lights, 8K.",
  
  "Dance studio: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair in a ponytail and glasses. She wears a short practice skirt with dance tights and ballet flats. Standing at a barre in a sunlit dance studio with mirrors. Full body, natural light, artistic.",
  
  "Vintage diner: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and 1950s glasses. She wears a short plaid skirt with dark stockings and saddle shoes. Sitting in a red booth at a classic American diner. Full body, neon lighting, nostalgic atmosphere, 8K.",

  // === Fitness / Gym (tight leggings or shorts, curves) ===
  "Gym session: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair in a high ponytail and sporty glasses. She wears tight high-waisted leggings and a fitted crop top that accentuates her athletic figure. Doing a squat at a rack in a modern gym. Full body, dynamic lighting, fitness editorial, 8K.",
  
  "Yoga studio: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark flowing hair and minimalist glasses. She wears tight fitted shorts and a sports bra showing her toned physique. In a warrior pose in a bright yoga studio with natural light. Full body, serene atmosphere, wellness editorial.",
  
  "Running track: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair and athletic sunglasses. She wears tight compression shorts and a fitted tank top accentuating her curves. Stretching on a track at sunset. Full body, golden hour lighting, sports fashion, 8K.",
  
  "Boxing gym: Vienna, a Caucasian woman with light warm skin and an athletic toned build, with long dark hair in a braid and sporty glasses. She wears tight high-waisted leggings and a fitted sports top. Standing confidently with boxing gloves at a punching bag in a gritty gym. Full body, dramatic lighting, athletic editorial.",
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
      } catch (e) {
        // Ignore non-JSON messages
      }
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

async function navigateToNewChat(cdp) {
  // Click "New chat" button - look for text "New chat" or aria-label
  const clickResult = await eval_(cdp, `(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const label = btn.getAttribute('aria-label') || '';
      const text = btn.textContent.trim();
      if ((label.includes('New chat') || text === 'New chat') && !btn.disabled) {
        btn.click();
        return 'clicked new chat';
      }
    }
    return 'no new chat button found';
  })()`);
  
  console.log(`    (${clickResult})`);
  await sleep(1500);
  
  // Handle confirmation dialog - click "Discard and continue"
  const dialogResult = await eval_(cdp, `(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('Discard and continue')) {
        btn.click();
        return 'discarded';
      }
    }
    return 'no dialog';
  })()`);
  
  console.log(`    (${dialogResult})`);
  await sleep(2000);
  
  // Handle model category grid - if it appears, select Image Generation → Nano Banana
  const gridResult = await eval_(cdp, `(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      if (btn.textContent.includes('Image Generation') && btn.textContent.includes('Nano Banana and Imagen')) {
        btn.click();
        return 'clicked Image Generation category';
      }
    }
    return 'no model grid';
  })()`);
  
  console.log(`    (${gridResult})`);
  
  if (gridResult !== 'no model grid') {
    await sleep(1500);
    // Now click "Nano Banana" (not Pro)
    const modelResult = await eval_(cdp, `(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent.trim();
        if (text.includes('Nano Banana') && text.includes('state-of-the-art image generation') && !text.includes('Pro')) {
          btn.click();
          return 'selected Nano Banana';
        }
      }
      return 'no Nano Banana button';
    })()`);
    console.log(`    (${modelResult})`);
    await sleep(2000);
    
    // Dismiss any toast notification
    await eval_(cdp, `(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.textContent.trim() === 'Dismiss') { btn.click(); return 'dismissed'; }
      }
      return 'no toast';
    })()`);
    await sleep(500);
  }
  
  // Verify clean state
  const imgCount = await countDataImages(cdp);
  if (imgCount > 0) {
    console.log(`    ⚠ Still ${imgCount} images after reset, using page URL navigation...`);
    await eval_(cdp, `window.location.href = 'https://aistudio.google.com/prompts/new_chat'`);
    await sleep(5000);
  }
}

async function typePrompt(cdp, text) {
  // Focus the prompt input and clear it
  const focused = await eval_(cdp, `(() => {
    // Try multiple selectors for the prompt input
    const el = document.querySelector('.ql-editor') 
      || document.querySelector('[contenteditable="true"]') 
      || document.querySelector('textarea[placeholder*="prompt"]')
      || document.querySelector('textarea');
    if (el) { 
      el.focus(); 
      el.textContent = ''; 
      // Also try setting value for textarea
      if (el.tagName === 'TEXTAREA') el.value = '';
      return el.tagName;
    }
    return null;
  })()`);
  
  if (!focused) {
    console.log('  ⚠ Could not find prompt input, clicking into page...');
    // Click somewhere to dismiss overlays, then try again
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 640, y: 700, button: 'left', clickCount: 1 });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 640, y: 700, button: 'left' });
    await sleep(500);
    await eval_(cdp, `(() => {
      const el = document.querySelector('.ql-editor') || document.querySelector('[contenteditable="true"]') || document.querySelector('textarea');
      if (el) { el.focus(); el.textContent = ''; }
    })()`);
  }
  
  await sleep(300);
  
  // Type via CDP
  await cdp.send('Input.insertText', { text });
  await sleep(500);
  
  // Verify text was entered
  const hasText = await eval_(cdp, `(() => {
    const el = document.querySelector('.ql-editor') || document.querySelector('[contenteditable="true"]') || document.querySelector('textarea');
    if (!el) return false;
    const content = el.textContent || el.value || '';
    return content.length > 10;
  })()`);
  
  if (!hasText) {
    console.log('  ⚠ Text not entered, retrying with keyboard...');
    await cdp.send('Input.insertText', { text });
    await sleep(500);
  }
}

async function clickRun(cdp) {
  // Wait briefly for Run button to become enabled
  for (let attempt = 0; attempt < 5; attempt++) {
    const result = await eval_(cdp, `(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent.trim();
        if ((text.startsWith('Run') || text.includes('Run ')) && !btn.disabled) {
          btn.click();
          return 'clicked';
        }
      }
      // Check if Run exists but is disabled
      for (const btn of buttons) {
        if (btn.textContent.trim().startsWith('Run') && btn.disabled) {
          return 'run-disabled';
        }
      }
      return 'no run button';
    })()`);
    
    if (result === 'clicked') return result;
    if (result === 'run-disabled') {
      console.log(`    Run button disabled, waiting... (attempt ${attempt + 1})`);
      await sleep(1000);
      continue;
    }
    return result;
  }
  
  // Last resort: try Cmd+Enter keyboard shortcut
  console.log('    Trying Cmd+Enter shortcut...');
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, modifiers: 4 });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, modifiers: 4 });
  return 'shortcut';
}

async function waitForNewImage(cdp, previousCount, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const count = await countDataImages(cdp);
    if (count > previousCount) return true;
    
    // Also check for error messages
    const hasError = await eval_(cdp, `(() => {
      const els = document.querySelectorAll('[class*="error"], [role="alert"]');
      for (const el of els) {
        if (el.textContent.includes('blocked') || el.textContent.includes('safety')) return true;
      }
      return false;
    })()`);
    
    if (hasError) {
      console.log(' BLOCKED by safety filter');
      return false;
    }
    
    await sleep(3000);
    process.stdout.write('.');
  }
  return false;
}

async function extractLatestImage(cdp, index) {
  // Get the LAST data URL image (newest)
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
  }
  
  const buffer = Buffer.from(base64, 'base64');
  const filename = `vienna-${String(index).padStart(3, '0')}-${Date.now()}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  
  console.log(`  ✓ Saved: ${filename} (${(buffer.length / 1024).toFixed(0)}KB)`);
  return filepath;
}

async function main() {
  const startIndex = parseInt(process.argv[2]) || 25;
  const count = parseInt(process.argv[3]) || 5;
  const promptOffset = parseInt(process.argv[4]) || 0; // Optional: start from this prompt index
  
  console.log(`🎨 Vienna Batch Generator v2`);
  console.log(`   Starting at image #${startIndex}, generating ${count} images, prompt offset ${promptOffset}`);
  console.log(`   Output: ${OUTPUT_DIR}\n`);
  
  const targets = await fetchJSON(`http://127.0.0.1:${CDP_PORT}/json`);
  const aiStudio = targets.find(t => t.url.includes('aistudio.google.com'));
  
  if (!aiStudio) {
    console.error('❌ No AI Studio tab found! Open https://aistudio.google.com/prompts/new_chat');
    process.exit(1);
  }
  
  const cdp = await connectCDP(aiStudio.webSocketDebuggerUrl);
  console.log('✅ Connected to AI Studio\n');
  
  const generated = [];
  
  for (let i = 0; i < count; i++) {
    const promptIdx = (promptOffset + i) % PROMPTS.length;
    const imgIdx = startIndex + i;
    
    console.log(`[${i + 1}/${count}] Image #${imgIdx}`);
    console.log(`  Theme: ${PROMPTS[promptIdx].substring(0, 60)}...`);
    
    try {
      // Navigate to fresh chat
      console.log('  → New chat...');
      await navigateToNewChat(cdp);
      
      // Verify clean state (0 images)
      const beforeCount = await countDataImages(cdp);
      if (beforeCount > 0) {
        console.log(`  ⚠ Found ${beforeCount} existing images, navigating again...`);
        await navigateToNewChat(cdp);
        await sleep(2000);
      }
      
      // Type prompt
      console.log('  → Typing prompt...');
      await typePrompt(cdp, PROMPTS[promptIdx]);
      
      // Click Run
      console.log('  → Running...');
      const runResult = await clickRun(cdp);
      if (runResult !== 'clicked') {
        console.log(`  ⚠ Run button: ${runResult}, retrying...`);
        await sleep(2000);
        await clickRun(cdp);
      }
      
      // Wait for image
      const imgsBefore = await countDataImages(cdp);
      process.stdout.write('  → Waiting');
      const found = await waitForNewImage(cdp, imgsBefore);
      console.log(found ? ' ✓' : ' ✗');
      
      if (!found) {
        console.log('  SKIP - no image generated');
        continue;
      }
      
      // Extract
      console.log('  → Extracting...');
      const filepath = await extractLatestImage(cdp, imgIdx);
      generated.push(filepath);
      
      // Pace ourselves to avoid rate limits (30s between generations)
      if (i < count - 1) {
        console.log('  ⏳ Cooling down 30s...');
        await sleep(30000);
      }
      
    } catch (err) {
      console.error(`  ❌ ERROR: ${err.message}`);
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
