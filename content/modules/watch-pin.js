// PinTube – Watch Page Pin Button (Injected next to Subscribe button)

function extractWatchMetaData() {
  if (!window.location.pathname.startsWith('/watch')) return null;

  const videoId = extractVideoId(window.location.href);
  if (!videoId) return null;

  // Title
  let title = '';
  const titleElem = document.querySelector(
    'ytd-watch-metadata h1.ytd-watch-metadata, ' +
    'h1.ytd-watch-metadata, ' +
    '#title h1, ' +
    'h1.title'
  );
  if (titleElem) {
    title = (titleElem.textContent || '').trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
  }
  if (!title) {
    title = document.title.replace(/\s*-\s*YouTube\s*$/i, '').trim();
  }

  // Channel Name
  let channel = '';
  const channelElem = document.querySelector(
    '#owner ytd-channel-name a, ' +
    '#owner #channel-name a, ' +
    '#owner a[href*="/@"], ' +
    '#owner a[href*="/channel/"], ' +
    'ytd-watch-metadata #owner #text'
  );
  if (channelElem) {
    channel = (channelElem.textContent || '').trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ');
  }

  // Duration
  let duration = '';
  const durationElem = document.querySelector('.ytp-time-duration');
  if (durationElem) {
    const match = (durationElem.textContent || '').match(/\d+:\d{2}(?::\d{2})?/);
    if (match) duration = match[0].trim();
  }

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

function injectWatchPinButton() {
  if (!window.location.pathname.startsWith('/watch')) return;

  const videoData = extractWatchMetaData();
  if (!videoData) return;

  // Find subscribe button or owner container
  const subscribeContainer = document.querySelector(
    'ytd-watch-metadata #owner #subscribe-button, ' +
    '#owner #subscribe-button, ' +
    '#subscribe-button, ' +
    'ytd-subscribe-button-renderer'
  );

  if (!subscribeContainer) return;

  const isPinned = pinnedMap.has(videoData.id);
  let btn = document.getElementById('pintube-watch-pin-btn');

  if (btn) {
    // If video ID changed or pin status changed, update button UI
    if (btn.dataset.videoId !== videoData.id || btn.dataset.isPinned !== String(isPinned)) {
      btn.dataset.videoId = videoData.id;
      btn.dataset.isPinned = String(isPinned);
      btn.className = `pintube-watch-pin-btn ${isPinned ? 'pintube-pinned' : ''}`;
      btn.title = isPinned ? 'Unpin this video' : 'Pin this video to homepage shelf';
      btn.innerHTML = `${isPinned ? UNPIN_SVG : PIN_SVG}<span>${isPinned ? 'Pinned' : 'Pin'}</span>`;
    }
    return;
  }

  // Create new button element
  btn = document.createElement('button');
  btn.id = 'pintube-watch-pin-btn';
  btn.dataset.videoId = videoData.id;
  btn.dataset.isPinned = String(isPinned);
  btn.className = `pintube-watch-pin-btn ${isPinned ? 'pintube-pinned' : ''}`;
  btn.title = isPinned ? 'Unpin this video' : 'Pin this video to homepage shelf';
  btn.innerHTML = `${isPinned ? UNPIN_SVG : PIN_SVG}<span>${isPinned ? 'Pinned' : 'Pin'}</span>`;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const freshData = extractWatchMetaData() || videoData;
    togglePinVideo(freshData);
    const nowPinned = pinnedMap.has(freshData.id);
    btn.dataset.isPinned = String(nowPinned);
    btn.className = `pintube-watch-pin-btn ${nowPinned ? 'pintube-pinned' : ''}`;
    btn.innerHTML = `${nowPinned ? UNPIN_SVG : PIN_SVG}<span>${nowPinned ? 'Pinned' : 'Pin'}</span>`;
    btn.title = nowPinned ? 'Unpin this video' : 'Pin this video to homepage shelf';
  });

  // Insert right after the subscribe button element
  if (subscribeContainer.nextSibling) {
    subscribeContainer.parentNode.insertBefore(btn, subscribeContainer.nextSibling);
  } else {
    subscribeContainer.parentNode.appendChild(btn);
  }
}
