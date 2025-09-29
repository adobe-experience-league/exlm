// eslint-disable-next-line import/extensions
import { create as createConfetti } from '../../scripts/confetti/canvas-confetti-1.9.3.module.min.mjs';
import { htmlToElement } from '../../scripts/scripts.js';
import createCanvas from '../../scripts/utils/canvas-utils.js';
import { canvasToPDF } from '../../scripts/utils/canvas-pdf-utils.js';

// Constants
const CONFIG = {
  CANVAS: {
    WIDTH: 588,
    HEIGHT: 330,
    Z_INDEX: '9',
  },
  CONFETTI: {
    DURATION: 30000, // 30 seconds
    PARTICLE_COUNT: 7,
    SPREAD: 60,
    TICKS: 500,
    FRAME_DELAY: 50,
    INITIAL_DELAY: 800,
    FALLBACK_PARTICLES: 100,
    FALLBACK_SPREAD: 50,
  },
  IMAGES: {
    CERTIFICATE: '/images/completion-certificate-mock.png',
    ALT_TEXT: 'Course Certificate',
  },
};

/**
 * Downloads the certificate as PDF
 */
async function downloadCertificate(canvas) {
  try {
    const pdfBlob = await canvasToPDF(canvas, {
      title: 'Course Completion Certificate',
      author: 'Learning Platform',
      subject: 'Certificate of Course Completion',
      scale: 1.2,
    });

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'certificate.pdf';

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Error downloading certificate:', error);
  }
}

/**
 * Creates and configures the confetti canvas
 * @returns {HTMLCanvasElement} Configured canvas element
 */
function createConfettiCanvas() {
  const canvas = document.createElement('canvas');
  canvas.classList.add('course-completion-confetti-canvas');

  canvas.width = CONFIG.CANVAS.WIDTH;
  canvas.height = CONFIG.CANVAS.HEIGHT;

  return canvas;
}

/**
 * Creates a certificate container with image and canvas
 * @param {HTMLElement} block - The block element
 * @param {Object} textOptions - Text configuration options
 * @returns {Object} Container and canvas elements
 */
async function createCertContainer(textOptions = []) {
  const container = document.createElement('div');
  container.classList.add('course-completion-certificate-container');

  const certificateCanvas = await createCanvas({
    width: 369,
    height: 285,
    backgroundColor: 'transparent',
    className: 'course-completion-certificate',
    options: {
      text: textOptions,
      image: {
        src: window.hlx.codeBasePath + CONFIG.IMAGES.CERTIFICATE,
        alt: CONFIG.IMAGES.ALT_TEXT,
        position: { x: 0, y: 0 },
        width: 369,
        height: 285,
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
 * @returns {HTMLElement} Content container
 */
function createContent(children, certificateCanvas) {
  const [title, description, , downloadBtn] = children;

  const container = htmlToElement(`
    <div class="course-completion-content-container">
      <h1>${title?.textContent}</h1>
      <p>${description?.textContent}</p>
      <div class="course-completion-button-container">
        <button class="btn primary download-certificate">${downloadBtn?.innerHTML}</button>
      </div>
    </div>
  `);
  // Add PDF download functionality to download certificate button
  const downloadCetificateBtn = container.querySelector('.download-certificate');
  if (downloadBtn && downloadCetificateBtn && certificateCanvas) {
    downloadCetificateBtn.addEventListener('click', () => downloadCertificate(certificateCanvas));
  }

  return container;
}

/**
 * Animates confetti for the specified duration
 * @param {Object} confettiInstance - Confetti instance
 */
function animateConfetti(confettiInstance) {
  const end = Date.now() + CONFIG.CONFETTI.DURATION;

  function frame() {
    confettiInstance({
      particleCount: CONFIG.CONFETTI.PARTICLE_COUNT,
      spread: CONFIG.CONFETTI.SPREAD,
      ticks: CONFIG.CONFETTI.TICKS,
      origin: { x: 0.5, y: 1 },
    });

    if (Date.now() < end) {
      setTimeout(() => requestAnimationFrame(frame), CONFIG.CONFETTI.FRAME_DELAY);
    }
  }

  frame();
}

/**
 * Creates confetti instance and starts animation
 * @param {HTMLCanvasElement} canvas - Canvas element for confetti
 */
function startConfetti(canvas) {
  const myConfetti = createConfetti(canvas, {
    resize: true,
    useWorker: true,
  });

  setTimeout(() => {
    animateConfetti(myConfetti);
  }, CONFIG.CONFETTI.INITIAL_DELAY);
}

/**
 * Main decorator function for course completion block
 * @param {HTMLElement} block - The block element to decorate
 */
export default async function decorate(block) {
  const certificateText = [
    {
      content: 'Marketo Engage Core Concepts',
      position: { x: 185, y: 100 },
      font: { size: '24px', weight: 'bold' }, // Custom weight for emphasis
      color: '#2c3e50',
      align: 'center',
    },
    {
      content: 'Completed by',
      position: { x: 185, y: 140 },
      font: { size: '14px' },
      color: '#7f8c8d',
      align: 'center',
    },
    {
      content: 'Noor',
      position: { x: 185, y: 160 },
      font: { size: '20px', weight: 'bold' }, // Bold name
      color: '#e74c3c',
      align: 'center',
    },
    {
      content: new Date().toLocaleDateString(),
      position: { x: 185, y: 200 },
      font: { size: '12px' },
      color: '#95a5a6',
      align: 'center',
    },
  ];

  const { container, canvas } = await createCertContainer(certificateText);
  const content = createContent(block.children, container.querySelector('.course-completion-certificate'));

  block.textContent = '';
  block.append(container, content);

  startConfetti(canvas);
}
