import { generateDetailedTeaserDOM } from '../detailed-teaser/detailed-teaser.js';
import { generateTeaserDOM } from '../teaser/teaser.js';
import { generateMediaDOM } from '../media/media.js';

// callback for touch based scrolling event
function updateButtons(entries) {
  entries.forEach((entry) => {
    // if panel has become > 60% visible
    if (entry.isIntersecting) {
      // get the buttons and panels
      const carousel = entry.target.parentNode.parentNode;
      const carouselButtons = carousel.querySelector('.button-container');
      const panelContainer = carousel.querySelector('.panel-container');

      // remove selected state from whatever button has it
      [...carouselButtons.querySelectorAll(':scope button')].forEach((b) => b.classList.remove('selected'));
      // remove active state from whatever panel has it
      [...panelContainer.querySelectorAll(':scope > div')].forEach((p) => p.classList.remove('active'));

      // add selected state to proper button
      carouselButtons
        .querySelector(`:scope button[data-panel='${entry.target.dataset.panel}']`)
        .classList.add('selected');

      // add active state to the current panel
      entry.target.classList.add('active');
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
    const [image, classList, ...rest] = panel.children;
    const classesText = classList.textContent.trim();
    const classes = (classesText ? classesText.split(',') : []).map((c) => c && c.trim()).filter((c) => !!c);
    let blockType;
    if ([...classes].includes('detailed-teaser')) {
      blockType = 'detailed-teaser';
    } else if ([...classes].includes('media')) {
      blockType = 'media';
    } else {
      blockType = 'teaser';
    }
    const bgColorCls = [...classes].find((cls) => cls.startsWith('bg-'));
    if (bgColorCls) {
      const bgColor = `var(--${bgColorCls.substr(3)})`;
      panel.style.backgroundColor = bgColor;
    }

    // check if we have to render teaser, detailed teaser, or media
    let contentDOM;
    if (blockType === 'detailed-teaser') {
      contentDOM = generateDetailedTeaserDOM([image, ...rest], classes);
    } else if (blockType === 'media') {
      contentDOM = generateMediaDOM([image, ...rest]);
    } else {
      contentDOM = generateTeaserDOM([image, ...rest], classes);
    }

    panel.textContent = '';
    panel.classList.add(blockType, 'block');
    classes.forEach((c) => panel.classList.add(c.trim()));
    panel.dataset.panel = `panel_${i}`;
    // Add active class to the first panel by default
    if (!i) panel.classList.add('active');
    panel.append(contentDOM);
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
        // Remove active class from all panels
        [...panelContainer.querySelectorAll(':scope > div')].forEach((p) => p.classList.remove('active'));
        // Add active class to the selected panel
        panel.classList.add('active');
        panelContainer.scrollTo({ top: 0, left: panel.offsetLeft - panel.parentNode.offsetLeft, behavior: 'smooth' });
      });
    }
  });

  block.textContent = '';
  block.append(panelContainer);
  if (buttonContainer.children.length) block.append(buttonContainer);
}
