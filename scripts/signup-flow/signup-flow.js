// eslint-disable-next-line import/no-cycle
import { htmlToElement, fetchLanguagePlaceholders, getPathDetails } from '../scripts.js';
import { loadCSS, loadBlocks, decorateSections, decorateBlocks, decorateIcons } from '../lib-franklin.js';

let placeholders = {};
try {
  placeholders = await fetchLanguagePlaceholders();
} catch (err) {
  /* eslint-disable-next-line no-console */
  console.error('Error fetching placeholders:', err);
}

const { lang } = getPathDetails();

// Array of pages for the signup flow
const pages = [
  {
    name: 'step1',
    path: `/${lang}/profile/signup-flow-modal/step1`,
    title: placeholders?.signupFlowStep1Header,
  },
  {
    name: 'step2',
    path: `/${lang}/profile/signup-flow-modal/step2`,
    title: placeholders?.signupFlowStep2Header,
  },
  {
    name: 'step3',
    path: `/${lang}/profile/signup-flow-modal/step3`,
    title: placeholders?.signupFlowStep3Header,
  },
  {
    name: 'confirm',
    path: `/${lang}/profile/signup-flow-modal/confirm`,
    title: placeholders?.signupFlowConfirmHeader,
    nofollow: true,
  },
];

/**
 * Creates and initializes the signup dialog.
 * The function sets up the dialog structure, navigation, and event handlers.
 */
