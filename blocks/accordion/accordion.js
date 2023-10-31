export default function decorate(block) {

    const summaryElement = document.createElement('summary');
    const summaryText = block.querySelector('div > div:first-child').firstElementChild.innerText;
    summaryElement.innerText = summaryText;

    const detailsElement = document.createElement('details');
    const pElement = document.createElement('p');
    block.removeChild(block.querySelector('div > div:first-child'));

    pElement.innerHTML = block.innerHTML;
    detailsElement.appendChild(summaryElement);
    detailsElement.appendChild(pElement);
    block.innerHTML = detailsElement.outerHTML;
}