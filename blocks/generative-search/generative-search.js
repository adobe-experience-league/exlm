import { htmlToElement } from '../../scripts/scripts.js';
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
 * Renders the search results in the container
 * @param {HTMLElement} container - The results container element
 * @param {object} data - The API response data
 */
function renderResults(container, data) {
  container.innerHTML = '';

  if (!data.summary) {
    container.innerHTML = '<p class="no-results">No results found. Please try a different query.</p>';
    container.hidden = false;
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

  container.innerHTML = `
    <div class="generative-search-answer">
      <div class="answer-content">
        ${formattedContent}
      </div>
      ${sourcesHtml}
      ${usageHtml}
    </div>
  `;
  container.hidden = false;
}

/**
 * Shows loading state
 * @param {HTMLElement} loadingEl - The loading element
 * @param {HTMLElement} resultsEl - The results element
 */
function showLoading(loadingEl, resultsEl) {
  loadingEl.hidden = false;
  resultsEl.hidden = true;
}

/**
 * Hides loading state
 * @param {HTMLElement} loadingEl - The loading element
 */
function hideLoading(loadingEl) {
  loadingEl.hidden = true;
}

/**
 * Shows error message
 * @param {HTMLElement} container - The results container
 * @param {string} message - The error message
 */
function showError(container, message) {
  container.innerHTML = `
    <div class="generative-search-error">
      <p>${message}</p>
    </div>
  `;
  container.hidden = false;
}

export default function decorate(block) {
  const search = `
    <div class="generative-search-container">
      <div class="generative-search-header">
        <h2>Generative Search</h2>
        <p class="generative-search-subtitle">Ask questions about Adobe Experience League</p>
      </div>
      <form class="generative-search-form" role="search">
        <div class="search-input-wrapper">
          <span class="icon icon-search search-icon"></span>
          <input 
            type="search" 
            placeholder="Ask a question..." 
            role="searchbox" 
            class="generative-search-input"
            aria-label="Search"
          />
          <button type="button" class="generative-search-clear-button" hidden>
            <span class="icon icon-clear"></span>
          </button>
        </div>
        <button type="submit" class="generative-search-button">Search</button>
      </form>
      <div class="generative-search-loading" hidden>
        <div class="loading-spinner"></div>
        <p>Generating response...</p>
      </div>
      <div class="generative-search-results" hidden aria-live="polite"></div>
    </div>
  `;

  block.innerHTML = '';
  block.append(htmlToElement(search));
  decorateIcons(block);

  // Get DOM references
  const form = block.querySelector('.generative-search-form');
  const searchInput = block.querySelector('.generative-search-input');
  const clearButton = block.querySelector('.generative-search-clear-button');
  const loadingEl = block.querySelector('.generative-search-loading');
  const resultsEl = block.querySelector('.generative-search-results');

  // Handle form submission
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    try {
      showLoading(loadingEl, resultsEl);
      const data = await fetchSearchResults(query);
      renderResults(resultsEl, data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Search error:', error);
      showError(resultsEl, 'Sorry, something went wrong. Please try again.');
    } finally {
      hideLoading(loadingEl);
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
    resultsEl.hidden = true;
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
