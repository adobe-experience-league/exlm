import { createTag } from '../../scripts/scripts.js';

export default async function decorate(block) {
  const wrapperEl = block.querySelector('h2').parentElement;
  while (wrapperEl.querySelector(':scope > h3') !== null) {
    const header = wrapperEl.querySelector(':scope > h3');
    const contents = wrapperEl.querySelector(':scope > ul');
    const container = createTag('div', { class: 'cloud-solutions-list-container' });
    container.appendChild(header);
    container.appendChild(contents);
    const target = wrapperEl.querySelector(':scope > ul')?.previousElementSibling;
    if (target) {
      wrapperEl.insertBefore(container, target);
    } else {
      wrapperEl.appendChild(container);
    }
  }

  // const header = wrapperEl.querySelector(':scope > h2');
  // const contents = [header.nextElementSibling];
  // while (contents[contents.length - 1]?.nextElementSibling?.classList?.contains('cloud-solutions-list-container')) {
  //   contents.push(contents[contents.length - 1]?.nextElementSibling);
  // }
  // const container = createTag('div', { class: 'cloud-solutions-list' });
  // const listWrapper = createTag('div', { class: 'cloud-solutions-list-item' });
  // container.appendChild(header);
  // contents.forEach((content) => {
  //   listWrapper.appendChild(content);
  // });
  // container.appendChild(listWrapper);
  // wrapperEl.appendChild(container);
}
