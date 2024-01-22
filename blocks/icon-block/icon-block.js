import { decorateIcons } from '../../scripts/lib-franklin.js';
import { createTag, decorateExternalLinks, htmlToElement } from '../../scripts/scripts.js';

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

    const linkTextDiv = column.querySelector('div:nth-child(4)');
    const linkWrapper = column.querySelector('div:nth-child(5)');
    const link = linkWrapper.querySelector('a');
    const linkTextDivHasText = linkTextDiv.innerText.trim() !== '' || linkTextDiv.textContent.trim() !== '';
    if (link && linkTextDivHasText) {
      const linkText = linkTextDiv.textContent.trim();
      const linkUrl = link.href;
      if (linkText && linkUrl) {
        const anchorDiv = htmlToElement(`
      ${`<a class='icon-link' href='${linkUrl}'>${linkText}</a>`}`);
        linkWrapper.replaceWith(anchorDiv);
        linkTextDiv.remove();
      }
    } else {
      linkWrapper.remove();
      linkTextDiv.remove();
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
