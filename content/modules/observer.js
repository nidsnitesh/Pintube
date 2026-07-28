// PinTube – Initialization, DOM Observer & Navigation

function applyFocusModeSetting(focusMode) {
  document.body?.classList.toggle('pintube-focus-mode', !!focusMode);
}

function applyHideShortsSetting(hideShorts) {
  document.body?.classList.toggle('pintube-hide-shorts', !!hideShorts);
}

function enableTheaterModeIfNeeded() {
  if (!window.location.pathname.startsWith('/watch')) return;
  let attempts = 0;
  const interval = setInterval(() => {
    const watchElem = document.querySelector('ytd-watch-flexy');
    const sizeBtn  = document.querySelector('.ytp-size-button');
    if (watchElem && sizeBtn) {
      const isTheater = watchElem.hasAttribute('theater') ||
                        watchElem.getAttribute('theater-name') === 'theater';
      if (!isTheater) sizeBtn.click();
      clearInterval(interval);
    }
    if (++attempts >= 20) clearInterval(interval);
  }, 300);
}

function startDOMObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const t = mutation.target;
      // Ignore our own DOM mutations to avoid feedback loops
      if (t && (
        t.id === 'pintube-home-shelf' ||
        t.classList?.contains('pintube-btn-container') ||
        t.closest?.('#pintube-home-shelf') ||
        t.closest?.('.pintube-btn-container')
      )) continue;

      if (mutation.addedNodes.length > 0) {
        debouncedScan();
        break;
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function setupNavigationListeners() {
  window.addEventListener('yt-navigate-finish', () => {
    setTimeout(() => {
      debouncedScan();
      renderHomeShelf(true);
      enableTheaterModeIfNeeded();
    }, 500);
  });
}

function init() {
  loadPinsFromStorage();
  setupStorageListener();
  startDOMObserver();
  setupNavigationListeners();
  enableTheaterModeIfNeeded();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
