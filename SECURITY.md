# Vienna Security Hardening

*Last updated: 2026-02-07*

## Current Protections

### ✅ Active Now
1. **Cisco AI Skill Scanner** - Installed at `~/.openclaw/skill-scanner-env/`
   - Static analysis (YARA rules)
   - Behavioral dataflow analysis
   - Weekly cron scan (Sundays 10 AM)

2. **OpenClaw Allowlists**
   - Telegram: Only Dr. B's ID (8521726021) allowed
   - iMessage: Pairing mode (requires approval)
   - Group chats: Allowlist only

3. **macOS Keychain** - API keys stored securely, not in config files

4. **Workspace Isolation** - All work in `/Users/vi/.openclaw/workspace/`

5. **Memory Segmentation** - MEMORY.md only loads in main session, not shared contexts

### 🔧 To Enable (Need API Keys)

| Feature | What It Does | Needed |
|---------|--------------|--------|
| **LLM Analysis** | AI reviews code semantics for hidden threats | `ANTHROPIC_API_KEY` env var |
| **VirusTotal** | Scans binaries for malware | Free VT API key |
| **Meta-Analyzer** | Filters false positives intelligently | Same as LLM key |

## Recommended Additional Measures

### 1. 🔐 Network Monitoring
```bash
# Install Little Snitch or LuLu (free)
brew install --cask lulu
```
- Alerts on any unexpected outbound connections
- Block skills from phoning home

### 2. 🛡️ Skill Sandboxing
- Run untrusted skills in Docker containers
- Limit filesystem access to specific directories

### 3. 📝 Git Pre-Commit Hook
```bash
# Auto-scan skills before committing
skill-scanner-pre-commit
```

### 4. 🔄 Automated Scans
Current cron job (Sundays 10 AM):
```
skill-scanner scan-all /Users/vi/.openclaw/workspace/skills --use-behavioral
```

Upgrade to full scan with LLM:
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
skill-scanner scan-all /path/to/skills --use-behavioral --use-llm --use-trigger --enable-meta
```

### 5. 🚨 VirusTotal Binary Scanning
```bash
# Get free API key from: https://www.virustotal.com/gui/join-us
export VIRUSTOTAL_API_KEY="your-key"
skill-scanner scan /path/to/skill --use-virustotal
```

### 6. 🔒 Principle of Least Privilege
- [ ] Audit which skills have network access
- [ ] Remove unused skills
- [ ] Review skills that read environment variables

### 7. 🕵️ Prompt Injection Defense
Vienna's built-in protections:
- System prompt priority over user input
- Memory files only in trusted sessions
- No external instruction execution
- Sensitive data not exposed to untrusted contexts

### 8. 📊 Audit Logging
Enable verbose logging:
```bash
openclaw gateway logs --level debug
```

## Scan Results Summary

### Workspace Skills (29 scanned)
- **Safe:** 28
- **Unsafe:** 1 (home-assistant - false positives in docs)
- **Findings:** 6 CRITICAL, 14 MEDIUM, 29 INFO

### Built-in Skills (50 scanned)  
- **Safe:** 49
- **Unsafe:** 1
- **Findings:** 5 CRITICAL, 1 HIGH, 8 MEDIUM, 50 INFO

### Action Items
1. [ ] Get VirusTotal API key (free)
2. [ ] Set up ANTHROPIC_API_KEY for full LLM scans
3. [ ] Install LuLu firewall
4. [ ] Review home-assistant skill docs (false positives)
5. [ ] Enable pre-commit hooks for skill changes

## Quick Commands

```bash
# Activate scanner
source ~/.openclaw/skill-scanner-env/bin/activate

# Quick scan single skill
skill-scanner scan /path/to/skill

# Full scan with everything
ANTHROPIC_API_KEY="..." skill-scanner scan-all ./skills \
  --use-behavioral --use-llm --use-virustotal --enable-meta \
  --yara-mode strict --format json -o scan-report.json

# List all analyzers
skill-scanner list-analyzers
```
