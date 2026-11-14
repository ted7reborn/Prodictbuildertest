#!/usr/bin/env bash
# 원고 생성 → 이미지 생성 → 드라이브 업로드를 한 번에
# Usage: scripts/make_post.sh content/ampoules/03_ceramide.json "No.03_セラミドショット"
set -euo pipefail
json="$1"; folder="$2"
slug="$(basename "$json" .json)"
out="output/posts/$slug"
node scripts/build_post.js "$json" "$out"
node scripts/render_cards.js "$json" "$out/images"
node scripts/upload_to_drive.js "$out" "$folder"
