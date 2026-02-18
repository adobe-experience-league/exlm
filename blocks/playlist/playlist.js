import { decorateIcons, loadCSS } from '../../scripts/lib-franklin.js';
import {
  htmlToElement,
  decoratePlaceholders,
  createPlaceholderSpan,
  fetchLanguagePlaceholders,
  getConfig,
  getPathDetails,
} from '../../scripts/scripts.js';
import { Playlist, LABELS } from './playlist-utils.js';
import { updateTranscript, transcriptLoading } from '../video-transcript/video-transcript.js';

async function fetchPlaylistById(playlistId) {
  const { lang } = getPathDetails();
  const { cdnOrigin } = getConfig();

  try {
    const resp = await fetch(`${cdnOrigin}/api/v2/playlists/${playlistId}?lang=${lang}`);
    const json = await resp.json();
    return json.data;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch playlist', e);
    return null;
  }
}

function getPlaylistHtml(data) {
  return data?.transformedContent?.find((c) => c.contentType === 'text/html')?.raw;
}

function parsePlaylistHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return {
    playlistEl: doc.querySelector('.playlist'),
    doc,
  };
}

const removeLastSlash = (url) => url.replace(/\/$/, '');
const isSameUrl = (a, b) => {
  const aUrl = new URL(a);
  const bUrl = new URL(b);
  return aUrl.origin === bUrl.origin && removeLastSlash(aUrl.pathname) === removeLastSlash(bUrl.pathname);
};

/**
 * find the json-ld script/object that contains the video url
 */
const findJsonLd = (videoUrl) => {
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  if (!jsonLdScripts || !jsonLdScripts.length) return null;

  const jsonLd = [...jsonLdScripts]
    .map((script) => {
      const parsed = JSON.parse(script.textContent);
      return Array.isArray(parsed) ? parsed : [parsed];
    })
    .flat()
    .find((jsonLdObj) => isSameUrl(jsonLdObj.embedUrl, videoUrl));

  return jsonLd;
};

function getVideoThumbnailUrl(videoUrl, jsonLdString) {
  try {
    const jsonLd = jsonLdString ? JSON.parse(jsonLdString) : findJsonLd(videoUrl);
    if (!jsonLd || !jsonLd.thumbnailUrl) return null;

    const thumbnails = Array.isArray(jsonLd.thumbnailUrl) ? jsonLd.thumbnailUrl : [jsonLd.thumbnailUrl];

    if (!thumbnails.length) return null;

    const bestFit = thumbnails.find((url) => url.includes('640x'));
    return bestFit || thumbnails[thumbnails.length - 1];
  } catch (e) {
    return null;
  }
}

/**
 * convert seconds to time in minutes in the format of 'mm:ss'
 * @param {string} seconds
 */
function toTimeInMinutes(seconds) {
  const secondsNumber = parseInt(seconds, 10);
  const minutes = Math.floor(secondsNumber / 60);
  const remainingSeconds = seconds % 60;
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
  if (url.searchParams.get(key) === value) return;
  if (value === undefined || value === null) {
    url.searchParams.delete(key);
    window.history.pushState({ [key]: 0 }, '', url);
  } else {
    url.searchParams.set(key, value);
    window.history.pushState({ [key]: value }, '', url);
  }
}

