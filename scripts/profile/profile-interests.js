import { decorateIcons, loadCSS } from '../lib-franklin.js';
import Dropdown from '../dropdown/dropdown.js';
import { htmlToElement } from '../scripts.js';
import getSolutionByName from '../../blocks/toc/toc-solutions.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/profile-interests/profile-interests.css`);

const options = [
  {
    value: 'Beginner',
    title: 'Beginner',
  },
  {
    value: 'Intermediate',
    title: 'Intermediate',
  },
  {
    value: 'Advanced',
    title: 'Advanced',
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
                <img class="profile-interest-logo">
                <span class="profile-interest-logo-text">My Adobe Product</span>
            </div>
            <h3>${product}</h3>
        </div>
    `);

  const img = header.querySelector('img');
  img.src = `/icons/solutions/${solutionInfoClassName}.svg`;

  // Content
  const content = htmlToElement(`
        <div class="profile-interest-content">
            <label for="experience-level">Select your experience level</label>
        </div>
    `);

  // eslint-disable-next-line no-new
  new Dropdown(content, 'Beginner', options);

  // Checkbox
  const checboxCta = 'Select this product';
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
