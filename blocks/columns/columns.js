import { span } from '../../scripts/dom-helpers.js';

const UEAuthorMode = window.hlx?.aemRoot || window.location.href.includes('.html');
const highlightBackgrounds = ['ffeceb', 'ffcbc7', 'eb1100'];

function resolveStyles(block) {
  const errors = [];
  const classes = [...block.classList];
  // UE replaces the block with server-rendered HTML. Only persisted class order is available,
  // not click history; resolve each group from its last valid serialized choice.
  const select = (prefix, allowed, fallback, aliases = {}) => {
    let selected = fallback;
    classes.forEach((name) => {
      if (Object.hasOwn(aliases, name)) selected = aliases[name];
      else if (name.startsWith(prefix)) {
        const value = name.slice(prefix.length);
        if (allowed.includes(value)) selected = value;
        else errors.push(`Invalid ${prefix} selection: ${value}`);
      }
    });
    return selected;
  };
  const presets = ['default', 'balanced', 'row-dense', 'column-dense', 'most-compact'];
  const comparison = select('padding-comparison-', presets, null);
  if (comparison && comparison !== 'default') block.dataset.columnsPaddingComparison = comparison;
  else delete block.dataset.columnsPaddingComparison;
  ['row', 'column'].forEach((axis) => {
    const padding = select(
      `${axis}-padding-`,
      ['default', 'compact'],
      'default',
      Object.fromEntries(
        presets.map((preset) => [`padding-comparison-${preset}`, preset === 'default' ? 'default' : 'compact']),
      ),
    );
    block.toggleAttribute(`data-columns-compact-${axis}`, padding === 'compact');
  });
  const width = select('column-width-', ['equal', 'fit-content'], 'equal');
  block.dataset.columnsWidth = width;
  const highlight = (axis) => {
    // Backgrounds are authoritative; deprecated On/Off tokens must not trap persisted content.
    const background = select(`${axis}-bg-`, highlightBackgrounds, null);
    if (!background) return null;
    let foreground = select(`${axis}-text-`, ['black', 'white'], 'black');
    if (foreground === 'white' && background !== 'eb1100') {
      errors.push(`White text requires #EB1100 for the ${axis} highlight; rendering Black`);
      foreground = 'black';
    }
    return { background, foreground };
  };
  const rowHighlight = highlight('row');
  const columnHighlight = highlight('column');
  const precedence = select('highlight-precedence-', ['row', 'column'], null);
  [...block.children].forEach((row, rowIndex) => {
    [...row.children].forEach((cell, colIndex) => {
      const rowStyle = rowIndex === 0 ? rowHighlight : null;
      const columnStyle = colIndex === 0 ? columnHighlight : null;
      const style = precedence === 'column' ? columnStyle || rowStyle : rowStyle || columnStyle;
      cell.toggleAttribute('data-columns-highlight', !!style);
      if (style) {
        cell.dataset.columnsHighlightBackground = style.background;
        cell.dataset.columnsHighlightForeground = style.foreground;
      } else {
        delete cell.dataset.columnsHighlightBackground;
        delete cell.dataset.columnsHighlightForeground;
      }
    });
  });
  block.toggleAttribute(
    'data-columns-enhanced',
    block.hasAttribute('data-columns-compact-row') ||
      block.hasAttribute('data-columns-compact-column') ||
      width === 'fit-content' ||
      !!rowHighlight ||
      !!columnHighlight,
  );
  const message = errors.join('; ');
  if (message && message !== block.dataset.columnsStyleErrors) {
    // Guard legacy content and stale values retained when conditional authoring fields are hidden.
    // eslint-disable-next-line no-console
    console.warn('Columns style validation:', message, block);
    block.dispatchEvent(new CustomEvent('columns:style-invalid', { bubbles: true, detail: errors }));
  }
  if (message) block.dataset.columnsStyleErrors = message;
  else delete block.dataset.columnsStyleErrors;
}

/**
 * Updates the headers of the columns based on the window width.
 */
function updateHeaders(block) {
  const headerCells = [...(block.firstElementChild?.children || [])];
  const rows = [...block.children].slice(1);

  if (window.innerWidth < 600 && block.classList.contains('b-alt-row')) {
    rows.forEach((row) => {
      [...row.children].forEach((cell, index) => {
        if (!cell.querySelector(':scope > .header-label')) {
          const headerLabel = span({ class: 'header-label' }, headerCells[index]?.textContent || '');
          const cellContent = document.createElement('div');
          cellContent.className = 'cell-content';
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

window.addEventListener('resize', () => {
  document.querySelectorAll('.columns[data-columns-decorated]').forEach(updateHeaders);
});

export default function decorate(block) {
  if (block.hasAttribute('data-columns-decorated')) {
    resolveStyles(block);
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
  resolveStyles(block);
  updateHeaders(block);
  block.setAttribute('data-columns-decorated', '');
  new MutationObserver(() => {
    resolveStyles(block);
    updateHeaders(block);
  }).observe(block, { attributes: true, attributeFilter: ['class'] });
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
