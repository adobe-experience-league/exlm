import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

// API Configuration - Change this to your production URL when deploying
const API_BASE_URL = 'http://localhost:8000';
const SEARCH_ENDPOINT = `${API_BASE_URL}/api/v1/search`;

/**
 * Makes a search request to the backend API with timeout
 * @param {string} query - The search query
 * @param {number} timeoutMs - Timeout in milliseconds (default 60s)
 * @returns {Promise<object>} - The API response
 */
async function fetchSearchResults(query, timeoutMs = 60000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(SEARCH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parses the summary and extracts sources section
 * @param {string} summary - The raw summary from API
 * @returns {object} - Parsed content and sources
 */
function parseSummary(summary) {
  if (!summary) return { content: '', sources: [] };

  // Split content and sources
  const sourcesMatch = summary.split(/\n\nSources:\n/);
  const mainContent = sourcesMatch[0] || '';
  const sourcesText = sourcesMatch[1] || '';

  // Parse sources: "• Title (Type) - URL"
  const sources = [];
  if (sourcesText) {
    const sourceLines = sourcesText.split('\n').filter((line) => line.startsWith('•'));
    sourceLines.forEach((line) => {
      const match = line.match(/^•\s*(.+?)\s*\(([^)]+)\)\s*-\s*(https?:\/\/.+)$/);
      if (match) {
        sources.push({
          title: match[1].trim(),
          type: match[2].trim(),
          url: match[3].trim(),
        });
      }
    });
  }

  return { content: mainContent, sources };
}

/**
 * Converts the summary content to HTML
 * @param {string} content - The main content text
 * @returns {string} - Formatted HTML string
 */
function formatContent(content) {
  if (!content) return '';

  return content
    // Bold text **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bullet points •
    .replace(/^•\s+(.*)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>[\s\S]*?<\/li>)(?=\s*<li>|$)/g, '$1')
    .replace(/((?:<li>[\s\S]*?<\/li>\s*)+)/g, '<ul>$1</ul>')
    // Double newlines to paragraph breaks
    .replace(/\n\n/g, '</p><p>')
    // Single newlines (not in lists)
    .replace(/(?<!<\/li>)\n(?!<)/g, '<br>')
    // Wrap in paragraph
    .replace(/^(.*)$/s, '<p>$1</p>')
    // Clean up
    .replace(/<p>\s*<ul>/g, '<ul>')
    .replace(/<\/ul>\s*<\/p>/g, '</ul>')
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p><br>/g, '<p>')
    .replace(/<br><\/p>/g, '</p>')
    .replace(/<p>(<strong>[^<]+<\/strong>)<\/p>/g, '<h3>$1</h3>');
}

/**
 * Animates content appearing line by line
 * @param {HTMLElement} container - The container with content to animate
 */
function animateContent(container) {
  const elements = container.querySelectorAll('.answer-content > *, .generative-search-sources, .generative-search-usage');
  elements.forEach((el, index) => {
    el.classList.add('animate-line');
    el.style.animationDelay = `${index * 0.1}s`;
  });
}

/**
 * Renders the search results in the container
 * @param {HTMLElement} container - The results container element
 * @param {object} data - The API response data
 * @param {string} noResultsMessage - Custom message when no results found
 * @param {object} placeholders - Language placeholders
 */
function renderResults(container, data, noResultsMessage, placeholders) {
  container.innerHTML = '';

  if (!data.summary) {
    container.innerHTML = `<p class="no-results">${noResultsMessage}</p>`;
    return;
  }

  const { content, sources } = parseSummary(data.summary);
  const formattedContent = formatContent(content);

  // Normalize type for data attribute (lowercase, kebab-case)
  const normalizeType = (type) => type.toLowerCase().replace(/\s+/g, '-');

  const sourcesHtml = sources.length > 0 ? `
    <div class="generative-search-sources">
      <h4>Sources</h4>
      <ul class="source-list">
        ${sources.map((source) => `
          <li>
            <a href="${source.url}" target="_blank" rel="noopener noreferrer" data-type="${normalizeType(source.type)}">
              <span class="source-title">${source.title}</span>
              <span class="source-type">${source.type}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';

  // Token usage display
  const usageHtml = data.usage ? `
    <div class="generative-search-usage">
      <div class="usage-item">
        <span class="usage-label">Input</span>
        <span class="usage-value">${data.usage.input_tokens?.toLocaleString() || 0}</span>
        <span class="usage-unit">tokens</span>
      </div>
      <div class="usage-item">
        <span class="usage-label">Output</span>
        <span class="usage-value">${data.usage.output_tokens?.toLocaleString() || 0}</span>
        <span class="usage-unit">tokens</span>
      </div>
      <div class="usage-item usage-total">
        <span class="usage-label">Total</span>
        <span class="usage-value">${((data.usage.input_tokens || 0) + (data.usage.output_tokens || 0)).toLocaleString()}</span>
        <span class="usage-unit">tokens</span>
      </div>
    </div>
  ` : '';

  const showMoreLabel = placeholders?.genSearchShowMore || 'Show more';
  const showLessLabel = placeholders?.genSearchShowLess || 'Show less';

  container.innerHTML = `
    <div class="generative-search-answer">
      <div class="answer-content-wrapper">
        <div class="answer-content">
          ${formattedContent}
        </div>
        <div class="answer-content-fade"></div>
      </div>
      <button class="generative-search-show-more" data-show-more="${showMoreLabel}" data-show-less="${showLessLabel}">
        <span>${showMoreLabel}</span>
      </button>
      ${sourcesHtml}
      ${usageHtml}
    </div>
  `;

  // Setup show more/less functionality
  const answerWrapper = container.querySelector('.answer-content-wrapper');
  const showMoreBtn = container.querySelector('.generative-search-show-more');

  // Check if content exceeds the collapsed height
  requestAnimationFrame(() => {
    const answerContent = container.querySelector('.answer-content');
    const isOverflowing = answerContent.scrollHeight > 200;

    if (isOverflowing) {
      answerWrapper.classList.add('is-collapsed');
    } else {
      showMoreBtn.hidden = true;
    }

    // Animate content appearing
    animateContent(container);
  });

  showMoreBtn?.addEventListener('click', () => {
    const isCollapsed = answerWrapper.classList.contains('is-collapsed');
    answerWrapper.classList.toggle('is-collapsed');
    showMoreBtn.querySelector('span').textContent = isCollapsed ? showLessLabel : showMoreLabel;
    showMoreBtn.classList.toggle('is-expanded', isCollapsed);
  });
}

