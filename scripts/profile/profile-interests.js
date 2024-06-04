import { decorateIcons, loadCSS } from '../lib-franklin.js';
import Dropdown from '../dropdown/dropdown.js';
import { htmlToElement, fetchLanguagePlaceholders } from '../scripts.js';
import getSolutionByName from '../../blocks/toc/toc-solutions.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/profile/profile-interests.css`);

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const options = [
  {
    value: placeholders["profile-exp-level-beginner"],
    title: placeholders["profile-exp-level-beginner"],
  },
  {
    value: placeholders["profile-exp-level-intermediate"],
    title: placeholders["profile-exp-level-intermediate"],
  },
  {
    value: placeholders["profile-exp-level-experienced"],
    title: placeholders["profile-exp-level-experienced"],
  },
];

// eslint-disable-next-line import/prefer-default-export
export async function buildProductCard(container, element, model) {
  const { product = 'Target', isSelected = false } = model;

  // Create card container
  const card = document.createElement('div');
  card.className = `profile-interest-card ${isSelected ? 'profile-interest-card--selected' : ''}`;
  const { class: solutionInfoClassName } = getSolutionByName(product);

  // Header
  const header = htmlToElement(`
        <div class="profile-interest-header">
            <div class="profile-interest-logo-wrapper">
                <span class="icon profile-interest-logo"></span>
                <span class="profile-interest-logo-text">${placeholders["my-adobe-product"]}</span>
            </div>
            <h3>${product}</h3>
        </div>
    `);

  const iconEl = header.querySelector('span');
  iconEl.classList.add(getSolutionByName(solutionInfoClassName));

  // Content
  const content = htmlToElement(`
        <div class="profile-interest-content">
            <label for="experience-level">${placeholders["select-your-experience-level"]}</label>
        </div>
    `);

  // eslint-disable-next-line no-new
  new Dropdown(content, 'Beginner', options);

  // Checkbox
  const checboxCta = placeholders["select-this-product"];
  const changeHandler = (e) => {
    const { checked } = e.target;
    if (checked) {
      card.classList.add('profile-interest-card--selected');
    } else {
      card.classList.remove('profile-interest-card--selected');
    }
  };
  const checkboxContainer = htmlToElement(`
        <div class="profile-interest-checkbox">
            <input type="checkbox" id="select-product">
            <label for="select-product">${checboxCta}</label>
        </div>`);
  const checkbox = checkboxContainer.querySelector('input');
  checkbox.checked = isSelected;
  checkbox.onchange = changeHandler;

  // Assemble card
  card.appendChild(header);
  card.appendChild(content);
  card.appendChild(checkboxContainer);

  // Add to DOM
  element.appendChild(card);
  decorateIcons(element);
}
