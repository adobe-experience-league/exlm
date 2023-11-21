import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createTag, decorateExternalLinks } from '../../scripts/scripts.js';

export default function decorate(block) {
  const columns = block.querySelectorAll('.icon-block > div');

  [...columns].forEach((column) => {
    const heading = column.querySelector('div:nth-child(2)');
    const description = column.querySelector('div:nth-child(3)');

    description.classList.add('icon-description');

    const h3 = createTag(
      'h3',
      {
        class: 'icon-heading',
      },
      heading.innerHTML.trim(),
    );

    heading.replaceWith(h3);

    const linkWrapper = column.querySelector('div:nth-child(4)');
    const link = linkWrapper.querySelector('a');
    if (!link) return;
    const linkText = link.innerHTML.trim();
    const linkUrl = link.href;

    const a = createTag(
      'a',
      {
        href: linkUrl,
        class: 'icon-link',
      },
      linkText,
    );

    linkWrapper.replaceWith(a);
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
