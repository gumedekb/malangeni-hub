#!/usr/bin/env bash
# Downloads all Malangeni Hub images, renames them, sorts into folders, and zips.
set -e

ROOT="malangeni-images"
rm -rf "$ROOT" "$ROOT.zip"
mkdir -p "$ROOT/home" "$ROOT/explore"

# format: folder|filename|url
IMAGES=(
  "home|library.jpg|https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80"
  "home|study-room.jpg|https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&q=80"
  "home|book-swap.jpg|https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80"
  "home|volunteer-tutors.jpg|https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&q=80"
  "explore|library.jpg|https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80"
  "explore|community-park.jpg|https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80"
  "explore|clinic.jpg|https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80"
  "explore|corner-market.jpg|https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=600&q=80"
  "explore|skills-centre.jpg|https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80"
  "explore|taxi-rank.jpg|https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80"
)

for entry in "${IMAGES[@]}"; do
  IFS='|' read -r folder name url <<< "$entry"
  echo "Downloading $folder/$name ..."
  curl -sSL -o "$ROOT/$folder/$name" "$url"
done

zip -r "$ROOT.zip" "$ROOT" >/dev/null
echo "Done → $ROOT.zip"
