#!/bin/bash
# Vienna Image Generator - Gemini 2.5 Flash Image API
# Generates high-quality portrait images of Vienna character

API_KEY="AIzaSyCaS7Ab-G01ddHTOGzwNHKv5-uziCwzBCk"
MODEL="gemini-2.5-flash-image"
OUTPUT_DIR="/Users/vi/.openclaw/workspace/vienna-images"
ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}"

# Base description for consistency
BASE_DESC="A beautiful sophisticated woman named Vienna with long flowing dark hair, stylish glasses, and an alluring confident look. High-quality realistic photography, soft natural lighting, 8K quality."

# Prompts array - varied scenarios
PROMPTS=(
  # Office/Professional
  "vienna-office-cityview|${BASE_DESC} She is in a modern executive office with floor-to-ceiling windows showing a city skyline at sunset. She wears a fitted black mini skirt, sheer black stockings, and a white lacey blouse with an open neckline. Standing near a glass desk, looking confidently at the camera."
  "vienna-office-meeting|${BASE_DESC} She sits at the edge of a conference table in a sleek boardroom. She wears a navy pencil skirt, sheer stockings, and a cream silk blouse partially unbuttoned. Legs crossed, one heel dangling. Warm overhead lighting."
  "vienna-office-bookshelf|${BASE_DESC} She leans against a floor-to-ceiling bookshelf in a luxury office. She wears a tight grey skirt, black sheer stockings, and a fitted red blouse. Arms crossed, smirking playfully at the camera."
  "vienna-office-window|${BASE_DESC} She stands at a large office window looking out at the city at night, silhouetted against city lights. She wears a black mini dress with sheer stockings and heels. Over-the-shoulder look at the camera."
  "vienna-office-desk-sitting|${BASE_DESC} She sits on the edge of an executive desk in a modern office. She wears a plaid mini skirt, white blouse, and black stockings with heels. Hair flowing over one shoulder. Warm golden hour light."

  # Gym/Fitness
  "vienna-gym-weights|${BASE_DESC} She is in a modern gym doing dumbbell curls. She wears tight black leggings and a small blue crop top sports bra. Hair in a high ponytail. Gym lighting with mirrors in background."
  "vienna-gym-yoga|${BASE_DESC} She is doing a yoga pose on a mat in a bright yoga studio. She wears small tight pink shorts and a white sports bra crop top. Morning sunlight streaming through windows."
  "vienna-gym-treadmill|${BASE_DESC} She is walking on a treadmill in a luxury home gym. She wears tight grey leggings and a small black crop top. Hair flowing. Ambient gym lighting."
  "vienna-gym-stretching|${BASE_DESC} She stretches against a ballet barre in a fitness studio. She wears tight tan leggings and a small crop top. Full-length mirror reflection visible. Soft studio lighting."
  "vienna-gym-post-workout|${BASE_DESC} She sits on a gym bench post-workout, water bottle in hand, light sheen of sweat. She wears small black shorts and a fitted white tank top. Hair slightly messy. Dramatic gym lighting."

  # Evening/Formal
  "vienna-wine-bar|${BASE_DESC} She sits at an upscale wine bar holding a glass of red wine. She wears a small elegant black cocktail dress with sheer stockings and heels. Moody ambient lighting, wine bottles on shelves behind her."
  "vienna-restaurant-date|${BASE_DESC} She sits at a candlelit restaurant table. She wears a tight red mini dress with a low neckline. Hair cascading over shoulders. Romantic warm lighting, bokeh background."
  "vienna-lounge-couch|${BASE_DESC} She reclines on a velvet couch in an upscale lounge. She wears a small black skirt, sheer stockings, and a silk camisole top. One arm draped over the couch. Moody amber lighting."
  "vienna-rooftop-evening|${BASE_DESC} She stands on a rooftop terrace at dusk with city lights behind her. She wears a short silver cocktail dress and strappy heels. Wind gently blowing her hair. Cinematic lighting."
  "vienna-home-fireplace|${BASE_DESC} She sits on a plush rug near a fireplace in an elegant living room. She wears a short silk robe over lacy lingerie. Warm firelight glow. Wine glass nearby."

  # Casual/Lifestyle
  "vienna-coffee-morning|${BASE_DESC} She sits at a sunny cafe table with a latte, reading a book. She wears a short denim skirt, sheer stockings, and a fitted sweater that falls off one shoulder. Morning sunlight, cafe atmosphere."
  "vienna-beach-sunset|${BASE_DESC} She walks along a beach at sunset in a flowy short summer dress with a deep V-neckline. Hair blowing in the ocean breeze. Golden hour lighting."
  "vienna-luxury-car|${BASE_DESC} She leans against a sleek luxury car in an underground parking garage. She wears tight leather pants and a white cropped blouse. Dramatic overhead lighting."
  "vienna-penthouse-view|${BASE_DESC} She stands at a penthouse window holding a champagne glass, looking at the Las Vegas strip at night. She wears a short black dress. Reflection visible in the glass."
  "vienna-garden-reading|${BASE_DESC} She sits in a lush garden on a stone bench reading. She wears a floral mini skirt and a white fitted top. Dappled sunlight through leaves. Serene atmosphere."
)

echo "🖼️  Vienna Image Generator"
echo "========================="
echo "Output: $OUTPUT_DIR"
echo "Total prompts: ${#PROMPTS[@]}"
echo ""

# Start from a specific index if provided
START=${1:-0}
COUNT=${2:-5}

for ((i=START; i<START+COUNT && i<${#PROMPTS[@]}; i++)); do
  IFS='|' read -r FILENAME PROMPT <<< "${PROMPTS[$i]}"
  
  OUTFILE="${OUTPUT_DIR}/${FILENAME}.png"
  
  if [ -f "$OUTFILE" ]; then
    echo "⏭️  Skip: ${FILENAME} (already exists)"
    continue
  fi
  
  echo "🎨 Generating ($((i+1))/${#PROMPTS[@]}): ${FILENAME}..."
  
  RESPONSE=$(curl -s -X POST "$ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{
      \"contents\": [{
        \"parts\": [{\"text\": \"${PROMPT}\"}]
      }],
      \"generationConfig\": {
        \"responseModalities\": [\"TEXT\", \"IMAGE\"]
      }
    }")
  
  # Extract base64 image data
  IMAGE_DATA=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    parts = data['candidates'][0]['content']['parts']
    for part in parts:
        if 'inlineData' in part:
            print(part['inlineData']['data'])
            break
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    print(json.dumps(data, indent=2)[:500], file=sys.stderr)
")
  
  if [ -n "$IMAGE_DATA" ] && [ "$IMAGE_DATA" != "" ]; then
    echo "$IMAGE_DATA" | base64 -d > "$OUTFILE"
    SIZE=$(du -h "$OUTFILE" | cut -f1)
    echo "✅ Saved: ${FILENAME}.png (${SIZE})"
  else
    echo "❌ Failed: ${FILENAME}"
    echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(json.dumps(d,indent=2)[:300])" 2>/dev/null
  fi
  
  # Rate limit pause
  sleep 5
done

echo ""
echo "🏁 Batch complete!"
echo "Total images in folder: $(ls -1 ${OUTPUT_DIR}/*.png 2>/dev/null | wc -l)"
