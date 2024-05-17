import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

export default function decorate(block) {
  block.textContent = '';

  const roleCardsData = [
    {
      title: placeholders.filterRoleUserTitle,
      icon: '',
      description: placeholders.filterRoleUserDescription,
    },
    {
      title: placeholders.filterRoleDeveloperTitle,
      icon: '',
      description: placeholders.filterRoleDeveloperDescription,
    },
    {
      title: placeholders.filterRoleAdminTitle,
      icon: '',
      description: placeholders.filterRoleAdminDescription,
    },
    {
      title: placeholders.filterRoleLeaderTitle,
      icon: '',
      description: placeholders.filterRoleLeaderDescription,
    },
  ];

  const headerDiv = htmlToElement(`
    <div class="role-cards-container">
      <div class="role-cards-block">
      ${roleCardsData.map((card) => {
        return `
        <h2>${card.title}</h2>
        <p>${card.description}</p>
        `;
      })}
      </div>
    </div>
  `);

  block.append(headerDiv);
}
