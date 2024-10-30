export default function decorate(block) {
  const [textElement] = [...block.children].map((row) => row.firstElementChild);
  const qualtricsSelector = textElement?.innerHTML || '';

  block.innerHTML = '';
  block.setAttribute('data-qualtrics-selector', qualtricsSelector);
}
