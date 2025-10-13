import { htmlToElement, fetchLanguagePlaceholders } from '../../scripts/scripts.js';
import createCanvas from '../../scripts/utils/canvas-utils.js';
import { canvasToPDF } from '../../scripts/utils/canvas-pdf-utils.js';
import { launchConfetti } from '../../scripts/utils/confetti-utils.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

const CONFIG = {
  CONFETTI: {
    DURATION: 30000, // 30 seconds
    PARTICLE_COUNT: 7,
    SPREAD: 60,
    TICKS: 500,
    FRAME_DELAY: 50,
    INITIAL_DELAY: 800,
    FALLBACK_PARTICLES: 100,
    FALLBACK_SPREAD: 50,
    CANVAS: {
      WIDTH: 588,
      HEIGHT: 330,
    },
  },
  CERTIFICATE: {
    IMAGE: {
      PLACEHOLDER: '/images/course-certificate-placeholder.png',
    },
    WIDTH: 369,
    HEIGHT: 285,
    SCALE: 3,
  },
  API: {
    URL: 'https://mocki.io/v1/d882efc4-04b9-4a5c-8110-a10fb18878bf', // Mock API URL - To be replaced with Profile API once implemented
  },
};

let placeholders = {};

/**
 * Simple text wrapping - breaks long text into multiple lines
 * @param {string} text - Text to wrap
 * @param {number} maxLength - Maximum characters per line
 * @returns {string} Wrapped text with line breaks
 */
function wrapText(text, maxLength = 30) {
  if (text.length <= maxLength) return text;

  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    if ((currentLine + word).length <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
}

function getCourseLandingPageUrl() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length >= 2) {
    const url = new URL(window.location.origin);
    url.pathname = `/${parts[0]}/${parts[1]}`;
    return url.toString();
  }
  return null;
}

/**
 * Fetches course data from API
 */
