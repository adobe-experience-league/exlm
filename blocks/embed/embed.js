/*
 * Embed Block
 * Show videos and social posts directly on your page
 * https://www.hlx.live/developer/block-collection/embed
 */

import { pushVideoEvent } from '../../scripts/analytics/lib-analytics.js';

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

const getDefaultEmbed = (url, oprions = {}) => `<div class="embed-video">
    <iframe 
      src="${url.href}"
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
      allowfullscreen=""
      autoplay="${oprions.autoplay ? 'true' : ''}"
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
const embedMpc = (url, options = { autoplay: false }) => {
  const urlObject = new URL(url);
  if (options.autoplay) {
    urlObject.searchParams.set('autoplay', 'true');
  }
  window.addEventListener(
    'message',
    (event) => {
      if (event.origin !== 'https://video.tv.adobe.com') return;
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
  return getDefaultEmbed(urlObject, options);
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
    block.innerHTML = config.embed(url, { autoplay });
    block.classList = `block embed embed-${config.match[0]}`;
  } else {
    block.innerHTML = getDefaultEmbed(url);
    block.classList = 'block embed';
  }
  block.classList.add('embed-is-loaded');
};

export default function decorate(block) {
  const placeholder = block.querySelector('picture');
  const link = block.querySelector('a').href;
  block.textContent = '';
  if (placeholder) {
    const wrapper = document.createElement('div');
    wrapper.className = 'embed-placeholder';
    wrapper.innerHTML = `<div class="embed-video-overlay">
                <button aria-label="play" class="embed-video-overlay-play"><div class="embed-video-overlay-circle"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="embed-video-overlay-icon"><path d="M8 5v14l11-7z"></path> <path d="M0 0h24v24H0z" fill="none"></path></svg></div></button>
              </div>`;
    wrapper.prepend(placeholder);
    wrapper.addEventListener('click', () => {
      loadEmbed(block, link, true);
    });
    block.append(wrapper);
  } else {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        loadEmbed(block, link);
      }
    });
    observer.observe(block);
  }
}
