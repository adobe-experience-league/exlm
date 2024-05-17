import { decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { Playlist } from './mpc-util.js';

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

/**
 * Update the query string parameter with the given key and value
 */
function updateQueryStringParameter(key, value) {
  const baseUrl = window.location.href.split('?')[0];
  const url = new URL(baseUrl);
  // do not update if same value
  if (url.searchParams.get(key) === value) return;
  url.searchParams.set(key, value);
  window.history.pushState({ [key]: value }, '', url);
}

/**
 * Get the query string parameter with the given key
 */
function getQueryStringParameter(key) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
}

/**
 * create an icon span (to be used with decorateIcons())
 */
function iconSpan(icon) {
  return `<span class="icon icon-${icon}"></span>`;
}

/**
 * @param {Video} video
 * @returns {HTMLElement}
 */
function newPlayer(video) {
  const { src, autoplay = false, title, description, transcriptUrl, currentTime = 0 } = video;
  const iframeAllowOptions = [
    'fullscreen',
    'accelerometer',
    'encrypted-media',
    'gyroscope',
    'picture-in-picture',
    'autoplay',
  ];

  return htmlToElement(`
        <div class="playlist-player" data-playlist-player>
            <div class="playlist-player-video">
                <iframe
                    src="${src}?t=${currentTime}&autoplay=${autoplay}" 
                    autoplay="${autoplay}"
                    frameborder="0" 
                    allow="${iframeAllowOptions.join('; ')}">
                </iframe>
            </div>
            <div class="playlist-player-info">
                <h3 class="playlist-player-info-title">${title}</h3>
                <p class="playlist-player-info-description">${description}</p>
                <details class="playlist-player-info-transcript" data-playlist-player-info-transcript="${transcriptUrl}">
                  <summary>Transcript</summary>
                  <p>loading...</p>
                </details>
            </div>
        </div>
    `);
}

/**
 * @param {HTMLElement} block
 * @param {number} videoLength
 */
function decoratePlaylistHeader(block, videoLength) {
  const playlistSection = block.closest('.section');
  const defaultContent = playlistSection.querySelector('.default-content-wrapper');
  defaultContent.prepend(
    htmlToElement(`<div class="playlist-info">
        <b>PLAYLIST</b>
        <div>${iconSpan('list')} ${videoLength} Tutorials</div>
    </div>`),
  );
  defaultContent.append(
    htmlToElement(`<div class="playlist-actions">
        <div>${iconSpan('bookmark')} Save Playlist</div>
        <div>${iconSpan('copy-link')} Share Playlist</div>
    </div>`),
  );
}

/** @param {string} transcriptUrl */
async function getCaptionParagraphs(transcriptUrl) {
  window.playlistCaptions = window.playlistCaptions || {};
  if (window.playlistCaptions[transcriptUrl]) return window.playlistCaptions[transcriptUrl];
  const response = await fetch(transcriptUrl);
  const transcriptJson = await response.json();
  const captions = transcriptJson?.captions || [];
  const paragraphs = [];
  let currentParagraph = '';
  captions.forEach(({ content, startOfParagraph }) => {
    if (startOfParagraph) {
      paragraphs.push(currentParagraph);
      currentParagraph = content;
    } else {
      currentParagraph += ` ${content}`;
    }
  });

  window.playlistCaptions[transcriptUrl] = paragraphs;
  return paragraphs;
}

function updateTranscript(transcriptDetail) {
  const transcriptUrl = transcriptDetail.getAttribute('data-playlist-player-info-transcript');
  transcriptDetail.addEventListener('toggle', (event) => {
    if (event.target.open && transcriptDetail.dataset.ready !== 'true') {
      getCaptionParagraphs(transcriptUrl).then((paragraphs) => {
        [...transcriptDetail.querySelectorAll('p')].forEach((p) => p.remove());
        paragraphs.forEach((paragraph) => transcriptDetail.append(htmlToElement(`<p>${paragraph}</p>`)));
        transcriptDetail.dataset.ready = 'true';
      });
    }
  });
}

/**
 * Shows the video at the given count
 * @param {import('./mpc-util.js').Video} video
 */
