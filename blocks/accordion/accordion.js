export default function decorate(block) {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  details.append(summary);
  Array.from(block.children).forEach((element, i) => {
    if (i === 0) summary.append(block.children[0].textContent.trim());
    else {
      details.append(element);
    }
  });
  block.innerHTML = '';
  block.append(details);
}
