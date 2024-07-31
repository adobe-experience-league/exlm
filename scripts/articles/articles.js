export default function decorateArticles() {
  const main = document.querySelector('main');
  main.classList.add('articles-wrapper');
  const [marquee, articleBody] = main.children;
  if (marquee) {
    marquee.classList.add('articles-marquee');
  }
  if (articleBody) {
    articleBody.classList.add('articles-body');
  }
}
