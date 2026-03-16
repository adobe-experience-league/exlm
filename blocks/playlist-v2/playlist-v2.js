import { decorateIcons, loadCSS } from '../../scripts/lib-franklin.js';
import {
  htmlToElement,
  decoratePlaceholders,
  createPlaceholderSpan,
  fetchLanguagePlaceholders,
  getConfig,
  getPathDetails,
} from '../../scripts/scripts.js';
import { Playlist, LABELS } from '../playlist/playlist-utils.js';
import { updateTranscript, transcriptLoading } from '../video-transcript/video-transcript.js';

/**
 * convert seconds to time in minutes in the format of 'mm:ss'
 * @param {string} seconds
 */
function toTimeInMinutes(seconds) {
  const secondsNumber = parseInt(seconds, 10);
  if (Number.isNaN(secondsNumber)) {
    return '0:00';
  }

  const minutes = Math.floor(secondsNumber / 60);
  const remainingSeconds = secondsNumber % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function isSameInteger(a, b) {
  return parseInt(a, 10) === parseInt(b, 10);
}

/**
 * Update the query string parameter with the given key and value
 */
function updateQueryStringParameter(key, value) {
  if (value < 0) return;
  const url = new URL(window.location.href);

  // do not update if same value
  if (url.searchParams.get(key) === String(value)) return;
  if (value === undefined || value === null) {
    url.searchParams.delete(key);
    window.history.pushState({ [key]: 0 }, '', url);
  } else {
    url.searchParams.set(key, value);
    window.history.pushState({ [key]: value }, '', url);
  }
}

function updateVideoIndexParam(activeIndex, param) {
  const url = new URL(window.location.href);
  const currentVideoIndexParam = url.searchParams.get(param);
  if (isSameInteger(currentVideoIndexParam, activeIndex)) return;

  // if the active index is 0, remove the video query param
  if (isSameInteger(activeIndex, 0)) {
    updateQueryStringParameter(param, null);
  } else {
    // if the active index is not 0, update the video query param
    updateQueryStringParameter(param, activeIndex);
  }
}

/**
 * Get the query string parameter with the given key
 */
function getQueryStringParameter(key) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
}

function hasQueryStringParameter(key) {
  return new URLSearchParams(window.location.search).has(key);
}

/**
 * create an icon span (to be used with decorateIcons())
 */
function iconSpan(icon) {
  return `<span class="icon icon-${icon}"></span>`;
}

/**
 * @param {Video} video
 * @param {Playlist} playlist
 * @returns {HTMLElement}
 */
function newPlayer(playlist) {
  const video = playlist.getActiveVideo();
  if (!video) return null;
  const { src, autoplay = false, title, description, transcriptUrl, currentTime = 0 } = video;

  const iframeSrc = new URL(src);
  iframeSrc.searchParams.set('t', currentTime);
  iframeSrc.searchParams.set('autoplay', autoplay);

  const iframeAllowOptions = [
    'fullscreen',
    'accelerometer',
    'encrypted-media',
    'gyroscope',
    'picture-in-picture',
    'autoplay',
  ];

  const player = htmlToElement(`
        <div class="playlist-player" data-playlist-player>
            <div class="playlist-player-video">
               <iframe
                  src="${iframeSrc}" 
                  autoplay="${autoplay}"
                  frameborder="0" 
                  allow="${iframeAllowOptions.join('; ')}">
                </iframe>
            </div>
            <div class="playlist-player-info">
                <h3 class="playlist-player-info-title">${title}</h3>
                <p class="playlist-player-info-description">${description}</p>
                <details class="playlist-player-info-transcript" data-playlist-player-info-transcript="${transcriptUrl}">
                  <summary>
                    <span data-placeholder="${LABELS.transcript}">Transcript</span>
                  </summary>
                  ${transcriptLoading}
                </details>
            </div>
        </div>
    `);

  decoratePlaceholders(player);

  const iframe = player.querySelector('iframe');
  iframe?.addEventListener('load', () => {
    try {
      iframe?.contentWindow?.postMessage({ type: 'mpcAction', action: 'play' }, '*');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error posting message to iframe:', error);
    }
  });
  return player;
}

/**
 * @param {HTMLElement} container
 * @param {Playlist} playlist
 * @param {string} title
 * @param {string} description
 */
