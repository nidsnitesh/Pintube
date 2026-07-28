// PinTube – Shared State & Constants
'use strict';

let pinnedVideos = [];
let pinnedMap = new Map();
let isShelfCollapsed = false;
let scanTimeout = null;

const PIN_SVG = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1.03 1 1.03-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/></svg>`;
const UNPIN_SVG = `<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1.03 1 1.03-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/><line x1="3" y1="3" x2="21" y2="21" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/></svg>`;

function updatePinnedMap() {
  pinnedMap.clear();
  pinnedVideos.forEach(v => pinnedMap.set(v.id, v));
}
