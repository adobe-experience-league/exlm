function generateAccordionDOM(block) {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  details.append(summary);
  Array.from(block.children).forEach((element, i) => {
    if (i === 0) {
      const heading = element.querySelector('h2,h3,h4,h5,h6');
      summary.append(heading || element.textContent.trim());
    } else {
      details.append(element);
    }
  });
  return details;
}

export default function decorate(block) {
  // each row is an accordion entry
  const accordions = [...block.children];

  // loop through all accordion blocks
  [...accordions].forEach((accordion) => {
    // generate the accordion
    const accordionDOM = generateAccordionDOM(accordion);
    // empty the content ,keep root element with UE instrumentation
    accordion.textContent = '';
    accordion.classList.add('accordion');
    accordion.append(accordionDOM);
  });

  // use same styling as shade-box from /docs
  block.classList.add('shade-box');
}
