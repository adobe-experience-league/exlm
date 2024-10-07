// eslint-disable-next-line import/no-cycle
import { htmlToElement, fetchLanguagePlaceholders, getPathDetails } from '../scripts.js';
import { loadCSS, loadBlocks, decorateSections, decorateBlocks, decorateIcons } from '../lib-franklin.js';
// eslint-disable-next-line import/no-cycle
import { defaultProfileClient } from '../auth/profile.js';
import SignUpFlowShimmer from './signup-flow-shimmer.js';
import FormValidator from '../form-validator.js';
import { sendNotice } from '../toast/toast.js';
import eventChannel from '../events.js';

const signupDialogEventEmitter = eventChannel.getEmitter('signupDialog');

/**
 * Types of signup dialog modals.
 * @enum {string}
 */
const SIGNUP_DIALOG_TYPE = {
  INCOMPLETE_PROFILE: 'incomplete-profile',
  NEW_PROFILE: 'new-profile',
};

/**
 * Name of the signup interaction event.
 * @type {string}
 */
const SIGNUP_INTERACTION_NAME = 'modalSeen';

/**
 * Class representing the Signup Flow Dialog.
 */
export default class SignupFlowDialog {
  /**
   * Creates an instance of SignupFlowDialog.
   * @param {string} modalType - The type of the modal to display.
   * @param {number} defaultPageIndex - The default page index to start from.
   */
  constructor(modalType, defaultPageIndex) {
    this.modalType = modalType;
    this.defaultPageIndex = defaultPageIndex;
    this.placeholders = {};
    this.lang = null;
    this.pages = [];
    this.signupDialog = null;
    this.shimmer = null;
    this.interactions = [];
    this.initialize();
  }

  /**
   * Initializes the dialog by fetching placeholders and loading required resources.
   */
  initialize() {
    const { lang } = getPathDetails();
    Promise.all([
      fetchLanguagePlaceholders(lang),
      loadCSS(`${window.hlx.codeBasePath}/scripts/signup-flow/signup-flow-dialog.css`),
      this.addModalSeenInteraction(),
    ]).then(([placeholders]) => {
      this.placeholders = placeholders;
      this.lang = lang;
      this.createSignupDialog();
      this.initNavigation();
    });
  }

  /**
   * Sets up the configuration for the signup pages.
   */
  setPagesConfig() {
    this.pages = [
      {
        name: 'step1',
        path: `/${this.lang}/home/signup-flow-modal/${this.modalType}/step1`,
        title: this.placeholders?.signupFlowStep1Header,
      },
      {
        name: 'step2',
        path: `/${this.lang}/home/signup-flow-modal/${this.modalType}/step2`,
        title: this.placeholders?.signupFlowStep2Header,
      },
      {
        name: 'confirm',
        path: `/${this.lang}/home/signup-flow-modal/${this.modalType}/confirm`,
        title: this.placeholders?.signupFlowConfirmHeader,
        nofollow: true,
      },
    ];
  }

  /**
   * Prefetches the signup pages for better performance.
   */
  prefetchPages() {
    this.pages.forEach((page) => {
      document.head.appendChild(htmlToElement(`<link rel="prefetch" href="${page.path}.plain.html">`));
    });
  }

