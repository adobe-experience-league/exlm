export default function decorateArticles() {
  const main = document.querySelector('main');
  main.classList.add('articles-wrapper');
  const [marquee, articleBody] = main.children;
  if (marquee) {
    marquee.classList.add('articles-marquee');
  }
  if (articleBody) {
    articleBody.classList.add('articles-body');
    const miniTocWrapper = articleBody.querySelector('.mini-toc-wrapper');
    articleBody.removeChild(miniTocWrapper);
    const wrapperEl = document.createElement('div');
    wrapperEl.classList.add('articles-body-content');
    Array.from(articleBody.children).forEach((element) => {
      element.classList.add('articles-section');
      wrapperEl.appendChild(element);
    });
    articleBody.appendChild(miniTocWrapper);
    articleBody.appendChild(wrapperEl);
  }
}
