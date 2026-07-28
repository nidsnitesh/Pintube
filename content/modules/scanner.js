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

function hideShortsInGuide() {
  if (!document.body.classList.contains('pintube-hide-shorts')) return;

  const guideLinks = document.querySelectorAll(
    '#guide a[href*="shorts"], #mini-guide a[href*="shorts"], ' +
    'ytd-guide-entry-renderer a[href*="shorts"], ytd-mini-guide-entry-renderer a[href*="shorts"], ' +
    '#guide [title="Shorts"], #mini-guide [title="Shorts"], ' +
    'a[href*="/shorts"]'
  );

  guideLinks.forEach(link => {
    const container = link.closest(
      'ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer, ' +
      'yt-navigation-drawer-entry-view-model, tp-yt-paper-item'
    ) || link;

    if (container && container.classList) {
      container.classList.add('pintube-is-shorts-container');
    }

    if (link.closest('#guide, #mini-guide, ytd-guide-renderer, ytd-mini-guide-renderer, ytd-app')) {
      link.style.setProperty('display', 'none', 'important');
      if (container) {
        container.style.setProperty('display', 'none', 'important');
        container.style.setProperty('visibility', 'hidden', 'important');
      }
    }
  });
}

function scanAndInjectButtons() {
  hideShortsInGuide();

  // Mark Shorts cards, shelves, and left drawer navigation entries with pintube-is-shorts-container
  const shortsElements = document.querySelectorAll(
    'ytd-reel-shelf-renderer, yt-reel-shelf-view-model, ytd-reel-item-renderer, ' +
    'a[href*="/shorts/"], a[href*="/shorts"], [is-shorts], #shorts-container, ' +
    '#guide a[href*="shorts"], #mini-guide a[href*="shorts"]'
  );
  shortsElements.forEach(el => {
    const container = el.closest(
      'ytd-reel-shelf-renderer, ytd-rich-section-renderer, ytd-shelf-renderer, ' +
      'ytd-video-renderer, yt-lockup-view-model, ytd-rich-item-renderer, ' +
      'ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer, ' +
      'yt-reel-shelf-view-model, grid-shelf-view-model, ' +
      'ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer, yt-navigation-drawer-entry-view-model'
    ) || el;
    if (container && container.classList) {
      container.classList.add('pintube-is-shorts-container');
    }
  });

  document.querySelectorAll(CARD_SELECTORS.join(',')).forEach(card => injectPinButton(card));
  injectWatchPinButton();
  renderHomeShelf(false);
}
