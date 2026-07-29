# YouTube’s Feed Was Ruining My Focus. So I Engineered My Own UI.

*How I built PinTube — a production-grade, privacy-first Manifest V3 extension that reclaims intentionality from YouTube’s attention economy.*

---

![PinTube Homepage Shelf Demo](https://raw.githubusercontent.com/nidsnitesh/Pintube/main/docs/images/pinned-shelf-demo.png)
*Figure 1: PinTube homepage custom Pinned Videos shelf sitting right above the feed.*

---

## 1. The Problem: The Cognitive Friction of Algorithmic Interfaces

Modern consumer web platforms are engineered around a single metric: **user engagement optimization**. YouTube’s front-end architecture is a masterclass in behavioral psychology — every pixel of the homepage grid, every recommendation sidebar, and every short-form video shelf is optimized to minimize friction between sessions and maximize watch time.

As engineers and knowledge workers, we use YouTube for high-value learning: software architecture deep-dives, compiler theory, system design, and technical talks. However, the interface creates severe cognitive friction:

1. **Context Switching & Attention Hijacking**: You open YouTube with a single task in mind (e.g., watching a talk on distributed consensus). Before you can focus on the search bar, 12 algorithmically selected thumbnails compete for your visual attention.
2. **The "Watch Later" Black Hole**: When you encounter a high-value 40-minute lecture while working, saving it to YouTube’s native *Watch Later* playlist creates a high-friction storage sink. Playlists become unorganized dumping grounds with zero visual priority.
3. **Tab Proliferation**: The default fallback for saving video context is keeping tabs open. This degrades browser performance, causes memory pressure, and fragments your workflow.

---

## 2. Why Existing Extensions Weren't Enough

Before writing a single line of code, I audited existing Chrome extensions for pinning or hiding YouTube content. I found they fell short in several key areas:

- **Fragmented Surface Support**: Most extensions only worked on the homepage thumbnail grid. They broke on search results (`/results`), recommendation sidebars, or when watching a video on `/watch`.
- **Fragile DOM Rendering & Autoplay Breaks**: Existing tools broke when YouTube triggered inline video autoplay previews (`ytd-inline-preview-renderer`), causing buttons to be covered or drift during page scroll.
- **Limited Scope & Missing Focus Controls**: They provided isolated button tweaks rather than a cohesive **Focus Engine** — lacking real-time Shorts removal across left drawers, feed suppression, and native theme integration.

I wanted a unified, production-grade system designed around a clear mission: **reclaiming intentionality on YouTube and turning it into a focused, distraction-free productivity tool — something sorely missing in today's algorithmic web.**

That led to the design and implementation of **PinTube**.

---

## 3. Product Design Philosophy: Intentionality over Algorithmic Feed

PinTube is designed around three core UX principles:

1. **Zero-Latency In-Context Pinning**: Pinning a video must be an inline, single-click action across all YouTube surfaces (homepage, search results, video player, and recommendation sidebars).
2. **Intent-Driven Surface Elimination (Focus Mode)**: The user should be able to disable algorithmic recommendations entirely, reducing YouTube to two components: **a pinned video queue** and **the search bar**.
3. **Zero External Dependencies & Absolute Privacy**: No telemetry, no third-party analytics, no backend infrastructure. State synchronization must rely entirely on local storage contracts (`chrome.storage.sync`).

---

## 4. Surface Architecture & Feature Overview

![PinTube Search Results Pinning](https://raw.githubusercontent.com/nidsnitesh/Pintube/main/docs/images/search-results-pinning.png)
*Figure 2: Pinning videos on YouTube Search Results (/results) with instant visual feedback.*

### 📌 1. Universal Thumbnail & Player Surface Pinning
Hovering over any video card across YouTube (Home feed, `/results` search grids, or related video sidebars) exposes a high-contrast inline **Pin** action. Additionally, on watch pages (`/watch?v=...`), a native-styled **📌 Pin / Pinned** action button is injected directly into YouTube’s primary video metadata bar, right next to the channel Subscribe button.

### 🏠 2. The Homepage Pinned Shelf
A custom, responsive CSS Grid component (`#pintube-home-shelf`) injected at the top of YouTube’s main `#contents` renderer. It mirrors YouTube’s native responsive grid tokens (`var(--ytd-rich-grid-items-per-row)`) for a seamless look and feel. Includes a collapsible state toggle for zero-visual-noise workflows.

![Focus Mode Active](https://raw.githubusercontent.com/nidsnitesh/Pintube/main/docs/images/focus-mode-feed.png)
*Figure 3: Focus Mode active — recommendation grids suppressed, only Pinned shelf and Search Bar remain.*

### 🎯 3. Focus Mode
Toggling Focus Mode completely suppresses YouTube's primary recommendation engine (`ytd-rich-grid-row`, `ytd-rich-section-renderer`), category chip bars (`ytd-feed-filter-chip-bar-renderer`), and sidebar recommendations (`#related`). YouTube becomes a clean productivity dashboard centered on your pinned queue and search input.

### 🚫 4. Real-Time Shorts Elimination
Eliminates short-form video elements (`ytd-reel-shelf-renderer`, `yt-reel-shelf-view-model`, `ytd-reel-item-renderer`) across all viewports, including dynamic navigation drawers (`#guide` and `#mini-guide`).

### 🎬 5. Automated Watch Page Cleanup
Enforces Theater Mode layout (`ytd-watch-flexy[theater]`) on navigation and suppresses end-screen overlay grids (`.ytp-endscreen-content`) upon video completion.

![PinTube Extension Popup Interface](https://raw.githubusercontent.com/nidsnitesh/Pintube/main/docs/images/extension-popup.png)
*Figure 4: PinTube Extension Popup interface with Focus Mode and Hide Shorts controls.*

---

## 5. Technical Architecture & Engineering Challenges

Building extension scripts on YouTube’s modern Polymer / Web Component Single Page Application (SPA) presents complex front-end engineering constraints. Below are the key architectural challenges and how they were solved.

---

### Challenge A: Stacking Context Isolation & Viewport Synchronization (RAF 60fps Loop)

#### The Problem:
YouTube’s homepage implements inline video preview renders (`ytd-inline-preview-renderer`). When a user hovers over a thumbnail for >1 second, YouTube instantiates a separate Web Component containing an HTML5 video iframe. 

If you inject an overlay button into the thumbnail element (`ytd-thumbnail`), YouTube’s preview player creates an isolated stacking context that paints over the button. Conversely, using standard `position: fixed` CSS relative to `document.body` solves the stacking context issue, but introduces severe **scroll drift** because YouTube executes page scrolling inside custom nested containers (`ytd-app`).

#### The Architectural Solution:
Instead of fighting YouTube’s internal DOM hierarchy or competing in z-index wars, PinTube decouples the overlay element entirely:

1. **Root Stacking Context Mount**: The floating overlay (`#pintube-floating-overlay`) is mounted directly on `document.body`, placing it in the top-level document stacking context above any nested shadow root or iframe.
2. **60fps Viewport RAF Synchronization**: When a card is hovered, PinTube initiates a non-blocking `requestAnimationFrame` loop that calculates the target thumbnail's live viewport bounding box (`getBoundingClientRect()`) and updates the overlay coordinates in real time.

```javascript
// content/modules/overlay.js

let floatingOverlay = null;
let activeCard = null;
let activeThumb = null;
let rafId = null;

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

#### Why This Works:
- **Zero Layout Thrashing**: Querying `getBoundingClientRect()` inside a RAF callback avoids synchronous layout forcing.
- **Iframe Immunity**: Mouse movement tracking uses a passive document-level listener (`mousemove`), checking viewport bounds directly to survive iframe event capture during autoplay previews.

---

### Challenge B: Modular Manifest V3 Content Script Architecture

To maintain strict separation of concerns, the content layer is split into specialized single-responsibility modules injected sequentially via Manifest V3 `content_scripts`:

```
pintube/
├── manifest.json            # Manifest V3 entry & permissions
├── background/
│   └── service-worker.js    # Lifecycle event listener
├── popup/
│   ├── popup.html           # Management popup interface
│   ├── popup.css            # Dark/light themed popup styling
│   └── popup.js             # Storage state controller
└── content/
    └── modules/             # Modular content runtime
        ├── state.js         # Shared mutable state & SVG assets
        ├── metadata.js      # Robust DOM metadata extraction
        ├── overlay.js       # RAF-synced floating overlay controller
        ├── watch-pin.js     # Watch page metadata & button injector
        ├── pin-actions.js   # Storage CRUD & state mutation dispatch
        ├── shelf.js         # Virtualized homepage grid renderer
        ├── scanner.js       # DOM scanner & Web Component tagger
        ├── observer.js      # SPA navigation & MutationObserver
        ├── focus-mode.css   # Focus Mode & Shorts removal rules
        ├── endscreen.css    # Endscreen overlay suppression
        ├── watch-pin.css    # Watch page pill action styling
        └── shelf.css        # Responsive shelf grid layout
```

---

### Challenge C: SPA Navigation & Memory Leak Mitigation

YouTube is a custom Single Page Application that navigates using custom history events (`yt-navigate-finish`) without full page reloads.

#### Mitigating Memory Leaks:
- **Debounced DOM MutationObserver**: The DOM observer ignores mutations generated by PinTube’s own UI (`#pintube-home-shelf`, `.pintube-btn-container`) to prevent recursive observer loops.
- **Idempotent Card Tagging**: Processed cards are tagged with `data-pintube-processed="true"`, ensuring DOM node queries remain \(O(N)\) over newly added nodes rather than re-evaluating the full tree.

---

### Challenge D: Zero-Runtime Theme Engine (Light & Dark Mode)

Rather than executing JavaScript theme checks on every render cycle, PinTube leverages YouTube's internal CSS Custom Property contracts:

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

This approach guarantees zero theme flash, crisp typography, and automatic adaptation when a user toggles YouTube’s appearance settings.

---

## 🔮 What’s Next: Future Functionality & Roadmap

PinTube v1.0 is just the beginning. The goal is to build an intelligent, focus-first layer for video-based learning. Future releases will include:

- **📂 Topic-Based Pinned Queues**: Group your pinned videos into custom categories (e.g., *"System Design"*, *"Machine Learning"*, *"Music"*).
- **⏱️ Intentional Session Timers & Focus Presets**: Set custom learning session timers that automatically remind you when your intended study window concludes.
- **📚 Smart Queue Auto-Archiving**: Automatically unpin or archive videos once watched to keep your homepage queue lean.
- **⚡ Keyboard Shortcuts & Quick Search**: Quick-pin hotkeys and inline search filters for your pinned collection.

---

## 🏪 Distribution & Marketplace Roadmap

### 📢 Chrome Web Store Release (Coming Soon!)
PinTube is currently undergoing review for official publication on the **Google Chrome Web Store**. Once published, users will be able to install PinTube with a single click and receive automatic background updates!

### ⚡ Developer Early Access (GitHub Releases)
While the marketplace review is finalizing, developers and early adopters can install PinTube today via **GitHub Releases**:

1. Download **`pintube-extension.zip`** from the [PinTube GitHub Releases](https://github.com/nidsnitesh/Pintube/releases) page.
2. Unzip the archive locally.
3. Open Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** (top-right toggle).
5. Click **Load unpacked** (top-left) and select the unzipped directory.

---

## 🛠️ Open Source & Architectural Summary

PinTube demonstrates that with proper architectural patterns — root stacking context isolation, RAF synchronization, debounced mutation observers, and CSS variable contracts — you can build high-performance extensions on top of complex Web Component applications without degrading frame rates or compromising user privacy.

- ⭐️ **GitHub Repository**: [https://github.com/nidsnitesh/Pintube](https://github.com/nidsnitesh/Pintube)
- 📦 **Latest Release Asset**: [https://github.com/nidsnitesh/Pintube/releases](https://github.com/nidsnitesh/Pintube/releases)

*Stay tuned for the official Chrome Store release announcement! Feedback, feature requests, and Pull Requests are welcome.* 📌
