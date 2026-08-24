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
  const attr = name?.includes(':') ? 'property' : 'name';
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
 * @returns
 */
const embedMpc = (url, block) => {
  const urlObject = new URL(url);
  let completed = false;

  const getVideoDetails = () => ({
    title: getMetadata('og:title'),
    description: getMetadata('og:description'),
    url: url.href,
    duration: getMetadata('video:duration'),
  });

  const handleMessage = (event) => {
    const iframe = block.querySelector('iframe');
    // Check if message is from this block's iframe
    if (!iframe || event.source !== iframe.contentWindow || event.data?.type !== 'mpcStatus') return;

    if (event.data.state === 'play') {
      pushVideoEvent(getVideoDetails());
    } else if (event.data.state === 'complete' && !completed) {
      completed = true;
      pushVideoEvent(getVideoDetails(), 'videoCompleted');
    }
  };

  window.addEventListener('message', handleMessage, false);
  return getDefaultEmbed(urlObject);
};

const loadEmbed = (block, link) => {
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
    block.innerHTML = config.embed(url, block);
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
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      observer.disconnect();
      loadEmbed(block, link);
    }
  });
  observer.observe(block);
}
