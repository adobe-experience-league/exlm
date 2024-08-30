import { htmlToElement } from '../../scripts/scripts.js';
import { isMobile, registerHeaderResizeHandler } from './header-utils.js';
import { decorateIcons } from '../../scripts/lib-franklin.js';

export default class Profile extends HTMLElement {
  constructor(options = {}) {
    super();
    this.options = options;
    this.profilePicture = options.profilePicture;
  }

  async createProfile() {
    const profile = htmlToElement(
      `<div class="profile">
          <button class="profile-toggle" aria-controls="profile-menu">
            <span class="icon icon-profile"></span>
          </button>
          <div class="profile-menu" id="profile-menu">
          </div>
        </div>`,
    );
    decorateIcons(profile);
    this.appendChild(profile);

    if (this.profilePicture) {
      const profileToggle = profile.querySelector('.profile-toggle');
      profileToggle.replaceChildren(
        htmlToElement(`<img class="profile-picture" src="${this.profilePicture}" alt="profile picture" />`),
      );
    }

    const toggler = profile.querySelector('.profile-toggle');
    const navOverlay = document.querySelector('.nav-overlay');
    const toggleExpandContentMobile = () => {
      const isExpanded = toggler.getAttribute('aria-expanded') === 'true';
      toggler.setAttribute('aria-expanded', !isExpanded);
      const profileMenu = toggler.nextElementSibling;
      const expandedClass = 'profile-menu-expanded';
      if (!isExpanded) {
        profileMenu.classList.add(expandedClass);
        navOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      } else {
        profileMenu.classList.remove(expandedClass);
        navOverlay.classList.add('hidden');
        document.body.removeAttribute('style');
      }
    };

    const toggleExpandContent = () => {
      const isExpanded = toggler.getAttribute('aria-expanded') === 'true';
      toggler.setAttribute('aria-expanded', !isExpanded);
      const profileMenu = toggler.nextElementSibling;
      const expandedClass = 'profile-menu-expanded';
      if (!isExpanded) {
        profileMenu.classList.add(expandedClass);
      } else {
        profileMenu.classList.remove(expandedClass);
      }
    };

    registerHeaderResizeHandler(() => {
      if (isMobile()) {
        // if mobile, add click event, remove mouseenter/mouseleave
        toggler.addEventListener('click', toggleExpandContentMobile);
        toggler.parentElement.removeEventListener('mouseenter', toggleExpandContent);
        toggler.parentElement.removeEventListener('mouseleave', toggleExpandContent);
      } else {
        navOverlay.classList.add('hidden');
        document.body.removeAttribute('style');
        // if desktop, add mouseenter/mouseleave, remove click event
        toggler.removeEventListener('click', toggleExpandContentMobile);
        toggler.parentElement.addEventListener('mouseenter', toggleExpandContent);
        toggler.parentElement.addEventListener('mouseleave', toggleExpandContent);
      }
    });
  }

  async connectedCallback() {
    await this.createProfile();
  }
}

customElements.define('profile-block', Profile);
