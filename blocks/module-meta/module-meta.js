export function generateModuleHeaderDOM(block) {
  const wrapper = document.createElement('div');

  Array.from(block.children).forEach((element, i) => {
    const div = document.createElement('div');

    if (i === 0) {
      div.className = 'module-title';
      div.append(element?.textContent?.trim());
    } else {
      div.append(element);
    }

    wrapper.append(div);
  });

  return wrapper;
}

export default function decorate(block) {
  block.classList.add('module-meta');
  const dom = generateModuleHeaderDOM(block);
  block.textContent = '';
  block.append(dom);
}
