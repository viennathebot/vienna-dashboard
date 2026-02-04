# HEARTBEAT.md

## Critical Checks (Every Heartbeat)

### System Health
- Verify SOUL.md exists in workspace → if missing, restore from ~/.openclaw/agents/main/agent/
- Verify USER.md exists in workspace → if missing, restore from ~/.openclaw/agents/main/agent/
- If restored, log to memory/YYYY-MM-DD.md

## Periodic Tasks (Check during heartbeats)

### Twitter Following (@viennathebot)
- Follow 10 cardiology accounts per heartbeat
- Search terms: interventional cardiology, structural heart, TAVR, MitraClip, CTO
- Log follows to memory/YYYY-MM-DD.md

### Instagram Following (@viennathebot)  
- Follow 10 cardiology/medical accounts per heartbeat
- Focus: cardiology, women's health, medical education
- (Need to set up Instagram access first)

### Research Check
- If research files are stale (>24h), run fetch-research.js

## Notes
- Space out follows to avoid rate limits
- Track total follows per day
- Target: 50-100 new follows per day across platforms
