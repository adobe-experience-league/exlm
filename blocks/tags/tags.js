import { getPathDetails, fetchLanguagePlaceholders, getConfig } from '../../scripts/scripts.js';
import { getMetadata } from '../../scripts/lib-franklin.js';

async function fetchData(url) {
  try {
    let data;
    const response = await fetch(url, {
      method: 'GET',
    });
    if (response.ok) {
      data = await response.json();
    }
    return data?.data || [];
  } catch (error) {
    /* eslint-disable no-console */
    console.error('Error fetching data', error);
    return [];
  }
}

function parseMetaData(metaDataString) {
  return metaDataString.split(',').map((item) => item.trim());
}

function getLocalizedData(dataArray, metaArray, lang, nameFieldEn, nameFieldLocalized) {
  if (lang !== 'en') {
    const localizedData = dataArray
      .filter((item) => metaArray.includes(item[nameFieldEn]))
      .map((item) => item[nameFieldLocalized])
      .join(',');

    // Return metaArray if localizedData is empty
    if (!localizedData) {
      return metaArray.join(',');
    }

    return localizedData;
  }
  return metaArray.join(',');
}

export default async function decorate(block) {
  const { lang } = getPathDetails();
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  const { rolesUrl, expLevelUrl, featuresUrl } = getConfig();
  const roles = await fetchData(rolesUrl);
  const levels = await fetchData(expLevelUrl);
  const features = await fetchData(featuresUrl);

  const coveosolutions = getMetadata('coveo-solution');
  const solutions = [
    ...new Set(
      coveosolutions.split(';').map((item) => {
        const parts = item.split('|');
        return parts.length > 1 ? parts[1].trim() : item.trim();
      }),
    ),
  ].join(',');

  const metaFeatures = parseMetaData(getMetadata('feature'));
  const metaRoles = parseMetaData(getMetadata('role'));
  const metaExpLevels = parseMetaData(getMetadata('level'));

  const localizedRoles = getLocalizedData(roles, metaRoles, lang, 'Name_en', 'Name');
  const localizedExpLevels = getLocalizedData(levels, metaExpLevels, lang, 'Name_en', 'Name');
  const localizedFeatures = getLocalizedData(features, metaFeatures, lang, 'Name_en', 'Name');

  function createTagsHTML(values) {
    return values
      .split(',')
      .filter(Boolean)
      .map((value) => `<div class="article-tags-name">${value.trim()}</div>`)
      .join('');
  }

  block.textContent = '';

  const articleTags = document.createDocumentFragment();

  if (solutions) {
    const productSection = document.createElement('div');
    productSection.classList.add('article-tags-product');
    productSection.innerHTML = `
      <div class="article-tags-product-heading">
        ${placeholders?.tagsBlockProducts || 'PRODUCTS:'}
      </div>
      ${createTagsHTML(solutions)}
    `;
    articleTags.appendChild(productSection);
  }

  if (metaFeatures) {
    const topicsSection = document.createElement('div');
    topicsSection.classList.add('article-tags-topics');
    topicsSection.innerHTML = `
      <div class="article-tags-topics-heading">
        ${placeholders?.topics || 'TOPICS:'}
      </div>
      ${createTagsHTML(localizedFeatures)}
    `;
    articleTags.appendChild(topicsSection);
  }

  const createdForContent = [localizedRoles, localizedExpLevels].filter(Boolean).map(createTagsHTML).join('');
  if (createdForContent) {
    const createdForSection = document.createElement('div');
    createdForSection.classList.add('article-tags-createdFor');
    createdForSection.innerHTML = `
      <div class="article-tags-createdFor-heading">
        ${placeholders?.createdFor || 'CREATED FOR:'}
      </div>
      ${createdForContent}
    `;
    articleTags.appendChild(createdForSection);
  }

  block.append(articleTags);
}
