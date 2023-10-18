export default function decorate(block) {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  details.append(summary);
  Array.from(block.children).forEach((element, i) => {
    if (i === 0) summary.append(block.children[0].textContent);
    else {
      const p = document.createElement('p');
      p.textContent = element.textContent;
      details.append(p);
    }
  });
  block.innerHTML = '';
  block.append(details);
}
