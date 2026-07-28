// PinTube – Pinned Shelf Rendering (Homepage)

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

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
  if (existingShelf && !forceReRender) return;

  let shelfElem = existingShelf;
  if (!shelfElem) {
    shelfElem = document.createElement('div');
    shelfElem.id = 'pintube-home-shelf';
    const anchor = contentsGrid || richGrid;
    anchor.insertBefore(shelfElem, anchor.firstChild);
  }

  // Empty state: compact banner
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

  // Full shelf
  shelfElem.className = `pintube-has-pins ${isShelfCollapsed ? 'pintube-is-collapsed' : ''}`;

  const cardsHTML = pinnedVideos.map(video => {
    const channel = video.channel && video.channel !== 'YouTube Video' ? video.channel : 'YouTube Channel';
    const duration = video.duration ? (video.duration.match(/\d+:\d{2}(?::\d{2})?/) || [''])[0] : '';
    return `
      <div class="pintube-card" data-card-id="${video.id}">
        <div class="pintube-card-thumb-wrapper">
          <a href="${video.url}">
            <img class="pintube-card-thumb" src="${video.thumbnail}" alt="${escapeHTML(video.title)}" />
          </a>
          ${duration ? `<span class="pintube-card-duration">${duration}</span>` : ''}
          <button class="pintube-card-unpin-btn" data-unpin-id="${video.id}" title="Unpin video">
            ${UNPIN_SVG}
          </button>
        </div>
        <div class="pintube-card-info">
          <a href="${video.url}" class="pintube-card-title" title="${escapeHTML(video.title)}">
            ${escapeHTML(video.title)}
          </a>
          <span class="pintube-card-channel" title="${escapeHTML(channel)}">${escapeHTML(channel)}</span>
        </div>
      </div>
    `;
  }).join('');

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
    <div class="pintube-shelf-grid ${isShelfCollapsed ? 'pintube-collapsed' : ''}">
      ${cardsHTML}
    </div>
  `;

  shelfElem.querySelector('#pintube-toggle-collapse')?.addEventListener('click', () => {
    isShelfCollapsed = !isShelfCollapsed;
    toggleShelfVisibilityUI();
  });

  shelfElem.querySelectorAll('[data-unpin-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const video = pinnedMap.get(btn.dataset.unpinId);
      if (video) togglePinVideo(video);
    });
  });
}

function toggleShelfVisibilityUI() {
  const shelfElem = document.getElementById('pintube-home-shelf');
  const grid = document.querySelector('.pintube-shelf-grid');
  const btn = document.querySelector('#pintube-toggle-collapse');
  if (!shelfElem || !grid) return;
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
