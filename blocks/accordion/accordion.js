export function generateAccordionDOM(props) {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  details.append(summary);
  Array.from(props).forEach((element, i) => {
    if (i === 0) summary.append(props[0].textContent.trim());
    else {
      details.append(element);
    }
  });
  return details;
}

export default function decorate(block) {
  const props = [...block.children].map((row) => row.firstElementChild);
  block.textContent = '';
  block.append(generateAccordionDOM(props));
}
