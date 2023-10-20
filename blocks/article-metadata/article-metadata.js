function containsSelector(elements, text) {
  return Array.from(elements).filter((element) =>
    element.textContent.includes(text),
  );
}

export default function decorate(block) {
  const elements = block.querySelectorAll('ul');
  const topicsUl = containsSelector(elements, 'Topics:')[0];
  const createdForUl = containsSelector(elements, 'Created for:')[0];

  if (topicsUl) {
    topicsUl.classList.add('meta-topic-list');
  }
  if (createdForUl) {
    createdForUl.classList.add('meta-created-for');
  }
}
