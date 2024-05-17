/* eslint-disable no-console */
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';
import { MPCListener, MCP_EVENT } from './mpc-util.js';

/**
 * @typedef {Object} Video
 * // src, autoplay = true, title, description, transcriptUrl
 * @property {string} src
 * @property {boolean} autoplay
 * @property {string} title
 * @property {string} description
 * @property {string} transcriptUrl
 * @property {string} duration
 * @property {string} thumbnailUrl
 * @property {boolean} active
 * @property {number} currentTime
 * @property {boolean} complete
 * @property {HTMLElement} el
 * @returns
 */

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
 */
function newPlayer(video) {
  const { src, autoplay = false, title, description, transcriptUrl, currentTime = 0 } = video;
  const iframeAllowOptions = ['fullscreen', 'accelerometer', 'encrypted-media', 'gyroscope', 'picture-in-picture'];
  if (autoplay) iframeAllowOptions.push('autoplay');

  return htmlToElement(`
        <div class="playlist-player">
            <div class="playlist-player-video">
                <iframe 
                    src="${src}?t=${currentTime}&autoplay=${autoplay}" 
                    frameborder="0" 
                    allow="${iframeAllowOptions.join('; ')}">
                </iframe>
            </div>
            <div class="playlist-player-info">
                <h3 class="playlist-player-info-title">${title}</h3>
                <p class="playlist-player-info-description">${description}</p>
                <div class="playlist-player-info-transcript" data-transcript="${transcriptUrl}">
                    <a href="javascrpt:void(0)">&gt; Transcript</a>
                </div>
            </div>
        </div>
    `);
}

/**
 * @param {HTMLElement} block
 * @param {Array} videos
 */
function decoratePlaylistHeader(block, videos) {
  const playlistSection = block.closest('.section');
  const defaultContent = playlistSection.querySelector('.default-content-wrapper');
  defaultContent.prepend(
    htmlToElement(`<div class="playlist-info">
        <b>PLAYLIST</b>
        <div>${iconSpan('list')} ${videos.length} Tutorials</div>
    </div>`),
  );
  defaultContent.append(
    htmlToElement(`<div class="playlist-actions">
        <div>${iconSpan('bookmark')} Save Playlist</div>
        <div>${iconSpan('copy-link')} Share Playlist</div>
    </div>`),
  );
}

/**
 * Shows the video at the given count
 * @param {*} count
 */
