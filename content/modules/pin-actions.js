// PinTube – Pin/Unpin Actions & Chrome Storage

function loadPinsFromStorage() {
  chrome.storage.sync.get(['pintube_pins', 'pintube_focus_mode', 'pintube_hide_shorts'], (result) => {
    pinnedVideos = result.pintube_pins || [];
    updatePinnedMap();
    applyFocusModeSetting(!!result.pintube_focus_mode);
    applyHideShortsSetting(!!result.pintube_hide_shorts);
    debouncedScan();
  });
}

function setupStorageListener() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' && areaName !== 'local') return;
    if (changes.pintube_pins) {
      pinnedVideos = changes.pintube_pins.newValue || [];
      updatePinnedMap();
      renderHomeShelf(true);
      if (typeof injectWatchPinButton === 'function') injectWatchPinButton();
    }
    if (changes.pintube_focus_mode !== undefined) {
      applyFocusModeSetting(!!changes.pintube_focus_mode.newValue);
    }
    if (changes.pintube_hide_shorts !== undefined) {
      applyHideShortsSetting(!!changes.pintube_hide_shorts.newValue);
    }
  });
}

function togglePinVideo(videoData) {
  const isPinned = pinnedMap.has(videoData.id);
  let updatedPins = isPinned
    ? pinnedVideos.filter(v => v.id !== videoData.id)
    : [videoData, ...pinnedVideos.filter(v => v.id !== videoData.id)];

  pinnedVideos = updatedPins;
  updatePinnedMap();
  renderHomeShelf(true);
  if (typeof injectWatchPinButton === 'function') injectWatchPinButton();

  chrome.storage.sync.set({ pintube_pins: pinnedVideos }, () => {
    if (chrome.runtime.lastError) {
      chrome.storage.local.set({ pintube_pins: pinnedVideos });
    }
  });
}
