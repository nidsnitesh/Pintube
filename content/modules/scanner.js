// PinTube – DOM Scanner (injects hover listener on every video card)

const CARD_SELECTORS = [
  'ytd-rich-item-renderer',
  'ytd-compact-video-renderer',
  'ytd-grid-video-renderer',
  'ytd-video-renderer',
  'ytd-playlist-video-renderer',
  'yt-lockup-view-model',
  'yt-thumbnail-view-model',
  'yt-thumbnail-bottom-overlay-view-model',
  'ytd-watch-card-compact-video-renderer',
  '#related ytd-compact-video-renderer',
  '#items ytd-compact-video-renderer',
  'a#thumbnail[href*="/watch?v="]'
];

function debouncedScan() {
  if (scanTimeout) clearTimeout(scanTimeout);
  scanTimeout = setTimeout(scanAndInjectButtons, 200);
}

function scanAndInjectButtons() {
  // Mark Shorts cards and shelves with pintube-is-shorts-container
  const shortsElements = document.querySelectorAll(
    'ytd-reel-shelf-renderer, yt-reel-shelf-view-model, ytd-reel-item-renderer, ' +
    'a[href*="/shorts/"], [is-shorts], #shorts-container'
  );
  shortsElements.forEach(el => {
    const container = el.closest(
      'ytd-reel-shelf-renderer, ytd-rich-section-renderer, ytd-shelf-renderer, ' +
      'ytd-video-renderer, yt-lockup-view-model, ytd-rich-item-renderer, ' +
      'ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer, ' +
      'yt-reel-shelf-view-model, grid-shelf-view-model'
    ) || el;
    if (container && container.classList) {
      container.classList.add('pintube-is-shorts-container');
    }
  });

  document.querySelectorAll(CARD_SELECTORS.join(',')).forEach(card => injectPinButton(card));
  renderHomeShelf(false);
}
