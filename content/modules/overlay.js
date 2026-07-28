// PinTube – Body-level Floating Overlay with RAF Position Sync
//
// Design rationale:
//   • position:fixed on document.body → ROOT stacking context → beats any YouTube z-index
//   • requestAnimationFrame position sync → stays locked to thumbnail even during scroll
//   • document.mousemove for hide → works through autoplay iframes (which swallow mouseleave)

let floatingOverlay = null;
let activeCard = null;
let activeThumb = null;
let rafId = null;

function ensureFloatingOverlay() {
  if (floatingOverlay && floatingOverlay.isConnected) return floatingOverlay;
  floatingOverlay = document.createElement('div');
  floatingOverlay.id = 'pintube-floating-overlay';
  floatingOverlay.style.cssText = [
    'position:fixed', 'top:0', 'left:0',
    'z-index:2147483647', 'opacity:0', 'visibility:hidden',
    'pointer-events:none', 'width:36px', 'height:36px',
    'border-radius:50%', 'transition:opacity 0.15s ease',
  ].join('!important;') + '!important';
  document.body.appendChild(floatingOverlay);
  return floatingOverlay;
}

function syncOverlayPosition() {
  if (!activeCard || !floatingOverlay) return;
  const rect = (activeThumb || activeCard).getBoundingClientRect();
  floatingOverlay.style.setProperty('left', (rect.left + 8) + 'px', 'important');
  floatingOverlay.style.setProperty('top',  (rect.top  + 8) + 'px', 'important');
}

function startRAFSync() {
  if (rafId) cancelAnimationFrame(rafId);
  (function loop() {
    if (!activeCard) { rafId = null; return; }
    syncOverlayPosition();
    rafId = requestAnimationFrame(loop);
  })();
}

function stopRAFSync() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

// Hide when mouse leaves card bounds (passive — iframe-proof, checked via viewport coords)
document.addEventListener('mousemove', (e) => {
  if (!activeCard) return;
  const r = activeCard.getBoundingClientRect();
  const insideCard = e.clientX >= r.left && e.clientX <= r.right &&
                     e.clientY >= r.top  && e.clientY <= r.bottom;
  if (!insideCard) {
    // Guard: keep showing if mouse is on the overlay button itself
    if (floatingOverlay) {
      const or = floatingOverlay.getBoundingClientRect();
      if (e.clientX >= or.left && e.clientX <= or.right &&
          e.clientY >= or.top  && e.clientY <= or.bottom) return;
    }
    hideOverlay();
  }
}, { passive: true });

function showOverlay(card, videoData) {
  const overlay = ensureFloatingOverlay();
  activeCard = card;
  activeThumb = card.querySelector(
    'a#thumbnail, ytd-thumbnail, yt-thumbnail-view-model, yt-thumbnail-bottom-overlay-view-model'
  );

  const isPinned = pinnedMap.has(videoData.id);
  overlay.innerHTML = '';

  const btn = document.createElement('button');
  btn.title = isPinned ? 'Unpin video' : 'Pin video';
  btn.innerHTML = isPinned ? UNPIN_SVG : PIN_SVG;
  btn.style.cssText = [
    'all:unset', 'display:flex', 'align-items:center', 'justify-content:center',
    'width:36px', 'height:36px', 'border-radius:50%',
    `background:${isPinned ? '#ff0000' : 'rgba(15,15,15,0.85)'}`,
    `border:1.5px solid ${isPinned ? '#ff3333' : 'rgba(255,255,255,0.25)'}`,
    'cursor:pointer', 'color:#fff',
    'box-shadow:0 4px 14px rgba(0,0,0,0.6)',
    'transition:all 0.2s ease',
  ].join(';');

  btn.addEventListener('mouseenter', () => {
    btn.style.background = '#ff0000';
    btn.style.borderColor = '#ff3333';
    btn.style.transform = 'scale(1.15)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = isPinned ? '#ff0000' : 'rgba(15,15,15,0.85)';
    btn.style.borderColor = isPinned ? '#ff3333' : 'rgba(255,255,255,0.25)';
    btn.style.transform = '';
  });
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const freshMeta = extractVideoMetaData(card) || videoData;
    togglePinVideo(freshMeta);
    setTimeout(() => showOverlay(card, freshMeta), 50);
  }, true);

  overlay.appendChild(btn);
  syncOverlayPosition();
  startRAFSync();
  overlay.style.setProperty('pointer-events', 'auto', 'important');
  overlay.style.setProperty('visibility', 'visible', 'important');
  overlay.style.setProperty('opacity', '1', 'important');
}

function hideOverlay() {
  stopRAFSync();
  if (!floatingOverlay) return;
  floatingOverlay.style.setProperty('opacity', '0', 'important');
  floatingOverlay.style.setProperty('visibility', 'hidden', 'important');
  floatingOverlay.style.setProperty('pointer-events', 'none', 'important');
  activeCard = null;
  activeThumb = null;
}

function injectPinButton(rawCard) {
  const card = getTopLevelCard(rawCard);
  if (!card || isShortsCard(card)) return;

  const videoData = extractVideoMetaData(card);
  if (!videoData) return;

  card.dataset.pintubeVideoId = videoData.id;
  card.dataset.pintubeProcessed = 'true';

  if (!card.dataset.pintubeHoverBound) {
    card.dataset.pintubeHoverBound = 'true';
    card.addEventListener('mouseenter', () => showOverlay(card, videoData));
    // Hide handled by document.mousemove (iframe-proof)
  }
}
