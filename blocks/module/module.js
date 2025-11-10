export default function decorate(block) {
  const rows = [...block.children];

  rows.forEach(() => {
    block.classList.add('module-step');
  });
}
