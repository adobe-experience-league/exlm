/**
 * Adds a data-analytics-coveo-meta attribute to each recommendation-marquee block on the page.
 * Value is in the format block-name-coveo-X, where X represents the order of the block on the page.
 */
export function setCoveoCountAsBlockAttribute(block) {
  const blocks = document.querySelectorAll(`.${block}.block`);
  let coveoCount = 1;

  blocks.forEach((el) => {
    el.setAttribute('data-analytics-coveo-meta', `${block}-coveo-${coveoCount}`);
    coveoCount += 1;
  });
}

/**
 * Sets target data as a data attribute on the given block element.
 *
 * This function checks if the provided `data` object contains a `meta` property.
 * If the `meta` property exists, it serializes the metadata as a JSON string and
 * adds it to the specified block element as a custom data attribute `data-analytics-target-meta`.
 *
 * @param {Object} data - The data returned from target.
 * @param {HTMLElement} block - The DOM element to which the meta data will be added as an attribute.
 *
 */
export function setTargetDataAsBlockAttribute(data, block) {
  if (data?.meta) {
    block.setAttribute('data-analytics-target-meta', JSON.stringify(data?.meta));
  }
}
