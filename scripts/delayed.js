// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';
// add more delayed functionality here

// Core Web Vitals RUM collection
sampleRUM('cwv');

/**
 * Loads prism for syntax highlighting
 * @param {Document} document
 */
function loadPrism(document) {
  const highlightable = document.querySelector(
    'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code',
  );
  if (!highlightable) return; // exit, no need to load prism if nothing to highlight

  // see: https://prismjs.com/docs/Prism.html#.manual
  window.Prism = window.Prism || {};
  window.Prism.manual = true;
  import('./prism.js')
    .then(() => {
      // see: https://prismjs.com/plugins/autoloader/
      window.Prism.plugins.autoloader.languages_path = '/scripts/prism-grammars/';
      // run prism in async mode; uses webworker.
      window.Prism.highlightAll(true);
    })
    // eslint-disable-next-line no-console
    .catch((err) => console.error(err));
}

loadPrism(document);

function pageLoadModel() {
  return {
    event: 'page loaded',
    web: {
      webPageDetails: {
        URL: window.location.href,
        cleanURL: 'experienceleague.adobe.com/#home',
        domain: window.location.host,
        mainSiteSection: '',
        name: document.title,
        pageLanguage: window.document.getElementsByTagName('html')[0].getAttribute('lang') || 'en',
        pageName: `xl${window.location.pathname.replace('/', ':').replace('-', ' ')}`,
        pageType: 'webpage',
        pageViews: { value: 1 },
        prevPage: '',
        userAgent: window.navigator.userAgent,
        previousPageName: '',
        recordid: '',
        server: window.location.host,
        siteSection: '',
        siteSubSection1: '',
        siteSubSection2: '',
        siteSubSection3: '',
        siteSubSection4: '',
        siteSubSection5: '',
        solution: document.querySelector('meta[name="solution"]')
          ? document.querySelector('meta[name="solution"]').content
          : '',
        solutionVersion: '',
        subSolution: '',
        type: document.querySelector('meta[name="type"]') ? document.querySelector('meta[name="type"]').content : '',
      },
    },
  };
}

function linkClickModel(e) {
  window.adobeDataLayer = window.adobeDataLayer || [];

  window.adobeDataLayer.push({
    event: 'linkClicked',
    link: {
      destinationDomain: '<Link HREF Value>',
      linkLocation: '<Position of link on page>',
      linkTitle: '<name of the link clicked>',
      linkType: '<’other’ || ‘exit’ || ‘download’>',
      solution: '<Adobe Solution link pertains to>',
    },
    web: {
      webInteraction: {
        URL: '<Link HREF Value>',
        linkClicks: { value: 1 },
        name: '<name of the link clicked>',
        type: '<’other’ || ‘exit’ || ‘download’>',
      },
    },
  });
  window.setTimeout(() => {
    window.location.href = e.target.href;
  }, 1000);
}

function loadAnalyticsEvents() {
  const linkClicked = document.querySelectorAll('a');
  linkClicked.forEach((linkElement) => {
    linkElement.addEventListener('click', (e) => {
      e.preventDefault();
      console.log(e);
      if (e.target.tagName === 'A') {
        linkClickModel(e);
      }
    });
  });
}

window.adobeDataLayer.push(pageLoadModel());
loadAnalyticsEvents();
