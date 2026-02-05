# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

---

## Google Drive

### Vienna's Drive (viennathebot@gmail.com)
- **Storage:** 37.2 MB of 15 GB used
- **Access:** Via browser automation (openclaw profile)
- **Use for:** Storing Vienna's files, backups, image gallery

### Shared "Vi" Folder (from Dr. B)
- **Location:** Shared with me → Vi
- **Purpose:** Upload completed work for Dr. B to access
- **Status:** Empty (ready for uploads)

---

## AI Image Generators

### Nano Banana (Primary - FREE)
- **What:** Google Gemini's image generator (Gemini 2.5 Flash Image)
- **Access:** 
  - Playground AI (has Nano Banana model built-in)
  - Gemini: https://gemini.google.com
  - AI Studio: https://aistudio.google.com/models/gemini-2-5-flash-image
- **Free tier:** 1,000 edits/month on Playground
- **Features:** Consistent characters, photo editing, style blending, chat-based editing
- **Best for:** High-quality realistic images

### Ideogram (@viennathebot account)
- **Status:** 0 credits (resets in 2 days)
- **Quality:** Excellent

### Craiyon
- **Status:** Unlimited, no account needed
- **Quality:** Good, fast

### Playground AI (@Vienna account)
- **Status:** Logged in, working
- **Models:** Nano Banana, Nano Banana Pro, GPT-4o, Seedream

---

## Accounts

| Service | Email/Username | Notes |
|---------|----------------|-------|
| Gmail | viennathebot@gmail.com | Primary email |
| GitHub | viennathebot | Token expires Mar 4, 2026 |
| Twilio | viennathebot@gmail.com | Phone: +1 (702) 820-1936 |
| Ideogram | viennathebot (Google) | Free tier |
| Playground | Vienna | Free tier |
| X/Twitter | Vienna ✦ (@viennathebot) | Active, rebranded |
| LinkedIn | Vienna Hart | New account, no pic yet |

---

## Phone Numbers

- **Vienna's Twilio:** +1 (702) 820-1936
- **Dr. B's iMessage:** +15854347097

---

## Network

- **Local IP:** 192.168.50.154
- **Tailscale IP:** 100.106.7.23
- **HTTP Server:** Port 8080 (workspace)
- **Case Logger API:** Port 3847 (when running)

---

## Crash Recovery

If Vienna wakes up "blank" (no personality):
```bash
cp ~/.openclaw/agents/main/agent/*.md ~/.openclaw/workspace/
npx openclaw gateway restart
```

---

Add whatever helps you do your job. This is your cheat sheet.

---

## Leonardo AI (@viennathebot)
- **URL:** https://app.leonardo.ai
- **Account:** viennathebot@gmail.com (Google OAuth)
- **Free Tier:** 150 tokens/day
- **Status:** Active, logged in
- **Models:** Phoenix (portraits), PhotoReal (ultra-detail)
- **Best for:** Volume generation, photorealistic portraits

## Recraft AI (@viennathebot)
- **URL:** https://www.recraft.ai
- **Account:** viennathebot@gmail.com (Google OAuth)
- **Free Tier:** 60 credits/day (2 images per generation = 1 credit each)
- **Status:** Active, logged in, working!
- **Image DL:** Only 300px thumbnails on free tier (paid = full res)
- **Content Filter:** PERMISSIVE — allows thigh-highs, short skirts, cocktails (what Leonardo blocks!)
- **Best for:** Edgier prompts that other platforms filter out

## Mage.space (@viennathebot)
- **URL:** https://www.mage.space
- **Account:** viennathebot@gmail.com (Google OAuth)  
- **Free Tier:** Unlimited (unverified = blurred suggestive content)
- **Status:** Active, needs verification for full access
- **Models:** Z-Image Turbo, Mango, FLUX, SDXL
- **Note:** Account verification needed for non-blurred suggestive images
