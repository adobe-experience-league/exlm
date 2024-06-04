import { decorateIcons } from '../../scripts/lib-franklin.js';
import { decorateExternalLinks } from '../../scripts/scripts.js';

export default function decorate(block) {
  const toggleDiv = block.querySelector('div');
  if (toggleDiv && toggleDiv.firstElementChild.textContent === 'true') {
    block.classList.add('icon-block-center-align');
  }
  toggleDiv?.remove();

  [...block.children].forEach((column) => {
    const [, headingWrapper, descriptionWrapper, linkWrapper] = column.children;

    descriptionWrapper.classList.add('icon-description');

    const heading = headingWrapper.firstElementChild;
    if (heading) {
      heading.classList.add('icon-heading');
      heading.remove();
      headingWrapper.replaceWith(heading);
    } else {
      headingWrapper.remove();
    }

    const link = linkWrapper.querySelector('a');
    if (link) {
      link.classList.add('icon-link');
      link.remove();
      linkWrapper.replaceWith(link);
    } else {
      linkWrapper.remove();
    }
  });

  decorateExternalLinks(block);

  const anchorEls = [...block.querySelectorAll('a')];
  anchorEls.forEach((a) => {
    if (a.target === '_blank') {
      const icon = '<span class="icon icon-new-tab"></span>';
      a.classList.add('external');
      a.insertAdjacentHTML('beforeend', icon);
    }
  });

  decorateIcons(block);
}
