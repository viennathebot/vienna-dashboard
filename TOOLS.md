# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

---

## Security & Monitoring

### GoatCounter (Dashboard Analytics)
- **URL:** https://viennabot.goatcounter.com
- **Account:** viennathebot@gmail.com
- **Password:** Vienna2026!Secure
- **Tracks:** Vienna dashboard visitor IPs, countries, pages, timestamps
- **Status:** Active, needs email verification

### LuLu Firewall
- **Location:** /Applications/LuLu.app
- **Status:** Installed, needs System Extension approval
- **Purpose:** Alerts on outbound connections

### Cisco AI Skill Scanner
- **Location:** ~/.openclaw/skill-scanner-env/
- **Command:** `skill-scanner scan /path/to/skill`
- **Cron:** Weekly Sundays 10 AM PST

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
| Tuta Mail | vienna3bot@tutamail.com | Password: Vienna2026!Secure, Recovery: 509d 63bf... |
| Gmail | viennathebot@gmail.com | Primary email |
| GitHub | viennathebot | Token expires Mar 4, 2026 |
| Twilio | viennathebot@gmail.com | Phone: +1 (702) 820-1936 |
| Telegram Bot | @ViennaBotAssistant | Token: 8424456261:AAF... |
| Ideogram | viennathebot (Google) | Free tier |
| Playground | Vienna | Free tier |
| X/Twitter | Vienna ✦ (@viennathebot) | Active, rebranded |
| LinkedIn | Vienna Hart | New account, no pic yet |
| ElevenLabs | Vienna (Google OAuth) | 10k credits/mo, Free tier |

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

## Recraft AI (@viennathebot - Account 1)
- **URL:** https://www.recraft.ai
- **Account:** viennathebot@gmail.com (Google OAuth)
- **Free Tier:** 30 credits/day
- **Status:** Active, working!
- **Image DL:** Only 300px thumbnails on free tier (paid = full res)
- **Content Filter:** PERMISSIVE — allows thigh-highs, short skirts, cocktails (what Leonardo blocks!)
- **Best for:** Edgier prompts that other platforms filter out

## Recraft AI (@vienna3bot - Account 2)
- **URL:** https://www.recraft.ai
- **Account:** vienna3bot@tutamail.com (email verification)
- **Password:** Vienna2026!Secure (same as Tuta)
- **Free Tier:** 30 credits/day
- **Status:** NEW (created 2026-02-07), 60 credits (welcome bonus)
- **Use for:** Backup when Account 1 runs out of credits

## Mage.space (@viennathebot)
- **URL:** https://www.mage.space
- **Account:** viennathebot@gmail.com (Google OAuth)  
- **Free Tier:** Unlimited (unverified = blurred suggestive content)
- **Status:** Active, needs verification for full access
- **Models:** Z-Image Turbo, Mango, FLUX, SDXL
- **Note:** Account verification needed for non-blurred suggestive images

## ElevenLabs (@Vienna)
- **URL:** https://elevenlabs.io/app
- **Account:** viennathebot@gmail.com (Google OAuth)
- **Platform:** Creative Platform
- **Plan:** Free ($0/forever)
- **Status:** Active (set up Feb 7, 2026)
- **Credits:** 10,000/month (resets ~9th of each month)

### Free Tier Limits:
- **Text to Speech:** ~10 min (high quality) or ~20 min (turbo/flash)
- **Voice Changer:** 10 min
- **Custom Voices:** 3 slots (0/3 used)
- **Studio Projects:** 3
- **Music:** 11 min
- **Sound Effects:** 250 seconds
- **Voice Isolation:** 10 min
- **Images:** Up to 40
- **Audio Quality:** 128 kbps, 44.1kHz
- **Concurrency:** 2 simultaneous requests

### Available Voices:
- 10,000+ community voices in Voice Library
- Default voice: Rachel
- Trending: Jon, Michael C. Vincent, Riley, Theo Silk
- 70+ languages supported
- Iconic voices: Michael Caine, Burt Reynolds, James Dean, Judy Garland

### Limitations (Free):
- ❌ No commercial license
- ❌ No instant voice cloning
- ❌ No professional voice cloning

## SeaArt AI (@Vienna)
- **URL:** https://www.seaart.ai
- **Account:** viennathebot@gmail.com (Google OAuth)
- **Free Tier:** 120 stamina/day (5 stamina per image = ~24 images/day)
- **Status:** Active, 14 images generated
- **Intimate prompts:** ✅ ALLOWED (lingerie, silk robes, etc.)
- **Download issue:** Free tier doesn't save locally — images in account history
- **Best for:** Intimate Vienna gallery images
