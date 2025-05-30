/*
 * Embed Block
 * Show videos and social posts directly on your page
 * https://www.hlx.live/developer/block-collection/embed
 */

import { pushVideoEvent, pushVideoMetadataOnLoad } from '../../scripts/analytics/lib-analytics.js';

const loadScript = (url, callback, type) => {
  const head = document.querySelector('head');
  const script = document.createElement('script');
  script.src = url;
  if (type) {
    script.setAttribute('type', type);
  }
  script.onload = callback;
  head.append(script);
  return script;
};

export function getMetadata(name, win = window) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...win.document.head.querySelectorAll(`meta[${attr}="${name}"]`)].map((m) => m.content).join(', ');
  return meta || '';
}

const getDefaultEmbed = (url) => `<div class="embed-video">
    <iframe 
      src="${url.href}"
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
      allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
    </iframe>
  </div>`;

const embedTwitter = (url) => {
  const embedHTML = `<blockquote class="twitter-tweet"><a href="${url.href}"></a></blockquote>`;
  loadScript('https://platform.twitter.com/widgets.js');
  return embedHTML;
};

/**
 *
 * @param {URL} url
 * @param {*} options
 * @returns
 */
const embedMpc = (url) => {
  const urlObject = new URL(url);
  window.addEventListener(
    'message',
    (event) => {
      if (event.data?.type === 'mpcStatus') {
        if (event.data.state === 'play') {
          pushVideoEvent({
            title: getMetadata('og:title'),
            description: getMetadata('og:description'),
            url: url.href,
            duration: getMetadata('video:duration'),
          });
        }
      }
    },
    false,
  );
  return getDefaultEmbed(urlObject);
};

const loadEmbed = (block, link, autoplay) => {
  if (block.classList.contains('embed-is-loaded')) {
    return;
  }

  const EMBEDS_CONFIG = [
    {
      match: ['twitter'],
      embed: embedTwitter,
    },
    {
      match: ['tv.adobe.com'],
      embed: embedMpc,
    },
  ];

  const config = EMBEDS_CONFIG.find((e) => e.match.some((match) => link.includes(match)));
  const url = new URL(link);
  if (config) {
    block.innerHTML = config.embed(url, autoplay);
    block.classList = `block embed embed-${config.match[0]}`;
  } else {
    block.innerHTML = getDefaultEmbed(url);
    block.classList = 'block embed';
  }
  block.classList.add('embed-is-loaded');
};

export default function decorate(block) {
  const link = block.querySelector('a').href;
  if (link?.includes('tv.adobe.com')) {
    const videoId = link.match(/\/v\/(\d+)/)?.[1];
    if (videoId) {
      const thumbnailUrl = `https://video.tv.adobe.com/v/${videoId}?format=jpeg`;
      pushVideoMetadataOnLoad(videoId, link, thumbnailUrl);
    }
  }

  block.textContent = '';
  loadEmbed(block, link);
}
