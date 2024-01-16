/**
 * formattedTopicsTags returns the array of base64 encoded tags after extracting from the tags selected in dialog
 * @param {string} inputString - The topics tag. E.g. exl:topic/QXBwIEJ1aWxkZXI=
 * @returns the topic tag. E.g. QXBwIEJ1aWxkZXI=
 */
export function formattedTopicsTags(inputString) {
  const splitArray = inputString.split(',');
  // eslint-disable-next-line array-callback-return, consistent-return
  const base64EncodedTagsArray = splitArray.map((item) => {
    const lastIndex = item.lastIndexOf('/');
    if (lastIndex !== -1) {
      const actualTagBase64Encoded = item.substring(lastIndex + 1);
      return actualTagBase64Encoded;
    }
  });
  return base64EncodedTagsArray;
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
      const [firstTopic] = selectedTopics;
      if (selectedTopics.length === 1) {
        query = `@el_features=${firstTopic}`;
      } else {
        // eslint-disable-next-line no-useless-escape
        query = `@el_features==(${selectedTopics.map((s) => `\"${s}\"`).join(',')})`;
      }
    }
    const advancedQueryAction = window.headlessQueryActionCreators.updateAdvancedSearchQueries({
      aq: query,
    });
    window.headlessSearchEngine.dispatch(advancedQueryAction);
    if (window.headlessSearchActionCreators) {
      const searchAction = window.headlessSearchActionCreators.executeSearch(window.logSearchboxSubmit());
      window.headlessSearchEngine.dispatch(searchAction);
    }
  }
}
