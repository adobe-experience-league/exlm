// eslint-disable-next-line import/extensions
import { create as createConfetti } from '../../scripts/confetti/canvas-confetti-1.9.3.module.min.mjs';
import { htmlToElement } from '../../scripts/scripts.js';

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
 * Shares the current page URL to LinkedIn
 */
function shareOnLinkedIn() {
  const urlToShare = encodeURIComponent(window.location.href);
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${urlToShare}`;
  window.open(linkedInUrl, '_blank', 'width=600,height=600');
}

/**
 * Creates and configures the confetti canvas
 * @returns {HTMLCanvasElement} Configured canvas element
 */
function createCanvas() {
  const canvas = document.createElement('canvas');
  canvas.classList.add('course-completion-confetti-canvas');

  canvas.width = CONFIG.CANVAS.WIDTH;
  canvas.height = CONFIG.CANVAS.HEIGHT;

  return canvas;
}

/**
 * Creates a certificate container with image and canvas
 * @param {HTMLElement} block - The block element
 * @returns {Object} Container and canvas elements
 */
function createCertContainer() {
  const container = document.createElement('div');
  container.classList.add('course-completion-certificate-container', 'gradient');

  const img = document.createElement('img');
  img.src = window.hlx.codeBasePath + CONFIG.IMAGES.CERTIFICATE;
  img.alt = CONFIG.IMAGES.ALT_TEXT;
  img.classList.add('course-completion-certificate-image');
  container.appendChild(img);

  const canvas = createCanvas();
  container.appendChild(canvas);

  return { container, canvas };
}

/**
 * Creates the content container with title, description, and buttons
 * @param {Array} children - Block children elements
 * @returns {HTMLElement} Content container
 */
function createContent(children) {
  const [title, description, shareBtn, downloadBtn] = children;

  const container = shareBtn && downloadBtn && htmlToElement(`
    <div class="course-completion-content-container">
      <h1>${title.textContent}</h1>
      <p>${description.textContent}</p>
      <div class="course-completion-button-container">
        <button class="btn primary">${shareBtn.innerHTML}</button>
        <button class="btn secondary">${downloadBtn.innerHTML}</button>
      </div>
    </div>
  `);

  // Add LinkedIn sharing functionality to primary button
  const primaryButton = container.querySelector('.btn.primary');
  if (primaryButton) {
    primaryButton.addEventListener('click', shareOnLinkedIn);
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
export default function decorate(block) {
  const { container, canvas } = createCertContainer(block);
  const content = createContent(block.children);

  block.textContent = '';
  block.append(container, content);

  startConfetti(canvas);
}