const createSignupDialog = () => {
  const signupDialog = htmlToElement(`
        <dialog class="signup-dialog">
            <div class="signup-dialog-close-bar">
                <a class="signup-dialog-close-btn close-btn">
                    <span class="close-text">${placeholders?.closeBtnLabel}</span>
                    <div class="close-icon-holder">
                        <span class="icon icon-close"></span>
                    </div>
                </a>
            </div>
            <div class="signup-dialog-container">                                           
                <div class="signup-dialog-header">
                    <div class="signup-dialog-header-decor"></div>
                    <div class="signup-dialog-nav-bar">
                        <button class="secondary prev-btn">${placeholders?.backBtnLabel}</button>
                        <div class="signup-dialog-title"></div>
                        <div class="signup-dialog-actions">
                            <button class="next-btn">${placeholders?.nextBtnLabel}</button>
                            <button class="finish-btn">${placeholders?.finishBtnLabel}</button>
                            <button class="close-btn">${placeholders?.closeBtnLabel}</button>
                        </div>
                    </div>
                    </div>
                    <div class="signup-dialog-middle-decor"></div>
                <div class="signup-dialog-body">
                    <div class="signup-dialog-body-top-decor"></div>
                    <div class="signup-dialog-steps"></div>
                    <div class="signup-dialog-content"></div>
                </div>
                <div class="signup-dialog-bottom-decor"></div>
            </div>
        </dialog>
    `);

  /**
   * Loads the content for a specific page by index.
   * @param {number} index - The index of the page to load.
   * @returns {Promise<boolean>} - Resolves to true if the content was loaded successfully, otherwise false.
   */
  const loadPageContent = async (index) => {
    if (index < 0 || index >= pages.length) return null;

    const response = await fetch(`${pages[index].path}.plain.html`);
    const signupClose = signupDialog.querySelector('.signup-dialog-close-btn');
    await decorateIcons(signupClose);
    const signupContainer = signupDialog.querySelector('.signup-dialog-container');
    const signupContent = signupDialog.querySelector('.signup-dialog-content');
    if (response.ok) {
      const pageContent = await response.text();
      if (pageContent) {
        signupContent.setAttribute('data-current-page-index', index);
        signupContainer.className = `signup-dialog-container ${pages[index].name}-container`;
        signupContent.innerHTML = pageContent;
        decorateSections(signupContent);
        decorateBlocks(signupContent);
        await loadBlocks(signupContent);
        await decorateIcons(signupDialog);
        return true;
      }
      return false;
    }
    signupContent.textContent = '';
    return false;
  };

  /**
   * Loads the content and updates the navigation buttons for the current step in the signup flow.
   *
   * @param {number} pageIndex - The index of the new step to load.
   */
  const loadStepFlow = async (pageIndex) => {
    const data = pages[pageIndex];
    const dialogTitle = signupDialog.querySelector('.signup-dialog-title');
    const stepsContainer = signupDialog.querySelector('.signup-dialog-steps');
    const navContainer = signupDialog.querySelector('.signup-dialog-nav-bar');
    const prevBtn = navContainer.querySelector('.prev-btn');
    const nextBtn = navContainer.querySelector('.next-btn');
    const finishBtn = navContainer.querySelector('.finish-btn');
    const closeBtn = navContainer.querySelector('.close-btn');

    prevBtn.classList.toggle('visibility-hidden', pageIndex === 0);
    nextBtn.classList.toggle('content-hidden', pageIndex > 1);
    finishBtn.classList.toggle('content-hidden', pageIndex !== 2);
    closeBtn.classList.toggle('content-hidden', pageIndex < pages.length - 1);

    // Generate step flow content based on the current step index
    let flow = '';
    if (pageIndex < pages.length - 1) {
      dialogTitle.innerHTML = `<h4>${data.title}</h4><p>Step ${pageIndex + 1} of ${pages.length - 1}</p>`;
      flow = `<div class="signup-dialog-step-flow">
                ${pages
                  .map((step, index) => {
                    if (!step.nofollow) {
                      let result;
                      if (pageIndex > index) {
                        result = `<div class="check-icon-shell"><span class="icon icon-checkmark"></span></div>`;
                      } else if (pageIndex === index) {
                        result = `<div class="signup-dialog-step current-step">${index + 1}</div>`;
                      } else {
                        result = `<div class="signup-dialog-step">${index + 1}</div>`;
                      }
                      if (index < pages.length - 2) {
                        result += '<hr/>';
                      }
                      return result;
                    }
                    return ''; // Return an empty string for the last element
                  })
                  .join('')}
              </div>`;
    } else {
      dialogTitle.innerHTML = `<h4>${data.title}</h4>`;
      flow = `<div class="signup-dialog-step-flow">
                <div class="check-icon-shell">
                    <span class="icon icon-checkmark"></span>
                </div>
            </div>`;
    }

    // Set the inner HTML of the step container to the generated flow
    stepsContainer.innerHTML = flow;
    await decorateIcons(stepsContainer);
  };

  /**
   * Handles the navigation between pages in the signup dialog.
   * @param {number} direction - The direction to navigate (1 for next, -1 for previous).
   */
  const handleNavigation = async (direction) => {
    const signupContent = signupDialog.querySelector('.signup-dialog-content');
    const currentPageIndex = parseInt(signupContent.dataset.currentPageIndex, 10);
    const newIndex = currentPageIndex + direction;
    const isLoaded = await loadPageContent(newIndex);
    if (isLoaded) {
      loadStepFlow(newIndex);
    }
  };

  /**
   * Initializes the navigation buttons and loads the first page.
   */
  const initNavigation = async (index) => {
    loadStepFlow(index);
    const isLoaded = await loadPageContent(index);
    if (isLoaded) {
      const prevBtn = signupDialog.querySelector('.signup-dialog-nav-bar .prev-btn');
      const nextBtn = signupDialog.querySelector('.signup-dialog-nav-bar .next-btn');
      const finishBtn = signupDialog.querySelector('.signup-dialog-nav-bar .finish-btn');

      prevBtn.addEventListener('click', () => handleNavigation(-1));
      nextBtn.addEventListener('click', () => handleNavigation(1));
      finishBtn.addEventListener('click', () => handleNavigation(1));
    }
  };

  /**
   * Sets up event handlers for closing the dialog.
   */
  const setupCloseEvents = () => {
    const signupClose = signupDialog.querySelectorAll('.close-btn');

    signupDialog.addEventListener('click', (event) => {
      if (event.target === signupDialog) {
        signupDialog.close();
        document.body.classList.remove('overflow-hidden');
      }
    });

    signupClose.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        signupDialog.close();
        document.body.classList.remove('overflow-hidden');
      });
    });
  };

  const defaultPageIndex = 0;
  initNavigation(defaultPageIndex);
  setupCloseEvents();
  document.body.append(signupDialog);
  document.body.classList.add('overflow-hidden');
  signupDialog.inert = true;
  signupDialog.showModal();
  signupDialog.inert = false;

  // Create an Intersection Observer instance for Signup Dialog Header
  const signupDialogHeader = signupDialog.querySelector('.signup-dialog-header');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        signupDialogHeader.classList.toggle('sticky', entry.intersectionRatio < 1);
      });
    },
    {
      root: signupDialog,
      threshold: [1],
    },
  );
  observer.observe(signupDialogHeader);
};

/**
 * Entry point for initializing the signup dialog flow.
 * Loads the necessary CSS and creates the signup dialog.
 */
export default function initializeSignupFlow() {
  const signupCSSLoaded = loadCSS(`${window.hlx.codeBasePath}/scripts/signup-flow/signup-flow.css`);
  signupCSSLoaded.then(() => {
    createSignupDialog();
  });
}
