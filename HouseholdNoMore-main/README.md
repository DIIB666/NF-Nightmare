# NF Nightmare 🚫

> Break free from Netflix household locks.

A browser extension that bypasses Netflix household verification prompts using multiple strategies.

**Supported browsers:** `Chrome` | `Edge` | `Opera` | `Brave` | `Vivaldi` | `Firefox` | `Kiwi Browser (Android)`

---

## Features

| # | Technique | Target | Description |
|---|-----------|--------|-------------|
| 1 | GraphQL Blocking | `/watch` | Blocks household verification API calls |
| 2 | Modal Hiding | `/browse` | Reactively removes verification popup |
| 3 | Periodic Hunter | all pages | Scans every 2s for modals (60s window) |
| 4 | Storage Cleanup | all pages | Clears household localStorage/sessionStorage keys |
| 5 | Cookie Cleanup | all pages | Removes household tracking cookies |
| 6 | Header Spoofing | `/watch` | Injects verification headers into GraphQL requests |
| 7 | Auto Skip Intro | `/watch` | Skips intros/recaps/credits and next episode |

---

## Install

### Desktop Chromium (Chrome, Edge, Opera, Brave, Vivaldi)
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the extension folder

### Android (Kiwi Browser)
1. Install **Kiwi Browser** from Google Play Store
2. Open Kiwi, go to `chrome://extensions`
3. Enable **Developer mode** (toggle top right)
4. Click **Load unpacked** → select the extension folder
5. Done! Extension works on Netflix Android

### Firefox (Desktop + Android)
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on** → select `manifest.json`

---

## Build

```bash
# Chromium (Chrome, Edge, Opera, Brave)
bash build_tools/build-for-chromium.sh

# Firefox
bash build_tools/build-for-firefox.sh
```

---

## Disclaimer

Not affiliated with Netflix. Use at your own risk.

---

## License

© DIIB666 — All Rights Reserved.
