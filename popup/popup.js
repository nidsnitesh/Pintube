// PinTube Popup Script

document.addEventListener('DOMContentLoaded', () => {
  let allPins = [];
  let currentSearchQuery = '';
  let currentSort = 'newest';

  // DOM Elements
  const pinsContainer = document.getElementById('pinsContainer');
  const emptyState = document.getElementById('emptyState');
  const pinCountElem = document.getElementById('pinCount');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const sortSelect = document.getElementById('sortSelect');
  const focusModeToggle = document.getElementById('focusModeToggle');
  const hideShortsToggle = document.getElementById('hideShortsToggle');
  const clearAllBtn = document.getElementById('clearAllBtn');

  // Initialize popup
  loadPins();
  loadSettings();

  // Storage listener for real-time update if updated elsewhere
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' || areaName === 'local') {
      if (changes.pintube_pins) {
        allPins = changes.pintube_pins.newValue || [];
        render();
      }
      if (changes.pintube_focus_mode !== undefined) {
        focusModeToggle.checked = !!changes.pintube_focus_mode.newValue;
      }
      if (changes.pintube_hide_shorts !== undefined) {
        hideShortsToggle.checked = !!changes.pintube_hide_shorts.newValue;
      }
    }
  });

  // Load Settings from Storage
  function loadSettings() {
    chrome.storage.sync.get(['pintube_focus_mode', 'pintube_hide_shorts'], (result) => {
      focusModeToggle.checked = !!result.pintube_focus_mode;
      hideShortsToggle.checked = !!result.pintube_hide_shorts;
    });
  }

  // Load Pins from Storage
  function loadPins() {
    chrome.storage.sync.get(['pintube_pins'], (result) => {
      allPins = result.pintube_pins || [];
      render();
    });
  }

  // Save Pins to Storage
  function savePins(updatedPins) {
    allPins = updatedPins;
    render();
    chrome.storage.sync.set({ pintube_pins: allPins }, () => {
      if (chrome.runtime.lastError) {
        chrome.storage.local.set({ pintube_pins: allPins });
      }
    });
  }

  // Filter and Sort Pins
  function getFilteredAndSortedPins() {
    let filtered = [...allPins];

    if (currentSearchQuery.trim()) {
      const q = currentSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.channel && p.channel.toLowerCase().includes(q))
      );
    }

    switch (currentSort) {
      case 'oldest':
        filtered.sort((a, b) => (a.pinnedAt || 0) - (b.pinnedAt || 0));
        break;
      case 'title':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'channel':
        filtered.sort((a, b) => (a.channel || '').localeCompare(b.channel || ''));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0));
        break;
    }

    return filtered;
  }

  // Render Pins UI
  function render() {
    const pinsToDisplay = getFilteredAndSortedPins();
    pinCountElem.textContent = `${allPins.length} Pin${allPins.length === 1 ? '' : 's'}`;

    if (allPins.length === 0) {
      pinsContainer.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');

    if (pinsToDisplay.length === 0) {
      pinsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>No results found for "${escapeHTML(currentSearchQuery)}"</p>
        </div>
      `;
      return;
    }

    pinsContainer.innerHTML = pinsToDisplay.map(pin => `
      <div class="popup-card" data-id="${pin.id}">
        <div class="popup-card-thumb-wrapper">
          <a href="${pin.url}" target="_blank">
            <img class="popup-card-thumb" src="${pin.thumbnail}" alt="${escapeHTML(pin.title)}" />
          </a>
          ${pin.duration ? `<span class="popup-card-duration">${pin.duration}</span>` : ''}
        </div>
        <div class="popup-card-details">
          <a href="${pin.url}" target="_blank" class="popup-card-title" title="${escapeHTML(pin.title)}">
            ${escapeHTML(pin.title)}
          </a>
          <div class="popup-card-channel">${escapeHTML(pin.channel)}</div>
          <div class="popup-card-actions">
            <button class="popup-card-btn copy-btn" data-url="${pin.url}" title="Copy Link">📋 Copy</button>
            <button class="popup-card-btn unpin" data-unpin-id="${pin.id}" title="Unpin Video">🗑️ Unpin</button>
          </div>
        </div>
      </div>
    `).join('');

    attachCardListeners();
  }

  function attachCardListeners() {
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        navigator.clipboard.writeText(url).then(() => {
          const originalText = btn.textContent;
          btn.textContent = '✓ Copied!';
          setTimeout(() => btn.textContent = originalText, 1500);
        });
      });
    });

    document.querySelectorAll('.popup-card-btn.unpin').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.unpinId;
        const updated = allPins.filter(p => p.id !== id);
        savePins(updated);
      });
    });
  }

  // Search input handler
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    if (currentSearchQuery) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    render();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.classList.add('hidden');
    render();
  });

  // Sort dropdown handler
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    render();
  });

  // Focus Mode toggle handler
  focusModeToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.sync.set({ pintube_focus_mode: isChecked });
  });

  // Hide Shorts toggle handler
  hideShortsToggle.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    chrome.storage.sync.set({ pintube_hide_shorts: isChecked });
  });

  // Clear All
  clearAllBtn.addEventListener('click', () => {
    if (allPins.length === 0) return;
    if (confirm('Are you sure you want to remove all pinned videos?')) {
      savePins([]);
    }
  });

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
});
