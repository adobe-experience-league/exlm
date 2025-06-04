import { htmlToElement } from '../../scripts/scripts.js';

const getDefaultEmbed = (url, options) => `<div class="video-frame">
    <iframe 
      src="${url.href}"
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
      allowfullscreen=""
      autoplay="${options.autoplay}"
      scrolling="no"
      allow="encrypted-media"
      title="Content from ${url.hostname}"
      loading="lazy">
    </iframe>
  </div>`;

const embedMpc = (url, options = { autoplay: false }) => {
  const urlObject = new URL(url);
  if (options.autoplay) {
    urlObject.searchParams.set('autoplay', 'true');
  }
  return getDefaultEmbed(urlObject, options);
};

const getMpcVideoDetailsByUrl = (url) =>
  new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('format', 'json');

      fetch(urlObj.href)
        .then((response) => response.json())
        .then((data) => resolve(data))
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Error while fetching url', error);
          resolve(undefined);
        });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to process the URL:', error);
      reject(new Error(`'Failed to process the URL:' ${error?.message})`));
    }
  });

const loadEmbed = (block, link) => {
  if (block.classList.contains('embed-is-loaded')) {
    return;
  }

  const url = new URL(link);
  const options = {
    autoplay: true,
  };
  url.searchParams.set('autoplay', options.autoplay);
  block.innerHTML = embedMpc(url, options);
  block.classList = 'block video-embed';
  block.classList.add('embed-is-loaded');
};

export default async function decorate(block) {
  const anchor = block.querySelector('a');
  if (!anchor) return;

  const { href } = anchor;
  block.textContent = '';

  if (href) {
    const wrapper = document.createElement('div');
    wrapper.className = 'video-frame';

    getMpcVideoDetailsByUrl(href)
      .then((videoDetails) => {
        const poster = videoDetails?.video?.poster;
        if (poster) {
          const videoImg = htmlToElement(`<img class="video-poster" src=${poster} alt="video-poster"></img>`);
          wrapper.appendChild(videoImg);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching video details:', error);
      });

    const videoOverlay = htmlToElement(`<div class="video-overlay">
      <button aria-label="play" class="video-overlay-play-button">
        <div class="video-overlay-play-circle">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="video-overlay-play-icon">
            <path d="M8 5v14l11-7z"></path>
            <path d="M0 0h24v24H0z" fill="none"></path>
          </svg>
        </div>
      </button>
    </div>`);

    wrapper.prepend(videoOverlay);

    wrapper.addEventListener('click', () => {
      loadEmbed(block, href);
    });

    block.appendChild(wrapper);
  }
}
