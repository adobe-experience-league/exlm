/**
 * Generates the DOM structure for the skill-track-header block
 * @param {Array} props The block properties
 * @returns {DocumentFragment} The generated DOM structure
 */
export function generateSkillTrackHeaderDOM(props) {
  // Extract title and description from props
  const [titleContainer, descriptionContainer] = props;
  
  // Create the DOM structure
  const headerDOM = document.createRange().createContextualFragment(`
    <div>
      <div>${titleContainer.innerHTML}</div>
      <div>${descriptionContainer.innerHTML}</div>
    </div>
  `);
  
  // Add accessibility attributes
  const heading = headerDOM.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    if (!heading.id) {
      heading.id = 'skill-track-header-titles';
    }
  } else if (headerDOM.querySelector('div > div:first-child').textContent.trim()) {
    // If no heading element exists, wrap the content in an h1
    const titleDiv = headerDOM.querySelector('div > div:first-child');
    const headingText = titleDiv.textContent.trim();
    titleDiv.innerHTML = `<h1 id="skill-track-header-titles">${headingText}</h1>`;
  }
  
  // Add ARIA role for the description
  const descDiv = headerDOM.querySelector('div > div:last-child');
  if (descDiv) {
    descDiv.setAttribute('role', 'region');
    descDiv.setAttribute('aria-label', 'Skill track description');
    
    // Ensure description has proper paragraph formatting if it's plain text
    if (!descDiv.querySelector('p, ul, ol, strong, em, a') && descDiv.textContent.trim()) {
      const descText = descDiv.textContent.trim();
      descDiv.innerHTML = `<p>${descText}</p>`;
    }
  }
  
  return headerDOM;
}

/**
 * Initializes the skill-track-header block
 * @param {HTMLElement} block The skill-track-header block element
 */
export default function decorate(block) {
  // Add the main class to the block
  block.classList.add('skill-track-header');
  
  // Get the first and only cell from each row
  const props = [...block.children].map((row) => row.firstElementChild);
  
  // Generate the DOM structure
  const headerDOM = generateSkillTrackHeaderDOM(props);
  
  // Clear the block and append the new DOM
  block.textContent = '';
  block.append(headerDOM);
  
  // Set aria-labelledby attribute on the block
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    block.setAttribute('aria-labelledby', heading.id);
  }
}
