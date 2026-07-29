# 📌 How I Built PinTube: A Chrome Extension to Pin YouTube Videos & Curate a Focus Feed

*Take back control of your YouTube experience with video pinning, focus mode, and Shorts removal — built with Manifest V3.*

---

## 🧠 The Motivation: Escaping YouTube’s Infinite Feed Trap

YouTube is an unmatched repository of human knowledge. From deep-dive software architecture lectures and MIT coursework to music production tutorials, almost everything you want to learn is available for free.

However, YouTube's interface is engineered for a very different purpose: **maximizing watch time through endless algorithmic recommendations.**

We’ve all experienced this workflow:
1. You open YouTube intending to search for a specific tutorial or coding concept.
2. Before your fingers even reach the search bar, the homepage grid bombards you with 12 high-dopamine thumbnails designed to hijack your attention.
3. You spot a genuinely interesting 40-minute documentary or lecture you *actually* want to watch later.
4. You either:
   - **Open it in a new tab** (adding to your collection of 60 open tabs that slow down your browser),
   - **Save it to a Watch Later playlist** (a black hole where videos go to be forgotten forever), or
   - **Do nothing** and lose track of it when the page refreshes.

I wanted a simpler, more intentional way to use YouTube. I asked myself a basic design question: 

> **What if you could pin videos directly to the top of your YouTube homepage — just like pinned tweets on Twitter/X or pinned tabs in Chrome?**

That idea led me to build **PinTube**.

---

## 🛠️ What is PinTube?

**PinTube** is an open-source, privacy-first Google Chrome extension built with Manifest V3. It transforms YouTube into a personal, distraction-free productivity space by allowing you to pin videos, hide algorithmic feeds, and remove short-form video traps.

