export default function decorate(block) {
  const [textElement] = [...block.children].map((row) => row.firstElementChild);
  const qualtricsSelector = textElement?.textContent || '';

  block.innerHTML = '';
  block.setAttribute('data-qualtrics-selector', qualtricsSelector);
}
