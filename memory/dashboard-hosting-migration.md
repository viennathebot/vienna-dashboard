# Vienna Dashboard — Hosting Migration Plan

## Current Setup
- **Host:** GitHub Pages (free, public)
- **Repo:** github.com/viennathebot/vienna-dashboard
- **URL:** https://viennathebot.github.io/vienna-dashboard/
- **Auth:** Client-side JavaScript password gate (SHA-256 hashed)
- **Limitation:** JS-only auth — page source/content is still publicly accessible to anyone who disables JS or views source

---

## Platform Comparison

### Cloudflare Pages ✅ RECOMMENDED
| Feature | Detail |
|---------|--------|
| **Ease** | ★★★★★ — Connect GitHub repo, auto-deploys on push |
| **Free Tier** | Unlimited sites, 500 builds/month, unlimited bandwidth |
| **Password Protection** | Cloudflare Access (free for up to 50 users) — server-side, real auth |
| **Custom Domain** | Free, automatic SSL, managed DNS if using Cloudflare |
| **Edge Functions** | Cloudflare Workers (100K free requests/day) |
| **Speed** | Global CDN, 300+ edge locations |

**Why it's best:** Cloudflare Access provides **real server-side auth** on the free tier. Visitors must authenticate through Cloudflare before any content is served. This completely solves the "view source" bypass problem. Zero Trust dashboard makes it easy to manage.

### Vercel
| Feature | Detail |
|---------|--------|
| **Ease** | ★★★★★ — Connect GitHub repo, auto-deploys |
| **Free Tier** | 100GB bandwidth/month, 100 deployments/day |
| **Password Protection** | Vercel Authentication (Pro plan only, $20/mo) OR use middleware + Edge Functions (complex) |
| **Custom Domain** | Free, automatic SSL |
| **Edge Functions** | Yes (Edge Middleware on free tier) |
| **Speed** | Global CDN, fast |

**Downside:** Native password protection requires the **Pro plan ($20/mo)**. You'd need to roll your own middleware-based auth on the free tier, which is more complex than Cloudflare Access.

### Netlify (Honorable Mention)
| Feature | Detail |
|---------|--------|
| **Free Tier** | 100GB bandwidth, 300 build min/month |
| **Password Protection** | Site-wide password (Pro plan, $19/mo) OR role-based (Business plan) |
| **Note** | Free tier has NO server-side password protection |

---

## Recommended: Cloudflare Pages + Access

### Migration Steps

1. **Create Cloudflare Account** (free)
   - Sign up at dash.cloudflare.com

2. **Connect GitHub Repo**
   - Cloudflare Pages → Create Project → Connect to Git
   - Select `viennathebot/vienna-dashboard`
   - Build settings: None needed (static site)
   - Framework: None
   - Output directory: `/` (root)

3. **Deploy**
   - Initial deploy happens automatically
   - URL will be: `vienna-dashboard.pages.dev`

4. **Set Up Cloudflare Access (Password Protection)**
   - Go to Zero Trust → Access → Applications
   - Create Self-Hosted Application
   - Application domain: `vienna-dashboard.pages.dev`
   - Add policy: "Allow" with authentication method
   - Options:
     - **One-Time PIN (OTP):** Users enter email, get a code (simplest)
     - **GitHub OAuth:** Login with GitHub account
     - **Google OAuth:** Login with Google account
     - **Service Token:** Generate a token for API access
   - For simplicity, use OTP with Dr. B's email as the allowed user

5. **Remove Client-Side Auth (Optional)**
   - Once Cloudflare Access is live, the JS password gate becomes redundant
   - Can remove `auth.js` and script tags from HTML files
   - Or keep as defense-in-depth

6. **Custom Domain (Future)**
   - Add domain to Cloudflare (free plan)
   - Point DNS to Cloudflare Pages
   - Update Access policy to include custom domain
   - Example: `dashboard.drb.com` or similar

### Cost Summary
| Component | Cost |
|-----------|------|
| Cloudflare Pages | Free |
| Cloudflare Access (≤50 users) | Free |
| Custom Domain | ~$10-15/year (registration) |
| SSL | Free (automatic) |
| **Total** | **$0/month** (+ domain if desired) |

---

## Timeline
- **Phase 1 (NOW):** JS password gate on GitHub Pages ✅
- **Phase 2 (When ready):** Migrate to Cloudflare Pages + Access
- **Phase 3 (Optional):** Add custom domain

## Notes
- Keep GitHub repo as-is — Cloudflare Pages deploys FROM GitHub
- No need to change git workflow at all
- Rollback is trivial — just re-enable GitHub Pages if needed
- The JS password gate is good enough for now (stops casual visitors, Google indexing)
- Cloudflare Access is the real solution for proper security
