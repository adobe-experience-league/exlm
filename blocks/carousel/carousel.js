import { generateTeaserDOM } from '../teaser/teaser.js';

export default function decorate(block) {
  // the panels container
  const panelContainer = document.createElement('div');
  panelContainer.classList.add('panel-container');

  // the buttons container
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('button-container');

  // get all children elements
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
    button.title = `Slide ${i + 1}`;
    if (!i) button.classList.add('selected');

    // add event listener to button
    button.addEventListener('click', () => {
      panelContainer.scrollTo({ top: 0, left: panel.offsetLeft - panel.parentNode.offsetLeft, behavior: 'smooth' });

      // updated button selected states
      [...buttonContainer.children].forEach((b) => b.classList.remove('selected'));
      button.classList.add('selected');
    });
  });

  block.textContent = '';
  block.append(panelContainer);
  block.append(buttonContainer);
}
