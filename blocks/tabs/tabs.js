import { createTag } from '../../scripts/scripts.js';

function changeTabs(e) {
  const { target } = e;
  const tabMenu = target.parentNode;
  const tabContent = tabMenu.nextElementSibling;

  tabMenu.querySelectorAll('[aria-selected="true"]').forEach((t) => t.setAttribute('aria-selected', false));

  target.setAttribute('aria-selected', true);

  tabContent.querySelectorAll('[role="tabpanel"]').forEach((p) => p.classList.remove('active'));

  tabContent.parentNode.querySelector(`#${target.getAttribute('aria-controls')}`).classList.add('active');
}

function initTabs(block) {
  const tabs = block.querySelectorAll('[role="tab"]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', changeTabs);
  });
}

let initCount = 0;
export default function decorate(block) {
  const tabList = createTag('div', { class: 'tab-list', role: 'tablist' });
  const tabContent = createTag('div', { class: 'tab-content' });

  const tabNames = [];
  const tabContents = [];

  [...block.children].forEach((child) => {
    [...child.children].forEach((el, index) => {
      if (index === 0) {
        tabNames.push(el.textContent.trim());
      } else {
        tabContents.push(el.innerHTML);
      }
    });
  });

  tabNames.forEach((name, i) => {
    const nameId = name.toLowerCase().split(' ').join('-');
    const tabBtnAttributes = {
      role: 'tab',
      class: 'tab-title',
      id: `tab-${initCount}-${nameId}`,
      tabindex: i > 0 ? '0' : '-1',
      'aria-selected': i === 0 ? 'true' : 'false',
      'aria-controls': `tab-panel-${initCount}-${nameId}`,
      'aria-label': name,
      'data-tab-id': i,
    };

    const tabNameDiv = createTag('button', tabBtnAttributes);
    tabNameDiv.textContent = name;
    tabList.appendChild(tabNameDiv);
  });

  tabContents.forEach((content, i) => {
    const name = tabNames[i];
    const nameId = name.toLowerCase().split(' ').join('-');

    const tabContentAttributes = {
      id: `tab-panel-${initCount}-${nameId}`,
      role: 'tabpanel',
      class: 'tabpanel',
      tabindex: '0',
      'aria-labelledby': `tab-${initCount}-${nameId}`,
    };

    const tabContentDiv = createTag('div', tabContentAttributes);
    // default first tab is active
    if (i === 0) tabContentDiv.classList.add('active');
    tabContentDiv.innerHTML = content;
    tabContent.appendChild(tabContentDiv);
  });

  // Replace the existing content with the new tab list and tab content
  block.innerHTML = ''; // Clear the existing content
  block.appendChild(tabList);
  block.appendChild(tabContent);

  initTabs(block);
  initCount += 1;
}
