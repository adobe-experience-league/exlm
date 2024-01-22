import { generateTeaserDOM } from '../teaser/teaser.js';

// callback for touch based scrolling event
function updateButtons(entries) {
  entries.forEach((entry) => {
    // if panel has become > 60% visible
    if (entry.isIntersecting) {
      // get the buttons
      const carouselButtons = entry.target.parentNode.parentNode.querySelector('.button-container');
      // remove selected state from whatever button has it
      [...carouselButtons.querySelectorAll(':scope button')].forEach((b) => b.classList.remove('selected'));
      // add selected state to proper button
      carouselButtons
        .querySelector(`:scope button[data-panel='${entry.target.dataset.panel}']`)
        .classList.add('selected');
    }
  });
}

// intersection observer for touch based scrolling detection
const observer = new IntersectionObserver(updateButtons, { threshold: 0.6, rootMargin: '500px 0px' });

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
    const { teaserDOM, classes } = generateTeaserDOM(panel.children, true);
    panel.textContent = '';
    panel.classList.add('teaser', 'block');
    classes.split(' ').map((c) => panel.classList.add(c));
    panel.dataset.panel = `panel_${i}`;
    panel.append(teaserDOM);
    panelContainer.append(panel);

    if (panels.length > 1) {
      // generate the button
      const button = document.createElement('button');
      buttonContainer.append(button);
      button.title = `Slide ${i + 1}`;
      button.dataset.panel = `panel_${i}`;
      if (!i) button.classList.add('selected');

      observer.observe(panel);

      // add event listener to button
      button.addEventListener('click', () => {
        panelContainer.scrollTo({ top: 0, left: panel.offsetLeft - panel.parentNode.offsetLeft, behavior: 'smooth' });
      });
    }
  });

  block.textContent = '';
  block.append(panelContainer);
  if (buttonContainer.children.length) block.append(buttonContainer);
}
