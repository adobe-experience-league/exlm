/**
 * Ceros Embed Block
 * Embeds Ceros experiences with optimized script loading
 */

const CEROS_SCRIPT_URL = 'https://assets.ceros.site/js/embed.v1.js';
const CEROS_SCRIPT_ID = 'ceros-embed-script';

/**
 * Loads the Ceros embed script if not already loaded
 * @returns {Promise} Promise that resolves when script is loaded
 */
function loadCerosScript() {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.getElementById(CEROS_SCRIPT_ID);
    if (existingScript) {
      resolve();
      return;
    }

    // Create and append the script
    const script = document.createElement('script');
    script.id = CEROS_SCRIPT_ID;
    script.src = CEROS_SCRIPT_URL;
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Ceros embed script'));
    
    document.head.appendChild(script);
  });
}

/**
 * Decorates the Ceros embed block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const cerosUrl = block.textContent.trim();
  
  if (!cerosUrl) {
    block.textContent = 'Please provide a Ceros experience URL';
    return;
  }

  // Clear the block content
  block.textContent = '';

  // Create the Ceros embed container
  const embedContainer = document.createElement('div');
  embedContainer.setAttribute('data-embed-width', '100%');
  embedContainer.setAttribute('data-embed-height', 'auto');
  embedContainer.setAttribute('data-ceros-experience', cerosUrl);
  
  block.appendChild(embedContainer);

  try {
    // Load the Ceros script
    await loadCerosScript();
    
    // Mark block as loaded
    block.classList.add('ceros-embed-loaded');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error loading Ceros embed:', error);
    block.textContent = 'Failed to load Ceros experience. Please try again later.';
  }
}
