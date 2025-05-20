import { getLink } from '../../scripts/scripts.js';
// Utility function to filter sub-pages under a given path
export const filterSubPages = (data, basePath) =>
  data.filter((page) => page.path.startsWith(`${basePath}/`) && page.path !== basePath);

// Utility function to build a multi-map from the filtered sub-pages
export function convertToMultiMap(jsonData, page) {
  const multiMap = new Map();

  jsonData.forEach((item) => {
    const pathSegments = item.path.split('/').filter((segment) => segment !== '');
    const category = pathSegments[pathSegments.indexOf(page) + 1];
    if (!multiMap.has(category)) {
      multiMap.set(category, []);
    }
    if (category !== item.title) {
      multiMap.get(category).push(item);
    }
  });
  return multiMap;
}

// Utility function to convert multi-map to nested list
export function convertToULList(multiMap) {
  const ulList = document.createElement('ul');
  ulList.classList.add('subPages');

  multiMap.forEach((value, key) => {
    const liItem = document.createElement('li');
    let firstAnchorAdded = false;
    const subUlList = document.createElement('ul');

    value.forEach((item) => {
      const anchor = document.createElement('a');
      anchor.href = getLink(item.path);
      anchor.textContent = item.title;

      if (key === item.path.substring(item.path.lastIndexOf('/') + 1)) {
        // If key matches, add as the first anchor
        liItem.appendChild(anchor);
        firstAnchorAdded = true;
      } else {
        // Otherwise, add to subUlList
        const subLiItem = document.createElement('li');
        subLiItem.appendChild(anchor);
        subUlList.appendChild(subLiItem);
      }
    });

    if (!firstAnchorAdded && value.length > 0) {
      // If key didn't match any path, add the first item as anchor
      const anchor = document.createElement('a');
      anchor.href = getLink(value[0].path);
      anchor.textContent = value[0].title;
      liItem.appendChild(anchor);
    }

    if (subUlList.childElementCount > 0) {
      // If there are items in subUlList, add it with a toggle icon
      liItem.classList.add('hasSubPages');
      const toggleIcon = document.createElement('span');
      toggleIcon.classList.add('js-toggle');
      liItem.appendChild(toggleIcon);
      liItem.appendChild(subUlList);
    }

    ulList.appendChild(liItem);
  });

  return ulList;
}

// Utility function to sort L1 products in ascending order
export function sortFirstLevelList(containerSelector) {
  const container = document.querySelector(containerSelector);
  const liElements = Array.from(container.children);

  liElements.sort((a, b) => {
    const textA = a.textContent.trim();
    const textB = b.textContent.trim();
    return textA.localeCompare(textB);
  });

  liElements.forEach((li) => container.appendChild(li));
}
