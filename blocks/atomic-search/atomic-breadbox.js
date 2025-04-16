export default function atomicBreadBoxHandler() {
  const baseElement = document.querySelector('atomic-breadbox');

  function updateFilterClearBtnStyles(enabled) {
    const clearBtn = document.querySelector('.clear-label');
    if (enabled) {
      clearBtn.classList.add('clear-btn-enabled');
    } else {
      clearBtn.classList.remove('clear-btn-enabled');
    }
  }

  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const enabled = !baseElement.className.includes('atomic-hidden');
        updateFilterClearBtnStyles(enabled);
      }
    });
  });

  observer.observe(baseElement, { attributes: true, attributeFilter: ['class'] });
}