![PinTube Architecture](https://raw.githubusercontent.com/nidsnitesh/Pintube/main/icons/icon128.png)

### ✨ Core Features Walkthrough

#### 1. 📌 Pin Videos Anywhere on YouTube
Whether you're browsing the homepage, scrolling through search results (`/results`), or checking recommendation sidebars, hovering over any video thumbnail reveals an instant **📌 Pin** button at the top-left corner. 
- Pinned videos update visual state dynamically across all open tabs.
- Clicking **Unpin** removes the video instantly.

#### 2. 📺 Dedicated Watch Page Pin Button
When watching a video on `/watch?v=...`, you don't need to hover over thumbnails. PinTube injects a native-styled **📌 Pin / Pinned** pill button directly onto YouTube’s action bar — positioned right next to the **Subscribe** button.

#### 3. 🏠 Custom Homepage Pinned Shelf
When you visit YouTube’s homepage, PinTube injects a clean, collapsible **📌 Pinned Videos** grid shelf at the very top of your feed:
- Shows full metadata including thumbnail, video title, channel name, and exact video duration.
- Includes a **Hide / Show** toggle button to collapse the shelf whenever you want a completely clean screen.
- Displays an empty state banner with usage hints when 0 videos are pinned.

#### 4. 🎯 Focus Mode (Intentional YouTube)
Toggle **Focus Mode ON** from the PinTube Chrome popup to turn off YouTube’s algorithm:
- Hides the endless homepage recommendation grid — **only your Pinned Videos shelf is displayed**.
- Hides topic filter chips (*"All"*, *"Music"*, *"Live"*, etc.), left navigation sidebars, and watch page recommendation columns.
- Keeps the **top Search Bar 100% active** so you only watch what you intentionally search for.

#### 5. 🚫 Real-time Shorts Remover
Short-form content is one of the biggest attention traps on the web. Toggle **Hide Shorts ON** to cleanly eliminate:
- Homepage Shorts section rows.
- Search result Shorts shelves (`ytd-reel-shelf-renderer` & `yt-lockup-view-model`).
- Left navigation drawer Shorts tabs (`#guide` and `#mini-guide`).

#### 6. 🎬 Auto Theater Mode & Clean Endscreen
Runs automatically on video watch pages:
- Automatically switches videos into **Theater Mode** for an immersive viewing experience.
- Suppresses end-screen recommendation tiles and video wall popups when playback completes.

---

## 🔬 Engineering & Architecture Deep Dive

Building a Chrome extension for a dynamic Single Page Application (SPA) like YouTube presents severe DOM mutation, web performance, and CSS stacking context challenges. Here is how PinTube solves them:

### 1. Solving the Autoplay Iframe Stacking Context (RAF 60fps Position Sync)

YouTube’s homepage uses `ytd-inline-preview-renderer` for inline video previews on hover. When autoplay triggers, YouTube creates a new web component with a high z-index and iframe video player that covers any DOM elements injected inside the thumbnail.

If you inject buttons inside the thumbnail DOM (`ytd-thumbnail`), YouTube’s preview renderer paints over them. If you use standard `position: fixed` CSS on `document.body`, the button drifts during page scroll because scroll events in YouTube occur inside inner custom scrollers (`ytd-app`).

#### The Solution:
PinTube uses a root-level `position: fixed` overlay mounted directly on `document.body` (giving it root stacking context above all YouTube elements), combined with a **`requestAnimationFrame` (RAF) 60fps position loop**:

```javascript
// Floating Overlay Position Sync Loop (modules/overlay.js)
function syncOverlayPosition() {
  if (!activeCard || !floatingOverlay) return;
  const rect = (activeThumb || activeCard).getBoundingClientRect();
  floatingOverlay.style.setProperty('left', (rect.left + 8) + 'px', 'important');
  floatingOverlay.style.setProperty('top',  (rect.top  + 8) + 'px', 'important');
}

function startRAFSync() {
  if (rafId) cancelAnimationFrame(rafId);
  (function loop() {
    if (!activeCard) { rafId = null; return; }
    syncOverlayPosition();
    rafId = requestAnimationFrame(loop);
  })();
}
```

- **Root Stacking Context**: Being on `document.body`, the button is never covered by inline preview iframes.
- **Pixel-Perfect Scroll Locking**: The 60fps RAF loop queries `getBoundingClientRect()` live, keeping the overlay locked to the thumbnail's top-left corner during any scroll action with zero drift.

---

### 2. Clean Manifest V3 Modular Architecture

Rather than maintaining a monolithic 1500-line content script, PinTube uses a clean modular structure where each file handles a single responsibility:

```
pintube/
├── manifest.json            # Extension configuration (Manifest V3)
├── background/
│   └── service-worker.js    # Service worker
├── popup/
│   ├── popup.html           # Popup UI
│   ├── popup.css            # Popup styling
│   └── popup.js             # Toggle states & storage sync
└── content/
    └── modules/             # Modular content scripts & styles
        ├── state.js         # Shared mutable state & SVG icons
        ├── metadata.js      # Video metadata & channel extraction
        ├── overlay.js       # RAF-synced floating overlay & hover tracker
        ├── watch-pin.js     # Watch page pin button (next to Subscribe)
        ├── pin-actions.js   # Pin/unpin state & storage handlers
        ├── shelf.js         # Homepage Pinned Videos shelf renderer
        ├── scanner.js       # DOM scanner & Shorts element tagging
        ├── observer.js      # DOM MutationObserver & SPA navigation
        ├── focus-mode.css   # Focus Mode & Hide Shorts rules
        ├── endscreen.css    # End-screen overlay hiding rules
        ├── watch-pin.css    # Watch page pin button styles
        └── shelf.css        # Pinned shelf & card styles
```

---

### 3. Dynamic Light & Dark Theme Support

YouTube supports both Light and Dark themes. Instead of hardcoding background or text colors, PinTube utilizes CSS custom properties with theme fallbacks:

```css
/* Light Mode Defaults */
#pintube-home-shelf {
  --pintube-shelf-bg: var(--yt-spec-badge-chip-background, rgba(0, 0, 0, 0.05));
  --pintube-shelf-border: var(--yt-spec-10-percent-layer, rgba(0, 0, 0, 0.12));
  --pintube-text-primary: var(--yt-spec-text-primary, #0f0f0f);
  --pintube-text-secondary: var(--yt-spec-text-secondary, #606060);
}

/* Dark Mode Overrides */
html[dark] #pintube-home-shelf,
[dark] #pintube-home-shelf {
  --pintube-shelf-bg: var(--yt-spec-badge-chip-background, rgba(255, 255, 255, 0.04));
  --pintube-shelf-border: var(--yt-spec-10-percent-layer, rgba(255, 255, 255, 0.1));
  --pintube-text-primary: var(--yt-spec-text-primary, #ffffff);
  --pintube-text-secondary: var(--yt-spec-text-secondary, #aaa);
}
```

This guarantees high-contrast, crisp text rendering whether you use YouTube in Light or Dark Mode.

---

## 🔒 Privacy-First Design

PinTube is **100% private and open source**:
- No external server connections.
- No analytics or data tracking.
- All pinned videos and toggle states are stored strictly in your browser via `chrome.storage.sync`.

---

## 🏪 Chrome Web Store & Early Access

### 📢 Chrome Extension Marketplace Coming Soon!
PinTube is currently undergoing submission for the official **Google Chrome Web Store**. Once published, users will be able to install PinTube with a single click from the Chrome Marketplace and receive **100% automatic background updates**!

### ⚡ Try it Now via GitHub Early Access!
While the official Chrome Web Store listing is being finalized, you can try PinTube right now via **GitHub Releases**:

1. Visit the **[PinTube GitHub Releases](https://github.com/nidsnitesh/Pintube/releases)** page.
2. Download the latest **`pintube-extension.zip`** asset.
3. Unzip the file on your computer.
4. Open Chrome and go to `chrome://extensions`.
5. Enable **Developer mode** (toggle in the top-right corner).
6. Click **Load unpacked** (top-left) and select the unzipped `pintube` folder.
7. Open YouTube and enjoy your curated feed!

---

## ⭐️ Stay Tuned & Contribute!

PinTube is completely open-source. If you find it helpful, please consider **starring the repository on GitHub** to follow updates!

- 💻 **GitHub Repository**: [https://github.com/nidsnitesh/Pintube](https://github.com/nidsnitesh/Pintube)
- 📦 **Latest Release**: [https://github.com/nidsnitesh/Pintube/releases](https://github.com/nidsnitesh/Pintube/releases)

Stay tuned for the official Chrome Store release announcement! If you have feature ideas or feedback, feel free to drop a comment below or open an issue on GitHub. Happy pinning! 📌
