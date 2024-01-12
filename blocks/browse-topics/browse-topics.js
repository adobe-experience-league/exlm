import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createTag, htmlToElement } from '../../scripts/scripts.js';

/**
 * formattedTopicsTags returns the array of base64 encoded tags after extracting from the tags selected in dialog
 * @param {string} inputString - The topics tag. E.g. exl:topic/QXBwIEJ1aWxkZXI=
 * @returns the topic tag. E.g. QXBwIEJ1aWxkZXI=
 */
function formattedTopicsTags(inputString) {
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

function handleTopicSelection(block) {
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

export default async function decorate(block) {
  // Extracting elements from the block
  const headingElement = block.querySelector('div:nth-child(1) > div');
  const topics = block.querySelector('div:nth-child(2) > div').textContent.trim();
  const allTopicsTags = topics !== '' ? formattedTopicsTags(topics) : '';

  // Clearing the block's content
  block.innerHTML = '';
  block.classList.add('browse-topics-block');

  const headerDiv = htmlToElement(`
    <div class="browse-topics-block-header">
      <div class="browse-topics-block-title">
          <h2>${headingElement?.textContent.trim()}</h2>
      </div>
    </div>
  `);
  // Appending header div to the block
  block.appendChild(headerDiv);
  await decorateIcons(headerDiv);

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('browse-topics-block-content');

  allTopicsTags.forEach((topicsButtonTitle) => {
    const topicName = atob(topicsButtonTitle);
    const topicsButtonDiv = createTag('button', { class: 'browse-topics browse-topics-item' });
    topicsButtonDiv.dataset.topicname = topicName;
    // decode tags here using atob
    topicsButtonDiv.innerHTML = topicName;
    // click event goes here
    contentDiv.appendChild(topicsButtonDiv);
  });

  contentDiv.addEventListener('click', (e) => {
    if (e.target?.classList?.contains('browse-topics-item')) {
      if (e.target.classList.contains('browse-topics-item-active')) {
        e.target.classList.remove('browse-topics-item-active');
      } else {
        e.target.classList.add('browse-topics-item-active');
      }
      handleTopicSelection(contentDiv);
    }
  });
  const decodedHash = decodeURIComponent(window.location.hash);
  const filtersInfo = decodedHash.split('&').find((s) => s.includes('@el_features'));
  if (filtersInfo) {
    let selectedTopics;
    const [, multipleFeaturesCheck] = filtersInfo.match(/@el_features==\(([^)]+)/) || [];
    let topicsString = multipleFeaturesCheck;
    if (!topicsString) {
      const [, singleFeatureCheck] = filtersInfo.match(/@el_features=("[^"]*")/) || [];
      topicsString = singleFeatureCheck;
    }
    if (topicsString) {
      selectedTopics = topicsString.split(',').map((s) => s.trim().replace(/"/g, ''));
    }
    selectedTopics.forEach((topic) => {
      const element = contentDiv.querySelector(`.browse-topics-item[data-topicname="${topic}"]`);
      element.classList.add('browse-topics-item-active');
    });
    handleTopicSelection(contentDiv);
  }
  block.appendChild(contentDiv);

  /* Append browse topics right above the filters section */
  const filtersFormEl = document.querySelector('.browse-filters-form');
  filtersFormEl.insertBefore(block, filtersFormEl.children[3]);
}
