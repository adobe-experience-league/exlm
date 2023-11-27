import { generateAccordionDOM } from '../accordion/accordion.js';

export default function decorate(block) {
  // get all children elements
  const accordions = [...block.children];

  // loop through all accordion blocks
  [...accordions].forEach((accordion) => {
    // generate the accordion
    const accordionDOM = generateAccordionDOM(accordion.children);
    // empty the content ,keep root element with UE instrumentation
    accordion.textContent = '';
    // add block classes
    accordion.classList.add('accordion', 'block');
    accordion.append(accordionDOM);
    block.classList.add('shade-box');
    block.append(accordion);
  });
}
