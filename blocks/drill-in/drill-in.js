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
  
  // Create a wrapper for the image if it doesn't exist
  let imageWrapper = imageDiv.querySelector('.drill-in-image-wrapper');
  if (!imageWrapper) {
    imageWrapper = document.createElement('div');
    imageWrapper.className = 'drill-in-image-wrapper';
    
    // Move the image into the wrapper
    const imageClone = image.cloneNode(true);
    imageWrapper.appendChild(imageClone);
    
    // Replace the content of the image div with the wrapper
    imageDiv.innerHTML = '';
    imageDiv.appendChild(imageWrapper);
  }
  
  // Get all callout divs (all divs after the first one)
  const calloutDivs = Array.from(block.querySelectorAll(':scope > div')).slice(1);
  if (calloutDivs.length === 0) return;
  
  // Store all coachmarks for navigation
  const coachmarks = [];
  
  // Process each callout
  calloutDivs.forEach((calloutDiv) => {
    const calloutTitle = calloutDiv.querySelector(':scope > div:first-child')?.textContent || '';
    const calloutDescription = calloutDiv.querySelector(':scope > div:nth-child(2)')?.textContent || '';
    
    // Get position data from the callout div
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
    coachmark.style.zIndex = '10';
    
    // Store the position as data attributes for easier access
    coachmark.dataset.positionX = x.toString();
    coachmark.dataset.positionY = y.toString();
    
    // Create a red plus button with text "+"
    const plusButton = document.createElement('div');
    plusButton.className = 'drill-in-plus-button';
    plusButton.textContent = '+';
    plusButton.style.fontSize = '18px';
    plusButton.style.fontWeight = 'bold';
    plusButton.style.lineHeight = '1';
    // Position the plus button at the same coordinates as the coachmark
    // but adjust to center it visually on the callout
    plusButton.style.position = 'absolute';
    plusButton.style.left = `calc(${x}% + 3px)`;
    // Adjust the vertical position to center it on the callout (move it up by 10px)
    plusButton.style.top = `calc(${y}% + 3px)`;
    // Add a data attribute to track which coachmark this plus button belongs to
    plusButton.dataset.coachmarkIndex = coachmarks.length;
    
    // Create header with navigation buttons
    const headerSlot = document.createElement('div');
    headerSlot.setAttribute('slot', 'title');
    
    // Create navigation container
    const navContainer = document.createElement('div');
    navContainer.className = 'drill-in-nav-container';
    
    // Create title element
    const titleEl = document.createElement('span');
    titleEl.className = 'drill-in-title';
    titleEl.textContent = calloutTitle;
    
    // Create previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'drill-in-nav-button prev';
    prevButton.innerHTML = '&lt;';
    prevButton.setAttribute('aria-label', 'Previous callout');
    
    // Create next button
    const nextButton = document.createElement('button');
    nextButton.className = 'drill-in-nav-button next';
    nextButton.innerHTML = '&gt;';
    nextButton.setAttribute('aria-label', 'Next callout');
    
    // Add elements to navigation container
    navContainer.appendChild(titleEl);
    navContainer.appendChild(prevButton);
    navContainer.appendChild(nextButton);
    
    // Add navigation container to header slot
    headerSlot.appendChild(navContainer);
    
    // Add header slot to coachmark
    coachmark.appendChild(headerSlot);
    
    // Create content slot
    const contentSlot = document.createElement('div');
    contentSlot.setAttribute('slot', 'content');
    contentSlot.textContent = calloutDescription;
    coachmark.appendChild(contentSlot);
    
    // Store coachmark for navigation
    coachmarks.push(coachmark);
    
    // Add the coachmark to the image wrapper
    imageWrapper.appendChild(coachmark);
    imageWrapper.appendChild(plusButton);
    
    // Initialize the coachmark to make it visible and start pulsating
    setTimeout(() => {
      coachmark.show();

      // Disable pointer events on the indicator to prevent hover-triggered popover
      const indicator = coachmark.shadowRoot?.querySelector('.spectrum-CoachIndicator');
      if (indicator) {
        indicator.style.pointerEvents = 'none';
      }
      
      // Force the indicator to pulse by calling the method directly
      if (typeof coachmark.indicatorPulse === 'function') {
        coachmark.indicatorPulse();
      }
      
      // Make sure the rings are visible and set their color to grey
      const rings = coachmark.shadowRoot?.querySelectorAll('.spectrum-CoachIndicator-ring');
      if (rings) {
        rings.forEach(ring => {
          ring.style.opacity = '1';
          ring.style.visibility = 'visible';
          ring.style.display = 'block';
          ring.style.borderColor = '#fafafa'; // Grey color
        });
      }

      const popOvers = coachmark.shadowRoot?.querySelectorAll('.spectrum-Popover');
      if (popOvers) {
        popOvers.forEach(popOverEle => {
          popOverEle.style.top = '50%';
          popOverEle.style.transform = 'translateY(-50%)';
          popOverEle.style.border = 'none';
          popOverEle.style.borderBottom = '3px solid #eb1000';

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
      // Hide all coachmarks first
      coachmarks.forEach(cm => {
        cm.classList.remove('active');
        // Hide the popover
        const popover = cm.shadowRoot?.querySelector('.spectrum-Popover');
        if (popover) {
          popover.style.display = 'none';
        }
      });

      // Show the target coachmark
      coachmarks[idx].classList.add('active');
      coachmarks[idx].show();

      
      // Re-apply the pulsating effect
      if (typeof coachmarks[idx].indicatorPulse === 'function') {
        coachmarks[idx].indicatorPulse();
      }
      
      // Make sure the rings are visible
      const rings = coachmarks[idx].shadowRoot?.querySelectorAll('.spectrum-CoachIndicator-ring');
      if (rings) {
        rings.forEach(ring => {
          ring.style.opacity = '1';
          ring.style.visibility = 'visible';
          ring.style.display = 'block';
          ring.style.borderColor = '#fafafa'; // Grey color
        });
      }
    };
    
    // Previous button click handler
    prevButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Calculate previous index with wrap-around
      const prevIndex = (index - 1 + coachmarks.length) % coachmarks.length;
      
      // Hide all popovers first
      coachmarks.forEach(cm => {
        const popover = cm.shadowRoot?.querySelector('.spectrum-Popover');
        if (popover) {
          popover.style.display = 'none';
        }
      });
      
      // Show the target coachmark
      showCoachmark(prevIndex);
      
      // Make sure the popover is visible
      setTimeout(() => {
        const popover = coachmarks[prevIndex].shadowRoot?.querySelector('.spectrum-Popover');
        if (popover) {
          popover.style.display = 'inline-flex';
        }
      }, 100);
    });
    
    // Next button click handler
    nextButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Calculate next index with wrap-around
      const nextIndex = (index + 1) % coachmarks.length;
      
      // Hide all popovers first
      coachmarks.forEach(cm => {
        const popover = cm.shadowRoot?.querySelector('.spectrum-Popover');
        if (popover) {
          popover.style.display = 'none';
        }
      });
      
      // Show the target coachmark
      showCoachmark(nextIndex);
      
      // Make sure the popover is visible
      setTimeout(() => {
        const popover = coachmarks[nextIndex].shadowRoot?.querySelector('.spectrum-Popover');
        if (popover) {
          popover.style.display = 'inline-flex';
        }
      }, 100);
    });
    
    // Add click event to the coachmark itself to show the popover
    coachmark.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      showCoachmark(index);
      
      // Directly modify the popover in the shadow DOM to make it visible
      setTimeout(() => {
        const popover = coachmark.shadowRoot?.querySelector('.spectrum-Popover');
        if (popover) {
          popover.style.display = 'inline-flex';
        }
      }, 100);
    });
  });
  
  // Add click event to the document to hide coachmarks when clicking outside
  document.addEventListener('click', (e) => {
    // Only hide if not clicking on a coachmark or navigation button
    if (!e.target.closest('exl-coachmark') && 
        !e.target.closest('.drill-in-nav-button')) {
      coachmarks.forEach(cm => {
        cm.classList.remove('active');
        
        // Also hide the popover in the shadow DOM
        setTimeout(() => {
          const popover = cm.shadowRoot?.querySelector('.spectrum-Popover');
          if (popover) {
            popover.style.display = 'none';
          }
        }, 100);
      });
    }
  });
  
  // Decorate icons (for the plus icon)
  decorateIcons(block);
}
