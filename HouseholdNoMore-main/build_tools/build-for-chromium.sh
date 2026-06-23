#!/bin/bash
# Build for Chromium-based browsers (Chrome, Edge, Opera, Brave, Vivaldi)
echo "Building extension for Chromium-based browsers..."
cd ..
mkdir -p build_tools/build/chromium
cp build_tools/manifest-chrome.json manifest.json
zip -r build_tools/build/chromium/netflix-bypass-chromium.zip . \
  --exclude='*.DS_Store*' \
  --exclude='build_tools/*' \
  --exclude='manifest-firefox.json' \
  --exclude='*.git*'
echo "Done. Created build/chromium/netflix-bypass-chromium.zip"
echo ""
echo "Install on any Chromium browser:"
echo "  1. Open the browser and go to chrome://extensions"
echo "  2. Enable Developer mode"
echo "  3. Drag & drop the ZIP file onto the page"
echo "     OR click 'Load unpacked' and select the extension folder"
rm manifest.json
