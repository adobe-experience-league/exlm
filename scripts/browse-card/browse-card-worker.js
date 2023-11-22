import CoveoDataService from '../data-service/coveo-data-service.js';

console.log("test");

self.addEventListener('message', async (event) => {
    const { param, contentType } = event.data;
  
    // Simulate an API call using CoveoDataService
    const cards = new CoveoDataService(param);
    const result = await cards.fetchBrowseCardsContent(contentType);
    console.log(result);
    // Send the result back to the main thread
    self.postMessage(result);
});