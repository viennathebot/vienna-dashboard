# Image Generation Workflow

## ✅ WORKING FREE (No Login Required)

### 1. Craiyon (formerly DALL-E Mini) ⭐ BEST FOR OPENCLAW
**URL:** https://www.craiyon.com
**Best for:** Quick concepts, artistic & photo styles, no login needed
**Limitations:** Watermark on free tier, ~512px resolution, public images
**How to use via browser automation:**
1. Navigate to craiyon.com
2. Type prompt in textbox (ref usually e70 or e14)
3. Click "Draw now" button
4. Wait ~20-30 seconds for generation
5. Screenshot the result or click image → Download
**Styles available:** Artistic, Photo, Anime, Illustration, Vector, Raw

## 🔐 REQUIRES LOGIN (Free Tiers Available)

### 2. Leonardo.ai (Best All-Rounder)
**URL:** https://leonardo.ai
**Requires:** Account (free daily tokens that reset)
**Best for:** High quality, consistent detailed images

### 3. Ideogram.ai (Best for Text/Logos)
**URL:** https://ideogram.ai
**Requires:** Google/Apple/Microsoft account
**Best for:** Text rendering in images, logos, posters

### 4. Microsoft Designer / Bing Image Creator (Best Free DALL-E 3)
**URL:** https://www.bing.com/images/create
**Requires:** Microsoft account
**Best for:** DALL-E 3 quality, free daily boosts

### 5. Freepik AI (Best for Speed)
**URL:** https://www.freepik.com/ai/image-generator
**Requires:** Account (free tier with daily limits)
**Best for:** Fast generation, FLUX models, commercial use

### 6. Mage.space (Unlimited Exploration)
**URL:** https://www.mage.space
**Requires:** Login (Google/Twitter/Email)
**Best for:** SDXL, Flux, NSFW-capable, no strict limits

## ❌ CURRENTLY DOWN

### Pollinations.ai
**URL:** https://image.pollinations.ai/prompt/{ENCODED_PROMPT}
**Status:** 502 errors as of Feb 2026
**When working (no login needed):**
```bash
curl -s -L "https://image.pollinations.ai/prompt/YOUR_PROMPT?width=1024&height=1024&nologo=true" -o image.jpg
```

## Paid Services (Require API Keys)

### OpenAI DALL-E
```bash
# Requires OPENAI_API_KEY
curl https://api.openai.com/v1/images/generations \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "dall-e-3", "prompt": "YOUR_PROMPT", "size": "1024x1024"}'
```

### Replicate
```bash
# Requires REPLICATE_API_TOKEN
# FLUX, Stable Diffusion, etc.
```

### Together.ai
```bash
# Requires TOGETHER_API_KEY
# FLUX, Stable Diffusion XL
```

## Recommended Setup

For consistent high-quality image generation, add one of these API keys to your environment:
- `OPENAI_API_KEY` - DALL-E 3 ($0.04-0.08 per image)
- `REPLICATE_API_TOKEN` - Various models (~$0.01 per image)
- `TOGETHER_API_KEY` - FLUX and others (~$0.01 per image)

## Vienna Portrait Prompts

Successful prompts for Vienna's portrait:
- "Vienna, a sophisticated AI executive assistant, elegant professional woman with warm confident expression, subtle smile, modern minimalist office aesthetic, soft dramatic lighting, photorealistic portrait, 8k quality"
- "Elegant AI executive assistant portrait, sophisticated woman with warm confident smile, short stylish dark hair, professional attire in navy blue with burgundy accents, soft holographic heart icon glowing nearby symbolizing cardiology, clean minimalist background, studio lighting, digital art portrait"

---
*Last updated: 2026-02-03*
