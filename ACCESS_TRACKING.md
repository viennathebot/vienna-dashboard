# Access Tracking Setup

## 1. GitHub Pages (vienna-dashboard)

GitHub Pages doesn't provide access logs, but we have options:

### Option A: GoatCounter (Free, Privacy-Friendly)
```html
<!-- Add to vienna-dashboard/index.html before </body> -->
<script data-goatcounter="https://viennabot.goatcounter.com/count"
        async src="//gc.zgo.at/count.js"></script>
```
- Free for 100k pageviews/month
- No cookies, GDPR compliant
- See who visits: https://viennabot.goatcounter.com

### Option B: Simple Pixel Tracker (DIY)
Use a service like IPLogger or create your own:
```html
<img src="https://iplogger.com/your-tracking-id.gif" style="display:none">
```

### Option C: Cloudflare Analytics (if using custom domain)
- Add site to Cloudflare (free tier)
- Get Web Analytics with visitor IPs, countries, etc.

## 2. Mac Mini Access

### Real-time Monitoring Script
```bash
# Run the access monitor
./scripts/access-monitor.sh
```

### Enable SSH Logging (if SSH is on)
```bash
# Edit /etc/ssh/sshd_config (needs sudo)
LogLevel VERBOSE
```

### Check Login History
```bash
# Recent logins
last -20

# Failed attempts  
log show --predicate 'eventMessage contains "authentication failed"' --last 24h
```

### Install Oversight (Camera/Mic Monitor)
```bash
brew install --cask oversight
```
- Alerts when camera/mic activated
- Shows which app is using them

## 3. Network Intrusion Detection

### Option A: Pi-hole + Logging
If you have a Raspberry Pi:
- Install Pi-hole for DNS-level blocking
- Logs all DNS queries from all devices

### Option B: Router-Level
Most routers have:
- Settings → Logs → Enable logging
- Shows all connection attempts

### Option C: Wireshark (Advanced)
```bash
brew install --cask wireshark
```
- Capture all network traffic
- Analyze suspicious connections

## 4. Automated Alerts

### Daily Security Digest (cron job)
```bash
# Add to crontab: every morning at 6 AM
0 6 * * * /Users/vi/.openclaw/workspace/scripts/access-monitor.sh | mail -s "Vienna Security Digest" your@email.com
```

### Real-time Alerts via Vienna
I can check access logs during heartbeats and alert you on Telegram if anything suspicious.

## Quick Status Check

```bash
# Who's logged in now?
who

# Active network connections
netstat -an | grep ESTABLISHED

# Listening services
lsof -i -P | grep LISTEN

# Recent auth events
log show --predicate 'subsystem == "com.apple.securityd"' --last 1h
```

## Recommended Setup (Priority Order)

1. ✅ LuLu firewall - INSTALLED
2. [ ] GoatCounter for dashboard analytics
3. [ ] Oversight for camera/mic monitoring
4. [ ] Enable verbose SSH logging
5. [ ] Router-level logging
6. [ ] Daily security digest cron
