import { sampleRUM } from './lib-franklin.js';
import { getPathDetails } from './scripts.js';

const { lang = 'en' } = getPathDetails() || {};
const errorPagePath = `/${lang}/404`;
const defaultErrorHTML = `
  <div>
    <p>Oops!</p>
    <h1>The requested content was not found.</h1>
    <p>Let us help you get back on the path.</p>
    <h4>Most popular sections</h4>
    <p><a href="/" title="Experience League homepage">Experience League homepage</a></p>
    <p><a href="/${lang}/docs">Documentation</a></p>
    <p><a href="/${lang}/playlists">Playlists</a></p>
    <p><a href="//experienceleaguecommunities.adobe.com/">Community</a></p>
  </div>
`;

const fetchAndParseHTML = async () => {
  const container = document.querySelector('.section > div > div:first-child');
  if (!container) return;
  try {
    const response = await fetch(errorPagePath);
    if (!response.ok) throw new Error('Network response was not ok');
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const contentElement = doc.querySelector('main > div');
    if (contentElement) {
      container.prepend(contentElement);
    } else {
      container.insertAdjacentHTML('afterbegin', defaultErrorHTML);
    }
  } catch (error) {
    container.insertAdjacentHTML('afterbegin', defaultErrorHTML);
  }
};

window.addEventListener('load', () => {
  sampleRUM('404', { source: document.referrer });
  fetchAndParseHTML();
});
