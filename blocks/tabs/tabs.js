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
  const tabSections = document.querySelectorAll('.tab-section');
  const tabList = createTag('div', { class: 'tab-list', role: 'tablist' });
  const tabContent = createTag('div', { class: 'tab-content' });

  const tabNames = [];
  const tabContents = [];
  // list of Universal Editor instrumented 'tab content' divs
  const tabInstrumentedDiv = [];

  // Process each .tab-section separately
  if (tabSections.length) {
    tabSections.forEach((section) => {
      tabInstrumentedDiv.push(section);

      const sectionChildren = Array.from(section.children);
      if (sectionChildren.length > 0) {
        const firstChild = sectionChildren[0];
        const restChildren = sectionChildren.slice(1);

        tabNames.push(firstChild.textContent.trim());
        tabContents.push(restChildren);
      }
    });
  } else {
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
  }
  tabNames.forEach((name, i) => {
    const tabBtnAttributes = {
      role: 'tab',
      class: 'tab-title',
      id: `tab-${initCount}-${i}`,
      tabindex: i > 0 ? '0' : '-1',
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

    const tabContentDiv = tabInstrumentedDiv[i];
    Object.entries(tabContentAttributes).forEach(([key, val]) => {
      tabContentDiv.setAttribute(key, val);
    });
    // default first tab is active
    if (i === 0) tabContentDiv.classList.add('active');
    tabContentDiv.innerHTML = '';
    tabContentDiv.append(...Array.from(content));
    tabContent.appendChild(tabContentDiv);
  });

  // Replace the existing content with the new tab list and tab content
  block.innerHTML = ''; // Clear the existing content
  block.appendChild(tabList);
  block.appendChild(tabContent);

  initTabs(block);
  initCount += 1;
}
