export function generateSkillTrackHeaderDOM(block) {
  const wrapper = document.createElement('div');

  Array.from(block.children).forEach((element, i) => {
    const div = document.createElement('div');
    div.className = i === 0 ? 'skill-track-title' : 'skill-track-description';

    if (i === 0) {
      const heading = element.querySelector('h1,h2,h3,h4,h5,h6');
      div.append(heading || element.textContent.trim());
    } else {
      div.append(element);
    }

    wrapper.append(div);
  });

  return wrapper;
}

export default function decorate(block) {
  block.classList.add('skill-track-header');
  const dom = generateSkillTrackHeaderDOM(block);
  block.textContent = '';
  block.append(dom);
}
