export default function decorate(block) {
  const [styleElement, textElement] = [...block.children].map((row) => row.firstElementChild);

  const blockStyle = styleElement?.textContent.trim();
  const blockText = textElement?.innerHTML;

  block.innerHTML = '';
  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = blockText;

  // Append the content div to the block
  block.append(contentDiv);
  block.classList.add('block-quote-content-test', blockStyle);
}