  /**
   * Sets up events to handle closing the signup dialog.
   */
  setupCloseEvents() {
    const signupClose = this.signupDialog.querySelectorAll('.close-action');

    signupClose.forEach((button) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.signupDialog.close();
        document.body.classList.remove('overflow-hidden');
        signupDialogEventEmitter.emit('signupDialogClose', { status: 'closed' });
      });
    });

    this.signupDialog.addEventListener('cancel', () => {
      document.body.classList.remove('overflow-hidden');
      signupDialogEventEmitter.emit('signupDialogClose', { status: 'closed' });
    });
  }

  /**
   * Observes the signup dialog header and makes it sticky to show the shadow based on scroll position.
   */
  observeHeader() {
    const signupDialogHeader = this.signupDialog.querySelector('.signup-dialog-header');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          signupDialogHeader.classList.toggle('sticky', entry.intersectionRatio < 1);
        });
      },
      { threshold: [1] },
    );

    observer.observe(signupDialogHeader);
  }

  /**
   * Creates and appends the signup dialog to the document body.
   */
  createSignupDialog() {
    this.signupDialog = htmlToElement(`
      <dialog class="signup-dialog" data-modaltype="${this.modalType}" >
        <div class="signup-dialog-close-bar">
          <a class="signup-dialog-close-btn close-action">
              <span class="close-text">${this.placeholders?.closeBtnLabel || 'Close'}</span>
              <div class="close-icon-holder">
                  <span class="icon icon-close"></span>
              </div>
          </a>
        </div>
        <div class="signup-dialog-container">                                           
          <div class="signup-dialog-header">
            <div class="signup-dialog-header-decor"></div>
            <div class="signup-dialog-nav-bar">
              <button class="secondary prev-btn">${this.placeholders?.backBtnLabel}</button>
              <div class="signup-dialog-title"></div>
              <div class="signup-dialog-actions">
                <button class="next-btn">${this.placeholders?.nextBtnLabel}</button>
                <button class="complete-btn close-action">${this.placeholders?.completeBtnLabel}</button>
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

    this.setPagesConfig();
    this.prefetchPages();
    this.setupCloseEvents();
    this.observeHeader();
    document.body.append(this.signupDialog);
    document.body.classList.add('overflow-hidden');
    const signupCloseBtn = this.signupDialog.querySelector('.signup-dialog-close-btn');
    decorateIcons(signupCloseBtn);
    this.signupDialog.inert = true;
    this.signupDialog.showModal();
    this.signupDialog.inert = false;
  }

  /**
   * Toggles the shimmer effect for the signup dialog.
   * @param {boolean} show - Whether to show or hide the shimmer effect.
   */
  toggleShimmer(show) {
    const displayStyle = show ? 'none' : 'block';
    const pointerEvents = show ? 'none' : 'auto';
    this.signupDialog.querySelectorAll('div[class$="-decor"]').forEach((decor) => {
      decor.style.display = displayStyle;
    });
    this.signupDialog.querySelectorAll('.signup-dialog-header button').forEach((button) => {
      button.style.pointerEvents = pointerEvents;
    });
    if (show) {
      const signupDialogBody = this.signupDialog.querySelector('.signup-dialog-body');
      this.shimmer.add(signupDialogBody);
    } else {
      this.shimmer.remove();
    }
  }

  /**
   * Loads and displays the step flow content for the specified page index.
   * @param {number} pageIndex - The index of the page to load.
   */
  async loadStepFlow(pageIndex) {
    const data = this.pages[pageIndex];
    const dialogTitle = this.signupDialog.querySelector('.signup-dialog-title');
    const stepsContainer = this.signupDialog.querySelector('.signup-dialog-steps');
    const navContainer = this.signupDialog.querySelector('.signup-dialog-nav-bar');
    const prevBtn = navContainer.querySelector('.prev-btn');
    const nextBtn = navContainer.querySelector('.next-btn');
    const completeBtn = navContainer.querySelector('.complete-btn');

    prevBtn.classList.toggle('visibility-hidden', pageIndex === 0);
    nextBtn.classList.toggle('hidden', pageIndex > 1);
    completeBtn.classList.toggle('hidden', pageIndex < this.pages.length - 1);

    // Generate step flow content based on the current step index
    let flow = '';
    if (pageIndex < this.pages.length - 1) {
      dialogTitle.innerHTML = `<h4>${data.title}</h4><p>Step ${pageIndex + 1} of ${this.pages.length - 1}</p>`;
      flow = `<div class="signup-dialog-step-flow">
                ${this.pages
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
                      if (index < this.pages.length - 2) {
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
    }

    // Set the inner HTML of the step container to the generated flow
    stepsContainer.innerHTML = flow;
    await decorateIcons(stepsContainer);
  }

  /**
   * Validates the specified form within the block.
   * @param {HTMLElement} block - The block containing the form.
   * @param {string} formSelector - The selector for the form to validate.
   * @param {string} errorSelector - The selector for the error container.
   * @param {string} errorMessage - The error message to display.
   * @returns {boolean} - Whether the form is valid.
   */
  validateForm(block, formSelector, errorSelector, errorMessage) {
    const form = block && block.querySelector(formSelector);
    if (form) {
      const options = {
        aggregateRules: {
          checkBoxGroup: {
            errorContainer: form.querySelector(errorSelector),
            errorMessage,
          },
        },
      };
      const validator = new FormValidator(form, this.placeholders, options);
      const isValidForm = validator.validate();
      if (!isValidForm) {
        sendNotice(this.placeholders?.signupFlowToastErrorMessage || 'Please fill in the missing details.', 'error');
        block.scrollIntoView({ behavior: 'smooth' });
        return false;
      }
    }
    return true;
  }

  /**
   * Adds a "modal seen" interaction to the user's profile.
   */
  async addModalSeenInteraction() {
    const modelInteraction = await defaultProfileClient.getLatestInteraction(SIGNUP_INTERACTION_NAME);
    if (!modelInteraction) {
      this.interactions = [{ event: SIGNUP_INTERACTION_NAME, timestamp: new Date().toISOString(), modalSeen: true }];
      await defaultProfileClient.updateProfile('interactions', this.interactions);
    }
  }

  /**
   * Decorates the signup dialog content with sections, blocks, and icons.
   * @param {Element} signupContent - The container element for the signup content.
   * @returns {Promise<void>}
   */
  async decorateDialog(signupContent) {
    decorateSections(signupContent);
    decorateBlocks(signupContent);
    await loadBlocks(signupContent);
    await decorateIcons(this.signupDialog);
  }

  /**
   * Loads the content of the signup dialog for a specific page.
   * @param {number} index - The index of the page to load.
   * @returns {Promise<boolean>} - Returns true if the content was successfully loaded, false otherwise.
   */
  async loadPageContent(index) {
    if (index < 0 || index >= this.pages.length) return null;

    const response = await fetch(`${this.pages[index].path}.plain.html`);
    const signupContainer = this.signupDialog.querySelector('.signup-dialog-container');
    const signupContent = this.signupDialog.querySelector('.signup-dialog-content');

    if (response.ok) {
      const pageContent = await response.text();
      if (pageContent) {
        signupContent.setAttribute('data-current-page-index', index);
        signupContainer.className = `signup-dialog-container ${this.pages[index].name}-container`;
        signupContent.innerHTML = pageContent;
        await this.decorateDialog(signupContent);
        return true;
      }
      return false;
    }
    signupContent.textContent = '';
    return false;
  }

  /**
   * Handles the navigation between pages in the signup dialog.
   * Validates forms on the current page before navigating to the next page.
   * @param {number} direction - The direction to navigate: -1 for previous, 1 for next.
   * @returns {Promise<boolean>} - Returns true if the navigation was successful, false otherwise.
   */
  async handleNavigation(direction) {
    if (direction === 1) {
      const productInterestsBlock = this.signupDialog.querySelector('.product-interests');
      const roleIndustryBlock = this.signupDialog.querySelector('.role-and-industry');

      if (
        !this.validateForm(
          productInterestsBlock,
          '.product-interests-form',
          '.product-interests-form-error',
          this.placeholders?.productInterestFormErrorMessage,
        ) ||
        !this.validateForm(
          roleIndustryBlock,
          '.role-and-industry-form',
          '.role-and-industry-form-error',
          this.placeholders?.formFieldGroupError,
        )
      ) {
        return false;
      }
    }

    const signupContent = this.signupDialog.querySelector('.signup-dialog-content');
    const currentPageIndex = parseInt(signupContent.dataset.currentPageIndex, 10);
    const newIndex = currentPageIndex + direction;
    this.toggleShimmer(true);
    const isLoaded = await this.loadPageContent(newIndex);
    if (isLoaded) {
      this.toggleShimmer(false);
      this.loadStepFlow(newIndex);
    }
    return true;
  }

  /**
   * Initializes navigation and handles page transitions in the signup dialog.
   */
  async initNavigation() {
    this.shimmer = new SignUpFlowShimmer();
    await this.loadStepFlow(this.defaultPageIndex);
    this.toggleShimmer(true);
    const isLoaded = await this.loadPageContent(this.defaultPageIndex);
    if (isLoaded) {
      this.toggleShimmer(false);
      const prevBtn = this.signupDialog.querySelector('.signup-dialog-nav-bar .prev-btn');
      const nextBtn = this.signupDialog.querySelector('.signup-dialog-nav-bar .next-btn');

      prevBtn.addEventListener('click', () => this.handleNavigation(-1));
      nextBtn.addEventListener('click', () => this.handleNavigation(1));
    }
  }

  /**
   * Initializes the SignupFlowDialog with the specified modal type and page index.
   * @param {string} [modalType=SIGNUP_DIALOG_TYPE.NEW_PROFILE] - The type of the signup dialog to initialize.
   * @param {number} [defaultPageIndex=0] - The index of the page to load by default.
   * @returns {Promise<void>}
   */
  static async init(modalType = SIGNUP_DIALOG_TYPE.NEW_PROFILE, defaultPageIndex = 0) {
    // eslint-disable-next-line no-new
    new SignupFlowDialog(modalType, defaultPageIndex);
  }
}
