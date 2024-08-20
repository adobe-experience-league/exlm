import { createTag, fetchLanguagePlaceholders, rewriteDocsPath } from './scripts.js';
import { getMetadata } from './lib-franklin.js';

export default async function loadPrevNextBtn() {
  const placeholders = await fetchLanguagePlaceholders();
  const mainDoc = document.querySelector('main div.content-section-last');
  if (!mainDoc) return;

  const prevPageMeta = getMetadata('prev-page');
  const prevPageMetaTitle = getMetadata('prev-page-title') || '';
  const nextPageMeta = getMetadata('next-page');
  const nextPageMetaTitle = getMetadata('next-page-title') || '';
  const prevPageMetaContent = prevPageMeta?.trim().split('.html')[0];
  const nextPageMetaContent = nextPageMeta?.trim().split('.html')[0];
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
    const titleLeft = prevPageMetaTitle ? createTag('span', { class: 'pagination-btn-title' }, prevPageMetaTitle) : '';

    anchorLeft.append(spanLeft);
    btnGotoLeft.append(anchorLeft, titleLeft);

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
    const titleRight = nextPageMetaTitle ? createTag('span', { class: 'pagination-btn-title' }, nextPageMetaTitle) : '';

    anchorRight.append(spanRight);
    btnGotoRight.append(anchorRight, titleRight);

    if (!prevPageMeta || prevPageMetaContent === '') {
      anchorLeft.classList.add('is-disabled');
      titleLeft.classList.add('is-hidden');
    }

    if (!nextPageMeta || nextPageMetaContent === '') {
      anchorRight.classList.add('is-disabled');
      titleRight.classList.add('is-hidden');
    }

    docPagination.append(btnGotoLeft, btnGotoRight);
    mainDoc.append(docPagination);
  }
}
