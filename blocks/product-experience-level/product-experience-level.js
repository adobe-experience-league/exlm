import buildProductCard from '../../scripts/profile/profile-interests.js';
import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { productExperienceEventEmitter } from '../../scripts/events.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const beginnerText = placeholders?.profileExpLevelBeginner || 'Beginner';
const experiencedText = placeholders?.profileExpLevelExperienced || 'Experienced';
const intermediateText = placeholders?.profileExpLevelIntermediate || 'Intermediate';
const beginnerDescription =
  placeholders?.profileExpLevelBeginnerDesc ||
  'You’re just starting out with the selected product and are looking to grow your skills.';
const intermediateDescription =
  placeholders?.profileExpLevelprofileExpLevelIntermediateDesc ||
  'You have a moderate understanding of the selected product, but have room to level up your skills.';
const experiencedDescription =
  placeholders?.profileExpLevelExperiencedDesc ||
  'You know the selected product inside and out and use your advanced skills to achieve complex objectives.';

const renderCards = (resultsEl) => {
  const interests = productExperienceEventEmitter.get('interests_data') ?? [];
  interests
    .filter((interest) => interest.selected)
    .forEach((interestData) => {
      const cardDiv = document.createElement('div');
      cardDiv.classList.add('card-item');
      buildProductCard(cardDiv, interestData);
      resultsEl.appendChild(cardDiv);
    });
};

export default function ProfileExperienceLevel(block) {
  const [firstLevel, secondLevel] = block.children;
  const heading = firstLevel.innerText?.trim() ?? '';
  const subHeading = secondLevel.innerText?.trim() ?? '';
  block.innerHTML = '';
  const content = htmlToElement(`
    <div>
        <h2 class="product-experience-level-header">${heading}</h2>
    <div>
      <p class="product-experience-level-para">${subHeading}</p>
      <div class="product-experience-level-type">
        <div class="product-experience-level-item">
          <div class="product-experience-level-item-header">
          <div class="product-interest-icon beginner">
            <div class="product-interest-icon-bar product-interest-icon-bar-beginner"></div>
            <div class="product-interest-icon-bar product-interest-icon-bar-intermediate"></div>
            <div class="product-interest-icon-bar product-interest-icon-bar-experience"></div>
        </div>
            <h3>${beginnerText}</h3>
          </div>
          <p>${beginnerDescription}</p>
        </div>
        <div class="product-experience-level-item">
          <div class="product-experience-level-item-header">
            <div class="product-interest-icon intermediate">
              <div class="product-interest-icon-bar product-interest-icon-bar-beginner"></div>
              <div class="product-interest-icon-bar product-interest-icon-bar-intermediate"></div>
              <div class="product-interest-icon-bar product-interest-icon-bar-experience"></div>
          </div>
            <h3>${intermediateText}</h3>
          </div>
          <p>${intermediateDescription}</p>
        </div>
        <div class="product-experience-level-item">
          <div class="product-experience-level-item-header">
            <div class="product-interest-icon experienced">
              <div class="product-interest-icon-bar product-interest-icon-bar-beginner"></div>
              <div class="product-interest-icon-bar product-interest-icon-bar-intermediate"></div>
              <div class="product-interest-icon-bar product-interest-icon-bar-experience"></div>
          </div>
            <h3>${experiencedText}</h3>
          </div>
          <p>${experiencedDescription}</p>
        </div>
      </div>
      <div class="personalize-interest-results"></div>
    </div>
  </div>`);
  block.appendChild(content);
  const resultsEl = block.querySelector('.personalize-interest-results');
  renderCards(resultsEl);

  productExperienceEventEmitter.on('dataChange', (data) => {
    const { key, value } = data;
    const interests = productExperienceEventEmitter.get('interests_data') ?? [];
    const model = interests.find((interest) => interest.id === key);
    if (model) {
      model.selected = value;
      resultsEl.innerHTML = '';
      renderCards(resultsEl);
    }
  });
}
