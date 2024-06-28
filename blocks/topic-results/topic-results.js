import { loadCSS } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';
import createTabs from './tabs.js';

/**
 * @param {HTMLDivElement} block
 */
function createHeading({ title, headding, resultCount, ResultTotal, viewMoreResultsLabel, viewMoreResultsUrl }) {
  return htmlToElement(`
    <div class="topics-header">
      <div class="topics-header-headding">
        <span>${title}</span>
        <h1>${headding}</h1>
      </div>
      <div class="topics-header-result">
        <p>Showing ${resultCount} of ${ResultTotal}</p>
        <a href="${viewMoreResultsUrl}">${viewMoreResultsLabel}</a>
      </div>
    </div>
  `);
}

/**
 * @param {HTMLDivElement} block
 */
export default async function decorate(block) {
  loadCSS(`${window.hlx.codeBasePath}/blocks/topic-results/tabs.css`);
  block.appendChild(
    createHeading({
      title: 'Topics',
      headding: 'Artificial Intelligence',
      resultCount: 10,
      ResultTotal: 100,
      viewMoreResultsLabel: 'View all results',
      viewMoreResultsUrl: '#',
    }),
  );

  block.appendChild(
    createTabs({
      title: 'Some Title',
      tabs: [
        { label: 'Maria Ahlefeldt', content: 'My content', selected: true },
        { label: 'Carl Andersen', content: 'My content' },
        { label: 'Ida da Fonseca', content: 'My content' },
        { label: 'Peter Müller', content: 'My content' },
      ],
    }),
  );
}
