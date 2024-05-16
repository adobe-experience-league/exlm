import { decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';

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
 *
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
 *
 * @param {Video} video
 * @returns
 */
function generateJsonLd(video) {
  if (video?.src && video?.src?.includes('tv.adobe.com/v/')) {
    const script = htmlToElement(`<script type="application/ld+json"></script>`);
    const jsonLdUrl = new URL(video.src);
    // add format=json-ld query param
    jsonLdUrl.searchParams.set('format', 'json-ld');
    fetch(jsonLdUrl.href)
      .then((response) => response.json())
      .then((data) => {
        script.textContent = JSON.stringify(data?.jsonLinkedData);
      });
    return script;
  }
  return null;
}

function iconSpan(icon) {
  return `<span class="icon icon-${icon}"></span>`;
}

function newPlayer({ src, autoplay = true, title, description, transcriptUrl }) {
  const iframeAllowOptions = ['accelerometer', 'encrypted-media', 'gyroscope', 'picture-in-picture'];
  if (autoplay) iframeAllowOptions.push('autoplay');

  return htmlToElement(`
        <div class="playlist-player">
            <div class="playlist-player-video">
                <iframe src="${src}" frameborder="0" allow="${iframeAllowOptions.join('; ')}" allowfullscreen></iframe>
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
 *
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
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const main = document.querySelector('main');
  main.classList.add('playlist-page');
  const playlistSection = block.closest('.section');
  const playerContainer = htmlToElement(`<div class="playlist-player-container"></div>`);
  playlistSection.parentElement.prepend(playerContainer);
  const videos = [];

  function updateQueryStringParameter(key, value) {
    const baseUrl = window.location.href.split('?')[0];
    const url = new URL(baseUrl);
    url.searchParams.set(key, value);
    window.history.pushState({ [key]: value }, '', url);
  }

  function getQueryStringParameter(key) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key);
  }
  function showVideo(count) {
    const index = count - 1;
    const player = newPlayer(videos[index]);
    playerContainer.innerHTML = '';
    playerContainer.append(player);
    // check if mobile (less than 600px)
    if (window.matchMedia('(max-width: 600px)').matches) {
      // scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
    document.querySelector('.playlist-item.active')?.classList.remove('active');
    document.querySelectorAll('.playlist-item')[index].classList.add('active');
    updateQueryStringParameter('video', count);
  }

  [...block.children].forEach((videoRow, videoIndex) => {
    videoRow.classList.add('playlist-item');
    const [videoCell, videoDataCell] = videoRow.children;
    videoDataCell.classList.add('playlist-item-content');

    const [srcP, pictureP] = videoCell.children;
    const [titleH, descriptionP, durationP, transcriptP] = videoDataCell.children;

    titleH.outerHTML = `<h6>${titleH.textContent}</h6>`;
    srcP.style.display = 'none';
    descriptionP.style.display = 'none';
    durationP.style.display = 'none';
    transcriptP.style.display = 'none';

    videos.push({
      src: srcP.textContent,
      title: titleH.textContent,
      description: descriptionP.textContent,
      duration: durationP.textContent,
      transcriptUrl: transcriptP.textContent,
      thumbnailUrl: pictureP.querySelector('img').src,
    });

    videoDataCell.append(
      htmlToElement(`<div class="playlist-item-meta">
              <div>${iconSpan('check')} In Progress</div>
              <div>${iconSpan('time')} ${toTimeInMinutes(durationP.textContent)} MIN</div>
          </div>`),
    );
    const jsonLd = generateJsonLd(videos[videoIndex]);
    if (jsonLd) videoRow.append(generateJsonLd(videos[videoIndex]));

    videoRow.addEventListener('click', () => {
      showVideo(videoIndex + 1);
    });
  });

  block.parentElement.append(
    htmlToElement(`<div class="playlist-options">
  
  </div>`),
  );
  decoratePlaylistHeader(block, videos);
  decorateIcons(playlistSection);
  showVideo(getQueryStringParameter('video') || 1);

  // handle browser back within history changes
  window.addEventListener('popstate', (event) => {
    if (event.state?.video) {
      showVideo(event.state.video);
    }
  });
}
