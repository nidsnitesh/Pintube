# 📌 PinTube - YouTube Video Pinner & Focus Suite

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red.svg)](#)

**PinTube** is a Google Chrome extension that lets you **pin your favorite YouTube videos** directly to your Home Feed while offering a distraction-free **Focus Mode** and **Shorts Remover**.

---

## ⚡ How to Add PinTube to Chrome

1. Go to the **[GitHub Releases](../../releases)** section of this repository.
2. Download the latest **`pintube-extension.zip`** file under Assets.
3. Extract (unzip) the `.zip` file into a folder on your computer.
4. Open Google Chrome and navigate to `chrome://extensions`.
5. Enable **Developer mode** using the toggle in the top-right corner.
6. Click **Load unpacked** in the top-left corner and select the extracted `pintube` folder.
7. Open [YouTube](https://www.youtube.com), hover over any video thumbnail, and start pinning!

---

## ✨ Features & How to Use Them

### 📌 1. Pinning Videos
- **How to use**: Hover over any video thumbnail on YouTube (Home feed, Search results, or Recommendations) and click the **📌 Pin** button at the top-left corner.
- **Visual Feedback**: Pinned videos display an **🗑️ Unpin** icon so you can toggle pin status anytime.

### 🏠 2. Homepage Pinned Shelf
- **How to use**: Visit YouTube's homepage to view your custom **📌 Pinned Videos** shelf at the top of your feed.
- **Collapsible**: Click **Hide / Show** on the top right of the shelf to collapse or expand it whenever needed.

### 🎯 3. Focus Mode (Distraction-Free YouTube)
- **How to use**: Click the PinTube extension icon in your Chrome toolbar and toggle **🎯 Focus Mode** ON.
- **What it does**: 
  - Hides the endless homepage recommendation feed — **only your Pinned Videos shelf is shown**.
  - Hides topic filter chips (*"All"*, *"Music"*, etc.), left navigation sidebar, and watch-page related recommendations.
  - Keeps the **top Search Bar 100% active** for intentional searching.

### 🚫 4. Hide Shorts
- **How to use**: Click the PinTube extension icon in your Chrome toolbar and toggle **🚫 Hide Shorts** ON.
- **What it does**: Instantly removes all Shorts shelves, recommendation reels, and sidebar items across YouTube in real time.

### 🎬 5. Auto Theater Mode & Clean Player
- **How to use**: Runs automatically on video watch pages.
- **What it does**: Automatically opens videos in **Theater Mode** and suppresses end-screen recommended video popups when playback finishes.

---

## 🤝 Open for PRs & Suggestions!

We welcome community contributions, feature ideas, bug reports, and Pull Requests!

### Project Architecture:
```
pintube/
├── manifest.json            # Extension configuration (Manifest V3)
├── background/
│   └── service-worker.js    # Service worker (handles installation)
├── popup/
│   ├── popup.html           # Extension popup interface
│   ├── popup.css            # Popup styling
│   └── popup.js             # Toggle state & pin manager logic
└── content/
    └── modules/             # Modular content scripts & styles
        ├── state.js         # Shared state & SVG constants
        ├── metadata.js      # Video metadata & channel extraction
        ├── overlay.js       # RAF-synced floating overlay & hover tracker
        ├── pin-actions.js   # Pin/unpin state & storage handlers
        ├── shelf.js         # Homepage Pinned Videos shelf renderer
        ├── scanner.js       # DOM scanner & Shorts element tagging
        ├── observer.js      # DOM MutationObserver & SPA navigation
        ├── focus-mode.css   # Focus Mode & Hide Shorts rules
        ├── endscreen.css    # End-screen overlay hiding rules
        └── shelf.css        # Pinned shelf & card styles
```

- **Have a feature idea or bug report?** Open an Issue on GitHub.
- **Want to contribute code?** Fork the repository, create a branch, and submit a Pull Request.

---

## 🔒 Privacy

PinTube is 100% private. No tracking, no analytics, no external backend servers. All your pinned videos and settings stay stored locally in your browser (`chrome.storage.sync`).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
