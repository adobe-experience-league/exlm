import { isMobileResolution } from './utilities.js';
import { decorateIcons } from './lib-franklin.js';

function hideMobileLayoutToggle(e) {
  const wrapper = document.querySelector('.rail-mobile-wrapper-visible');
  if (wrapper && (!e.target || (e.target && !wrapper.contains(e.target)))) {
    wrapper.classList.remove('rail-mobile-wrapper-visible');
    document.removeEventListener('click', hideMobileLayoutToggle);
  }
}

function buildMobileToggle(leftRail) {
  leftRail.classList.add('rail-mobile-section', 'rail-section');
  let mobileRailButton = leftRail.querySelector('.rail-mobile-button');
  if (mobileRailButton) {
    return;
  }
  const leftRailContents = leftRail.innerHTML;
  const originalWrapper = leftRail.querySelector('.rail-mobile-wrapper');
  const wrapper = originalWrapper || document.createElement('div');
  wrapper.classList.add('rail-mobile-wrapper');
  mobileRailButton = document.createElement('button');
  mobileRailButton.classList.add('rail-mobile-button');
  mobileRailButton.innerText = 'Table of Contents';
  mobileRailButton.addEventListener('click', (e) => {
    if (!wrapper.classList.contains('rail-mobile-wrapper-visible')) {
      wrapper.classList.add('rail-mobile-wrapper-visible');
      e.stopPropagation();
      document.addEventListener('click', hideMobileLayoutToggle);
    }
  });
  if (!originalWrapper) {
    wrapper.innerHTML = leftRailContents;
    leftRail.innerHTML = '';
    leftRail.appendChild(wrapper);
  }
  leftRail.appendChild(mobileRailButton);
}

function attachToggleLayoutEvent({
  toggleElement,
  railElement,
  main,
  isLeftSection,
}) {
  railElement.classList.add('rail-events-attached');
  toggleElement.addEventListener('click', () => {
    const MIN_RAIL_WIDTH = '40px';
    const MAX_RAIL_WIDTH = '20%';
    let leftSectionWidth;
    let rightSectionWidth;
    if (toggleElement.classList.contains('rail-section-toggler-expanded')) {
      toggleElement.classList.remove('rail-section-toggler-expanded');
      railElement.classList.remove('rail-section-expanded');
      if (isLeftSection) {
        leftSectionWidth = MIN_RAIL_WIDTH;
        rightSectionWidth = main.children[2]?.classList?.contains(
          'rail-section-expanded',
        )
          ? MAX_RAIL_WIDTH
          : MIN_RAIL_WIDTH;
      } else {
        leftSectionWidth = main.children[0]?.classList?.contains(
          'rail-section-expanded',
        )
          ? MAX_RAIL_WIDTH
          : MIN_RAIL_WIDTH;
        rightSectionWidth = MIN_RAIL_WIDTH;
      }
    } else {
      toggleElement.classList.add('rail-section-toggler-expanded');
      railElement.classList.add('rail-section-expanded');
      if (isLeftSection) {
        leftSectionWidth = MAX_RAIL_WIDTH;
        rightSectionWidth = main.children[2].classList.contains(
          'rail-section-expanded',
        )
          ? MAX_RAIL_WIDTH
          : MIN_RAIL_WIDTH;
      } else {
        leftSectionWidth = main.children[0].classList.contains(
          'rail-section-expanded',
        )
          ? MAX_RAIL_WIDTH
          : MIN_RAIL_WIDTH;
        rightSectionWidth = MAX_RAIL_WIDTH;
      }
    }
    main.style.gridTemplateColumns = `${leftSectionWidth} 1fr ${rightSectionWidth}`;
  });
}

function createToggleLayoutSection(main, railElement, isLeftSection = true) {
  const secondaryClassName = isLeftSection
    ? 'rail-section-left'
    : 'rail-section-right';
  railElement.classList.add(
    'rail-section',
    secondaryClassName,
    'rail-section-expanded',
  );
  const wrapperElement =
    railElement.querySelector('.rail-section-wrapper') ||
    document.createElement('div');
  wrapperElement.classList.add('rail-section-wrapper');
  const railChildren = railElement.innerHTML;
  wrapperElement.innerHTML = railChildren;
  railElement.replaceChildren(wrapperElement);
  const toggleElement =
    railElement.querySelector('.rail-section-toggler') ||
    document.createElement('div');
  toggleElement.classList.add(
    'rail-section-toggler',
    'rail-section-toggler-expanded',
  );
  toggleElement.innerHTML = '<span class="icon icon-rail"></span>';
  railElement.appendChild(toggleElement);
  attachToggleLayoutEvent({ toggleElement, railElement, main, isLeftSection });
}

/**
 * Update the layout structure dynamically based on window dimensions
 * Triggered from window resize event
 */
function handleLayoutResize() {
  const main = document.querySelector('main');
  const isMobile = isMobileResolution();
  const [leftRail, content, rightRail] = main.children;
  if (isMobile && main.classList.contains('three-col-layout')) {
    main.classList.remove('three-col-layout');
    content.classList.remove('content-section');
    rightRail.classList.add('rail-hidden');
    const mRailWrapper = main.querySelector('.rail-section-wrapper');
    if (mRailWrapper) {
      mRailWrapper.classList.add('rail-mobile-wrapper');
      mRailWrapper.classList.remove('rail-section-wrapper');
    }
    buildMobileToggle(leftRail);
  } else if (!isMobile && !main.classList.contains('three-col-layout')) {
    main.classList.add('three-col-layout');
    content.classList.add('content-section');
    leftRail.classList.remove('rail-mobile-section');
    rightRail.classList.remove('rail-hidden', 'rail-mobile-section');
    leftRail.classList.add('rail-section-left', 'rail-section-expanded');
    rightRail.classList.add('rail-section-right', 'rail-section-expanded');
    const mRailWrapper = main.querySelector('.rail-mobile-wrapper');
    if (mRailWrapper) {
      mRailWrapper.classList.remove('rail-mobile-wrapper');
      mRailWrapper.classList.add('rail-section-wrapper');
    }
    createToggleLayoutSection(main, leftRail, true);
    createToggleLayoutSection(main, rightRail, false);
    decorateIcons(main);
  }
}

/**
 * Builds three column grid layout with left/right toggle section
 * @param {Element} main The container element
 */
export default function buildLayout(main) {
  // Get all child div elements
  const childDivs = main?.children;

  // Ensure there are at least 3 child divs
  if (childDivs?.length !== 3) {
    return;
  }
  window.addEventListener('resize', handleLayoutResize);
  const [leftRail, content, rightRail] = main.children;

  const isMobileRes = isMobileResolution();
  if (isMobileRes) {
    if (rightRail) {
      rightRail.classList.add('rail-hidden');
    }
    if (leftRail) {
      buildMobileToggle(leftRail);
    }
    return;
  }

  // Set CSS styles for the layout
  main.classList.add('three-col-layout');
  content.classList.add('content-section');
  createToggleLayoutSection(main, leftRail, true);
  createToggleLayoutSection(main, rightRail, false);
  decorateIcons(main);
}
