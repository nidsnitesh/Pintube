# Privacy Policy for PinTube

**Effective Date:** July 28, 2026

## Overview
PinTube ("the Extension") respects your privacy. This Privacy Policy explains our commitment to security and transparency.

## Data Collection and Processing
- **No Personal Data Collected**: PinTube does not collect, record, transmit, or monetize any personal user data.
- **Local Storage Usage**: PinTube saves your pinned video information (Video ID, Title, Channel Name, Thumbnail URL, Duration, Timestamp) and user settings (Focus Mode & Hide Shorts toggle state) locally within your browser using `chrome.storage.sync` or `chrome.storage.local`.
- **No Third-Party Analytics**: We do not use third-party analytics, tracking scripts, advertising networks, or external telemetry servers.

## Network Requests
PinTube operates entirely within your browser. The extension makes no external network calls to third-party servers. All video thumbnail images are loaded directly from YouTube's standard image servers (`i.ytimg.com`).

## Data Permissions
- `storage`: Required to save your pinned YouTube video data and toggle preferences locally across sessions.
- `https://www.youtube.com/*`: Required to render pin overlays, apply Focus Mode styles, and inject the Homepage Pinned Shelf on YouTube.

## Changes to Privacy Policy
We may update this policy from time to time. Any changes will be published in this repository.

## Contact
If you have any questions regarding privacy, please open an issue on the open-source GitHub repository.
