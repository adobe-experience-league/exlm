import { decorateIcons } from '../../scripts/lib-franklin.js';
import { decorateExternalLinks } from '../../scripts/scripts.js';

export default function decorate(block) {
  const toggleDiv = block.querySelector('div');
  if (toggleDiv && toggleDiv.firstElementChild.textContent === 'true') {
    block.classList.add('icon-block-center-align');
  }
  toggleDiv?.remove();

  [...block.children].forEach((column) => {
    const [, headingWrapper, descriptionWrapper, linkWrapper, linkTargetElement] = column.children;

    descriptionWrapper?.classList.add('icon-description');

    const heading = headingWrapper?.firstElementChild;
    if (heading) {
      heading.classList.add('icon-heading');
      headingWrapper?.replaceWith(heading);
    } else {
      headingWrapper?.remove();
    }

    const link = linkWrapper?.querySelector('a');
    if (link) {
      link.classList.add('icon-link');
      if (link.closest('.signup-dialog-content') || linkTargetElement?.textContent.trim() === 'true') {
        link.setAttribute('target', '_blank');
      }
      linkWrapper?.replaceWith(link);
      linkTargetElement?.remove();
    } else {
      linkWrapper?.remove();
      linkTargetElement?.remove();
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
