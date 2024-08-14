import { decorateIcons } from '../../scripts/lib-franklin.js';
import { decorateExternalLinks } from '../../scripts/scripts.js';

export default function decorate(block) {
  const toggleDiv = block.querySelector('div');
  if (toggleDiv?.firstElementChild?.textContent === 'true') {
    block.classList.add('icon-block-center-align');
  }
  toggleDiv?.remove();

  [...block.children].forEach((column) => {
    const [, headingWrapper, descriptionWrapper, linkWrapper, targetElement] = column.children;

    if (descriptionWrapper) {
      descriptionWrapper.classList.add('icon-description');
    }

    const heading = headingWrapper?.firstElementChild;
    if (heading) {
      heading.classList.add('icon-heading');
      headingWrapper.replaceWith(heading);
    } else {
      headingWrapper?.remove();
    }

    const link = linkWrapper?.querySelector('a');
    if (link) {
      link.classList.add('icon-link');
      if (targetElement?.textContent === 'new-tab') {
        link.setAttribute('target', '_blank');
      }
      linkWrapper.replaceWith(link);
      targetElement?.remove();
    } else {
      linkWrapper?.remove();
      targetElement?.remove();
    }
  });

  decorateExternalLinks(block);

  block.querySelectorAll('a[target="_blank"]').forEach((a) => {
    const icon = '<span class="icon icon-new-tab"></span>';
    a.classList.add('external');
    a.insertAdjacentHTML('beforeend', icon);
  });

  decorateIcons(block);
}
