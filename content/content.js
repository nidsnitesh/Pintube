// PinTube Content Script

(function () {
  'use strict';

  // Global Pin State
  let pinnedVideos = [];
  let pinnedMap = new Map();
  let isShelfCollapsed = false;
  let scanTimeout = null;

  const PIN_SVG = `<svg viewBox="0 0 24 24"><path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1.03 1 1.03-1v-7H19v-2c-1.66 0-3-1.34-3-3z"/></svg>`;
  const UNPIN_SVG = `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

  // Initialize
  function init() {
    loadPinsFromStorage();
    setupStorageListener();
    startDOMObserver();
    setupNavigationListeners();
    enableTheaterModeIfNeeded();
    setInterval(monitorAndHideEndscreen, 300);
  }

  // Continuously remove endscreen overlays when video finishes
  function monitorAndHideEndscreen() {
    const endscreenElems = document.querySelectorAll(
      '.ytp-videowall-endscreen, .ytp-endscreen-content, .html5-endscreen, .ytp-ce-element, .ytp-pause-overlay, .ytp-autonav-endscreen, a.ytp-videowall-still'
    );
    endscreenElems.forEach(elem => {
      if (elem) {
        elem.style.setProperty('display', 'none', 'important');
        elem.style.setProperty('opacity', '0', 'important');
        elem.style.setProperty('pointer-events', 'none', 'important');
        elem.style.setProperty('visibility', 'hidden', 'important');
      }
    });
  }

  // Load Pinned Videos and Settings from Storage
  function loadPinsFromStorage() {
    chrome.storage.sync.get(['pintube_pins', 'pintube_focus_mode', 'pintube_hide_shorts'], (result) => {
      pinnedVideos = result.pintube_pins || [];
      updatePinnedMap();
      applyFocusModeSetting(!!result.pintube_focus_mode);
      applyHideShortsSetting(!!result.pintube_hide_shorts);
      debouncedScan();
    });
  }

  // Auto-enable Theater Mode on Watch Page
  function enableTheaterModeIfNeeded() {
    if (!window.location.pathname.startsWith('/watch')) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const watchElem = document.querySelector('ytd-watch-flexy');
      const sizeBtn = document.querySelector('.ytp-size-button');

      if (watchElem && sizeBtn) {
        const isTheater = watchElem.hasAttribute('theater') || watchElem.getAttribute('theater-name') === 'theater';
        if (!isTheater) {
          sizeBtn.click();
        }
        clearInterval(interval);
      }

      if (attempts >= 20) {
        clearInterval(interval);
      }
    }, 300);
  }

  // Apply or Remove Focus Mode CSS Class on body
  function applyFocusModeSetting(focusMode) {
    if (document.body) {
      document.body.classList.toggle('pintube-focus-mode', !!focusMode);
    }
  }

  // Apply or Remove Hide Shorts CSS Class on body
  function applyHideShortsSetting(hideShorts) {
    if (document.body) {
      document.body.classList.toggle('pintube-hide-shorts', !!hideShorts);
    }
  }

  // Update Lookup Map
  function updatePinnedMap() {
    pinnedMap.clear();
    pinnedVideos.forEach(v => pinnedMap.set(v.id, v));
  }

  // Listen for Storage Changes across tabs
  function setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' || areaName === 'local') {
        if (changes.pintube_pins) {
          pinnedVideos = changes.pintube_pins.newValue || [];
          updatePinnedMap();
          updateAllButtonsState();
          renderHomeShelf(true);
        }
        if (changes.pintube_focus_mode !== undefined) {
          applyFocusModeSetting(!!changes.pintube_focus_mode.newValue);
        }
        if (changes.pintube_hide_shorts !== undefined) {
          applyHideShortsSetting(!!changes.pintube_hide_shorts.newValue);
        }
      }
    });
  }

  // Extract Video ID from URL (Strictly EXCLUDES YouTube Shorts)
  function extractVideoId(url) {
    if (!url) return null;
    if (url.includes('/shorts/')) return null;

    const match = url.match(/(?:v=|\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  // Check if card is a Shorts element
  function isShortsCard(card) {
    if (!card) return true;
    if (card.tagName && card.tagName.toLowerCase().includes('reel')) return true;
    if (card.hasAttribute && card.hasAttribute('is-shorts')) return true;
    
    if (card.closest && card.closest('ytd-reel-shelf-renderer, ytd-rich-section-renderer, ytd-reel-item-renderer, [is-shorts], #shorts-container')) {
      return true;
    }
    return false;
  }

  // Multi-strategy Channel Name Extraction
  function extractChannelName(card) {
    if (!card) return 'YouTube Channel';

    const channelSelectors = [
      'ytd-channel-name a',
      '#channel-name a',
      'a[href*="/@"]',
      'a[href*="/channel/"]',
      'a[href*="/user/"]',
      '#byline-container a',
      '.ytd-channel-name a',
      'ytd-channel-name',
      '#channel-name',
      '#byline-container',
      '.ytd-channel-name',
      '#channel-info',
      '#metadata #byline',
      'yt-formatted-string#text',
      '.yt-lockup-metadata-view-model-wiz__subtitle'
    ];

    for (const sel of channelSelectors) {
      const elem = card.querySelector(sel);
      if (elem) {
        let text = (elem.textContent || elem.innerText || '').trim();
        text = text.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (text && text.length > 0 && text.length < 80 && !text.match(/^\d+:\d+$/)) {
          return text;
        }
      }
    }

    const allLinks = card.querySelectorAll('a[href]');
    for (const link of allLinks) {
      const href = link.getAttribute('href') || '';
      if (href.includes('/@') || href.includes('/channel/') || href.includes('/user/')) {
        const text = (link.textContent || '').trim();
        if (text) return text.replace(/\s+/g, ' ');
      }
    }

    return 'YouTube Channel';
  }

  // Extract Metadata from Video Renderer Card
  function extractVideoMetaData(card) {
    if (isShortsCard(card)) return null;

    const linkElem = card.querySelector('a#thumbnail, a.ytd-thumbnail, a#video-title-link, a[href*="/watch?v="]') || 
                     (card.tagName === 'A' ? card : null);
    if (!linkElem) return null;

    const href = linkElem.getAttribute('href') || (card.getAttribute ? card.getAttribute('href') : null);
    const videoId = extractVideoId(href);
    if (!videoId) return null;

    // Title
    const titleElem = card.querySelector('#video-title, #video-title-link, yt-formatted-string#video-title, a#video-title, .title, h3');
    let title = titleElem ? (titleElem.textContent || titleElem.getAttribute('title') || '').trim() : '';
    if (!title) {
      const imgElem = card.querySelector('img');
      title = imgElem ? imgElem.getAttribute('alt') || 'YouTube Video' : 'YouTube Video';
    }

    // Channel
    const channel = extractChannelName(card);

    // Duration
    const durationElem = card.querySelector('ytd-thumbnail-overlay-time-status-renderer, span.ytd-thumbnail-overlay-time-status-renderer, #text.ytd-thumbnail-overlay-time-status-renderer, .badge-shape-wiz--thumbnail-status');
    const duration = durationElem ? (durationElem.textContent || '').trim() : '';

    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    return {
      id: videoId,
      title: title || 'YouTube Video',
      channel: channel || 'YouTube Channel',
      thumbnail: thumbnail,
      duration: duration,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      pinnedAt: Date.now()
    };
  }

  // Inject Pin Button into a Video Container (Top Left)
  function injectPinButton(card) {
    if (isShortsCard(card)) return;
    if (card.dataset.pintubeProcessed) return;

    let thumbContainer = card.querySelector('ytd-thumbnail, #thumbnail, .ytd-thumbnail, yt-image, a[href*="/watch?v="]');
    if (!thumbContainer && card.tagName === 'A' && extractVideoId(card.getAttribute('href'))) {
      thumbContainer = card;
    }

    if (!thumbContainer) return;

    if (thumbContainer.querySelector('.pintube-btn-container')) {
      card.dataset.pintubeProcessed = 'true';
      return;
    }

    const videoData = extractVideoMetaData(card);
    if (!videoData) return;

    card.dataset.pintubeProcessed = 'true';
    card.dataset.pintubeVideoId = videoData.id;

    const style = window.getComputedStyle(thumbContainer);
    if (style.position === 'static') {
      thumbContainer.style.position = 'relative';
    }

    const isPinned = pinnedMap.has(videoData.id);

    // Create Button Container (Top Left)
    const btnContainer = document.createElement('div');
    btnContainer.className = `pintube-btn-container ${isPinned ? 'pintube-pinned' : ''}`;

    const btn = document.createElement('button');
    btn.className = `pintube-btn ${isPinned ? 'pintube-pinned' : ''}`;
    btn.title = isPinned ? 'Unpin video' : 'Pin video';
    btn.innerHTML = isPinned ? UNPIN_SVG : PIN_SVG;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const freshMeta = extractVideoMetaData(card) || videoData;
      togglePinVideo(freshMeta);
    });

    btnContainer.appendChild(btn);
    thumbContainer.appendChild(btnContainer);
  }

  // Toggle Pin Status of Video
  function togglePinVideo(videoData) {
    const isPinned = pinnedMap.has(videoData.id);
    let updatedPins = [...pinnedVideos];

    if (isPinned) {
      updatedPins = updatedPins.filter(v => v.id !== videoData.id);
    } else {
      updatedPins = [videoData, ...updatedPins.filter(v => v.id !== videoData.id)];
    }

    pinnedVideos = updatedPins;
    updatePinnedMap();
    updateAllButtonsState();
    renderHomeShelf(true);

    chrome.storage.sync.set({ pintube_pins: pinnedVideos }, () => {
      if (chrome.runtime.lastError) {
        chrome.storage.local.set({ pintube_pins: pinnedVideos });
      }
    });
  }

  // Update Visual State of all Injected Pin Buttons
  function updateAllButtonsState() {
    const cards = document.querySelectorAll('[data-pintube-processed="true"]');
    cards.forEach(card => {
      const videoId = card.dataset.pintubeVideoId;
      const btnContainer = card.querySelector('.pintube-btn-container');
      const btn = card.querySelector('.pintube-btn');
      
      if (btnContainer && btn) {
        const isPinned = pinnedMap.has(videoId);
        if (isPinned) {
          btnContainer.classList.add('pintube-pinned');
          btn.classList.add('pintube-pinned');
          btn.title = 'Unpin video';
          btn.innerHTML = UNPIN_SVG;
        } else {
          btnContainer.classList.remove('pintube-pinned');
          btn.classList.remove('pintube-pinned');
          btn.title = 'Pin video';
          btn.innerHTML = PIN_SVG;
        }
      }
    });
  }

  // Debounced DOM Scanner
  function debouncedScan() {
    if (scanTimeout) clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
      scanAndInjectButtons();
    }, 200);
  }

  // Scan YouTube DOM for Video Cards
  function scanAndInjectButtons() {
    const cardSelectors = [
      'ytd-rich-item-renderer',
      'ytd-compact-video-renderer',
      'ytd-grid-video-renderer',
      'ytd-video-renderer',
      'ytd-playlist-video-renderer',
      'yt-lockup-view-model',
      'a#thumbnail[href*="/watch?v="]'
    ];

    const cards = document.querySelectorAll(cardSelectors.join(','));
    cards.forEach(card => injectPinButton(card));

    renderHomeShelf(false);
  }

  // Render Homepage Pinned Videos Shelf
  function renderHomeShelf(forceReRender = false) {
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
    const existingShelf = document.getElementById('pintube-home-shelf');

    if (!isHomePage) {
      if (existingShelf) existingShelf.remove();
      return;
    }

    const contentsGrid = document.querySelector('ytd-rich-grid-renderer #contents');
    const richGrid = document.querySelector('ytd-rich-grid-renderer');
    if (!contentsGrid && !richGrid) return;

    if (existingShelf && !forceReRender) {
      return;
    }

    let shelfElem = existingShelf;
    if (!shelfElem) {
      shelfElem = document.createElement('div');
      shelfElem.id = 'pintube-home-shelf';
      if (contentsGrid) {
        contentsGrid.insertBefore(shelfElem, contentsGrid.firstChild);
      } else {
        richGrid.insertBefore(shelfElem, richGrid.firstChild);
      }
    }

    // 1. If 0 items pinned: render a small 70px banner
    if (pinnedVideos.length === 0) {
      shelfElem.className = 'pintube-empty-banner';
      shelfElem.innerHTML = `
        <div class="pintube-shelf-header">
          <div class="pintube-shelf-title-group">
            <h2 class="pintube-shelf-title">📌 Pinned Videos</h2>
            <span class="pintube-hint-text">Hover over any video thumbnail and click 📌 to pin it for quick access!</span>
          </div>
        </div>
      `;
      return;
    }

    // 2. If 1+ items pinned: render FULL native YouTube grid
    shelfElem.className = `pintube-has-pins ${isShelfCollapsed ? 'pintube-is-collapsed' : ''}`;
    const cardsHTML = `
      <div class="pintube-shelf-grid ${isShelfCollapsed ? 'pintube-collapsed' : ''}">
        ${pinnedVideos.map(video => {
          const displayChannel = video.channel && video.channel !== 'YouTube Video' ? video.channel : 'YouTube Channel';
          return `
            <div class="pintube-card" data-card-id="${video.id}">
              <div class="pintube-card-thumb-wrapper">
                <a href="${video.url}">
                  <img class="pintube-card-thumb" src="${video.thumbnail}" alt="${escapeHTML(video.title)}" />
                </a>
                ${video.duration ? `<span class="pintube-card-duration">${video.duration}</span>` : ''}
                <button class="pintube-card-unpin-btn" data-unpin-id="${video.id}" title="Unpin video">
                  ${UNPIN_SVG}
                </button>
              </div>
              <div class="pintube-card-info">
                <a href="${video.url}" class="pintube-card-title" title="${escapeHTML(video.title)}">
                  ${escapeHTML(video.title)}
                </a>
                <span class="pintube-card-channel" title="${escapeHTML(displayChannel)}">${escapeHTML(displayChannel)}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    shelfElem.innerHTML = `
      <div class="pintube-shelf-header">
        <div class="pintube-shelf-title-group">
          <h2 class="pintube-shelf-title">📌 Pinned Videos</h2>
          <span class="pintube-badge">${pinnedVideos.length}</span>
        </div>
        <div class="pintube-shelf-controls">
          <button class="pintube-shelf-action-btn" id="pintube-toggle-collapse">
            ${isShelfCollapsed ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>
      ${cardsHTML}
    `;

    const collapseBtn = shelfElem.querySelector('#pintube-toggle-collapse');
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        isShelfCollapsed = !isShelfCollapsed;
        toggleShelfVisibilityUI();
      });
    }

    const unpinBtns = shelfElem.querySelectorAll('[data-unpin-id]');
    unpinBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.unpinId;
        const video = pinnedMap.get(id);
        if (video) togglePinVideo(video);
      });
    });
  }

  function toggleShelfVisibilityUI() {
    const shelfElem = document.getElementById('pintube-home-shelf');
    const grid = document.querySelector('.pintube-shelf-grid');
    const btn = document.querySelector('#pintube-toggle-collapse');

    if (shelfElem && grid) {
      if (isShelfCollapsed) {
        shelfElem.classList.add('pintube-is-collapsed');
        grid.classList.add('pintube-collapsed');
        if (btn) btn.textContent = 'Show';
      } else {
        shelfElem.classList.remove('pintube-is-collapsed');
        grid.classList.remove('pintube-collapsed');
        if (btn) btn.textContent = 'Hide';
      }
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Observe YouTube dynamic DOM updates smoothly
  function startDOMObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;

      for (const mutation of mutations) {
        const target = mutation.target;
        if (target && (
          target.id === 'pintube-home-shelf' ||
          target.classList?.contains('pintube-btn-container') ||
          target.closest?.('#pintube-home-shelf')
        )) {
          continue;
        }

        if (mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }

      if (shouldScan) {
        debouncedScan();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Handle YouTube SPA Navigation
  function setupNavigationListeners() {
    window.addEventListener('yt-navigate-finish', () => {
      setTimeout(() => {
        debouncedScan();
        renderHomeShelf(true);
        enableTheaterModeIfNeeded();
      }, 500);
    });
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
