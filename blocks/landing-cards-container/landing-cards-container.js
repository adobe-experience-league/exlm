export default function decorate(block) {
  const card = document.createElement('div');
  card.innerHTML = block.innerHTML;
  block.textContent = '';
  block.append(card);
}
