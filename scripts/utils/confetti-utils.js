/**
 * Confetti utility functions
 * Provides functionality to create and animate confetti effects
 */

// Global confetti loader - ensures confetti is loaded only once
let confettiPromise = null;

async function loadConfetti() {
  if (confettiPromise) {
    return confettiPromise;
  }

  if (window.confetti) {
    return window.confetti;
  }

  confettiPromise = new Promise((resolve, reject) => {
    (async () => {
      try {
        /* eslint-disable-next-line import/extensions */
        const confettiModule = await import('../confetti/canvas-confetti-1.9.3.module.min.mjs');
        const confetti = confettiModule.create;

        // Make it available globally for consistency
        window.confetti = confetti;

        resolve(confetti);
      } catch (error) {
        reject(new Error(`Failed to load confetti: ${error.message}`));
      }
    })();
  });

  return confettiPromise;
}

/**
 * Creates a confetti instance with the specified canvas
 * @param {HTMLCanvasElement} canvas - Canvas element for confetti
 * @param {Object} options - Confetti options
 * @returns {Promise<Object>} Confetti instance
 */
export async function createConfettiInstance(canvas, options = {}) {
  const confetti = await loadConfetti();

  const defaultOptions = {
    resize: true,
    useWorker: true,
    ...options,
  };

  return confetti(canvas, defaultOptions);
}

/**
 * Animates confetti for the specified duration
 * @param {Object} confettiInstance - Confetti instance
 * @param {Object} config - Animation configuration
 * @param {number} config.duration - Duration in milliseconds
 * @param {number} config.particleCount - Number of particles per frame
 * @param {number} config.spread - Spread angle
 * @param {number} config.ticks - Number of ticks
 * @param {number} config.frameDelay - Delay between frames
 */
export function animateConfetti(confettiInstance, config = {}) {
  const { duration = 30000, particleCount = 7, spread = 60, ticks = 500, frameDelay = 50 } = config;

  const end = Date.now() + duration;

  function frame() {
    confettiInstance({
      particleCount,
      spread,
      ticks,
      origin: { x: 0.5, y: 1 },
    });

    if (Date.now() < end) {
      setTimeout(() => requestAnimationFrame(frame), frameDelay);
    }
  }

  frame();
}

/**
 * Creates confetti instance and starts animation with delay
 * @param {HTMLCanvasElement} canvas - Canvas element for confetti
 * @param {Object} config - Configuration object
 * @param {Object} config.confettiOptions - Options for confetti instance
 * @param {Object} config.animationConfig - Options for animation
 * @param {number} config.initialDelay - Initial delay before starting
 */
export async function launchConfetti(canvas, config = {}) {
  const { confettiOptions = {}, animationConfig = {}, initialDelay = 800 } = config;

  try {
    const confettiInstance = await createConfettiInstance(canvas, confettiOptions);

    setTimeout(() => {
      animateConfetti(confettiInstance, animationConfig);
    }, initialDelay);

    return confettiInstance;
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Error starting confetti:', error);
    throw error;
  }
}
