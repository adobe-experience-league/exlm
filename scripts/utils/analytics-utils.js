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
export default function setTargetDataAsBlockAttribute(block, data) {
  if (data?.meta) {
    block.setAttribute('data-analytics-target-meta', JSON.stringify(data?.meta));
  }
}
