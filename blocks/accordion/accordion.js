export default function decorate(block) {

    // get 1st div element text to create summary element; then remove 1st div element from block
    const summaryElement = document.createElement('summary');
    const summaryText = block.querySelector('div > div:first-child').firstElementChild.innerText;
    summaryElement.innerText = summaryText;
    const detailsElement = document.createElement('details');
    block.removeChild(block.querySelector('div > div:first-child'));
    detailsElement.appendChild(summaryElement);
    // next div element(s) form the accordion details
    Array.from(block.children).forEach((element) => {
        detailsElement.appendChild(element);
    });

    block.innerHTML = detailsElement.outerHTML;
}