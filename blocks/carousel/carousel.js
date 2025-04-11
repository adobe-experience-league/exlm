import { generateDetailedTeaserDOM } from '../detailed-teaser/detailed-teaser.js';
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

  // loop through all children blocks
  [...panels].forEach((panel, i) => {
    // generate the  panel
    let [image, classList, ...rest] = panel.children;
    const classesText = classList.textContent.trim();
    const classes = (classesText ? classesText.split(',') : []).map((c) => c && c.trim()).filter((c) => !!c);
    const blockType = [...classes].includes('detailed-teaser') ? 'detailed-teaser' : 'teaser';
    const bgColorCls = [...classes].find((cls) => cls.startsWith('bg-'));
    if (bgColorCls) {
      const bgColor = `var(--${bgColorCls.substr(3)})`;
      panel.style.backgroundColor = bgColor;
    }
    if (blockType === 'detailed-teaser') {
      [image, classList, , ...rest] = panel.children;
    }
    // check if we have to render teaser or a detailed teaser
    const teaserDOM =
      blockType === 'detailed-teaser'
        ? generateDetailedTeaserDOM([image, ...rest], classes)
        : generateTeaserDOM([image, ...rest], classes);
    panel.textContent = '';
    panel.classList.add(blockType, 'block');
    classes.forEach((c) => panel.classList.add(c.trim()));
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
