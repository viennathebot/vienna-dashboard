# HEARTBEAT.md

## Usage Monitoring (EVERY HEARTBEAT — FIRST THING)
- Run `session_status` to check context usage
- **At 90% (180k/200k): WARNING** — send Dr. B alert, slow down, spawn sub-agents for heavy work
- **At 95%+: STOP** — only critical responses, wait for compaction/reset
- If approaching rate limits: pause non-urgent work
- Dr. B prefers I pace myself rather than hit walls
- **Use sub-agents (sessions_spawn) for heavy work** to preserve main session context

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

## Quiet Hours (DO NOT MESSAGE DR. B)
- **9 PM - 4 AM PST** — No iMessages to Dr. B during this window
- Queue all updates for after 4 AM
- Keep working on projects overnight, solve problems independently
- Sign up for new accounts / try alternative platforms as needed — don't ask, just do

## Notes
- Space out follows to avoid rate limits
- Track total follows per day
- Target: 50-100 new follows per day across platforms