async function fetchCourseData() {
  try {
    const response = await fetch(CONFIG.API.URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.course;
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Error fetching course data:', error);
    throw error;
  }
}

/**
 * Creates shimmer loading elements
 */
function createShimmerElements() {
  const shimmerContainer = document.createElement('div');
  shimmerContainer.classList.add('course-completion-certificate-container');

  const shimmerCanvas = document.createElement('div');
  shimmerCanvas.classList.add('course-completion-certificate', 'shimmer');

  shimmerContainer.appendChild(shimmerCanvas);
  return shimmerContainer;
}

/**
 * Creates error message element
 */
function createErrorMessage() {
  const errorDiv = document.createElement('div');
  errorDiv.classList.add('error-message');
  errorDiv.innerHTML = `
    <h4>${placeholders?.courseCertificateErrorTitle || 'Unable to Load Certificate'}</h4>
    <p>${
      placeholders?.courseCertificateErrorMessage ||
      'There was an error loading your certificate data. Please try again later.'
    }</p>
  `;
  return errorDiv;
}

/**
 * Downloads the certificate as high-quality PDF
 */
async function downloadCertificate(canvas, courseData, downloadButton) {
  try {
    // Disable button
    downloadButton.disabled = true;

    // Create dynamic filename with course name
    const courseName = courseData.name
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD - Would be replaced with issued date from API
    const filename = `${courseName}-certificate-${date}.pdf`;

    // Download as PDF with actual canvas dimensions (no scaling)
    const pdfBlob = await canvasToPDF(canvas, {
      title: `${courseData.name} - ${placeholders?.courseCertificateTitleText || 'Course Completion Certificate'}`,
      author: placeholders?.courseCertificateAuthorText || 'Experience League | Adobe',
      subject: placeholders?.courseCertificateSubjectText || 'Certificate of Course Completion',
      scale: CONFIG.CERTIFICATE.SCALE, // Use actual canvas dimensions
    });

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    // Re-enable button
    downloadButton.disabled = false;
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Error downloading certificate:', error);

    // Re-enable button
    downloadButton.disabled = false;
  }
}

/**
 * Shares the course completion to LinkedIn
 */
function shareToLinkedIn() {
  const shareUrl = encodeURIComponent(getCourseLandingPageUrl());
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;

  // Open LinkedIn share in new window
  window.open(linkedInUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
}

/**
 * Creates and configures the confetti canvas
 * @returns {HTMLCanvasElement} Configured canvas element
 */
function createConfettiCanvas() {
  const canvas = document.createElement('canvas');
  canvas.classList.add('course-completion-confetti-canvas');

  canvas.width = CONFIG.CONFETTI.CANVAS.WIDTH;
  canvas.height = CONFIG.CONFETTI.CANVAS.HEIGHT;

  return canvas;
}

/**
 * Creates a certificate container with image and canvas using API data
 * @param {Object} courseData - Course data from API
 * @returns {Object} Container and canvas elements
 */
async function createCertificateContainer(courseData) {
  const container = document.createElement('div');
  container.classList.add('course-completion-certificate-container');

  // Create certificate text using API data with scale adjustment and placeholders
  const certificateText = [
    {
      content: wrapText(courseData.name, 20), // Simple character-based wrapping
      position: { x: 185 * CONFIG.CERTIFICATE.SCALE, y: 115 * CONFIG.CERTIFICATE.SCALE },
      font: { size: `${22 * CONFIG.CERTIFICATE.SCALE}px`, weight: 'bold' },
      color: '#2C2C2C',
      align: 'center',
    },
    {
      content: placeholders?.courseCompletedByText || 'COMPLETED BY',
      position: { x: 185 * CONFIG.CERTIFICATE.SCALE, y: 180 * CONFIG.CERTIFICATE.SCALE },
      font: { size: `${8 * CONFIG.CERTIFICATE.SCALE}px` },
      color: '#686868',
      align: 'center',
    },
    {
      content: 'John Doe',
      position: { x: 185 * CONFIG.CERTIFICATE.SCALE, y: 195 * CONFIG.CERTIFICATE.SCALE },
      font: { size: `${16 * CONFIG.CERTIFICATE.SCALE}px`, weight: 'bold' },
      color: '#2C2C2C',
      align: 'center',
    },
    {
      content: 'ISSUED July 30, 2025',
      position: { x: 185 * CONFIG.CERTIFICATE.SCALE, y: 220 * CONFIG.CERTIFICATE.SCALE },
      font: { size: `${8.5 * CONFIG.CERTIFICATE.SCALE}px` },
      color: '#686868',
      align: 'center',
    },
    {
      content: (placeholders?.courseCompletionTimeText || 'Completion Time [hours] hours').replace(
        '[hours]',
        courseData.completionTimeInHrs,
      ),
      position: { x: 300 * CONFIG.CERTIFICATE.SCALE, y: 240 * CONFIG.CERTIFICATE.SCALE },
      font: { size: `${7.5 * CONFIG.CERTIFICATE.SCALE}px` },
      color: '#2C2C2C',
      align: 'center',
    },
  ];

  const certificateCanvas = await createCanvas({
    width: CONFIG.CERTIFICATE.WIDTH * CONFIG.CERTIFICATE.SCALE,
    height: CONFIG.CERTIFICATE.HEIGHT * CONFIG.CERTIFICATE.SCALE,
    backgroundColor: 'transparent',
    className: 'course-completion-certificate',
    options: {
      text: certificateText,
      image: {
        src: window.hlx.codeBasePath + CONFIG.CERTIFICATE.IMAGE.PLACEHOLDER,
        position: { x: 0, y: 0 },
        width: CONFIG.CERTIFICATE.WIDTH * CONFIG.CERTIFICATE.SCALE,
        height: CONFIG.CERTIFICATE.HEIGHT * CONFIG.CERTIFICATE.SCALE,
        fit: 'cover',
      },
    },
  });

  container.appendChild(certificateCanvas);

  const canvas = createConfettiCanvas();
  container.appendChild(canvas);

  return { container, canvas };
}

/**
 * Creates the content container with title, description, and buttons
 * @param {Array} children - Block children elements
 * @param {HTMLCanvasElement} certificateCanvas - The certificate canvas for download
 * @param {Object} courseData - Course data from API
 * @returns {HTMLElement} Content container
 */
function createContent(children, certificateCanvas, courseData) {
  const [title, description, linkedInBtn, downloadBtn] = children;

  const container = htmlToElement(`
    <div class="course-completion-content-container">
      <h1>${title?.textContent}</h1>
      <p>${description?.textContent}</p>
      <div class="course-completion-button-container">
        <button class="btn primary linkedin-share"><span class="icon icon-linkedin-white"></span>${linkedInBtn?.textContent}</button>
        <button class="btn secondary download-certificate">${downloadBtn?.textContent}</button>
      </div>
    </div>
  `);

  // Add LinkedIn share functionality
  const linkedInShareBtn = container.querySelector('.linkedin-share');
  if (linkedInShareBtn) {
    linkedInShareBtn.addEventListener('click', () => shareToLinkedIn());
  }

  // Add PDF download functionality to download certificate button
  const downloadCertificateBtn = container.querySelector('.download-certificate');
  if (downloadBtn && downloadCertificateBtn && certificateCanvas) {
    downloadCertificateBtn.addEventListener('click', () =>
      downloadCertificate(certificateCanvas, courseData, downloadCertificateBtn),
    );
  }
  return container;
}

/**
 * Main decorator function for course completion block
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate(block) {
  // Store original children before clearing block
  const originalChildren = Array.from(block.children);

  // Load placeholders
  try {
    placeholders = await fetchLanguagePlaceholders();
  } catch {
    // eslint-disable-next-line no-console
    console.error('Error fetching placeholders:');
  }

  // Show shimmer loading initially
  const shimmerContainer = createShimmerElements();
  block.textContent = '';
  block.appendChild(shimmerContainer);

  try {
    // Fetch course data from API
    const courseData = await fetchCourseData();

    // Create certificate with API data
    const { container, canvas } = await createCertificateContainer(courseData);
    const content = createContent(
      originalChildren,
      container.querySelector('.course-completion-certificate'),
      courseData,
    );

    // Replace shimmer with actual certificate
    block.textContent = '';
    block.append(container, content);

    // Launch confetti animation
    launchConfetti(canvas, {
      confettiOptions: {
        resize: true,
        useWorker: true,
      },
      animationConfig: {
        duration: CONFIG.CONFETTI.DURATION,
        particleCount: CONFIG.CONFETTI.PARTICLE_COUNT,
        spread: CONFIG.CONFETTI.SPREAD,
        ticks: CONFIG.CONFETTI.TICKS,
        frameDelay: CONFIG.CONFETTI.FRAME_DELAY,
      },
      initialDelay: CONFIG.CONFETTI.INITIAL_DELAY,
    });
  } catch {
    // Show error message
    const errorMessage = createErrorMessage();
    block.textContent = '';
    block.appendChild(errorMessage);
  }
  decorateIcons(block);
}
