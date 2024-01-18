export function pageLoadModel() {
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
        pageName: `xl${window.location.pathname.replaceAll('/', ':').replaceAll('-', ' ')}`,
        pageType: document.querySelector('meta[name="type"]')
          ? document.querySelector('meta[name="type"]').content
          : 'webpage',
        pageViews: { value: 1 },
        prevPage: document.querySelector('meta[name="prev-page"]')
          ? document.querySelector('meta[name="prev-page"]').content
          : '',
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

export function linkClickModel(e) {
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
