import { fetchPlaceholders } from "../lib-franklin.js";
import API_COVEO from "../constants.js";

/**
 * Module for handling cards.
 * @module CardsAbstraction
 */

/**
 * Creates a new instance of CardsAbstraction.
 * @constructor
 * @param {Array} dataSources - An array of data sources for the cards.
 */
export default function CardsAbstraction(dataSources) {
    /**
     * The array of data sources for the cards.
     * @type {Array}
     */
    this.dataSources = dataSources;

    /**
     * Converts a string to title case.
     *
     * @param {string} str - The input string to be converted to title case.
     * @returns {string} - The title case version of the input string.
     */
    this.toTitleCase = (str) => str.replace(/\b\w/g, (match) => match.toUpperCase());

    /**
     * Fetches data from a specified data source.
     * @async
     * @function
     * @param {Object} dataSource - The data source to fetch data from.
     * @returns {Array} An array of results from the data source.
     */
    this.fetchData = async (dataSource) => {
        try {
            const response = await fetch(dataSource.url, {
                method: "POST",
                body: JSON.stringify(dataSource.param)
            });
            const data = await response.json();
            return data.results || [];
        } catch (error) {
            console.error(`Error fetching data from ${dataSource.url}`, error);
            return [];
        }
    }

    /**
     * Maps results from a specific API source to a common format.
     * @function
     * @param {string} apiSource - The API source name.
     * @param {Object} result - The result to be mapped.
     * @returns {Object} The mapped result in a common format.
     */
    this.mapResults = (apiSource, result) => {
        let mappedResult = {
            contentType: "",
            thumbnail: "",
            product: "",
            title: "",
            description: "",
            tags: [],
            eventDateTime: "",
            contributor: {},
            copyLink: "",
            bookmarkLink: "",
            viewLink: "",
            viewLinkText: ""
        };
        if (apiSource === API_COVEO.NAME) {
            const contentType = Array.isArray(result?.raw?.type) ? result?.raw?.type[0] : result?.raw?.type;
            const product = Array.isArray(result?.raw?.el_product) ? result?.raw?.el_product[0] : result?.raw?.el_product;

            mappedResult = {
                contentType,
                thumbnail: "",
                product,
                title: result?.title,
                description: result?.excerpt,
                tags: [{
                    icon: result?.raw?.el_view_status ? "eye" : "avatar",
                    text: result?.raw?.el_view_status || this.placeholders.developer
                },{
                    icon: result?.raw?.el_reply_status ? "reply" : "book",
                    text: result?.raw?.el_reply_status || this.placeholders.lesson
                }],
                eventDateTime: result?.raw?.date,
                contributor: {
                    thumbnail: "",
                    name: "",
                    level: "",
                    date: ""
                },
                copyLink: result?.uri,
                bookmarkLink: "",
                viewLink: result?.uri,
                viewLinkText: contentType ? this.placeholders[`viewLink${this.toTitleCase(contentType)}`] : ""
            };
        }
        return mappedResult;
    }

    /**
     * Maps data from a data source to a common format.
     * @async
     * @function
     * @param {Object} source - The data source to map.
     * @returns {Array} An array of mapped results.
     */
    this.mapDataSource = async (source) => {
        const data = await this.fetchData(source);        
        return data.map(result => this.mapResults(source.name, result));
    }

    /**
     * Maps data from all data sources to a common format.
     * @async
     * @function
     * @returns {Array} An array of mapped results from all data sources.
     */
    this.mapDataSources = async () => {
        const mappedDataPromises = this.dataSources.map(source => this.mapDataSource(source));
        const mappedDataArray = await Promise.all(mappedDataPromises);
        const combinedData = [].concat(...mappedDataArray);        
        return combinedData;
    }

    /**
     * Gets card data by fetching placeholders and mapping data from all sources.
     * @async
     * @function
     * @returns {Array} An array of card data.
     */
    this.getCardData = async () => {
        this.placeholders = await fetchPlaceholders();
        return this.mapDataSources();
    }
}
