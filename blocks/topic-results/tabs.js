import { htmlToElement } from '../../scripts/scripts.js';

// TODO: FIX THIS.
// eslint-disable-next-line no-unused-vars
class TabsAutomatic {
  constructor(groupNode) {
    this.tablistNode = groupNode;

    this.tabs = [];

    this.firstTab = null;
    this.lastTab = null;

    this.tabs = Array.from(this.tablistNode.querySelectorAll('[role=tab]'));
    this.tabpanels = [];

    for (let i = 0; i < this.tabs.length; i += 1) {
      const tab = this.tabs[i];
      const tabpanel = document.getElementById(tab.getAttribute('aria-controls'));

      tab.tabIndex = -1;
      tab.setAttribute('aria-selected', 'false');
      this.tabpanels.push(tabpanel);

      tab.addEventListener('keydown', this.onKeydown.bind(this));
      tab.addEventListener('click', this.onClick.bind(this));

      if (!this.firstTab) {
        this.firstTab = tab;
      }
      this.lastTab = tab;
    }

    this.setSelectedTab(this.firstTab, false);
  }

  setSelectedTab(currentTab, setFocus) {
    if (typeof setFocus !== 'boolean') {
      setFocus = true;
    }
    for (let i = 0; i < this.tabs.length; i += 1) {
      const tab = this.tabs[i];
      if (currentTab === tab) {
        tab.setAttribute('aria-selected', 'true');
        tab.removeAttribute('tabindex');
        this.tabpanels[i].classList.remove('is-hidden');
        if (setFocus) {
          tab.focus();
        }
      } else {
        tab.setAttribute('aria-selected', 'false');
        tab.tabIndex = -1;
        this.tabpanels[i].classList.add('is-hidden');
      }
    }
  }

  setSelectedToPreviousTab(currentTab) {
    let index;

    if (currentTab === this.firstTab) {
      this.setSelectedTab(this.lastTab);
    } else {
      index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(this.tabs[index - 1]);
    }
  }

  setSelectedToNextTab(currentTab) {
    let index;

    if (currentTab === this.lastTab) {
      this.setSelectedTab(this.firstTab);
    } else {
      index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(this.tabs[index + 1]);
    }
  }

  /* EVENT HANDLERS */

  onKeydown(event) {
    const tgt = event.currentTarget;
    let flag = false;

    switch (event.key) {
      case 'ArrowLeft':
        this.setSelectedToPreviousTab(tgt);
        flag = true;
        break;

      case 'ArrowRight':
        this.setSelectedToNextTab(tgt);
        flag = true;
        break;

      case 'Home':
        this.setSelectedTab(this.firstTab);
        flag = true;
        break;

      case 'End':
        this.setSelectedTab(this.lastTab);
        flag = true;
        break;

      default:
        break;
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  onClick(event) {
    this.setSelectedTab(event.currentTarget);
  }
}

export default function createTabs({
  title = 'Some Title',
  tabs = [
    { label: 'Maria Ahlefeldt', content: 'My content', selected: true },
    { label: 'Carl Andersen', content: 'My content' },
    { label: 'Ida da Fonseca', content: 'My content' },
    { label: 'Peter Müller', content: 'My content' },
  ],
}) {
  const uniqueId = Date.now();

  const getPanelId = (index) => `tabpanel-${index + 1}`;
  const getTabId = (index) => `tab-${index + 1}`;

  const tablist = tabs.map(
    (tab, index) => `
      <button id="${getTabId(index)}" type="button" role="tab" aria-selected="${
        tab.selected || false
      }" aria-controls="${getPanelId(index)}">
        <span class="focus">${tab.label}</span>
      </button>
    `,
  );

  const panelList = tabs.map(
    (tab, index) => `
      <div id="${getPanelId(index)}" role="tabpanel" tabindex="0" aria-labelledby="${getTabId(index)}" class="${
        tab.selected ? '' : 'is-hidden'
      }">
        ${tab.content}
      </div>
    `,
  );

  const tabsEl = htmlToElement(`
    <div class="tabs">
        <h3 id="${uniqueId}">${title}</h3>
        <div role="tablist" aria-labelledby="${uniqueId}">
            ${tablist.join('')}
        </div>
        ${panelList.join('')}
    </div>
    `);

  // new TabsAutomatic(tabsEl.querySelector('[role=tablist]'));

  return tabsEl;
}
