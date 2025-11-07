import { generateDetailedTeaserDOM } from '../detailed-teaser/detailed-teaser.js';
import { generateTeaserDOM } from '../teaser/teaser.js';
import { generateMediaDOM } from '../media/media.js';

// callback for touch-based scrolling event
function updateButtons(entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const carouselButtons = entry.target.parentNode.parentNode.querySelector('.button-container');
      [...carouselButtons.querySelectorAll(':scope button')].forEach((b) => b.classList.remove('selected'));
      carouselButtons
        .querySelector(`:scope button[data-panel='${entry.target.dataset.panel}']`)
        .classList.add('selected');
    }
  });
}

// intersection observer for touch-based scrolling detection
const observer = new IntersectionObserver(updateButtons, { threshold: 0.6, rootMargin: '500px 0px' });

export default function decorate(block) {
  const panelContainer = document.createElement('div');
  panelContainer.classList.add('panel-container');

  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('button-container');

  const panels = [...block.children];

  panels.forEach((panel, i) => {
    const [image, classList, ...rest] = panel.children;
    const classesText = classList.textContent.trim();
    const classes = (classesText ? classesText.split(',') : []).map((c) => c && c.trim()).filter((c) => !!c);

    // determine block type
    let blockType = 'teaser';
    if (classes.includes('detailed-teaser')) blockType = 'detailed-teaser';
    else if (classes.includes('media')) blockType = 'media';

    // handle background color if defined
    const bgColorCls = classes.find((cls) => cls.startsWith('bg-'));
    if (bgColorCls) {
      const bgColor = `var(--${bgColorCls.substr(3)})`;
      panel.style.backgroundColor = bgColor;
    }

    // generate correct DOM
    let contentDOM;
    if (blockType === 'detailed-teaser') {
      contentDOM = generateDetailedTeaserDOM([image, ...rest], classes);
    } else if (blockType === 'media') {
      contentDOM = generateMediaDOM([image, ...rest], classes);
    } else {
      contentDOM = generateTeaserDOM([image, ...rest], classes);
    }

    // rebuild panel
    panel.textContent = '';
    panel.classList.add(blockType, 'block');
    classes.forEach((c) => panel.classList.add(c.trim()));
    panel.dataset.panel = `panel_${i}`;
    panel.append(contentDOM);
    panelContainer.append(panel);

    // create carousel buttons if multiple panels
    if (panels.length > 1) {
      const button = document.createElement('button');
      buttonContainer.append(button);
      button.title = `Slide ${i + 1}`;
      button.dataset.panel = `panel_${i}`;
      if (!i) button.classList.add('selected');

      observer.observe(panel);

      button.addEventListener('click', () => {
        panelContainer.scrollTo({
          top: 0,
          left: panel.offsetLeft - panel.parentNode.offsetLeft,
          behavior: 'smooth',
        });
      });
    }
  });

  block.textContent = '';
  block.append(panelContainer);
  if (buttonContainer.children.length) block.append(buttonContainer);
}
