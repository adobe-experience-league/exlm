import CardsAbstraction from "../../scripts/cards/cardsAbstraction.js";
import API_COVEO from "../../scripts/constants.js";
/**
 * Decorate function to process and log the mapped data.
 * @param {object} block - The block of data to process.
 */
export default async function decorate(block) {
	console.log(block);
	const dataSources = [{
		name: API_COVEO.NAME,
		url: API_COVEO.URL,
		param: {
			contentType: "course",
			sort: "relevancy"
		}
	}];
	const curratedCards = new CardsAbstraction(dataSources);
	const data = await curratedCards.getCardData();
	console.log(data);
}