import { generateTeaserDOM } from '../teaser/teaser.js';

export default function decorate(block) {
  // the panels container
  const panelContainer = document.createElement('div');
  panelContainer.classList.add('panel-container');

  // the buttons container
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('button-container');

  // get all children elements , each row is a teaser block
  const panels = [...block.children];

  // loop through all teaser blocks
  [...panels].forEach((panel, i) => {
    // generate the teaser panel
    const teaserDOM = generateTeaserDOM(panel.children);
    panel.textContent = '';
    panel.classList.add('teaser', 'block');
    panel.append(teaserDOM);
    panelContainer.append(panel);

    // generate the button
    const button = document.createElement('button');
    buttonContainer.append(button);
    button.innerText = `Slide ${i + 1}`;
  });

  block.textContent = '';
  block.append(panelContainer);
  block.append(buttonContainer);
}
