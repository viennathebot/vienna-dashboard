# GitHub Space Audit — Feb 5, 2026

## Current Usage
- **Workspace total:** 510 MB
- **Git objects:** ~80 MB
- **GitHub Pages site:** All pages returning HTTP 200 ✅

## Breakdown by Directory
| Directory | Size | Notes |
|-----------|------|-------|
| vienna-dashboard/ | 177 MB | Duplicate of main repo content — could clean |
| projects/ | 62 MB | STEMI, case-logger, research, twitter |
| images/ | 59 MB | Dashboard image assets |
| vienna-images/ | 47 MB | AI-generated Vienna images |
| schedule/ | 14 MB | Schedule data |
| tools/ | 7.6 MB | CLI tools |
| tavr-cases/ | 6.3 MB | TAVR planning data |
| japan-trip/ | 648 KB | Itinerary |
| scripts/ | 212 KB | Automation scripts |
| surrey-womens-clinic/ | NEW | Instagram project |

## GitHub Limits
| Limit | Value | Our Status |
|-------|-------|------------|
| Recommended repo size | < 1 GB | 510 MB ✅ (51%) |
| Hard repo limit | 5 GB | Well under |
| Pages site size | 1 GB | ~500 MB ✅ |
| Individual file limit | 100 MB | All under |
| LFS storage (free) | 1 GB | Not using LFS |

## Recommendations
1. **vienna-dashboard/** (177 MB) appears to be a duplicate — investigate if it can be removed
2. **Images growing fast** — if we hit 150 AI images at ~2MB each = ~300MB total
3. **Consider Git LFS** for images if repo exceeds 800MB
4. **Alternative for images:** Use Google Drive shared "Vi" folder or separate `vienna-images` repo
5. **Current trajectory:** At ~510MB, we have headroom for 50% more growth

## Verdict: ✅ HEALTHY — No immediate action needed
Watch image growth. Consider cleanup of vienna-dashboard/ duplicate.
