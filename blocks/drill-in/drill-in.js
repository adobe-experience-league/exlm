import { decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * Decorate the drill-in block
 * @param {Element} block The drill-in block element
 */
export default async function decorate(block) {
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

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

  const closePopover = (cm) => {
    cm.classList.remove('active');
    cm.classList.remove('has-mobile-popover');

    const popover = cm.shadowRoot?.querySelector('.spectrum-Popover');
    if (popover) {
      popover.classList.remove('is-open');
      popover.style.display = 'none';
    }
    const anyMobilePopover = document.querySelectorAll('.drill-in-coachmark.has-mobile-popover').length > 0;
    if (!anyMobilePopover) {
      document.body.classList.remove('overflow-hidden');
    }
  };

  const getDivText = (parent, nth, trim = true) => {
    const text = parent.querySelector(`:scope > div:nth-child(${nth})`)?.textContent || '';
    return trim ? text.trim() : text;
  };

  const parsePosition = (text, defaultVal = 50) => {
    const val = parseInt(text, 10);
    return !Number.isNaN(val) && val >= 0 && val <= 100 ? val : defaultVal;
  };

  const setAbsolutePosition = (el, x, y, offset = 0) => {
    el.style.position = 'absolute';
    el.style.left = `calc(${x}% + ${offset}px)`;
    el.style.top = `calc(${y}% + ${offset}px)`;
  };

  const createNavButton = (cls, label, html) => {
    const btn = document.createElement('button');
    btn.className = cls;
    btn.setAttribute('aria-label', label);
    btn.innerHTML = html;
    return btn;
  };

  const showCoachmark = (idx) => {
    coachmarks.forEach((cm) => {
      cm.classList.remove('active');
      const popover = cm.shadowRoot?.querySelector('.spectrum-Popover');
      if (popover) {
        popover.style.display = 'none';
        popover.classList.remove('is-open');
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

  const updatePopoverState = (cm, popover) => {
    if (!popover) return;
    popover.style.display = 'inline-flex';
    popover.classList.add('is-open');
    popover.classList.remove('popover-mobile');

    if (isMobile()) {
      popover.classList.add('popover-mobile');
      cm.classList.add('has-mobile-popover');
      document.body.classList.add('overflow-hidden');
    } else {
      cm.classList.remove('has-mobile-popover');
      document.body.classList.remove('overflow-hidden');
    }
  };

  const navigateCoachmark = (targetIndex) => {
    showCoachmark(targetIndex);
    coachmarks.forEach((cm, idx) => {
      const popover = cm.shadowRoot?.querySelector('.spectrum-Popover');
      if (idx === targetIndex) {
        cm.style.zIndex = baseZIndex + 1;
        updatePopoverState(cm, popover);
      } else {
        cm.style.zIndex = baseZIndex;
        cm.classList.remove('has-mobile-popover');
      }
    });
  };

  calloutDivs.forEach((calloutDiv) => {
    const calloutTitle = getDivText(calloutDiv, 1);
    const calloutDescription = getDivText(calloutDiv, 2);
    const x = parsePosition(getDivText(calloutDiv, 3));
    const y = parsePosition(getDivText(calloutDiv, 4));

    // Create the coachmark element
    const coachmark = document.createElement('exl-coachmark');
    coachmark.setAttribute('type', 'circle');
    coachmark.setAttribute('x', x.toString());
    coachmark.classList.add('drill-in-coachmark');

    // Position the coachmark
    setAbsolutePosition(coachmark, x, y);

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
    setAbsolutePosition(plusButtonContainer, x, y, 3);
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

    const prevButton = createNavButton('drill-in-nav-button prev', 'Previous callout', '&lt;');
    const nextButton = createNavButton('drill-in-nav-button next', 'Next callout', '&gt;');
    const closeBtn = createNavButton('drill-in-close-btn', 'Close', '&#x2715;');

    navButtons.appendChild(prevButton);
    navButtons.appendChild(nextButton);

    navContainer.appendChild(titleEl);
    navContainer.appendChild(navButtons);
    navContainer.appendChild(closeBtn);

    headerSlot.appendChild(navContainer);

    coachmark.appendChild(headerSlot);

    const contentSlot = document.createElement('div');
    contentSlot.setAttribute('slot', 'content');
    contentSlot.textContent = calloutDescription;
    coachmark.appendChild(contentSlot);

    coachmarks.push(coachmark);

    imageWrapper.appendChild(coachmark);
    imageWrapper.appendChild(plusButtonContainer);

    coachmark.show();

    const spectrumCoachmark = coachmark.shadowRoot?.querySelector('.spectrum-CoachMark');
    spectrumCoachmark.classList.add('spectrum-coachmark-white');

    const indicator = coachmark.shadowRoot?.querySelector('.spectrum-CoachIndicator');
    if (indicator) {
      indicator.style.pointerEvents = 'none';
    }

    setTimeout(() => {
      coachmark.indicatorPulse();
    }, 100);

    // Popover styling
    const popOvers = coachmark.shadowRoot?.querySelectorAll('.spectrum-Popover');
    if (popOvers) {
      popOvers.forEach((popOverEle) => {
        const existingNotch = popOverEle.querySelector('.popover-notch');
        if (existingNotch) existingNotch.remove();

        const notch = document.createElement('div');
        notch.classList.add('popover-notch');

        popOverEle.appendChild(notch);
        // Ensure popover is not displayed on initial load (fixes issue with modal opening automatically on mobile)
        popOverEle.style.display = 'none';
        popOverEle.classList.remove('is-open');
      });
    }
    // Hide the original callout div as we're showing it in coachmarks now
    calloutDiv.style.display = 'none';
  });

  // Set up navigation between coachmarks
  coachmarks.forEach((coachmark, index) => {
    const prevButton = coachmark.querySelector('.drill-in-nav-button.prev');
    const nextButton = coachmark.querySelector('.drill-in-nav-button.next');
    const closeButton = coachmark.querySelector('.drill-in-close-btn');

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

    // Close button click handler
    closeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closePopover(coachmark);
    });

    window.addEventListener('resize', () => {
      coachmarks.forEach((cm) => {
        const popover = cm.shadowRoot?.querySelector('.spectrum-Popover');
        if (popover && popover.classList.contains('is-open')) {
          updatePopoverState(cm, popover);
        }
      });
    });
  });

  // Add click event to the document to hide coachmarks when clicking outside
  document.addEventListener('click', (e) => {
    // Only hide if not clicking on a coachmark or navigation button
    if (!e.target.closest('exl-coachmark') && !e.target.closest('.drill-in-nav-button')) {
      coachmarks.forEach((cm) => {
        closePopover(cm);
      });
    }
  });

  // Decorate icons (for the plus icon)
  decorateIcons(block);
}
