/* this function also gets called by accordion-group */
export function generateAccordionDOM(block) {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  details.append(summary);
  Array.from(block.children).forEach((element, i) => {
    if (i === 0) summary.append(block.children[0].textContent.trim());
    else {
      details.append(element);
    }
  });
  return details;
}

export default function decorate(block) {
  const dom = generateAccordionDOM(block);
  block.textContent = '';
  block.append(dom);
}
