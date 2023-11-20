import { loadCSS, decorateIcons } from "../lib-franklin.js";
import { buildCardContent, setupCopyAction } from "./utils.js";

export default async function buildCard(element, model) {
    // load css dynamically
    loadCSS(`${window.hlx.codeBasePath}/scripts/browseCard/browseCard.css`);
    const { thumbnail: _thumbnail, product, title, contentType } = model;
    const type = contentType?.toLowerCase();
    const thumbnail = _thumbnail ? _thumbnail : type === 'course' || type === 'tutorial' ? 'https://placehold.co/400x600' : null;
    const card = document.createElement('div');
    card.classList.add('card', `${type}-card`);
    card.innerHTML = `<div class="card-figure"></div><div class="card-content"></div><div class="card-footer"></div>`;
    const cardFigure = card.querySelector('.card-figure');
    const cardContent = card.querySelector('.card-content');

    if (thumbnail) {
        const img = document.createElement('img');
        img.src = thumbnail;
        cardFigure.appendChild(img);
    }


    const bannerElement = document.createElement('span');
    bannerElement.classList.add('card-banner')
    bannerElement.innerText = contentType;
    cardFigure.appendChild(bannerElement);

    if (product) {
        const tagElement = document.createElement('p');
        tagElement.classList.add('card-tag-text')
        tagElement.textContent = product;
        cardContent.appendChild(tagElement);
    }

    if (title) {
        const titleElement = document.createElement('p');
        titleElement.classList.add('card-title-text')
        titleElement.textContent = title;
        cardContent.appendChild(titleElement);
    }
    buildCardContent(card, model);
    setupCopyAction(card);
    element.appendChild(card);
}

// export default async function buildCards(gridWrapper, dataModel, /*authoredConfig*/) {
//     const wrapper = document.createDocumentFragment();
//     dataModel.forEach((model) => {
//         buildCard(wrapper, model);
//     });
//     await decorateIcons(wrapper);
//     gridWrapper.appendChild(wrapper);
// }
