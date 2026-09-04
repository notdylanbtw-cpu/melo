#!/bin/sh
set -eu
cd /workspace
if [ -f /workspace/.secrets/elevenlabs ]; then
  ELEVENLABS_API_KEY=$(tr -d '\n' < /workspace/.secrets/elevenlabs)
  export ELEVENLABS_API_KEY
fi
if [ -f /workspace/.data/elevenlabs.json ]; then
  ELEVENLABS_VOICE_ID=$(python3 -c 'import json; print(json.load(open("/workspace/.data/elevenlabs.json")).get("voiceId") or "")')
  export ELEVENLABS_VOICE_ID
fi
if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev > /tmp/melo-dev.log 2>&1 &
i=1
while [ "$i" -le 40 ]; do
  if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
    exit 0
  fi
  i=$((i + 1))
  sleep 0.5
done
exit 0
