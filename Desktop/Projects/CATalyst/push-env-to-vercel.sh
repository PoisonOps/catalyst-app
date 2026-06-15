#!/bin/bash
# Reads .env and pushes every variable to Vercel (Production environment).
# Run once: bash push-env-to-vercel.sh

set -e

if [ ! -f .env ]; then
  echo "❌ .env file not found. Run from the CATalyst directory."
  exit 1
fi

echo "Pushing .env vars to Vercel (Production)..."

while IFS= read -r line || [ -n "$line" ]; do
  # Skip blank lines and comments
  [[ -z "$line" || "$line" == \#* ]] && continue

  KEY="${line%%=*}"
  VALUE="${line#*=}"

  # Skip placeholder values
  if [[ "$VALUE" == *"PASTE_YOUR"* ]]; then
    echo "⚠️  Skipping $KEY — replace the placeholder value in .env first"
    continue
  fi

  echo "  Adding $KEY..."
  echo "$VALUE" | vercel env add "$KEY" production --force 2>/dev/null \
    && echo "  ✅ $KEY added" \
    || echo "  ⚠️  $KEY may already exist — update it manually in Vercel dashboard if needed"

done < .env

echo ""
echo "Done. Run 'vercel env ls' to verify."
