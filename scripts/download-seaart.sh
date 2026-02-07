#!/bin/bash
# Download SeaArt Vienna images

cd /Users/vi/.openclaw/workspace/images

# Image IDs from SeaArt Vienna account (from today's generation)
declare -a IMAGE_IDS=(
    "d63k3v5e878c73e8jc7g"
    "d63k3v5e878c73e8jc70"
    "d63k3v5e878c73e8jc8g"
    "d63k3v5e878c73e8jc80"
    "d63k3jte878c73co3c40"
    "d63k3jte878c73co3c30"
    "d63k3jte878c73co3c4g"
    "d63k3jte878c73co3c3g"
    "d63k0sde878c738fcnhg"
    "d63k0sde878c738fcnig"
    "d63k0sde878c738fcnh0"
    "d63k0sde878c738fcni0"
    "d63jqjle878c73e8c9ig"
    "d63jqjle878c73e8c9i0"
)

count=1
for id in "${IMAGE_IDS[@]}"; do
    echo "Downloading image $count/14: $id"
    # Try to fetch the page and extract the high-res image URL
    # SeaArt uses format: https://image.cdn2.seaart.me/2026-02-07/{id}/{hash}_high.webp
    curl -sL "https://www.seaart.ai/api/v1/artwork/$id" -H "User-Agent: Mozilla/5.0" | \
        grep -oE 'https://image\.cdn2\.seaart\.me[^"]+_high\.(webp|png|jpg)' | head -1 | \
        xargs -I {} curl -sL {} -o "seaart-vienna-$(printf '%03d' $count).webp"
    
    ((count++))
    sleep 1
done

echo "Download complete. Files saved to $(pwd)"
ls -la seaart-vienna-*.webp 2>/dev/null || echo "Note: Some downloads may have failed"
