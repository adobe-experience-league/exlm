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
  block.innerHTML = preElement.outerHTML;
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
}
