/**
 * formattedTags returns the array of base64 encoded tags after extracting from the tags selected in dialog
 * @param {string} inputString - The topics tag. E.g. exl:topic/QXBwIEJ1aWxkZXI=
 * @returns the topic tag. E.g. QXBwIEJ1aWxkZXI=
 */
export function formattedTags(inputString) {
  const resultArray = [];
  const items = inputString.split(',');

  items.forEach((item) => {
    let base64EncodedTagsArray;
    let product;
    let version;

    const [type, productBase64, versionBase64] = item.split('/');
    if (productBase64) {
      product = atob(productBase64);
    }
    if (versionBase64) {
      version = atob(versionBase64);
    }

    // Check if product and version are not undefined before appending to base64EncodedTagsArray
    if (product || version) {
      base64EncodedTagsArray = `${type}${product ? `/${product}` : ''}${version ? `/${version}` : ''}`;
      resultArray.push(base64EncodedTagsArray);
    }
  });
  return resultArray;
}

export function handleTopicSelection(block) {
  const wrapper = block || document;
  const selectedTopics = Array.from(wrapper.querySelectorAll('.browse-topics-item-active')).reduce((acc, curr) => {
    const id = curr.dataset.topicname;
    acc.push(id);
    return acc;
  }, []);

  if (window.headlessContext) {
    if (selectedTopics.length) {
      window.headlessContext.set({ topic: selectedTopics });
    } else {
      window.headlessContext.remove('topic');
    }
  }
  if (window.headlessQueryActionCreators) {
    let query = '';
    if (selectedTopics.length) {
      query = `(${selectedTopics.map((type) => `@el_features="${type}"`).join(' OR ')})`;
    }
    const advancedQueryAction = window.headlessQueryActionCreators.updateAdvancedSearchQueries({
      aq: query,
    });
    window.headlessSearchEngine.dispatch(advancedQueryAction);
    if (window.headlessSearchActionCreators) {
      const searchAction = window.headlessSearchActionCreators.executeSearch(window.logSearchboxSubmit());
      if (window.headlessPager) {
        window.headlessPager.selectPage(1);
      }
      window.headlessSearchEngine.dispatch(searchAction);
    }
  }
}
