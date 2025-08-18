import { decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * Decorate the drill-in block
 * @param {Element} block The drill-in block element
 */
export default async function decorate(block) {
  await import('../../scripts/coachmark/coachmark.js');

  const imageDiv = block.querySelector(':scope > div:first-child');
  const image = imageDiv?.querySelector('img');
  if (!image) return;

  let imageWrapper = imageDiv.querySelector('.drill-in-image-wrapper');
  if (!imageWrapper) {
    imageWrapper = document.createElement('div');
    imageWrapper.className = 'drill-in-image-wrapper';

    const imageClone = image.cloneNode(true);
    imageWrapper.appendChild(imageClone);

    imageDiv.innerHTML = '';
    imageDiv.appendChild(imageWrapper);
  }

  // Get all the child elements except the first child which is img
  const baseZIndex = 10;
  const calloutDivs = Array.from(block.querySelectorAll(':scope > div')).slice(1);
  if (calloutDivs.length === 0) return;

  const coachmarks = [];

  calloutDivs.forEach((calloutDiv) => {
    const calloutTitle = calloutDiv.querySelector(':scope > div:first-child')?.textContent || '';
    const calloutDescription = calloutDiv.querySelector(':scope > div:nth-child(2)')?.textContent || '';
    const positionXDiv = calloutDiv.querySelector(':scope > div:nth-child(3)');
    const positionYDiv = calloutDiv.querySelector(':scope > div:nth-child(4)');

    // Default position is center (50%, 50%) if not specified
    let x = 50;
    let y = 50;

    // Parse position values if available
    if (positionXDiv) {
      const positionX = parseInt(positionXDiv.textContent, 10);
      if (!Number.isNaN(positionX) && positionX >= 0 && positionX <= 100) {
        x = positionX;
      }
    }

    if (positionYDiv) {
      const positionY = parseInt(positionYDiv.textContent, 10);
      if (!Number.isNaN(positionY) && positionY >= 0 && positionY <= 100) {
        y = positionY;
      }
    }

    // Create the coachmark element
    const coachmark = document.createElement('exl-coachmark');
    coachmark.setAttribute('type', 'circle');
    coachmark.setAttribute('x', x.toString());
    coachmark.classList.add('drill-in-coachmark');

    // Position the coachmark
    coachmark.style.position = 'absolute';
    coachmark.style.left = `${x}%`;
    coachmark.style.top = `${y}%`;
    coachmark.style.display = 'block';

    // Store the position as data attributes for easier access
    coachmark.dataset.positionX = x.toString();
    coachmark.dataset.positionY = y.toString();

    // Create a red plus button with text "+"
    const plusButtonContainer = document.createElement('div');
    plusButtonContainer.classList.add('drill-in-plus-button');
    const plusButton = document.createElement('span');
    plusButton.textContent = '+';
    plusButtonContainer.appendChild(plusButton);

    // Position the plus button at the same coordinates as the coachmark
    plusButtonContainer.style.left = `calc(${x}% + 3px)`;
    plusButtonContainer.style.top = `calc(${y}% + 3px)`;
    // Add a data attribute to track which coachmark this plus button belongs to
    plusButtonContainer.dataset.coachmarkIndex = coachmarks.length;

    const headerSlot = document.createElement('div');
    headerSlot.setAttribute('slot', 'title');

    const navContainer = document.createElement('div');
    navContainer.className = 'drill-in-nav-container';

    const titleEl = document.createElement('span');
    titleEl.className = 'drill-in-title';
    titleEl.textContent = calloutTitle;

    const navButtons = document.createElement('div');
    navButtons.classList.add('drill-in-nav-buttons-container');
    const prevButton = document.createElement('button');
    prevButton.className = 'drill-in-nav-button prev';
    prevButton.innerHTML = '&lt;';
    prevButton.setAttribute('aria-label', 'Previous callout');

    const nextButton = document.createElement('button');
    nextButton.className = 'drill-in-nav-button next';
    nextButton.innerHTML = '&gt;';
    nextButton.setAttribute('aria-label', 'Next callout');

    navButtons.appendChild(prevButton);
    navButtons.appendChild(nextButton);

    navContainer.appendChild(titleEl);
    navContainer.appendChild(navButtons);

    headerSlot.appendChild(navContainer);

    coachmark.appendChild(headerSlot);

    const contentSlot = document.createElement('div');
    contentSlot.setAttribute('slot', 'content');
    contentSlot.textContent = calloutDescription;
    coachmark.appendChild(contentSlot);

    coachmarks.push(coachmark);

    imageWrapper.appendChild(coachmark);
    imageWrapper.appendChild(plusButtonContainer);

    setTimeout(() => {
      coachmark.show();
      const indicator = coachmark.shadowRoot?.querySelector('.spectrum-CoachIndicator');
      if (indicator) {
        indicator.style.pointerEvents = 'none';
      }
      coachmark.indicatorPulse();

      const rings = coachmark.shadowRoot?.querySelectorAll('.spectrum-CoachIndicator-ring');
      if (rings) {
        rings.forEach((ring) => {
          ring.style.borderColor = 'var(--overlay-background-color)';
        });
      }

      // Popover styling
      const popOvers = coachmark.shadowRoot?.querySelectorAll('.spectrum-Popover');
      if (popOvers) {
        popOvers.forEach((popOverEle) => {
          popOverEle.style.top = '50%';
          popOverEle.style.transform = 'translateY(-50%)';
          popOverEle.style.border = 'none';
          popOverEle.style.borderBottom = '4px solid var(--non-spectrum-adobe-dark-red)';
          popOverEle.style.width = '400px';
          popOverEle.style.padding = '30px';

          const popOverEleTitle = popOverEle.querySelector('.spectrum-CoachMark-header');
          if (popOverEleTitle) {
            popOverEleTitle.style.padding = '0';
            popOverEleTitle.style.margin = '0';
            popOverEleTitle.style.display = 'unset';
          }

          const popOverEleContent = popOverEle.querySelector('.spectrum-CoachMark-content');
          if (popOverEleContent) {
            popOverEleContent.style.padding = '0';
            popOverEleContent.style.margin = '0';
          }

          const existingNotch = popOverEle.querySelector('.popover-notch');
          if (existingNotch) existingNotch.remove();

          const notch = document.createElement('div');
          notch.className = 'popover-notch';
          notch.style.width = '12px';
          notch.style.height = '12px';
          notch.style.position = 'absolute';
          notch.style.top = '50%';
          notch.style.backgroundColor = 'white';
          notch.style.transform = 'translateY(-50%) rotate(45deg)';

          if (popOverEle.classList.contains('spectrum-Popover--left-top')) {
            popOverEle.style.right = 'calc(100% + 30px)';
            notch.style.right = '-6px';
          }
          if (popOverEle.classList.contains('spectrum-Popover--right-top')) {
            popOverEle.style.left = 'calc(100% + 30px)';
            notch.style.left = '-6px';
          }
          popOverEle.appendChild(notch);
        });
      }
    }, 100);

    // Hide the original callout div as we're showing it in coachmarks now
    calloutDiv.style.display = 'none';
  });

  // Set up navigation between coachmarks
  coachmarks.forEach((coachmark, index) => {
    const prevButton = coachmark.querySelector('.drill-in-nav-button.prev');
    const nextButton = coachmark.querySelector('.drill-in-nav-button.next');

    // Function to show a specific coachmark
    const showCoachmark = (idx) => {
      coachmarks.forEach((cm) => {
        cm.classList.remove('active');
        // Hide the popover
        const popover = cm.shadowRoot?.querySelector('.spectrum-Popover');
        if (popover) {
          popover.style.display = 'none';
        }
      });

      coachmarks[idx].classList.add('active');
      coachmarks[idx].show();

      // Make sure the rings are not visible after click
      const rings = coachmarks[idx].shadowRoot?.querySelectorAll('.spectrum-CoachIndicator-ring');
      if (rings) {
        rings.forEach((ring) => {
          ring.style.display = 'none';
        });
      }
    };

    const navigateCoachmark = (targetIndex) => {
      showCoachmark(targetIndex);
      coachmarks.forEach((cm, idx) => {
        if (idx === targetIndex) {
          cm.style.zIndex = baseZIndex + 10;
        } else {
          cm.style.zIndex = baseZIndex;
        }
      });
      const popover = coachmarks[targetIndex].shadowRoot?.querySelector('.spectrum-Popover');
      if (popover) {
        popover.style.display = 'inline-flex';
      }
    };

    // Previous button click handler
    prevButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const prevIndex = (index - 1 + coachmarks.length) % coachmarks.length;
      navigateCoachmark(prevIndex);
    });

    // Next button click handler
    nextButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nextIndex = (index + 1) % coachmarks.length;
      navigateCoachmark(nextIndex);
    });

    // Add click event to the coachmark itself to show the popover
    coachmark.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navigateCoachmark(index);
    });
  });

  // Add click event to the document to hide coachmarks when clicking outside
  document.addEventListener('click', (e) => {
    // Only hide if not clicking on a coachmark or navigation button
    if (!e.target.closest('exl-coachmark') && !e.target.closest('.drill-in-nav-button')) {
      coachmarks.forEach((cm) => {
        cm.classList.remove('active');
        const popover = cm.shadowRoot?.querySelector('.spectrum-Popover');
        if (popover) {
          popover.style.display = 'none';
        }
      });
    }
  });

  // Decorate icons (for the plus icon)
  decorateIcons(block);
}
