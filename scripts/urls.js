const lang = document.querySelector('html').lang || 'en';
export const environmentOrigin = window.location.origin;
export const profileUrl = `https://experienceleague.adobe.com/api/profile?lang=${lang}`;
export const JWTTokenUrl = `https://experienceleague.adobe.com/api/token?lang=${lang}`;
export const coveoTokenUrl = `https://experienceleague.adobe.com/api/coveo-token?lang=${lang}`;
export const coveoSearchResultsUrl = 'https://adobesystemsincorporatednonprod1.org.coveo.com/rest/search/v2';
export const liveEventsUrl = 'https://cdn.experienceleague.adobe.com/thumb/upcoming-events.json';
export const adlsUrl = 'https://learning.adobe.com/catalog.result.json';
export const searchUrl = 'https://experienceleague.adobe.com/search.html';
export const articleUrl = 'https://experienceleague.adobe.com/api/articles/';
export const solutionsUrl = 'https://experienceleague.adobe.com/api/solutions?page_size=100';
export const tocUrl = 'https://experienceleague.adobe.com/api/tocs/';
export const pathsUrl = `https://experienceleague.adobe.com/api/paths`;
export const exlmCDNUrl = 'https://cdn.experienceleague.adobe.com';
// Khoros Proxy URL (Determine the environment based on the host name)
const environment = window.location.hostname === 'experienceleague.adobe.com' ? '' : '-dev';
export const khorosProxyProfileAPI = `https://51837-exlmconverter${environment}.adobeioruntime.net/api/v1/web/main/khoros/plugins/custom/adobe/adobedx/profile-menu-list?lang=${lang}`;
// Browse Left nav
export const browseMoreProductsLink = `/${lang}/browse`;
// Machine Translation
export const automaticTranslationLink = `/${lang}/docs/contributor/contributor-guide/localization/machine-translation`;
// Tabbed cards
export const tabbedCardViewAllTroubleshootingLink = `/${lang}/docs`;
export const tabbedCardViewAllCoursesLink = `/home?lang=${lang}#courses`;
export const tabbedCardViewAllTutorialsLink = `/${lang}/docs/home-tutorials`;
export const tabbedCardViewAllDocumentationLink = `/${lang}/docs`;
export const tabbedCardViewAllCommunityLink = 'https://experienceleaguecommunities.adobe.com';
export const tabbedCardViewAllCertificationLink = `/${lang}/docs/certification/program/overview`;
export const tabbedCardViewAllOnDemandEventsLink = `/events?lang=${lang}#ondemandevents`;
// Recommended Courses
export const recommendedCoursesUrl = `${environmentOrigin}/home?lang=${lang}#dashboard/learning`;
