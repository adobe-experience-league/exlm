export default function decorate(block) {
  const alignment = [...block.classList].find((className) => ['left', 'center', 'right'].includes(className));
  if (alignment) block.classList.add(`text-align-${alignment}`);
}
