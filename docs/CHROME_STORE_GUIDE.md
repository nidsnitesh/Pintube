# 🚀 Publishing PinTube to the Chrome Web Store

Follow this step-by-step guide to package and publish **PinTube** on the official Google Chrome Web Store.

---

## Step 1: Create a Developer Account

1. Go to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard).
2. Sign in with your Google account.
3. Pay the one-time **$5 registration fee** required by Google for new developer accounts.

---

## Step 2: Package the Extension (.zip)

To publish, compress the extension files into a single `.zip` archive.

Run this command inside the `pintube` root folder:

```bash
zip -r pintube-extension.zip manifest.json icons/ content/ background/ popup/ docs/ README.md LICENSE
```

> **Note**: Do not include `.git` or local scratch files in the zip bundle.

---

## Step 3: Create New Item in Developer Dashboard

1. In the Chrome Developer Dashboard, click **Add new item**.
2. Drag and drop `pintube-extension.zip` or click **Browse files**.
3. Once uploaded, you will be taken to the store listing editor.

---

## Step 4: Complete Store Listing Information

Fill in the following details in the Store Listing tab:

- **Title**: PinTube - YouTube Video Pinner & Focus Suite
- **Summary**: Pin favorite YouTube videos to your home feed, use Focus Mode to remove feed distractions, and hide Shorts.
- **Detailed Description**:
  ```
  PinTube lets you pin any video on YouTube directly to your Home Feed shelf, remove feed distractions with Focus Mode, and clean up Shorts.

  Key Features:
  📌 Pin any YouTube video with 1 click from thumbnail overlays.
  🏠 Custom Pinned Videos shelf at the top of your YouTube Homepage.
  🎯 Focus Mode: Remove recommendation rabbit holes while keeping Search active.
  🚫 Hide Shorts: 1-click switch to remove YouTube Shorts shelves & reels.
  🎬 Auto Theater Mode & Endscreen Overlay Removal for clean watching.
  🔍 Search & sort pinned videos in extension popup gallery.
  🔒 100% private - no external tracking or data collection.
  ```
- **Category**: Productivity / Social & Communication
- **Language**: English
- **Store Assets**:
  - **Extension Icon**: Upload `icons/icon128.png` (128x128 px).
  - **Screenshots**: Upload screenshots (1280x800 or 640x400 px) showing:
    1. The pin button on YouTube thumbnails.
    2. The Pinned Videos shelf on YouTube Homepage.
    3. Focus Mode & Hide Shorts toggles in the extension popup.

---

## Step 5: Fill Privacy Tab

Under the **Privacy practices** tab:

1. **Single Purpose**: "Pin favorite YouTube videos to home page feed and provide focus mode customization."
2. **Permission Justifications**:
   - `storage`: Required to save user pinned video preferences and toggle settings locally.
   - `host_permission` (`https://www.youtube.com/*`): Required to inject pin overlay buttons, Focus Mode styles, and render the home shelf on YouTube.
3. **Data Usage**: Select **"No"** for all data collection types (PinTube does not process or transmit personal data).

---

## Step 6: Submit for Review

1. Click **Submit for review**.
2. Select publication mode (Automated publish after review or Manual publish).
3. Reviews typically take **24 to 72 hours**. Once approved, your extension will be live on the Chrome Web Store!

---

## Step 7: Publishing to GitHub (Open Source)

To host on GitHub:

```bash
cd /Users/nitesh/workspace/pintube
git init
git add .
git commit -m "Initial commit: PinTube Chrome Extension v1.0.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pintube.git
git push -u origin main
```
