# 📌 How I Built PinTube: A Chrome Extension to Pin YouTube Videos & Curate a Focus Feed

*Take back control of your YouTube experience with video pinning, focus mode, and Shorts removal — built with Manifest V3.*

---

## The Problem: The Infinite Feed Trap

We’ve all been there: you open YouTube to watch a specific tutorial or lecture, but before you can even click search, the algorithm bombards your homepage with addictive recommendations. 

Even worse, when you spot a great 30-minute video you want to watch later, you either:
- Open it in a new tab (adding to your 50 open tabs),
- Save it to a bloated "Watch Later" playlist you'll never open again, or
- Lose it forever when the feed refreshes.

I wanted a simpler, more intentional way to use YouTube: **What if you could pin videos directly to the top of your YouTube homepage just like pinned posts on Twitter/X or pinned tabs in Chrome?**

That’s why I built **PinTube**.

---

## What is PinTube?

**PinTube** is an open-source, privacy-first Google Chrome extension (Manifest V3) that transforms YouTube into a personal, distraction-free productivity space.

### ✨ Core Features

1. **📌 Pin Any Video Everywhere**: Hover over any video thumbnail across YouTube (Home feed, Search Results, or Recommendations) and click the **Pin** button. 
2. **📺 Dedicated Watch Page Pin Button**: Watching a great video? Click the native-styled **📌 Pin / Pinned** button placed right next to the Subscribe button on `/watch` pages.
3. **🏠 Homepage Pinned Shelf**: Your pinned videos sit in a clean, collapsible grid shelf at the very top of YouTube’s homepage.
4. **🎯 Focus Mode**: Toggle Focus Mode ON to hide the endless recommendation feed, topic filter chips, and sidebars. Only your **Pinned Videos shelf** and the top Search Bar remain active.
5. **🚫 Shorts Remover**: Cleanly hide Shorts shelves, recommendation reels, and left drawer navigation tabs across YouTube in real time.
6. **🎬 Auto Theater Mode**: Automatically switches video watch pages into Theater Mode and removes annoying end-screen video popups when playback finishes.

---

## 🛠️ The Engineering Behind PinTube

Building a Chrome extension on top of a dynamic Single Page Application (SPA) like YouTube comes with unique web performance and DOM engineering challenges. Here’s how I solved them:

### 1. 60fps Viewport Sync for Autoplay Preview (RAF Sync)
YouTube’s homepage uses `ytd-inline-preview-renderer` for video autoplay previews. This overlay has a custom stacking context that covers DOM-injected buttons inside thumbnails.

To solve this without z-index battles or DOM layout breaks, PinTube uses a root-level `position: fixed` overlay combined with **`requestAnimationFrame` (RAF) position syncing**:
- The button renders on `document.body` in the root stacking context (immune to YouTube’s internal iframes).
- On hover, a 60fps RAF loop continuously locks the button's viewport coordinates (`left`/`top`) to `getBoundingClientRect()` of the target thumbnail.
- When the mouse leaves or scroll occurs, position sync remains pixel-perfect without scroll drift.

### 2. Clean Modular Architecture (Manifest V3)
Instead of a monolithic 1000-line script, PinTube uses a clean modular content script architecture:
```
content/modules/
├── state.js         # Shared mutable state & SVG constants
├── metadata.js      # Video metadata & channel extraction
├── overlay.js       # RAF-synced floating overlay & hover tracker
├── watch-pin.js     # Watch page pin button (injected next to Subscribe)
├── pin-actions.js   # Pin/unpin state & storage handlers
├── shelf.js         # Homepage Pinned Videos shelf renderer
├── scanner.js       # DOM scanner & Shorts element tagging
├── observer.js      # DOM MutationObserver & SPA navigation
├── focus-mode.css   # Focus Mode & Hide Shorts rules
├── endscreen.css    # End-screen overlay hiding rules
├── watch-pin.css    # Watch page pin button styles
└── shelf.css        # Pinned shelf & card styles
```

### 3. Light & Dark Theme Responsiveness
PinTube dynamically detects YouTube’s active theme using CSS custom properties (`var(--yt-spec-text-primary)`). It smoothly transitions contrast, text colors, and glassmorphic card backgrounds whether you use YouTube in Light Mode or Dark Mode.

---

## 🔒 100% Private & Open Source

PinTube requires **zero login, zero external API keys, and has zero tracking**. 
All your pinned videos and settings are stored locally in your browser via `chrome.storage.sync`.

---

## 🚀 How to Try PinTube

You can download and run PinTube today:

1. **GitHub Releases**: Download `pintube-extension.zip` from the [PinTube GitHub Releases](https://github.com/nidsnitesh/Pintube/releases).
2. **Installation**:
   - Extract the `.zip` file.
   - Open Chrome and navigate to `chrome://extensions`.
   - Enable **Developer mode** (top-right toggle).
   - Click **Load unpacked** (top-left) and select the unzipped `pintube` directory.

---

## ⭐️ Join the Project!

PinTube is 100% open-source! Check out the code, star the repository, or open a Pull Request:

👉 **GitHub Repository**: [https://github.com/nidsnitesh/Pintube](https://github.com/nidsnitesh/Pintube)

If you have feature suggestions or feedback, feel free to drop a comment or open an issue on GitHub!
