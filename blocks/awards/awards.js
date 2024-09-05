import { defaultProfileClient, isSignedInUser } from '../../scripts/auth/profile.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';
import { fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import Pagination from '../../scripts/pagination/pagination.js';

const UEAuthorMode = window.hlx.aemRoot || window.location.href.includes('.html');
const RESULTS_PER_PAGE = 6;
let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('Error fetching placeholders:', err);
}

export default async function decorate(block) {
  block.textContent = '';
  const isSignedIn = await isSignedInUser();

  function generateAwardCard(card) {
    return `
        <div class="awards-card">
          <div class="awards-details">
            <div class="awards-title">${card.Title}</div>
            <div class="awards-time">${placeholders?.completed || 'COMPLETED'} ${card.Timestamp}</div>
            <div class="awards-description">${card.Description}</div>
          </div>
          <span class="icon icon-book"></span>
        </div>
      `;
  }

  function generateAwardsBlock(awardDetails) {
    return `
        ${awardDetails.map(generateAwardCard).join('')}
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
      .map((skill) => ({
        Timestamp: skill.formattedTimestamp,
        Title: skill.title,
        Description: skill.description,
      }));

    if (awardDetails.length) {
      const pgNum = 0;
      const totalPages = Math.ceil(awardDetails.length / RESULTS_PER_PAGE);
      const renderItems = ({ pgNum: pgNumber, block: blockEl }) => {
        const start = pgNumber * RESULTS_PER_PAGE;
        const end = start + RESULTS_PER_PAGE;
        const items = awardDetails.slice(start, end);
        const wrapper = blockEl.querySelector('.awards-holder');
        const awardsDiv = document.createRange().createContextualFragment(generateAwardsBlock(items));
        wrapper.innerHTML = '';
        wrapper.append(awardsDiv);
        decorateIcons(blockEl);
      };
      block.innerHTML = `<div class="awards-holder"></div>`;
      // eslint-disable-next-line no-new
      new Pagination({ wrapper: block, identifier: 'awards', renderItems, pgNumber: pgNum, totalPages });
      renderItems({ pgNum, block });
    } else {
      // eslint-disable-next-line no-lonely-if
      if (!UEAuthorMode) {
        block.closest('.section.awards-container')?.remove();
      }
    }
  }
}
