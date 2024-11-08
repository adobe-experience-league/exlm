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
  const contentContainer = document.createElement('div');
  contentContainer.classList.add('article-content-container');
  if (!document.querySelector('main > .article-content-section, main > .tab-section')) {
    document.querySelector('main > .mini-toc-section').remove();
  } else {
    if (document.querySelector('.mini-toc')) {
      document.querySelector('.mini-toc').style.display = null;
    }
    document
      .querySelectorAll('main > .article-content-section, main > .tab-section, main > .mini-toc-section')
      .forEach((section) => {
        contentContainer.append(section);
      });
    if (document.querySelector('.article-header-section')) {
      document.querySelector('.article-header-section').after(contentContainer);
    } else {
      document.querySelector('main').prepend(contentContainer);
    }
  }
}
