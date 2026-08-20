import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';

const LANGUAGE_LABELS = {
  js: 'JS',
  javascript: 'JS',
  css: 'CSS',
  html: 'HTML',
  markup: 'HTML',
  java: 'Java',
  ts: 'TS',
  typescript: 'TS',
  jsx: 'JSX',
  tsx: 'TSX',
  json: 'JSON',
  xml: 'XML',
  sql: 'SQL',
  python: 'Python',
  php: 'PHP',
  yaml: 'YAML',
  yml: 'YAML',
  bash: 'Shell',
  shell: 'Shell',
  sh: 'Shell',
  csharp: 'C#',
  cs: 'C#',
  dotnet: 'C#',
  cpp: 'C++',
  c: 'C',
  ruby: 'Ruby',
  go: 'Go',
  graphql: 'GraphQL',
  markdown: 'Markdown',
  md: 'Markdown',
  plaintext: 'Text',
  plain: 'Text',
  text: 'Text',
};

/**
 * Resolves a display label for a Prism `language-*` class suffix.
 * @param {string} language - the language suffix (e.g. 'js' from 'language-js')
 * @returns {string} the short display label (e.g. 'JS')
 */
function getLanguageLabel(language) {
  const known = LANGUAGE_LABELS[language.toLowerCase()];
  if (known) return known;
  return language.charAt(0).toUpperCase() + language.slice(1);
}

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
    toggleButton.className = 'code-toggle-button collapsed';
    toggleButton.textContent = placeholders?.showMore || 'Show more';

    toggleButton.addEventListener('click', () => {
      const isCollapsed = pre.getAttribute('data-collapsed') === 'true';
      pre.setAttribute('data-collapsed', isCollapsed ? 'false' : 'true');
      toggleButton.classList.toggle('collapsed', !isCollapsed);
      toggleButton.classList.toggle('expanded', isCollapsed);
      toggleButton.textContent = isCollapsed
        ? placeholders?.showLess || 'Show less'
        : placeholders?.showMore || 'Show more';
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
  let detectedLanguage = '';

  block.classList.forEach((className) => {
    switch (true) {
      case className === 'line-number':
      case className.startsWith('language-'):
        pre.classList.add(className);
        if (className.startsWith('language-')) {
          const language = className.slice(9);
          if (language && language.toLowerCase() !== 'none' && !detectedLanguage) {
            detectedLanguage = language;
          }
        }
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

  if (detectedLanguage) {
    const badge = document.createElement('span');
    badge.className = 'code-language-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = getLanguageLabel(detectedLanguage);
    block.appendChild(badge);
  }

  if (block.classList.contains('expandable')) {
    addCollapsibleCodeFeature(block, pre, defaultLines, placeholders);
  }
}