function updatePlayer(video) {
  const exisatingPlayer = document.querySelector('[data-playlist-player]');
  if (exisatingPlayer?.querySelector('iframe').src?.startsWith(video.src)) return;
  const player = newPlayer(video);
  const playerContainer = document.querySelector('[data-playlist-player-container]');
  const transcriptDetail = player.querySelector('[data-playlist-player-info-transcript]');
  updateTranscript(transcriptDetail);
  playerContainer.innerHTML = '';
  playerContainer.append(player);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 *
 * @param {number} videoIndex
 * @param {import('./mpc-util.js').Video} video
 */
function updateProgress(videoIndex, video) {
  const { el, currentTime, duration } = video;
  const nowViewingCount = document.querySelector('[data-playlist-now-viewing-count]');
  if (nowViewingCount) nowViewingCount.textContent = parseInt(videoIndex, 10) + 1;
  const progressBox = el.querySelector('[data-playlist-item-progress-box]');
  progressBox.style.setProperty('--playlist-item-progress', `${((currentTime || 0) / duration) * 100}%`);
}

const playlist = new Playlist();
playlist.onVideoChange((videos, vIndex) => {
  const currentVideo = videos[vIndex];
  const { active = false, el } = currentVideo;
  el.classList.toggle('active', active);
  updatePlayer(currentVideo);
  updateQueryStringParameter('video', playlist.getActiveVideoIndex());
  updateProgress(vIndex, currentVideo);
  return true;
});

// eslint-disable-next-line no-unused-vars
const playerOptions = {};

/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const main = document.querySelector('main');
  main.classList.add('playlist-page');
  const playlistSection = block.closest('.section');
  const playerContainer = htmlToElement(`<div class="playlist-player-container" data-playlist-player-container></div>`);
  playlistSection.parentElement.prepend(playerContainer);

  [...block.children].forEach((videoRow, videoIndex) => {
    videoRow.classList.add('playlist-item');
    const [videoCell, videoDataCell] = videoRow.children;
    videoCell.classList.add('playlist-item-thumbnail');
    videoCell.setAttribute('data-playlist-item-progress-box', '');
    videoDataCell.classList.add('playlist-item-content');

    const [srcP, pictureP] = videoCell.children;
    const [titleH, descriptionP, durationP, transcriptP] = videoDataCell.children;
    titleH.classList.add('playlist-item-title');

    const video = {
      src: srcP.textContent,
      title: titleH.textContent,
      description: descriptionP.textContent,
      duration: durationP.textContent,
      transcriptUrl: transcriptP.textContent,
      thumbnailUrl: pictureP.querySelector('img').src,
      el: videoRow,
    };
    playlist.updateVideoByIndex(videoIndex, video);

    // remove elements that don't need to show here.
    srcP.remove();
    descriptionP.remove();
    durationP.remove();
    transcriptP.remove();

    // item bottom status
    videoDataCell.append(
      htmlToElement(`<div class="playlist-item-meta">
              <div class="playlist-item-meta-status">${iconSpan('check')} In Progress</div>
              <div>${iconSpan('time')} ${toTimeInMinutes(video.duration)} MIN</div>
          </div>`),
    );

    videoRow.addEventListener('click', () => {
      playlist.activateVideoByIndex(videoIndex);
    });
  });

  // bottom options
  block.parentElement.append(
    htmlToElement(`<div class="playlist-options">
        <div class="playlist-options-autoplay">
            <input type="checkbox" id="playlist-options-autoplay" checked=${playlist?.options?.autoplayNext || true}>
            <label for="playlist-options-autoplay">Autoplay next Video</label>
        </div>
    </div>`),
  );

  document.querySelector('#playlist-options-autoplay').addEventListener('change', (event) => {
    playlist.updateOptions({ autoplayNext: event.target.checked });
  });

  const activeVideoIndex = getQueryStringParameter('video') || 0;

  // now viewing
  block.parentElement.append(
    htmlToElement(`<div class="playlist-now-viewing">
        <b>NOW VIEWING</b>
        <b><span class="playlist-now-viewing-count" data-playlist-now-viewing-count>${activeVideoIndex + 1}</span> OF ${playlist.length}</b>
    </div>`),
  );

  decoratePlaylistHeader(block, playlist.length);
  decorateIcons(playlistSection);
  playlist.activateVideoByIndex(activeVideoIndex);

  // // handle browser back within history changes
  // window.addEventListener('popstate', (event) => {
  //   if (event.state?.video) {
  //     playlist.activateVideoByIndex(event.state.video);
  //   }
  // });
}
