import { decorateIcons, loadCSS } from '../lib-franklin.js';
loadCSS(`${window.hlx.codeBasePath}/scripts/product-card/product-card.css`);

export async function buildProductCard(container, element, model) {
    const { experienceLevel = 'Beginner', product = 'Target', isSelected = false, contentType = '', badgeTitle = '' } = model;

     // Create card container
     const card = document.createElement('div');
     card.className = 'card';
 
     // Header
     const header = document.createElement('div');
     header.className = 'header';
     const logo = document.createElement('img');
    //  logo.src = 'logo.png';  // Path to the logo image
    //  logo.alt = 'Logo';
     logo.className = 'logo';
     const title = document.createElement('h1');
     title.textContent = product;
     header.appendChild(logo);
     header.appendChild(title);
 
     // Content
     const content = document.createElement('div');
     content.className = 'content';
     const label = document.createElement('label');
     label.setAttribute('for', 'experience-level');
     label.textContent = 'Select your experience level';
     const select = document.createElement('select');
     select.id = 'experience-level';
     ['Beginner', 'Intermediate', 'Advanced'].forEach(level => {
         const option = document.createElement('option');
         option.value = level.toLowerCase();
         option.textContent = level;
         option.selected = level === experienceLevel;
         select.appendChild(option);
     });
     content.appendChild(label);
     content.appendChild(select);
 
     // Checkbox
     const checkboxContainer = document.createElement('div');
     const checkbox = document.createElement('input');
     checkbox.type = 'checkbox';
     checkbox.id = 'select-product';
     checkbox.checked = isSelected;
     const checkboxLabel = document.createElement('label');
     checkboxLabel.setAttribute('for', 'select-product');
     checkboxLabel.textContent = 'Select this product';
     checkboxContainer.appendChild(checkbox);
     checkboxContainer.appendChild(checkboxLabel);
 
     // Assemble card
     card.appendChild(header);
     card.appendChild(content);
     card.appendChild(checkboxContainer);
 
     // Add to DOM
     element.appendChild(card);
    decorateIcons(element);
  }
  