function decoratePlaylistHeader(container, playlist, title = '', description = '') {
  const defaultContent = htmlToElement(`<div class="default-content-wrapper" data-playlist-progress-box></div>`);

  // Add title and description if provided
  if (title) {
    const titleH3 = htmlToElement(`<h3>${title}</h3>`);
    defaultContent.appendChild(titleH3);
  }
  if (description) {
    const descriptionP = htmlToElement(`<p>${description}</p>`);
    defaultContent.appendChild(descriptionP);
  }

  const playlistInfo = htmlToElement(`<div class="playlist-info">
    <b><span data-placeholder="${LABELS.playlist}">Playlist<span></b>
    <div>${iconSpan('list')} <span data-playlist-length>${playlist.length}</span> <span data-placeholder="${
      LABELS.tutorials
    }">Tutorials<span></div>
    <button data-playlist-action-button class="playlist-action-button" aria-expanded="false">⋮</button>
  </div>`);

  decoratePlaceholders(playlistInfo);
  defaultContent.prepend(playlistInfo);

  const nowViewing = createPlaceholderSpan(LABELS.nowViewing, 'NOW VIEWING {} OF {}', (span) => {
    const [nowViewingText = 'NOW VIEWING ', ofText = ' OF '] = span.textContent.split('{}');

    span.replaceWith(
      htmlToElement(`<div class="playlist-now-viewing">
        <b>${nowViewingText}</b>
        <b><span class="playlist-now-viewing-count" data-playlist-now-viewing-count>${
          playlist.getActiveVideoIndex() + 1
        }</span>${ofText}<span data-playlist-length>${playlist.length}</span></b>
      </div>`),
    );
  });

  defaultContent.append(nowViewing);

  container.prepend(defaultContent);

  // Load actions Menu
  loadCSS('/blocks/playlist/playlist-action-menu.css');
  import('../playlist/playlist-action-menu.js').then((mod) =>
    mod.default(container.querySelector('[data-playlist-action-button]'), playlist),
  );
}

/**
 * Shows the video at the given count
 * @param {import('./mpc-util.js').Video} video
 */
function updatePlayer(playlist, playerContainer) {
  const video = playlist.getActiveVideo();
  if (!video) return;
  const existingPlayer = playerContainer.querySelector('[data-playlist-player]');
  if (existingPlayer?.querySelector('iframe')?.src?.startsWith(video.src)) return;
  const player = newPlayer(playlist);
  if (!player) return;
  const transcriptDetail = player.querySelector('[data-playlist-player-info-transcript]');
  const transcriptUrl = transcriptDetail.getAttribute('data-playlist-player-info-transcript');

  updateTranscript(transcriptUrl, transcriptDetail);
  playerContainer.innerHTML = '';
  playerContainer.append(player);
}

/**
 *
 * @param {number} videoIndex
 * @param {import('./mpc-util.js').Video} video
 * @param {import('./mpc-util.js').Playlist} playlist
 */
function updateProgress(videoIndex, playlist, container) {
  const { el, currentTime, duration, completed } = playlist.getVideo(videoIndex);
  if (!el) return;

  // now viewing count
  const nowViewingCount = container.querySelector('[data-playlist-now-viewing-count]');
  if (nowViewingCount) nowViewingCount.textContent = parseInt(videoIndex, 10) + 1;

  // total count
  [...container.querySelectorAll('[data-playlist-length]')].forEach((span) => {
    span.textContent = playlist.length;
  });

  // progress bar
  const progressBox = el.querySelector('[data-playlist-item-progress-box]');
  if (progressBox && duration > 0) {
    progressBox.style.setProperty('--playlist-item-progress', `${((currentTime || 0) / duration) * 100}%`);
  }

  // update overall progress
  const playlistProgressBox = container.querySelector('[data-playlist-progress-box]');
  if (playlistProgressBox) {
    const completedVideos = playlist.getVideos().filter((v) => v.currentTime >= v.duration - 1).length;
    playlistProgressBox.style.setProperty('--playlist-progress', `${(completedVideos / playlist.length) * 100}%`);
  }

  // update completed status - completed means a videos has been watched till the end, at-least once.
  if (currentTime >= duration - 1 && !completed) {
    playlist.updateVideoByIndex(videoIndex, { completed: true });
  }

  let progressStatus;
  if (completed) {
    progressStatus = 'completed';
  } else if (currentTime >= duration - 1) {
    progressStatus = 'not-started';
  } else {
    progressStatus = 'in-progress';
  }
  [...el.querySelectorAll('[data-progress-status]')].forEach((status) => {
    status.style.display = 'none';
    if (status.getAttribute('data-progress-status') === progressStatus) {
      status.style.display = 'block';
    }
  });
}

