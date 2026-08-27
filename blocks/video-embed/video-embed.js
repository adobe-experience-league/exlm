import { getLocalizedVideoUrl } from '../../scripts/utils/video-utils.js';
import { getPathDetails } from '../../scripts/scripts.js';
import { getMetadata } from '../../scripts/lib-franklin.js';
import { pushVideoEvent, pushVideoMetadataOnLoad } from '../../scripts/analytics/lib-analytics.js';

const getDefaultEmbed = (url) => `<div class="video-frame">
    <iframe 
      src="${url.href}"
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
      allowfullscreen=""
      scrolling="no"
      allow="encrypted-media"
      title="Content from ${url.hostname}"
      loading="lazy">
    </iframe>
  </div>`;

const embedMpc = (url, block) => {
  const urlObject = new URL(url);
  let firstPlay = true;

  const handleMessage = (event) => {
    const iframe = block.querySelector('iframe');
    // Check if message is from this block's iframe
    if (
      iframe &&
      event.source === iframe.contentWindow &&
      event.data?.type === 'mpcStatus' &&
      event.data.state === 'play' &&
      firstPlay
    ) {
      firstPlay = false;
      const fullSolution = getMetadata('solution') || '';
      const solution = fullSolution?.split(',')[0]?.trim() || '';

      pushVideoEvent({
        title: getMetadata('og:title'),
        description: getMetadata('description'),
        url: url.href,
        duration: '',
        solution,
        fullSolution,
      });

      // Remove listener after first play
      window.removeEventListener('message', handleMessage);
    }
  };

  window.addEventListener('message', handleMessage, false);

  return getDefaultEmbed(urlObject);
};

const loadEmbed = (block, link) => {
  if (block.classList.contains('embed-is-loaded')) {
    return;
  }

  const url = new URL(link);
  block.innerHTML = embedMpc(url, block);
  block.classList = 'block video-embed';
  block.classList.add('embed-is-loaded');

  // Call pushVideoMetadataOnLoad if video is from tv.adobe.com
  if (url.href?.includes('tv.adobe.com')) {
    const videoId = url.href.match(/\/v\/(\d+)/)?.[1];
    if (videoId) {
      const thumbnailUrl = `https://video.tv.adobe.com/v/${videoId}?format=jpeg`;
      pushVideoMetadataOnLoad(videoId, url.href, thumbnailUrl);
    }
  }
};

export default async function decorate(block) {
  const anchor = block.querySelector('a');
  if (!anchor) return;

  const { href } = anchor;

  block.textContent = '';

  if (href) {
    const { lang = 'en' } = getPathDetails() || {};
    const locVideoUrl = await getLocalizedVideoUrl(href, lang);
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        loadEmbed(block, locVideoUrl);
      }
    });
    observer.observe(block);
  }
}
