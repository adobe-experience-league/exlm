// Utility function to check if the element is visible on the page.
export function isVisible(element) {
  const style = getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

// Utility function to create dynamic list items
export function createListItem(item) {
  const li = document.createElement('li');
  li.innerHTML = `<a href="${item.path}">${item.title}</a>`;
  return li;
}

// Utility function to toggle visibility of items
export function toggleItemVisibility(itemList, startIndex, show) {
  // eslint-disable-next-line no-plusplus
  for (let i = startIndex; i < itemList.length; i++) {
    itemList[i].classList.toggle('hidden', !show);
  }
}

// Utility function to set link visibility
export function setLinkVisibility(linkId, show) {
  const linkElement = document.getElementById(linkId);
  if (linkElement) {
    linkElement.style.display = show ? 'block' : 'none';
  }
}

// Function to check if current page has sub-pages
export function hasDirectLeafNodes(jsonData, currentPage) {
  const directLeafNodes = jsonData.filter(
    (item) =>
      item.path.startsWith(currentPage) &&
      item.path !== currentPage &&
      !item.path.substring(currentPage.length + 1).includes('/'),
  );

  return directLeafNodes.length > 0;
}

// Utility Function to get the path until a specific level
export function getPathUntilLevel(originalUrl, levels) {
  const pathSegments = originalUrl.split('/');
  const resultPath = pathSegments.slice(0, levels + 1).join('/');
  return resultPath;
}

// Utility function to filter sub-pages under a given path
export const filterSubPages = (data, basePath) =>
  data.filter((page) => page.path.startsWith(basePath) && page.path !== basePath);

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
  multiMap.forEach((value) => {
    const liItem = document.createElement('li');
    const anchor = document.createElement('a');
    if (value.length > 0) {
      anchor.href = value[0].path;
      anchor.textContent = value[0].title;

      liItem.appendChild(anchor);
    }
    if (value.length > 1) {
      const subUlList = document.createElement('ul');
      liItem.classList.add('hasSubPages');
      value
        .slice(1)
        .sort((a, b) => a.title.localeCompare(b.title))
        .forEach((item) => {
          const subLiItem = document.createElement('li');
          const subAnchor = document.createElement('a');
          subAnchor.href = item.path;
          subAnchor.textContent = item.title;

          subLiItem.appendChild(subAnchor);
          subUlList.appendChild(subLiItem);
        });
      const toggleIcon = document.createElement('span');
      // toggleIcon.textContent = 'test';
      toggleIcon.classList.add('js-toggle');
      liItem.append(toggleIcon);
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
