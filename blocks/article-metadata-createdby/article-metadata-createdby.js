export default function decorate(block) {
  const createdForUl = block.querySelector('ul');

  if (createdForUl) {
    createdForUl.classList.add('meta-created-for');
    const { matches: isMobileRes } = window.matchMedia('(max-width: 768px)');
    const listItems = createdForUl.children;
    if (listItems?.length > 1) {
      const wrapper = isMobileRes ? document.createElement('div') : null;
      for (let i = 1; i < listItems.length; ) {
        listItems[i].classList.add('meta-created-for-element');
        if (wrapper) {
          wrapper.appendChild(listItems[i]);
        } else {
          i += 1;
        }
      }
      if (wrapper) {
        createdForUl.insertBefore(wrapper, listItems[1]);
        wrapper.classList.add('meta-created-for-wrapper');
      }
    }
  }
}