function updatePlayer(video) {
  const exisatingPlayer = document.querySelector('.playlist-player');
  if (exisatingPlayer?.querySelector('iframe').src?.startsWith(video.src)) return;
  const player = newPlayer(video);
  const playerContainer = document.querySelector('.playlist-player-container');
  playerContainer.innerHTML = '';
  playerContainer.append(player);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// get from localStorage or create a new array
let savedVideos = [];
if (localStorage.getItem('videos')) {
  try {
    savedVideos = JSON.parse(localStorage.getItem('videos'));
  } catch (e) {
    localStorage.removeItem('videos');
  }
}

/**
 * array with proxy to update based on array values
 * @type {Array<Video>}
 */
const videos = new Proxy(savedVideos, {
  /**
   * @param {Array} target
   * @param {string} index
   * @param {Video} video
   */
  set(target, prop, val) {
    if (prop === 'length' || typeof prop === 'symbol') return target[prop];
    target[prop] = {
      ...target[prop],
      ...val,
    };
    const currentVideo = target[prop];
    const { active, el, currentTime, duration } = currentVideo;
    el.classList.toggle('active', active);
    updatePlayer(currentVideo);
    updateQueryStringParameter('video', prop);
    const nowViewingCount = document.querySelector('.playlist-now-viewing-count');
    if (nowViewingCount) nowViewingCount.textContent = parseInt(prop, 10) + 1;
    const thumbnail = el.querySelector('.playlist-item-thumbnail');
    thumbnail.style.setProperty('--playlist-item-progress', `${((currentTime || 0) / duration) * 100}%`);
    // update localStorage
    localStorage.setItem('videos', JSON.stringify(target));
    return true;
  },
});

// eslint-disable-next-line no-unused-vars
const playerOptions = {};

// const getActiveVideo = () => videos.find((video) => video.active);
const getActiveVideoIndex = () => videos.findIndex((video) => video.active);
const updateVideoByIndex = (index, props) => {
  videos[index] = { ...videos[index], ...props };
};
const updateActiveVideo = (props) => {
  const activeVideoIndex = getActiveVideoIndex();
  if (activeVideoIndex === -1) return;
  updateVideoByIndex(activeVideoIndex, props);
};

function handleSeek(event) {
  const { currentTime } = event;
  console.log(event);
  let activeVideoIndex = videos.findIndex((video) => video.active);
  if (activeVideoIndex === -1) activeVideoIndex = 0;
  if (currentTime >= 0) {
    updateActiveVideo({ currentTime });
  }
}

// function handleComplete() {
//   console.log('completed');
// }

const mpcListener = new MPCListener();
mpcListener.on(MCP_EVENT.LOAD, console.log);
mpcListener.on(MCP_EVENT.START, console.log);
mpcListener.on(MCP_EVENT.PLAY, console.log);
mpcListener.on(MCP_EVENT.PAUSE, console.log);
mpcListener.on(MCP_EVENT.TICK, handleSeek);
mpcListener.on(MCP_EVENT.MILESTONE, console.log);
mpcListener.on(MCP_EVENT.SEEK, handleSeek);
mpcListener.on(MCP_EVENT.CHAPTER, console.log);
mpcListener.on(MCP_EVENT.COMPLETE, console.log);
mpcListener.on(MCP_EVENT.ENTER_FULLSCREEN, console.log);

/**
 * @param {number|string} index
 */
function activateVideoByIndex(index) {
  mpcListener.pause();
  let i = parseInt(index, 10);
  if (!videos[i]) i = 0;
  const currentActiveIndex = getActiveVideoIndex();
  if (currentActiveIndex !== -1 && currentActiveIndex !== index) {
    updateActiveVideo({ active: false });
    updateVideoByIndex(index, { active: true });
  }
  mpcListener.resume();
}

/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const main = document.querySelector('main');
  main.classList.add('playlist-page');
  const playlistSection = block.closest('.section');
  const playerContainer = htmlToElement(`<div class="playlist-player-container"></div>`);
  playlistSection.parentElement.prepend(playerContainer);

  [...block.children].forEach((videoRow, videoIndex) => {
    videoRow.classList.add('playlist-item');
    const [videoCell, videoDataCell] = videoRow.children;
    videoCell.classList.add('playlist-item-thumbnail');
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
    videos[videoIndex] = video;

    // remove elements that don't need to show here.
    srcP.remove();
    descriptionP.remove();
    durationP.remove();
    transcriptP.remove();

    // item bottom status
    videoDataCell.append(
      htmlToElement(`<div class="playlist-item-meta">
              <div>${iconSpan('check')} In Progress</div>
              <div>${iconSpan('time')} ${toTimeInMinutes(video.duration)} MIN</div>
          </div>`),
    );

    videoRow.addEventListener('click', () => {
      activateVideoByIndex(videoIndex);
    });
  });

  // bottom options
  block.parentElement.append(
    htmlToElement(`<div class="playlist-options">
        <div class="playlist-options-autoplay">
            <input type="checkbox" id="playlist-options-autoplay">
            <label for="playlist-options-autoplay">Autoplay next Video</label>
        </div>
    </div>`),
  );

  const activeVideoIndex = getQueryStringParameter('video') || 0;

  // now viewing
  block.parentElement.append(
    htmlToElement(`<div class="playlist-now-viewing">
        <b>NOW VIEWING</b>
        <b><span class="playlist-now-viewing-count">${activeVideoIndex + 1}</span> OF ${videos.length}</b>
    </div>`),
  );

  decoratePlaylistHeader(block, videos);
  decorateIcons(playlistSection);
  activateVideoByIndex(activeVideoIndex);

  // handle browser back within history changes
  window.addEventListener('popstate', (event) => {
    if (event.state?.video) {
      activateVideoByIndex(event.state.video);
    }
  });
}
