import { fetchLanguagePlaceholders, htmlToElement, isProfilePage, getConfig } from '../../scripts/scripts.js';
import { isMobile, registerHeaderResizeHandler, simplifySingleCellBlock } from './header-utils.js';
import { decorateIcons, getMetadata } from '../../scripts/lib-franklin.js';

const communityLocalesMap = new Map([
  ['de', 'de'],
  ['en', 'en'],
  ['ja', 'ja'],
  ['fr', 'fr'],
  ['es', 'es'],
  ['pt-br', 'pt'],
  ['ko', 'ko'],
  ['sv', 'en'],
  ['nl', 'en'],
  ['it', 'en'],
  ['zh-hans', 'en'],
  ['zh-hant', 'en'],
]);

// eslint-disable-next-line
async function fetchCommunityProfileData(url = khorosProfileUrl) {
  const locale = communityLocalesMap.get(document.querySelector('html').lang) || communityLocalesMap.get('en');
  try {
    const response = await fetch(`${url}?lang=${locale}`, {
      method: 'GET',
      headers: {
        'x-ims-token': await window.adobeIMS?.getAccessToken().token,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    // eslint-disable-next-line
    console.log('Error fetching data!!', err);
  }
}

export default class ProfileMenu extends HTMLElement {
  /**
   *
   * @param {import('./header.js').DecoratorOptions} decoratorOptions
   * @param {HTMLElement} profileMenuBlock
   */
  constructor(decoratorOptions, profileMenuBlock) {
    super();
    this.decoratorOptions = decoratorOptions;
    this.profileMenuBlock = profileMenuBlock;
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

    if (this.decoratorOptions.getProfilePicture) {
      this.decoratorOptions.getProfilePicture().then((profilePicture) => {
        const profileToggle = profile.querySelector('.profile-toggle');
        profileToggle.replaceChildren(
          htmlToElement(`<img class="profile-picture" src="${profilePicture}" alt="profile picture" />`),
        );
      });
    }

    const toggler = profile.querySelector('.profile-toggle');
    const navOverlay = document.querySelector('.nav-overlay');
    const toggleExpandContentMobile = () => {
      const shadowRoot = toggler.getRootNode();
      const navButton = shadowRoot.querySelector('.nav-hamburger');
      if (navButton.getAttribute('aria-expanded') === 'true') {
        navButton.click();
      }
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

    this.decorateProfileMenu();
  }

  /**
   * Decorates the profile-menu block
   * @param {HTMLElement} profileMenu
   */
  async decorateProfileMenu() {
    const placeholders = await fetchLanguagePlaceholders(this.decoratorOptions.lang);

    const profileMenuBlock = this.querySelector('.profile-menu');
    profileMenuBlock.innerHTML = simplifySingleCellBlock(this.profileMenuBlock).innerHTML;
    this.profileMenuBlock.remove();

    const communityPlaceholders = [40, 40, 40, 40].map((n) =>
      htmlToElement(`<a><span profile-placeholder>${'&nbsp;'.repeat(n)}</span></a>`),
    );

    const menuSection = (title, anchors = []) => {
      const section = htmlToElement(
        `<div class="profile-menu-section">
          <h2>${title}</h2>
          <div class="profile-menu-links">
            ${anchors?.map((anchor) => anchor.outerHTML).join('')}
          </div>
        </div>`,
      );
      profileMenuBlock.append(section);
      return section;
    };

    const getSignOutRedirectUrl = (targetUrl, lang) => {
      if (!targetUrl) {
        return isProfilePage ? `/${lang}` : '';
      }

      if (targetUrl === '/') {
        return targetUrl.replace('/', `/${lang}`);
      }

      if (targetUrl.startsWith('/en/')) {
        return targetUrl.replace('/en/', `/${lang}/`);
      }

      return targetUrl;
    };

    const isSignedIn = await this.decoratorOptions.isUserSignedIn();
    if (isSignedIn) {
      const links = Array.from(profileMenuBlock.querySelectorAll('a')).map((link) => link.cloneNode(true));
      // all links except last one
      const learnLinks = links.slice(0, links.length - 1);
      const signoutLink = links[links.length - 1];

      profileMenuBlock.innerHTML = '';

      menuSection(placeholders?.headerLearningLabel || 'Learning', learnLinks);

      const communitySection = menuSection(placeholders?.headerCommunityLabel || 'Community', communityPlaceholders);

      signoutLink.dataset.id = 'sign-out';
      signoutLink.addEventListener('click', async () => {
        const { cdnOrigin } = getConfig();
        const signOutRedirectUrl = getMetadata('signout-redirect-url');
        const redirectURL = getSignOutRedirectUrl(signOutRedirectUrl, this.decoratorOptions.lang);
        this.decoratorOptions.onSignOut({ redirect_uri: `${cdnOrigin}${redirectURL}` });
      });
      profileMenuBlock.append(signoutLink);

      fetchCommunityProfileData(this.decoratorOptions.khorosProfileUrl)
        .then((res) => {
          if (res) {
            const communityLinks = communitySection.querySelector('.profile-menu-links');
            communityLinks.innerHTML = '';
            const locale =
              communityLocalesMap.get(document.querySelector('html').lang) || communityLocalesMap.get('en');
            if (res.data.menu.length > 0) {
              res.data.menu.forEach((item) => {
                if (item.title && item.url) {
                  const link = htmlToElement(`<a href="${item.url}" title="">${item.title}</a>`);
                  communityLinks.append(link);
                }
              });
            } else {
              const link = htmlToElement(
                `<a href="https://experienceleaguecommunities.adobe.com/?profile.language=${locale}">${
                  placeholders?.communityLink || 'Community'
                }</a>`,
              );
              communitySection.appendChild(link);
            }
          }
        })
        .catch((err) => {
          /* eslint-disable-next-line no-console */
          console.error(err);
        });
    } else {
      const isProfileMenu = document.querySelector('.profile-menu');
      if (isProfileMenu) {
        document.querySelector('nav').removeChild(isProfileMenu);
      }
    }
  }

  async connectedCallback() {
    await this.createProfile();
  }
}

customElements.define('profile-block', ProfileMenu);
