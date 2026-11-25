import { span } from '../../scripts/dom-helpers.js';

const MOBILE_BREAKPOINT = 600;
const UEAuthorMode = window.hlx?.aemRoot || window.location.href.includes('.html');
function updateStyles(block) {
  const classes = [...block.classList];
  const select = (prefix, allowed, fallback) => {
    let selected;
    classes.forEach((name) => {
      if (name.startsWith(prefix)) {
        const value = name.slice(prefix.length);
        if ((!allowed || allowed.includes(value)) && selected === undefined) selected = value;
      }
    });
    return selected === undefined ? fallback : selected;
  };
  const comparison = select('padding-comparison-', ['default', 'balanced', 'most-compact'], null);
  const styles = [];
  const compact = comparison !== null && comparison !== 'default';
  if (compact) styles.push(`columns-style-${comparison}`);
  const width = select('column-width-', ['equal', 'fit-content'], 'equal');
  if (width === 'fit-content') styles.push('columns-style-fit');
  const highlight = (axis) => {
    const background = select(`${axis}-bg-`, null, null);
    if (!background) return false;
    styles.push(`columns-style-${axis}-bg-${background}`);
    const foreground = select(`${axis}-text-`, ['black', 'white'], 'black');
    if (foreground === 'white' && background === 'eb1100') {
      styles.push(`columns-style-${axis}-white`);
    }
    return true;
  };
  const rowHighlight = highlight('row');
  const columnHighlight = highlight('column');
  if (select('highlight-precedence-', ['row', 'column'], 'row') === 'column') {
    styles.push('columns-style-column-precedence');
  }
  [...block.children].forEach((row, rowIndex) => {
    [...row.children].forEach((cell, colIndex) => {
      cell.classList.toggle('columns-row-highlight', rowHighlight && rowIndex === 0);
      cell.classList.toggle('columns-column-highlight', columnHighlight && colIndex === 0);
    });
  });
  const currentStyles = classes.filter((name) => name.startsWith('columns-style-'));
  block.classList.remove(...currentStyles);
  block.classList.add(...styles);
  const enhanced = compact || width === 'fit-content' || rowHighlight || columnHighlight;
  block.classList.toggle('columns-enhanced', enhanced);
}

function updateHeaders(block) {
  const headerCells = [...(block.firstElementChild?.children || [])];
  const rows = [...block.children].slice(1);

  if (window.innerWidth < MOBILE_BREAKPOINT && block.classList.contains('b-alt-row')) {
    rows.forEach((row) => {
      [...row.children].forEach((cell, index) => {
        if (!cell.querySelector(':scope > .header-label')) {
          const headerLabel = span({ class: 'header-label' }, headerCells[index]?.textContent || '');
          const cellContent = document.createElement('div');
          cellContent.className = 'cell-content';
          // Keep the content nodes intact so they can be restored on desktop.
          cellContent.append(...cell.childNodes);
          cell.append(headerLabel, cellContent);
        }
      });
    });
  } else {
    rows.forEach((row) => {
      [...row.children].forEach((cell) => {
        const headerLabel = cell.querySelector(':scope > .header-label');
        const cellContent = cell.querySelector(':scope > .cell-content');
        if (headerLabel && cellContent) {
          headerLabel.remove();
          cellContent.replaceWith(...cellContent.childNodes);
        }
      });
    });
  }
}

let mobileLayout = window.innerWidth < MOBILE_BREAKPOINT;
window.addEventListener('resize', () => {
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  if (isMobile === mobileLayout) return;
  mobileLayout = isMobile;
  document.querySelectorAll('.columns[data-columns-decorated]').forEach(updateHeaders);
});

export default function decorate(block) {
  if (block.hasAttribute('data-columns-decorated')) {
    updateStyles(block);
    updateHeaders(block);
    return;
  }
  const cols = [...(block.firstElementChild?.children || [])];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const buttonType = col.querySelector('strong:first-of-type, em:first-of-type, a:first-of-type');
      if (buttonType) {
        const buttonTypeWrapper = buttonType.closest('div');
        if (
          buttonTypeWrapper &&
          buttonTypeWrapper.children.length === 1 &&
          // Don't wrap inline links or formatting that shares a cell with other text.
          buttonTypeWrapper.textContent.trim() === buttonType.textContent.trim()
        ) {
          // when a column has a single button with a type
          const pTag = document.createElement('p');
          buttonType.parentNode.insertBefore(pTag, buttonType);
          pTag.appendChild(buttonType);
          pTag.classList.add('button-container');
          // when button is primary - strong tag gets generated
          const anchorInsideStrong = pTag.querySelector('strong a');
          // when button is secondary - em tag gets generated
          const anchorInsideEm = pTag.querySelector('em a');
          if (anchorInsideStrong) {
            anchorInsideStrong.classList.add('button', 'primary');
          }
          if (anchorInsideEm) {
            anchorInsideEm.classList.add('button', 'secondary');
          }
        }
      }
    });
  });
  updateStyles(block);
  updateHeaders(block);
  block.setAttribute('data-columns-decorated', '');
  // Remove empty <p> tags
  if (UEAuthorMode) {
    block.querySelectorAll('p').forEach((p) => {
      if (p.innerHTML.trim() === '' || p.innerHTML.trim() === '&nbsp;') {
        p.remove();
      }
    });
    block.querySelectorAll('br').forEach((br) => {
      br.remove();
    });
  }
}
