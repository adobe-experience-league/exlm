import { loadCSS, decorateIcon } from '../lib-franklin.js';

const DIALOG_CSS = `${window.hlx.codeBasePath}/scripts/dialog/dialog.css`;

// loadCSS() resolves with undefined; query the element after it settles.
async function ensureStyles() {
  await loadCSS(DIALOG_CSS);
  return document.querySelector(`head > link[href="${DIALOG_CSS}"]`);
}

function buildDefaultHeader({ title, titleIcon, titleBadge, canExpand }, dialog) {
  const header = document.createElement('div');
  header.className = 'exl-dialog-header';

  if (titleIcon) {
    const icon = document.createElement('span');
    icon.className = `icon icon-${titleIcon}`;
    decorateIcon(icon);
    header.append(icon);
  }

  const titleEl = document.createElement('span');
  titleEl.className = 'exl-dialog-header-title';
  if (titleBadge) {
    titleEl.classList.add('exl-dialog-header-title-with-badge');
    titleEl.append(title || '');
    const badgeEl = document.createElement('span');
    badgeEl.className = 'exl-dialog-header-title-badge';
    badgeEl.textContent = titleBadge;
    titleEl.append(badgeEl);
  } else {
    titleEl.textContent = title || '';
  }
  header.append(titleEl);

  let setExpanded = () => {};

  if (canExpand) {
    const expandBtn = document.createElement('button');
    expandBtn.className = 'exl-dialog-header-expand';
    expandBtn.setAttribute('aria-label', 'Expand');
    expandBtn.setAttribute('aria-pressed', 'false');

    const expandIcon = document.createElement('span');
    expandIcon.className = 'icon icon-expand';
    expandBtn.append(expandIcon);
    decorateIcon(expandIcon);
    header.append(expandBtn);

    setExpanded = (expanded) => {
      if (expanded) {
        dialog.classList.add('exl-dialog-expanded');
        expandBtn.setAttribute('aria-label', 'Collapse');
        expandBtn.setAttribute('aria-pressed', 'true');
        expandIcon.className = 'icon icon-collapse';
        expandIcon.replaceChildren();
        decorateIcon(expandIcon);
      } else {
        dialog.classList.remove('exl-dialog-expanded');
        expandBtn.setAttribute('aria-label', 'Expand');
        expandBtn.setAttribute('aria-pressed', 'false');
        expandIcon.className = 'icon icon-expand';
        expandIcon.replaceChildren();
        decorateIcon(expandIcon);
      }
    };

    expandBtn.addEventListener('click', () => {
      setExpanded(!dialog.classList.contains('exl-dialog-expanded'));
    });
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'exl-dialog-header-close';
  closeBtn.setAttribute('aria-label', 'Close');
  const closeIcon = document.createElement('span');
  closeIcon.className = 'icon icon-close';
  closeBtn.append(closeIcon);
  decorateIcon(closeIcon);
  header.append(closeBtn);

  return { header, closeBtn, setExpanded };
}

/**
 * @param {'drawer'|'modal'} type
 * @param {object}       options
 * @param {string}       options.id              - ID for the <dialog>; prevents duplicates.
 * @param {string}       options.ariaLabel       - Accessible label for the dialog element.
 * @param {string}       [options.title]         - Default header title.
 * @param {string}       [options.titleBadge]    - Optional pill label after the title (e.g. BETA).
 * @param {string}       [options.titleIcon]     - Default header icon class suffix.
 * @param {boolean}      [options.canExpand]     - Drawer only: show expand/collapse toggle.
 * @param {HTMLElement}  [options.header]        - Custom header; replaces the default.
 * @param {string}       [options.closeSelector] - Selector for the close trigger inside a custom header.
 * @param {HTMLElement}  [options.content]       - Scrollable body content.
 * @param {HTMLElement}  [options.footer]        - Optional sticky footer.
 * @param {HTMLElement}  [options.triggerEl]     - Element focused on close.
 * @param {function}     [options.onClose]       - Called after dialog.close().
 * @returns {{ element: HTMLDialogElement, destroy: function }}
 */
function createDialog(type, options) {
  const {
    id,
    ariaLabel,
    title,
    titleBadge,
    titleIcon,
    canExpand,
    header: customHeader,
    closeSelector,
    content,
    footer,
    triggerEl,
    onClose,
  } = options;

  const existing = document.getElementById(id);
  if (existing) {
    return { element: existing, destroy: () => existing.remove() };
  }

  const dialog = document.createElement('dialog');
  dialog.id = id;
  dialog.dataset.type = type;
  dialog.setAttribute('aria-label', ariaLabel);

  let closeBtn = null;
  let setExpanded = () => {};

  if (customHeader) {
    dialog.append(customHeader);
    if (closeSelector) closeBtn = customHeader.querySelector(closeSelector);
  } else {
    // canExpand is drawer-only; ignored silently for modals.
    const built = buildDefaultHeader(
      {
        title,
        titleBadge,
        titleIcon,
        canExpand: type === 'drawer' && canExpand,
      },
      dialog,
    );
    dialog.append(built.header);
    closeBtn = built.closeBtn;
    setExpanded = built.setExpanded;
  }

  const body = document.createElement('div');
  body.className = 'exl-dialog-body';
  if (content) body.append(content);
  dialog.append(body);

  if (footer) {
    footer.classList.add('exl-dialog-footer');
    dialog.append(footer);
  }

  document.body.append(dialog);

  const closeDialog = () => dialog.close();

  if (closeBtn) closeBtn.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeDialog();
  });
  dialog.addEventListener('close', () => {
    setExpanded(false);
    if (triggerEl) triggerEl.focus();
    if (typeof onClose === 'function') onClose();
  });

  let cssLinkEl = null;
  ensureStyles().then((link) => {
    cssLinkEl = link;
  });

  return {
    element: dialog,
    destroy: () => {
      dialog.remove();
      cssLinkEl?.remove();
      cssLinkEl = null;
    },
  };
}

/**
 * Right-side drawer that can optionally expand to a centred modal.
 * @param {object} options - See createDialog() for the full option set.
 * @returns {{ element: HTMLDialogElement, destroy: function }}
 */
export function openDrawer(options) {
  return createDialog('drawer', options);
}

/**
 * Centred modal overlay.
 * @param {object} options - See createDialog() for the full option set. `canExpand` is not supported.
 * @returns {{ element: HTMLDialogElement, destroy: function }}
 */
export function openModal(options) {
  return createDialog('modal', options);
}
