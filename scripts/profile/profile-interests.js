import { decorateIcons, loadCSS } from '../lib-franklin.js';
import Dropdown from '../dropdown/dropdown.js';
import { htmlToElement, fetchLanguagePlaceholders } from '../scripts.js';
import getSolutionByName from '../../blocks/toc/toc-solutions.js';
import { productExperienceEventEmitter } from '../events.js';

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
    value: 'Beginner',
    title: placeholders.profileExpLevelBeginner || 'Beginner',
  },
  {
    value: 'Intermediate',
    title: placeholders.profileExpLevelIntermediate || 'Intermediate',
  },
  {
    value: 'Advanced',
    title: placeholders.profileExpLevelExperienced || 'Experienced',
  },
];

// eslint-disable-next-line import/prefer-default-export
export default async function buildProductCard(container, element, model) {
  const { product: productsList = [], isSelected = false } = model;
  const [product] = productsList;
  // Create card container
  const card = document.createElement('div');
  const cardContent = document.createElement('div');
  card.className = `profile-interest-card ${isSelected ? 'profile-interest-card-selected' : ''}`;
  const { class: solutionInfoClassName } = getSolutionByName(product);

  // Header
  const header = htmlToElement(`
        <div class="profile-interest-header">
            <div class="profile-interest-logo-wrapper">
                <span class="icon profile-interest-logo"></span>
                <span class="profile-interest-logo-text">${placeholders.myAdobeproduct || 'My Adobe product'}</span>
            </div>
            <h3>${product}</h3>
        </div>
    `);

  const iconEl = header.querySelector('span');
  iconEl.classList.add(`icon-${solutionInfoClassName}`);

  // Content
  const content = htmlToElement(`
        <div class="profile-interest-content">
            <label for="experience-level">${
              placeholders.selectYourExperienceLevel || 'Select your experience level'
            }</label>
        </div>
    `);

  // eslint-disable-next-line no-new
  new Dropdown(content, 'Beginner', options);

  // Checkbox
  const changeHandler = (e) => {
    const { checked } = e.target;
    if (checked) {
      card.classList.add('profile-interest-card-selected');
    } else {
      card.classList.remove('profile-interest-card-selected');
    }
    productExperienceEventEmitter.set(product, checked);
  };
  const checkboxContainer = htmlToElement(`
        <div class="profile-interest-checkbox">
            <input type="checkbox" data-name="${product}">
            <label for="${product}" class="subtext">${placeholders.selectThisProduct || 'Select this product'}</label>
        </div>`);
  const checkbox = checkboxContainer.querySelector('input');
  checkbox.checked = isSelected;
  checkbox.onchange = changeHandler;

  // Assemble card
  card.appendChild(header);
  decorateIcons(header, 'solutions/');
  cardContent.appendChild(content);
  decorateIcons(content);
  cardContent.appendChild(checkboxContainer);

  card.appendChild(cardContent);

  // Add to DOM
  element.appendChild(card);
}
