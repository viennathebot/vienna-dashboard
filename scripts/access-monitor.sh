#!/bin/bash
# Vienna Access Monitor - Track login attempts, SSH, screen sharing

echo "=== Mac Mini Access Report ==="
echo "Generated: $(date)"
echo ""

# Failed login attempts (last 24h)
echo "### Failed Login Attempts (24h) ###"
log show --predicate 'eventMessage contains "authentication" AND eventMessage contains "failed"' --style compact --last 24h 2>/dev/null | tail -20

echo ""
echo "### Successful Logins (24h) ###"
log show --predicate 'process == "loginwindow" OR process == "screensharingd" OR process == "sshd"' --style compact --last 24h 2>/dev/null | grep -i "auth\|login\|accept" | tail -20

echo ""
echo "### SSH Connection Attempts ###"
log show --predicate 'process == "sshd"' --style compact --last 24h 2>/dev/null | tail -20

echo ""
echo "### Screen Sharing Sessions ###"
log show --predicate 'process == "screensharingd"' --style compact --last 24h 2>/dev/null | tail -10

echo ""
echo "### Current Network Connections ###"
netstat -an | grep ESTABLISHED | head -20

echo ""
echo "### Listening Ports ###"
lsof -i -P | grep LISTEN | head -20
