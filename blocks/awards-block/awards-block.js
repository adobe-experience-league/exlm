import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

const COMPLETED = placeholders?.completed || 'COMPLETED';
const NO_AWARDS_YET =
  placeholders?.noAwardsYet || 'No awards yet! Start exploring Experience League to discover what you can earn.';

export default async function decorate(block) {
  block.textContent = '';
  const isSignedIn = await isSignedInUser();

  function generateAwardCard(card) {
    return `
        <div class="awards-block-card">
          <div class="awards-block-details">
            <div class="awards-block-title">${card.Title}</div>
            <div class="awards-block-time">${COMPLETED} ${card.Timestamp}</div>
            <div class="awards-block-description">${card.Description}</div>
          </div>
          <span class="icon icon-book"></span>
        </div>
      `;
  }

  function generateAwardsBlock(awardDetails) {
    return `
        <div class="awards-block-holder">
          ${awardDetails.map(generateAwardCard).join('')}
        </div>
      `;
  }

  function generateEmptyAwardsBlock() {
    return `
        <div class="awards-block-noAwardsYet">
          ${NO_AWARDS_YET}
        </div>
      `;
  }

  function formatTimestampToMonthYear(timestamp) {
    const date = new Date(timestamp);
    const options = { year: 'numeric', month: 'short' };
    const formattedMonth = date.toLocaleDateString(undefined, options).slice(0, 3).toUpperCase();
    const year = date.getFullYear();
    return `${formattedMonth} ${year}`;
  }

  if (isSignedIn) {
    const profileData = await defaultProfileClient.getMergedProfile();
    const skills = profileData?.skills;
    const awardedSkills = skills.filter((skill) => skill.award === true);
    const awardDetails = awardedSkills
      .map((skill) => ({
        originalTimestamp: skill.timestamp,
        formattedTimestamp: formatTimestampToMonthYear(skill.timestamp),
        title: skill.name,
        description: skill.description,
      }))
      .sort((a, b) => new Date(a.originalTimestamp) - new Date(b.originalTimestamp))
      .slice(-3)
      .map((skill) => ({
        Timestamp: skill.formattedTimestamp,
        Title: skill.title,
        Description: skill.description,
      }));

    if (awardDetails.length) {
      const awardsBlockDiv = document.createRange().createContextualFragment(generateAwardsBlock(awardDetails));
      block.append(awardsBlockDiv);
    } else {
      const awardsBlockEmptyDiv = document.createRange().createContextualFragment(generateEmptyAwardsBlock());
      block.append(awardsBlockEmptyDiv);
    }
    decorateIcons(block);
  }
}