function updateVideoIndexParam(activeIndex) {
  const url = new URL(window.location.href);
  const currentVideoIndexParam = url.searchParams.get('video');
  if (isSameInteger(currentVideoIndexParam, activeIndex)) return;

  // if the active index is 0, remove the video query param
  if (isSameInteger(activeIndex, 0)) {
    updateQueryStringParameter('video', null);
  } else {
    // if the active index is not 0, update the video query param
    updateQueryStringParameter('video', activeIndex);
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
  iframe.addEventListener('load', () => {
    iframe.contentWindow.postMessage({ type: 'mpcAction', action: 'play' }, '*');
  });
  return player;
}

/**
 * @param {HTMLElement} block
 * @param {Playlist} playlist
 */
function decoratePlaylistHeader(block, playlist) {
  const playlistSection = block.closest('.section');
  const defaultContent = playlistSection?.querySelector('.default-content-wrapper');
  if (!defaultContent) return;

  // set title and description
  const playlistTitleH = defaultContent.querySelector('h1, h2, h3, h4, h5, h6');
  const playlistDescriptionP = defaultContent.querySelector('p');
  playlist.title = playlistTitleH?.textContent || '';
  playlist.description = playlistDescriptionP?.textContent || '';

  defaultContent.setAttribute('data-playlist-progress-box', '');

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

  // Load actions Menu
  loadCSS('/blocks/playlist/playlist-action-menu.css');
  import('./playlist-action-menu.js').then((mod) =>
    mod.default(playlistSection.querySelector('[data-playlist-action-button]'), playlist),
  );
}

/**
 * Shows the video at the given count
 * @param {import('./mpc-util.js').Video} video
 */
function updatePlayer(playlist) {
  const video = playlist.getActiveVideo();
  if (!video) return;
  const exisatingPlayer = document.querySelector('[data-playlist-player]');
  if (exisatingPlayer?.querySelector('iframe')?.src?.startsWith(video.src)) return;
  const player = newPlayer(playlist);
  if (!player) return;
  const playerContainer = document.querySelector('[data-playlist-player-container]');
  const transcriptDetail = player.querySelector('[data-playlist-player-info-transcript]');
  const transcriptUrl = transcriptDetail.getAttribute('data-playlist-player-info-transcript');

  updateTranscript(transcriptUrl, transcriptDetail);
  playerContainer.innerHTML = '';
  playerContainer.append(player);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 *
 * @param {number} videoIndex
 * @param {import('./mpc-util.js').Video} video
 * @param {import('./mpc-util.js').Playlist} playlist
 */
function updateProgress(videoIndex, playlist) {
  const { el, currentTime, duration, completed } = playlist.getVideo(videoIndex);
  // now viewing count
  const nowViewingCount = document.querySelector('[data-playlist-now-viewing-count]');
  if (nowViewingCount) nowViewingCount.textContent = parseInt(videoIndex, 10) + 1;

  // total count
  [...document.querySelectorAll('[data-playlist-length]')].forEach((span) => {
    span.textContent = playlist.length;
  });

  // progress bar
  const progressBox = el.querySelector('[data-playlist-item-progress-box]');
  progressBox.style.setProperty('--playlist-item-progress', `${((currentTime || 0) / duration) * 100}%`);

  // update overall progress
  const playlistProgressBox = document.querySelector('[data-playlist-progress-box]');
  const completedVideos = playlist.getVideos().filter((v) => v.currentTime >= v.duration - 1).length;
  playlistProgressBox.style.setProperty('--playlist-progress', `${(completedVideos / playlist.length) * 100}%`);

  // update completed status - completed means a vides has been watched till the end, at-least once.
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

const playlist = new Playlist();
playlist.onVideoChange((videos, vIndex) => {
  const currentVideo = videos[vIndex];
  const { active = false, el } = currentVideo;
  const activeStatusChanged = currentVideo.active !== currentVideo?.el?.classList?.contains('active');
  el.classList.toggle('active', active);
  if (active && activeStatusChanged) el.parentElement.scrollTop = el.offsetTop - el.clientHeight / 2;
  updatePlayer(playlist);
  updateVideoIndexParam(playlist.getActiveVideoIndex());
  updateProgress(vIndex, playlist);
  return true;
});

/**
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  const playlistSection = block.closest('.section');
  const playlistId = block.childElementCount === 1 ? block.firstElementChild.textContent?.trim() : '';
  let jsonLdArray = [];
  if (playlistId) {
    block.classList.add('hide-playlist');

    try {
      const data = await fetchPlaylistById(playlistId);
      const html = getPlaylistHtml(data);
      const parsed = parsePlaylistHtml(html);

      if (!parsed || !parsed.playlistEl) return;

      // For API-loaded playlists, update localStorage key to include page name and playlistId
      // This ensures different API playlists don't share localStorage data
      const pathParts = window.location.pathname.split('/').filter((p) => p);
      const pageSlug = pathParts[pathParts.length - 1] || 'playlist';
      const cleanPlaylistId = playlistId.replace(/^\/+/, '').replace(/\//g, '-');
      playlist.localStorageKey = `playlist-${pageSlug}-${cleanPlaylistId}`;

      const jsonLdScript = parsed.doc.querySelector('script[type="application/ld+json"]');
      if (jsonLdScript) {
        try {
          const jsonLdData = JSON.parse(jsonLdScript.textContent);
          jsonLdArray = Array.isArray(jsonLdData) ? jsonLdData : [jsonLdData];
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Failed to parse jsonLd', e);
        }
      }

      // Extract playlist title and description from the main content div
      const mainDiv = parsed.doc.querySelector('main > div');
      const playlistTitleH = mainDiv?.querySelector('h1, h2, h3, h4, h5, h6');
      const playlistDescriptionP = mainDiv?.querySelector('p');

      block.innerHTML = parsed.playlistEl.innerHTML;

      // Store playlist metadata for API-loaded playlists
      if (playlistTitleH) block.dataset.playlistTitle = playlistTitleH.textContent.trim();
      if (playlistDescriptionP) block.dataset.playlistDescription = playlistDescriptionP.textContent.trim();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to load playlist', error);
    } finally {
      block.classList.remove('hide-playlist');
    }
  }

  if (!block.children.length) return;

  let defaultContent = playlistSection.querySelector('.default-content-wrapper');
  if (!defaultContent && playlistId) {
    defaultContent = htmlToElement(`
  <div class="default-content-wrapper"></div>
`);
    playlistSection.prepend(defaultContent);
  }

  const main = document.querySelector('main');
  main.classList.add('playlist-page');
  let playerContainer = document.querySelector('[data-playlist-player-container]');
  if (!playerContainer) {
    playerContainer = htmlToElement('<div class="playlist-player-container" data-playlist-player-container></div>');
    if (playlistId) {
      playlistSection.before(playerContainer);
    } else {
      playlistSection.parentElement.prepend(playerContainer);
    }
  }

  const activeVideoIndex = getQueryStringParameter('video') || 0;

  // Populate defaultContent with stored playlist metadata for API-loaded playlists
  if (playlistId && defaultContent && block.dataset.playlistTitle) {
    const titleH = htmlToElement(`<h3>${block.dataset.playlistTitle}</h3>`);
    defaultContent.append(titleH);

    if (block.dataset.playlistDescription) {
      const descriptionP = htmlToElement(`<p>${block.dataset.playlistDescription}</p>`);
      defaultContent.append(descriptionP);
    }
  }

  decoratePlaylistHeader(block, playlist);

  [...block.children].forEach((videoRow, videoIndex) => {
    videoRow.classList.add('playlist-item');
    const [videoCell, videoDataCell, jsonLdCell] = videoRow.children;
    const [srcP] = videoCell.children;
    videoCell.classList.add('playlist-item-thumbnail');
    videoCell.setAttribute('data-playlist-item-progress-box', '');
    videoDataCell.classList.add('playlist-item-content');

    const [titleH, descriptionP, durationP, transcriptP] = videoDataCell.children;
    titleH.classList.add('playlist-item-title');

    const video = {
      src: srcP.textContent,
      title: titleH.textContent,
      description: descriptionP.textContent,
      duration: durationP.textContent,
      transcriptUrl: transcriptP.textContent,
      el: videoRow,
    };

    // remove elements that don't need to show here.
    srcP.remove();
    descriptionP.remove();
    durationP.remove();
    transcriptP.remove();

    // Handle jsonLd for thumbnails
    let jsonLdForVideo = null;

    // For manual authoring: jsonLd is in the third cell
    if (jsonLdCell) {
      jsonLdCell.replaceWith(htmlToElement(`<script type="application/ld+json">${jsonLdCell.textContent}</script>`));
      jsonLdForVideo = jsonLdCell.textContent;
    }
    // For API-loaded playlists: jsonLd is in the stored array
    else if (jsonLdArray.length > 0 && jsonLdArray[videoIndex]) {
      jsonLdForVideo = JSON.stringify(jsonLdArray[videoIndex]);
    }

    // add thumbnail from jsonld if available
    const thumbnailUrl = getVideoThumbnailUrl(video.src, jsonLdForVideo);
    if (thumbnailUrl) {
      videoCell.innerHTML = `<img src="${thumbnailUrl}" alt="${video.title}">`;
    }

    // item bottom status
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
    videoRow.addEventListener('click', () => {
      playlist.activateVideoByIndex(videoIndex);
    });

    // always do this at the end.
    playlist.updateVideoByIndex(videoIndex, video);
  });

  decorateIcons(playlistSection);

  // Only show playlist options if there are videos in the playlist
  if (playlist.length > 0) {
    const playlistOptions = htmlToElement(`<div class="playlist-options">
      <div class="playlist-options-autoplay">
          <input type="checkbox" id="playlist-options-autoplay" checked=${playlist?.options?.autoplayNext || true}>
          <label for="playlist-options-autoplay">
            <span data-placeholder="${LABELS.autoPlayNextVideo}">Auto Play Next Video</span>
          </label>
      </div>
    </div>`);
    decoratePlaceholders(playlistOptions);
    // bottom options
    block.parentElement.append(playlistOptions);

    document.querySelector('#playlist-options-autoplay').addEventListener('change', (event) => {
      playlist.updateOptions({ autoplayNext: event.target.checked });
    });
  }

  playlist.activateVideoByIndex(activeVideoIndex);

  // handle browser back within history changes
  window.addEventListener('popstate', (event) => {
    if (event.state?.video) {
      playlist.activateVideoByIndex(event.state.video);
    } else if (!event.state) {
      playlist.activateVideoByIndex(0);
    }
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
