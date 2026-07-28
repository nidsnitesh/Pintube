// PinTube Background Service Worker

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[PinTube] Extension installed successfully.');
    chrome.storage.sync.get(['pintube_pins'], (result) => {
      if (!result.pintube_pins) {
        chrome.storage.sync.set({ pintube_pins: [] });
      }
    });
  }
});

// Handle runtime messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getPins') {
    chrome.storage.sync.get(['pintube_pins'], (result) => {
      sendResponse({ pins: result.pintube_pins || [] });
    });
    return true;
  }
});