/**
 * Creates shimmer loading placeholder
 * @returns {string} - HTML string for shimmer
 */
function createShimmerHTML() {
  const widths = [100, 95, 80, 100, 60];
  return `
    <div class="generative-search-shimmer">
      ${widths.map((w) => `<p class="loading-shimmer" style="--placeholder-width: ${w}%"></p>`).join('')}
    </div>
  `;
}

/**
 * Shows shimmer loading state
 * @param {HTMLElement} resultsEl - The results container element
 * @param {HTMLElement} resultsWrapper - The results wrapper element
 */
function showShimmer(resultsEl, resultsWrapper) {
  resultsEl.innerHTML = createShimmerHTML();
  resultsEl.classList.add('is-loading');
  resultsWrapper.hidden = false;
}

/**
 * Hides shimmer loading state
 * @param {HTMLElement} resultsEl - The results container element
 */
function hideShimmer(resultsEl) {
  resultsEl.classList.remove('is-loading');
  const shimmer = resultsEl.querySelector('.generative-search-shimmer');
  if (shimmer) shimmer.remove();
}

/**
 * Shows error/no-results message
 * @param {HTMLElement} container - The results container
 * @param {string} message - The message to display
 */
function showError(container, message) {
  container.innerHTML = `<p class="no-results">${message}</p>`;
}

export default async function decorate(block) {
  let placeholders = {};
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:', err);
  }

  // Extract configuration from block's HTML structure
  const [placeholderText, resultsSubtitle, noResultsMessage] = [...block.children].map(
    (row) => row?.querySelector('div')?.textContent?.trim() || '',
  );

  const resultsLabel = placeholders?.genSearchLabel || 'Search Results';

  const search = `
    <div class="generative-search-container">
      <form class="generative-search-form" role="search">
        <div class="search-input-wrapper">
          <span class="icon icon-search search-icon"></span>
          <input 
            type="search" 
            placeholder="${placeholderText}" 
            role="searchbox" 
            class="generative-search-input"
            aria-label="Search"
          />
          <button type="button" class="generative-search-clear-button" hidden>
            <span class="icon icon-close"></span>
          </button>
        </div>
      </form>
      <div class="generative-search-results-wrapper" hidden>
        <div class="generative-search-results-header">
          <h2 class="generative-search-results-label">${resultsLabel}</h2>
          ${resultsSubtitle ? `<p class="generative-search-results-subtitle">${resultsSubtitle}</p>` : ''}
        </div>
        <div class="generative-search-results" aria-live="polite"></div>
      </div>
    </div>
  `;

  block.innerHTML = '';
  block.append(htmlToElement(search));
  decorateIcons(block);

  // Get DOM references
  const form = block.querySelector('.generative-search-form');
  const searchInput = block.querySelector('.generative-search-input');
  const clearButton = block.querySelector('.generative-search-clear-button');
  const resultsWrapper = block.querySelector('.generative-search-results-wrapper');
  const resultsEl = block.querySelector('.generative-search-results');

  // Handle form submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    try {
      showShimmer(resultsEl, resultsWrapper);
      const data = await fetchSearchResults(query);
      hideShimmer(resultsEl);
      renderResults(resultsEl, data, noResultsMessage, placeholders);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Search error:', error);
      hideShimmer(resultsEl);
      showError(resultsEl, noResultsMessage);
    }
  });

  // Show/hide clear button based on input
  searchInput?.addEventListener('input', () => {
    clearButton.hidden = !searchInput.value;
  });

  // Clear input and results
  clearButton?.addEventListener('click', () => {
    searchInput.value = '';
    clearButton.hidden = true;
    resultsWrapper.hidden = true;
    resultsEl.innerHTML = '';
    searchInput.focus();
  });

  // Allow Enter key to submit
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.dispatchEvent(new Event('submit'));
    }
  });
}
