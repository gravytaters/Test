#!/bin/bash
# Starts Good Neighbors Hub Inventory on this Mac and opens it in your browser.
# Leave this window open while you use the app; close it to stop.
cd "$(dirname "$0")"
PORT=8642
URL="http://localhost:$PORT/"
if curl -s -o /dev/null "$URL"; then open "$URL"; exit 0; fi
if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 isn't installed, so the app can't start a local server."
  echo "Opening the app file directly instead (live camera scanning and Install won't be available)."
  open "index.html"; exit 0
fi
echo "Good Neighbors Hub Inventory is running at $URL"
echo "Leave this window open while you use it."
(sleep 1; open "$URL") &
python3 -m http.server "$PORT" --bind 127.0.0.1
