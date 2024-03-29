import { createTag, fetchLanguagePlaceholders, rewriteDocsPath } from './scripts.js';

export default async function loadPrevNextBtn() {
  const placeholders = await fetchLanguagePlaceholders();
  const mainDoc = document.querySelector('main > div.content-section-last');
  if (!mainDoc) return;

  const prevPageMeta = document.querySelector('meta[name="prev-page"]');
  const nextPageMeta = document.querySelector('meta[name="next-page"]');
  const prevPageMetaContent = prevPageMeta?.getAttribute('content').trim().split('.html')[0];
  const nextPageMetaContent = nextPageMeta?.getAttribute('content').trim().split('.html')[0];
  const PREV_PAGE = placeholders?.previousPage;
  const NEXT_PAGE = placeholders?.nextPage;

  if (prevPageMeta || nextPageMeta) {
    if (prevPageMetaContent === '' && nextPageMetaContent === '') return;

    const docPagination = createTag('div', { class: 'doc-pagination' });
    const btnGotoLeft = createTag('div', { class: 'btn-goto is-left-desktop' });

    const anchorLeftAttr = {
      // eslint-disable-next-line no-use-before-define
      href: `${rewriteDocsPath(prevPageMetaContent)}`,
      class: 'pagination-btn',
    };
    const anchorLeft = createTag('a', anchorLeftAttr);
    const spanLeft = createTag('span', '', PREV_PAGE);

    anchorLeft.append(spanLeft);
    btnGotoLeft.append(anchorLeft);

    const btnGotoRight = createTag('div', {
      class: 'btn-goto is-right-desktop',
    });

    const anchorRightAttr = {
      // eslint-disable-next-line no-use-before-define
      href: `${rewriteDocsPath(nextPageMetaContent)}`,
      class: 'pagination-btn',
    };
    const anchorRight = createTag('a', anchorRightAttr);
    const spanRight = createTag('span', '', NEXT_PAGE);

    anchorRight.append(spanRight);
    btnGotoRight.append(anchorRight);

    if (!prevPageMeta || prevPageMetaContent === '') {
      anchorLeft.classList.add('is-disabled');
    }

    if (!nextPageMeta || nextPageMetaContent === '') {
      anchorRight.classList.add('is-disabled');
    }

    docPagination.append(btnGotoLeft, btnGotoRight);
    mainDoc.append(docPagination);
  }
}
