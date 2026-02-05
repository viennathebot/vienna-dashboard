#!/bin/bash
# GitHub Health Check Script — Vienna Dashboard
# Runs twice daily to verify GitHub Pages is healthy
# Usage: bash scripts/github-health-check.sh

REPO_URL="https://viennathebot.github.io/vienna-dashboard"
REPO_DIR="/Users/vi/.openclaw/workspace"
LOG_FILE="$REPO_DIR/memory/github-health-$(date +%Y-%m-%d).md"

echo "# GitHub Health Check — $(date '+%Y-%m-%d %H:%M PST')" > "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Check GitHub Pages
echo "## 🌐 GitHub Pages Status" >> "$LOG_FILE"
PAGES=("/" "/todo.html" "/workout.html" "/images/" "/tavr-planning.html" "/surrey-womens-clinic/")
ALL_OK=true

for page in "${PAGES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${REPO_URL}${page}" 2>/dev/null)
  if [ "$STATUS" = "200" ]; then
    echo "- ✅ ${page} — HTTP $STATUS" >> "$LOG_FILE"
  else
    echo "- ❌ ${page} — HTTP $STATUS" >> "$LOG_FILE"
    ALL_OK=false
  fi
done

echo "" >> "$LOG_FILE"

# Git status
echo "## 📦 Repository Status" >> "$LOG_FILE"
cd "$REPO_DIR"
UNCOMMITTED=$(git status --porcelain | wc -l | tr -d ' ')
echo "- Uncommitted changes: $UNCOMMITTED files" >> "$LOG_FILE"

# Repo size
REPO_SIZE=$(du -sh "$REPO_DIR" 2>/dev/null | cut -f1)
GIT_SIZE=$(git count-objects -v 2>/dev/null | grep 'size:' | head -1 | awk '{print $2}')
echo "- Workspace size: $REPO_SIZE" >> "$LOG_FILE"
echo "- Git objects: ${GIT_SIZE} KiB" >> "$LOG_FILE"

# Biggest directories
echo "" >> "$LOG_FILE"
echo "## 📊 Top Directories by Size" >> "$LOG_FILE"
du -sh "$REPO_DIR"/*/ 2>/dev/null | sort -rh | head -10 | while read size dir; do
  dirname=$(basename "$dir")
  echo "- $size — $dirname/" >> "$LOG_FILE"
done

echo "" >> "$LOG_FILE"

# Overall status
if [ "$ALL_OK" = true ] && [ "$UNCOMMITTED" -lt 20 ]; then
  echo "## ✅ OVERALL: HEALTHY" >> "$LOG_FILE"
else
  echo "## ⚠️ OVERALL: NEEDS ATTENTION" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
echo "Last check: $(date '+%Y-%m-%d %H:%M:%S PST')" >> "$LOG_FILE"

cat "$LOG_FILE"
