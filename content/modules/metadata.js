// PinTube – Video Metadata Extraction

function extractVideoId(url) {
  if (!url) return null;
  if (url.includes('/shorts/')) return null;
  const match = url.match(/(?:v=|\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function isShortsCard(card) {
  if (!card) return true;
  if (card.tagName && card.tagName.toLowerCase().includes('reel')) return true;
  if (card.hasAttribute && card.hasAttribute('is-shorts')) return true;
  if (card.querySelector && card.querySelector('a[href*="/shorts/"]')) return true;
  if (card.closest && card.closest(
    'ytd-reel-shelf-renderer, ytd-rich-section-renderer, ytd-reel-item-renderer, [is-shorts], #shorts-container'
  )) return true;
  return false;
}

function getTopLevelCard(card) {
  if (!card) return null;
  const parent = card.closest(
    'ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer, ' +
    'ytd-grid-video-renderer, ytd-playlist-video-renderer, yt-lockup-view-model, ' +
    'ytd-watch-card-compact-video-renderer, #dismissible'
  );
  return parent || card;
}

function extractChannelName(rawCard) {
  const card = getTopLevelCard(rawCard);
  if (!card) return 'YouTube Channel';

  const channelSelectors = [
    '#channel-info a', 'ytd-channel-name a', '#channel-name a',
    '#byline-container a', '.ytd-channel-name a',
    'ytd-channel-name #text', '#channel-name #text',
    'ytd-channel-name', '#channel-name', '#channel-info',
    '.ytd-channel-name', '#byline-container', '#metadata #byline',
    'a[href*="/@"]', 'a[href*="/channel/"]', 'a[href*="/user/"]', 'a[href*="/c/"]',
    '.yt-lockup-metadata-view-model-wiz__subtitle'
  ];

  for (const sel of channelSelectors) {
    const elem = card.querySelector(sel);
    if (!elem) continue;
    let text = '';
    if (elem.querySelector && elem.querySelector('tp-yt-paper-tooltip')) {
      const clone = elem.cloneNode(true);
      clone.querySelectorAll('tp-yt-paper-tooltip').forEach(t => t.remove());
      text = (clone.textContent || '').trim();
    } else {
      text = (elem.getAttribute('title') || elem.textContent || elem.innerText || '').trim();
    }
    text = text.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (text && text.length > 0 && text.length < 80 && !text.match(/^\d+:\d+$/) && text !== 'YouTube Video') {
      return text;
    }
  }

  for (const link of card.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href') || '';
    if (href.includes('/@') || href.includes('/channel/') || href.includes('/user/') || href.includes('/c/')) {
      const text = (link.textContent || '').trim();
      if (text && !text.match(/^\d+:\d+$/)) return text.replace(/\s+/g, ' ');
    }
  }

  return 'YouTube Channel';
}

function extractVideoMetaData(rawCard) {
  const card = getTopLevelCard(rawCard);
  if (!card || isShortsCard(card)) return null;

  const linkElem = card.querySelector(
    'a#thumbnail, a.ytd-thumbnail, a#video-title-link, a#video-title, a[href*="/watch?v="]'
  ) || (card.tagName === 'A' ? card : null);
  if (!linkElem) return null;

  const href = linkElem.getAttribute('href') || (card.getAttribute ? card.getAttribute('href') : null);
  const videoId = extractVideoId(href);
  if (!videoId) return null;

  // Title — try progressively wider selectors
  let title = '';
  for (const sel of [
    '#video-title', '#video-title-link', 'a#video-title',
    'yt-formatted-string#video-title', '.yt-lockup-metadata-view-model-wiz__title',
    '.title-and-badge', 'h3 a', 'h3'
  ]) {
    const elem = card.querySelector(sel);
    if (elem) {
      title = (elem.getAttribute('title') || elem.getAttribute('aria-label') || elem.textContent || '').trim();
      title = title.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (title && title !== 'YouTube Video') break;
    }
  }
  if (!title) title = (card.querySelector('img')?.getAttribute('alt') || '').trim();
  title = title.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Duration — regex ensures no doubled timestamps (e.g. "19:06 19:06")
  const durationElem = card.querySelector(
    '#text.ytd-thumbnail-overlay-time-status-renderer, ' +
    'span.ytd-thumbnail-overlay-time-status-renderer, ' +
    '.badge-shape-wiz__text, ytd-thumbnail-overlay-time-status-renderer'
  );
  const durationMatch = (durationElem ? durationElem.textContent || '' : '').match(/\d+:\d{2}(?::\d{2})?/);

  return {
    id: videoId,
    title: title || 'YouTube Video',
    channel: extractChannelName(card) || 'YouTube Channel',
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    duration: durationMatch ? durationMatch[0].trim() : '',
    url: `https://www.youtube.com/watch?v=${videoId}`,
    pinnedAt: Date.now()
  };
}