/**
 * Fetch data from API
 * @param {string} playlistId
 * @param {string} lang
 */
async function fetchPlaylistData(playlistId, lang) {
  const { cdnOrigin } = getConfig();
  const apiUrl = `${cdnOrigin}/api/v2/playlists/${playlistId}?lang=${lang}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist data: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching playlist data:', error);
    return null;
  }
}

/**
 * Transform API response to playlist items format
 * @param {Object} apiData
 */
function transformApiDataToPlaylistItems(apiData) {
  if (!apiData?.data?.videos) {
    return [];
  }

  return apiData.data.videos.map((video) => {
    // Get thumbnail URL from jsonLinkedData.thumbnailUrl array (prefer 960x540)
    let thumbnailUrl = '';
    if (video.jsonLinkedData && Array.isArray(video.jsonLinkedData.thumbnailUrl)) {
      thumbnailUrl =
        video.jsonLinkedData.thumbnailUrl.find((url) => url.includes('960x540')) ||
        video.jsonLinkedData.thumbnailUrl[0] ||
        '';
    }

    return {
      src: video.url || '',
      title: video.title || '',
      description: video.description || '',
      duration: video.duration || 0,
      transcriptUrl: video.transcriptUrl || '',
      thumbnailUrl,
      jsonLd: video.jsonLinkedData || null,
    };
  });
}

/**
 * Build playlist items from API data
 * @param {HTMLElement} itemsContainer
 * @param {Array} playlistItems
 * @param {Playlist} playlist
 */
function buildPlaylistItems(itemsContainer, playlistItems, playlist) {
  playlistItems.forEach((item, videoIndex) => {
    const videoRow = document.createElement('div');
    videoRow.classList.add('playlist-item');

    const videoCell = document.createElement('div');
    videoCell.classList.add('playlist-item-thumbnail');
    videoCell.setAttribute('data-playlist-item-progress-box', '');

    // Add thumbnail if available
    if (item.thumbnailUrl) {
      videoCell.innerHTML = `<img src="${item.thumbnailUrl}" alt="${item.title}">`;
    }

    const videoDataCell = document.createElement('div');
    videoDataCell.classList.add('playlist-item-content');

    const titleH = document.createElement('h3');
    titleH.classList.add('playlist-item-title');
    titleH.textContent = item.title;
    videoDataCell.appendChild(titleH);

    const video = {
      src: item.src,
      title: item.title,
      description: item.description,
      duration: item.duration,
      transcriptUrl: item.transcriptUrl,
      el: videoRow,
    };

    // Add JSON-LD if available
    if (item.jsonLd) {
      const jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.textContent = typeof item.jsonLd === 'string' ? item.jsonLd : JSON.stringify(item.jsonLd);
      videoRow.appendChild(jsonLdScript);
    }

    // Item bottom status
    videoDataCell.append(
      htmlToElement(`<div class="playlist-item-meta">
              <div data-progress-status="not-started"></div>
              <div data-progress-status="in-progress">${iconSpan('check')} <span data-placeholder="${
                LABELS.inProgress
              }">In Progress</span></div>
              <div data-progress-status="completed">${iconSpan('check-filled')} <span data-placeholder="${
                LABELS.completed
              }">Completed</span></div>
              <div>${iconSpan('time')} ${toTimeInMinutes(video.duration)} <span data-placeholder="${
                LABELS.minLabel
              }">MIN</span></div>
          </div>`),
    );
    decoratePlaceholders(videoDataCell);

    videoRow.appendChild(videoCell);
    videoRow.appendChild(videoDataCell);

    videoRow.addEventListener('click', () => {
      playlist.activateVideoByIndex(videoIndex);
    });

    itemsContainer.appendChild(videoRow);

    // always do this at the end.
    playlist.updateVideoByIndex(videoIndex, video);
  });
}

/**
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  // Get playlist ID from block
  const playlistIdElement = block.querySelector('div > div');
  const playlistId = playlistIdElement?.textContent?.trim();

  if (!playlistId) {
    return;
  }
  block.textContent = '';

  const { lang } = getPathDetails();
  const apiData = await fetchPlaylistData(playlistId, lang);

  if (!apiData) {
    return;
  }

  const playlistItems = transformApiDataToPlaylistItems(apiData);

  if (playlistItems.length === 0) {
    return;
  }

  // Create playlist instance with unique ID for localStorage
  const playlist = new Playlist({ playlistId });

  // Create player container inside block
  const playerContainer = htmlToElement(`<div class="playlist-player-container" data-playlist-player-container></div>`);
  block.appendChild(playerContainer);

  // Create items container (acts like section.playlist-container)
  const itemsContainer = htmlToElement(`<div class="playlist-items-container"></div>`);

  // Create playlist wrapper (acts like .playlist-wrapper and .playlist)
  const playlistWrapper = htmlToElement(`<div class="playlist-wrapper"><div class="playlist"></div></div>`);
  const playlistDiv = playlistWrapper.querySelector('.playlist');

  // determine query param for this playlist
  const allPlaylistBlocks = [...document.querySelectorAll('.block.playlist-v2')];
  const playlistIndex = allPlaylistBlocks.indexOf(block);
  const videoParam = allPlaylistBlocks.length === 1 ? 'video' : `video${playlistIndex + 1}`;

  // Setup playlist change handler
  playlist.onVideoChange((videos, vIndex) => {
    const currentVideo = videos[vIndex];
    const { active = false, el } = currentVideo;
    const activeStatusChanged = currentVideo.active !== currentVideo?.el?.classList?.contains('active');
    el.classList.toggle('active', active);
    if (active && activeStatusChanged) itemsContainer.scrollTop = el.offsetTop - el.clientHeight / 2;
    updatePlayer(playlist, playerContainer);
    updateVideoIndexParam(playlist.getActiveVideoIndex(), videoParam);
    updateProgress(vIndex, playlist, block);
    return true;
  });

  const activeVideoIndex = Number(getQueryStringParameter(videoParam)) || 0;

  // Get playlist title and description from API data
  const playlistTitle = apiData.data?.title || '';
  const playlistDescription = apiData.data?.description || '';

  // Set title and description on playlist instance (needed for action menu)
  playlist.title = playlistTitle;
  playlist.description = playlistDescription;

  buildPlaylistItems(playlistDiv, playlistItems, playlist);
  decoratePlaylistHeader(itemsContainer, playlist, playlistTitle, playlistDescription);

  // Append playlist wrapper to items container
  itemsContainer.appendChild(playlistWrapper);

  // Add autoplay options inside items container
  const playlistOptions = htmlToElement(`<div class="playlist-options">
    <div class="playlist-options-autoplay">
        <label>
          <input type="checkbox" class="playlist-options-autoplay-checkbox" checked=${
            playlist?.options?.autoplayNext || true
          }>
          <span data-placeholder="${LABELS.autoPlayNextVideo}">Auto Play Next Video</span>
        </label>
    </div>
  </div>`);
  decoratePlaceholders(playlistOptions);
  itemsContainer.appendChild(playlistOptions);

  // Append items container to block
  block.appendChild(itemsContainer);

  itemsContainer.querySelector('.playlist-options-autoplay-checkbox').addEventListener('change', (event) => {
    playlist.updateOptions({ autoplayNext: event.target.checked });
  });

  decorateIcons(block);
  playlist.activateVideoByIndex(activeVideoIndex);

  // handle browser back within history changes
  window.addEventListener('popstate', () => {
    const index = Number(getQueryStringParameter(videoParam)) || 0;
    playlist.activateVideoByIndex(index);
  });

  // if the url contains "redirected" query param, show a toast message and remove the query param.
  if (hasQueryStringParameter('redirected')) {
    // replace page history to remove the query param
    updateQueryStringParameter('redirected', null);
    Promise.allSettled([import('../../scripts/toast/toast.js'), fetchLanguagePlaceholders()]).then(
      ([toastResult, placeholdersResult]) => {
        const notice =
          placeholdersResult.value[LABELS.courseReplacedNotice] ||
          'The course you visited was migrated to a video playlist for easier access';
        toastResult.value.sendNotice(notice, 'info', 5000);
      },
    );
  }
}
