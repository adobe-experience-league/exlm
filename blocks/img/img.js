export default function decorate(block) {
  const img = block?.querySelector('img');
  if (!img) {
    return;
  }
  const title = img.dataset.title || img.title;
  img.title = title;

  const picture = block.querySelector('picture');
  if (picture) {
    picture.title = title;
  }

  if (block.className.includes('w-')) {
    const [width] = block.className.match(/\d+/g);
    if (width) {
      img.style.width = `${width}px`;
    }
  }
}
