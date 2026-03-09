import { createPlaceholderSpan, htmlToElement } from '../../scripts/scripts.js';

export const transcriptLoading = [100, 100, 100, 80, 70, 40]
  .map((i) => `<p class="loading-shimmer" style="--placeholder-width: ${i}%"></p>`)
  .join('');

/** @param {string} transcriptUrl */
export async function getCaptionParagraphs(transcriptUrl) {
  window.videoTranscriptCaptions = window.videoTranscriptCaptions || {};
  if (window.videoTranscriptCaptions[transcriptUrl]) return window.videoTranscriptCaptions[transcriptUrl];
  const response = await fetch(transcriptUrl);
  const transcriptJson = await response.json();
  const captions = transcriptJson?.captions || [];
  const paragraphs = [];
  let currentParagraph = '';
  captions.forEach(({ content, startOfParagraph }) => {
    if (startOfParagraph) {
      paragraphs.push(currentParagraph);
      currentParagraph = content;
    } else {
      currentParagraph += ` ${content}`;
    }
  });
  paragraphs.push(currentParagraph);

  window.videoTranscriptCaptions[transcriptUrl] = paragraphs;
  return paragraphs;
}

/**
 * Updates current video transcript
 * @param {string} transcriptUrl
 * @param {HTMLDetailsElement} transcriptDetail
 */
export function updateTranscript(transcriptUrl, transcriptDetail) {
  const clearTranscript = () => [...transcriptDetail.querySelectorAll('p')].forEach((p) => p.remove());
  const showTranscriptNotAvailable = () => {
    clearTranscript();
    transcriptDetail.append(createPlaceholderSpan('playlistTranscriptNotAvailable', 'Transcript not available'));
  };
  transcriptDetail.addEventListener('toggle', (event) => {
    if (event.target.open && transcriptDetail.dataset.ready !== 'true') {
      const summaryEl = transcriptDetail.querySelector('summary');
      if (summaryEl && !transcriptDetail.querySelector('.loading-shimmer')) {
        summaryEl.insertAdjacentHTML('afterend', transcriptLoading);
      }
      getCaptionParagraphs(transcriptUrl)
        .then((paragraphs) => {
          clearTranscript();
          if (!paragraphs || !paragraphs.length || !paragraphs.join('').trim()) {
            showTranscriptNotAvailable();
          } else paragraphs.forEach((paragraph) => transcriptDetail.append(htmlToElement(`<p>${paragraph}</p>`)));
        })
        .catch(() => {
          showTranscriptNotAvailable();
        })
        .finally(() => {
          transcriptDetail.dataset.ready = 'true';
        });
    }
  });
}

/**
 * @param {string} transcriptUrl
 */
function createTranscriptFromUrl(transcriptUrl) {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  details.append(summary);
  summary.append(createPlaceholderSpan('playlistTranscript', 'Transcript'));
  updateTranscript(transcriptUrl, details);
  return details;
}

/**
 * @param {HTMLDivElement} block
 */
export default function decorate(block) {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  details.append(summary);
  // if row 2 has a link, use the link as the transcript url
  const transcriptUrl = block.querySelector(':scope > div:nth-child(1) > div > a')?.href;
  if (transcriptUrl) {
    block.replaceWith(createTranscriptFromUrl(transcriptUrl));
  } else {
    details.append(summary);
    Array.from(block.children).forEach((element, i) => {
      if (i === 0) summary.append(block.children[0].textContent);
      else {
        const p = document.createElement('p');
        p.textContent = element.textContent;
        details.append(p);
      }
    });

    block.innerHTML = '';
    block.append(details);
  }
}
