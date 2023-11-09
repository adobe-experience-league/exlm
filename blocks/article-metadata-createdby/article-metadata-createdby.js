export default function decorate(block) {
  const createdForUl = block.querySelector('ul');

  if (createdForUl) {
    createdForUl.classList.add('meta-created-for');
    const listItems = createdForUl.children;
    if (listItems?.length > 1) {
      const wrapper = document.createElement('li');
      wrapper.classList.add('meta-created-for-wrapper');
      for (let i = 1; i < listItems.length; ) {
        listItems[i].classList.add('meta-created-for-element');
        wrapper.appendChild(listItems[i]);
      }
      createdForUl.insertBefore(wrapper, listItems[1]);
    }
  }
}
