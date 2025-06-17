import { loadPrism } from '../../scripts/utils/prism-utils.js';
import { htmlToElement } from '../../scripts/scripts.js';

function getDataLineValue(arr) {
  let dataLineValue = '';
  arr.forEach((className) => {
    dataLineValue += `${className.slice(2)}, `;
  });
  return dataLineValue.slice(0, -2);
}

/**
 * Adds collapsible functionality to code blocks with more than 3 lines
 * @param {HTMLElement} block - The code block container
 * @param {HTMLElement} pre - The pre element containing the code
 */
function addCollapsibleCodeFeature(block, pre) {
  const codeElement = pre.querySelector('code');
  if (!codeElement) return;

  const codeText = codeElement.textContent;
  const lineCount = (codeText.match(/\n/g) || []).length + 1;

  const lineHeight = 1.5;
  const N = 15;

  if (lineCount > N) {
    const collapsedHeight = lineHeight * N;

    pre.classList.add('collapsible-code');
    pre.setAttribute('data-lines', lineCount);
    pre.setAttribute('data-collapsed', 'true');
    pre.style.maxHeight = `${collapsedHeight}em`;

    const toggleButton = document.createElement('button');
    toggleButton.className = 'code-toggle-button';
    toggleButton.textContent = 'Show more';

    toggleButton.addEventListener('click', () => {
      const isCollapsed = pre.getAttribute('data-collapsed') === 'true';
      pre.setAttribute('data-collapsed', isCollapsed ? 'false' : 'true');
      toggleButton.textContent = isCollapsed ? 'Show less' : 'Show more';
      pre.style.maxHeight = isCollapsed ? '' : `${collapsedHeight}em`;
    });

    block.appendChild(toggleButton);
  }
}

export default function decorate(block) {
  const htmlElementData = [...block.children].map((row) => row.firstElementChild);
  const [preElement, lineNumberingEl, lineHighlightingEl] = htmlElementData;

  const preTagAttributes = {};
  let preTagElement = preElement.childElementCount === 1 ? preElement.firstElementChild : preElement;
  if (preTagElement.tagName !== 'PRE') {
    const newPre = htmlToElement(`<pre>${preTagElement.innerHTML}</pre>`);
    preElement.innerHTML = '';
    preElement.appendChild(newPre);
    preTagElement = newPre;
  }

  if (!preTagElement.querySelector('code')) {
    const codeEl = htmlToElement(`<code>${preTagElement.innerHTML}</code>`);
    preTagElement.innerHTML = '';
    preTagElement.appendChild(codeEl);
  }
  preTagElement.innerHTML = preTagElement.innerHTML.replace(/<br>/g, '\n');
  block.innerHTML = preTagElement.outerHTML;
  const dataLine = [];
  const pre = block.querySelector('pre');

  block.classList.forEach((className) => {
    switch (true) {
      case className === 'line-number':
      case className.startsWith('language-'):
        pre.classList.add(className);
        break;

      case className.startsWith('data-start-'):
        preTagAttributes['data-start'] = className.slice(11);
        break;

      case className.startsWith('data-line-offset-'):
        preTagAttributes['data-line-offset'] = className.slice(17);
        break;

      case className.startsWith('h-'):
        dataLine.push(className);
        break;

      default:
        break;
    }
  });

  if (lineNumberingEl?.textContent) {
    preTagAttributes['data-start'] = parseInt(lineNumberingEl.textContent, 10);
  }

  if (lineHighlightingEl?.innerText) {
    preTagAttributes['data-line'] = lineHighlightingEl.innerText;
  } else if (dataLine.length) {
    preTagAttributes['data-line'] = getDataLineValue(dataLine);
  }

  Object.entries(preTagAttributes).forEach(([key, value]) => {
    if (value) {
      pre.setAttribute(key, value);
    }
  });

  const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
  if (UEAuthorMode) {
    if (window.Prism) {
      // This block is to re-highlight the code block once UE changes the block content.
      setTimeout(() => {
        // Wait until the newly updated block is added to DOM and ready for Prism to highlight.
        window.Prism.highlightAllUnder(block, true);
        // Add collapsible functionality after highlighting only if block has expandable class
        if (block.classList.contains('expandable')) {
          addCollapsibleCodeFeature(block, pre);
        }
      }, 250);
    } else {
      // Prism library is not available. Probably the code block was newly authored to the page.
      loadPrism(document).then(() => {
        setTimeout(() => {
          // Wait until the newly updated block is added to DOM and ready for Prism to highlight.
          window.Prism.highlightAllUnder(block, true);
          // Add collapsible functionality after highlighting only if block has expandable class
          if (block.classList.contains('expandable')) {
            addCollapsibleCodeFeature(block, pre);
          }
        }, 250);
      });
    }
  } else if (block.classList.contains('expandable')) {
    // Add collapsible functionality directly if not in UE author mode and block has expandable class
    addCollapsibleCodeFeature(block, pre);
  }
}
