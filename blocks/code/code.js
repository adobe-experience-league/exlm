import { htmlToElement } from '../../scripts/scripts.js';

function getDataLineValue(arr) {
  let dataLineValue = '';
  arr.forEach((className) => {
    dataLineValue += `${className.slice(2)}, `;
  });
  return dataLineValue.slice(0, -2);
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
  if (UEAuthorMode && window.Prism) {
    // This block is to re-highlight the code block once UE changes the block content.
    setTimeout(() => {
      // Wait until the newly updated block is added to DOM and ready for Prism to highlight.
      window.Prism.highlightAllUnder(block, true);
    }, 250);
  }
}
