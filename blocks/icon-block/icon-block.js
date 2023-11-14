import { createTag } from '../../scripts/scripts.js';

export default function decorate(block) {
  const columns = block.querySelectorAll('.icon-block > div');

  [...columns].forEach((column) => {
    const heading = column.querySelector('div:nth-child(2)');
    const description = column.querySelector('div:nth-child(3)');

    description.classList.add('icon-description');

    const link = column.querySelector('div:nth-child(4)');
    const linkText = link.innerHTML.trim();
    const linkUrl = column.querySelector('div:nth-child(5)').innerHTML.trim();

    const a = createTag(
      'a',
      {
        href: linkUrl,
        class: 'icon-link', // TODO: handle external links
      },
      linkText,
    );

    const h3 = createTag(
      'h3',
      {
        class: 'icon-heading',
      },
      heading.innerHTML.trim(),
    );

    link.nextElementSibling.remove();
    link.replaceWith(a);
    heading.replaceWith(h3);
  });
}
