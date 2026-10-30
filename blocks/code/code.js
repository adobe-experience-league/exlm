import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import joinCodeLines from './join-code-lines.js';

function getDataLineValue(arr) {
  let dataLineValue = '';
  arr.forEach((className) => {
    dataLineValue += `${className.slice(2)}, `;
  });
  return dataLineValue.slice(0, -2);
}

/**
 * Published pages store each code line as its own pre. One pre is left as authored.
 * shortcut: a br inside an already-split line is not a line break, upgrade if publish emits brs there.
 */
function preFromCell(cell) {
  const pres = [...cell.querySelectorAll(':scope > pre')];
  if (pres.length === 1) return pres[0];
  if (pres.length < 2) return null;
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.textContent = joinCodeLines(pres.map((linePre) => (linePre.querySelector('code') || linePre).textContent));
  pre.append(code);
  return pre;
}

/**
 * Adds collapsible functionality to code blocks with more than 3 lines
 * @param {HTMLElement} block - The code block container
 * @param {HTMLElement} pre - The pre element containing the code
 */
function addCollapsibleCodeFeature(block, pre, lines, placeholders) {
  const codeElement = pre.querySelector('code');
  if (!codeElement) return;

  const codeText = codeElement.textContent;
  const lineCount = (codeText.match(/\n/g) || []).length + 1;

  const lineHeight = 1.5;

  if (lineCount > lines) {
    const collapsedHeight = lineHeight * lines;

    pre.classList.add('collapsible-code');
    pre.setAttribute('data-lines', lineCount);
    pre.setAttribute('data-collapsed', 'true');
    pre.style.maxHeight = `${collapsedHeight}em`;

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.className = 'code-toggle-button collapsed';
    toggleButton.textContent = placeholders?.showMore || 'Show more';
    toggleButton.setAttribute('aria-expanded', 'false');

    toggleButton.addEventListener('click', () => {
      const isCollapsed = pre.getAttribute('data-collapsed') === 'true';
      pre.setAttribute('data-collapsed', isCollapsed ? 'false' : 'true');
      toggleButton.classList.toggle('collapsed', !isCollapsed);
      toggleButton.classList.toggle('expanded', isCollapsed);
      toggleButton.textContent = isCollapsed
        ? placeholders?.showLess || 'Show less'
        : placeholders?.showMore || 'Show more';
      toggleButton.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');
      pre.style.maxHeight = isCollapsed ? '' : `${collapsedHeight}em`;
    });

    block.appendChild(toggleButton);
  }
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const htmlElementData = [...block.children].map((row) => row.firstElementChild);
  const [preElement, lineNumberingEl, lineHighlightingEl, defaultLineNumbers] = htmlElementData;

  const defaultLines = parseInt(defaultLineNumbers?.textContent, 10) || 15;

  const preTagAttributes = {};
  let preTagElement = preFromCell(preElement);
  if (!preTagElement) {
    preTagElement = preElement.childElementCount === 1 ? preElement.firstElementChild : preElement;
    if (preTagElement.tagName !== 'PRE') {
      const newPre = htmlToElement(`<pre>${preTagElement.innerHTML}</pre>`);
      preElement.innerHTML = '';
      preElement.appendChild(newPre);
      preTagElement = newPre;
    }
  }

  if (!preTagElement.querySelector('code')) {
    const codeEl = htmlToElement(`<code>${preTagElement.innerHTML}</code>`);
    preTagElement.innerHTML = '';
    preTagElement.appendChild(codeEl);
  }
  if (preElement.contains(preTagElement)) {
    preTagElement.innerHTML = preTagElement.innerHTML.replace(/<br>/g, '\n');
  }
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

  if (block.classList.contains('expandable')) {
    addCollapsibleCodeFeature(block, pre, defaultLines, placeholders);
  }
}
