export default function decorate(block) {
  if (!block.classList.contains('block-quote-content')) {
    block.classList.add('block-quote-content');
  }
}
