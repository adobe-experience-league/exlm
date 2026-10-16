import { loadBlocks } from '../../scripts/lib-franklin.js';
import { createTag } from '../../scripts/scripts.js';
import { moveInstrumentation } from '../../scripts/utils/ue-utils.js';

function activateTab(tab, moveFocus = false) {
  const tabList = tab.parentNode;
  const tabContent = tabList.nextElementSibling;

  tabList.querySelectorAll('[role="tab"]').forEach((otherTab) => {
    const selected = otherTab === tab;
    otherTab.setAttribute('aria-selected', selected);
    otherTab.tabIndex = selected ? 0 : -1;
  });

  tabContent.querySelectorAll('[role="tabpanel"]').forEach((panel) => panel.classList.remove('active'));
  tabContent.querySelector(`#${tab.getAttribute('aria-controls')}`).classList.add('active');

  if (moveFocus) tab.focus();
}

function changeTabs(e) {
  activateTab(e.currentTarget);
}

function navigateTabs(e) {
  const tabs = [...e.currentTarget.parentNode.querySelectorAll('[role="tab"]')];
  const currentIndex = tabs.indexOf(e.currentTarget);
  let nextIndex;

  switch (e.key) {
    case 'ArrowRight':
      nextIndex = (currentIndex + 1) % tabs.length;
      break;
    case 'ArrowLeft':
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      break;
    case 'Home':
      nextIndex = 0;
      break;
    case 'End':
      nextIndex = tabs.length - 1;
      break;
    default:
      return;
  }

  e.preventDefault();
  activateTab(tabs[nextIndex], true);
}

function initTabs(block) {
  const tabs = block.querySelectorAll('[role="tab"]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', changeTabs);
    tab.addEventListener('keydown', navigateTabs);
  });
}

let initCount = 0;
export default async function decorate(block) {
  const tabIndex = block?.dataset?.tabIndex;
  if (tabIndex) {
    block.textContent = '';
    document.querySelectorAll(`div.tab-section.tab-index-${tabIndex}`).forEach((tabSection, i) => {
      tabSection.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
        heading.classList.add('no-mtoc');
      });
      const tabTitle = tabSection?.dataset.title || `tab-${i}`;
      const container = document.createElement('div');
      moveInstrumentation(tabSection, container);
      const titleContainer = document.createElement('div');
      titleContainer.textContent = tabTitle.trim();
      container.append(titleContainer);
      container.append(tabSection);
      block.append(container);
    });
    await loadBlocks(block);
  }
  const tabList = createTag('div', { class: 'tab-list', role: 'tablist' });
  const tabContent = createTag('div', { class: 'tab-content' });

  const tabNames = [];
  const tabContents = [];
  // list of Universal Editor instrumented 'tab content' divs
  const tabInstrumentedDiv = [];

  [...block.children].forEach((child) => {
    // keep the div that has been instrumented for UE
    tabInstrumentedDiv.push(child);

    [...child.children].forEach((el, index) => {
      if (index === 0) {
        tabNames.push(el.textContent.trim());
      } else {
        tabContents.push(el.childNodes);
      }
    });
  });

  tabNames.forEach((name, i) => {
    const tabBtnAttributes = {
      role: 'tab',
      class: 'tab-title',
      id: `tab-${initCount}-${i}`,
      tabindex: i === 0 ? '0' : '-1',
      'aria-selected': i === 0 ? 'true' : 'false',
      'aria-controls': `tab-panel-${initCount}-${i}`,
      'aria-label': name,
      'data-tab-id': i,
    };

    const tabNameDiv = createTag('button', tabBtnAttributes);
    tabNameDiv.textContent = name;
    tabList.appendChild(tabNameDiv);
  });

  tabContents.forEach((content, i) => {
    const tabContentAttributes = {
      id: `tab-panel-${initCount}-${i}`,
      role: 'tabpanel',
      class: 'tabpanel',
      tabindex: '0',
      'aria-labelledby': `tab-${initCount}-${i}`,
    };

    // get the instrumented div
    const tabContentDiv = tabInstrumentedDiv[i];
    // add all additional attributes
    Object.entries(tabContentAttributes).forEach(([key, val]) => {
      tabContentDiv.setAttribute(key, val);
    });

    // default first tab is active
    if (i === 0) tabContentDiv.classList.add('active');
    tabContentDiv.replaceChildren(...Array.from(content));
    tabContent.appendChild(tabContentDiv);
  });

  // Replace the existing content with the new tab list and tab content
  block.innerHTML = ''; // Clear the existing content
  block.appendChild(tabList);
  block.appendChild(tabContent);

  initTabs(block);
  initCount += 1;
}
