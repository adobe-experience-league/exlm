export default function decorate(block) {
  const topicsUl = block.querySelector('ul');

  if (topicsUl) {
    topicsUl.classList.add('meta-topic-list');
  }
}
