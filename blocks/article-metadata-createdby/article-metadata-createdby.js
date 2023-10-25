export default function decorate(block) {
  const createdForUl = block.querySelector('ul');

  if (createdForUl) {
    createdForUl.classList.add('meta-created-for');
  }
}
