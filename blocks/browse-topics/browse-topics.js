import { decorateIcons } from '../../scripts/lib-franklin.js';
import { htmlToElement } from '../../scripts/scripts.js';

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
    const topicsButtonDiv = document.createElement('div');
    topicsButtonDiv.classList.add('browse-topics');
    topicsButtonDiv.classList.add('topic');
    // decode tags here using atob
    topicsButtonDiv.innerHTML = atob(topicsButtonTitle);
    // click event goes here
    contentDiv.appendChild(topicsButtonDiv);
  });
  block.appendChild(contentDiv);
}
