export default function decorate(block) {
  const kids = block.querySelector(':scope > div > div').innerHTML;
  if (kids) block.innerHTML = kids;
}
