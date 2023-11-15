function getDataLineValue(arr) {
  let dataLineValue = '';
  arr.forEach((className) => {
    dataLineValue += `${className.slice(2)}, `;
  });
  return dataLineValue.slice(0, -2);
}

export default function decorate(block) {
  const attributes = {};
  const pre = block.querySelector('pre');
  attributes.dataLine = [];
  block.classList.forEach((className) => {
    if (className === 'line-number') pre.classList.add(className);
    if (className.startsWith('language-')) pre.classList.add(className);
    if (className.startsWith('data-start-')) attributes.dataStart = className.slice(11);
    if (className.startsWith('data-line-offset-')) attributes.dataLineOffset = className.slice(17);
    if (className.startsWith('h-')) attributes.dataLine.push(className);
  });
  if (attributes.dataStart) pre.setAttribute('data-start', attributes.dataStart);
  if (attributes.dataLineOffset) pre.setAttribute('data-line-offset', attributes.dataLineOffset);
  if (attributes.dataLine.length) pre.setAttribute('data-line', getDataLineValue(attributes.dataLine));
}
