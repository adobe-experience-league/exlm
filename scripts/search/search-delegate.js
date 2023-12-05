import CoveoDataService from '../data-service/coveo/coveo-data-service.js';
import { coveoSearchResultsUrl } from '../urls.js';

const SearchDelegate = (() => {
  const constructCoveoSearchParams = (query) => {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('count', 5);

    return params;
  };
  const fetchSearchSuggestions = async (query = '') =>
    /* eslint-disable-next-line no-async-promise-executor */
    new Promise(async (resolve, reject) => {
      const dataSource = {
        url: `${coveoSearchResultsUrl}/querySuggest`,
        param: constructCoveoSearchParams(query),
      };
      const coveoService = new CoveoDataService(dataSource);
      const searchHits = await coveoService.fetchDataFromSource();
      if (searchHits) {
        resolve(searchHits);
      } else {
        reject(new Error('An Error Occured'));
      }
    });

  return {
    fetchSearchSuggestions,
  };
})();

export default SearchDelegate;
