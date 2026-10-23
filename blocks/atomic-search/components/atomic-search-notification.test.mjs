/**
 * EXLM-6175 — unit coverage for the production trigger notification renderer.
 * Run: node blocks/atomic-search/components/atomic-search-notification.test.mjs
 *
 * Imports `renderTriggerNotifications` (same module production uses). Uses a minimal
 * DOM shim so Node can run without pulling `scripts.js`.
 */
import assert from 'node:assert/strict';
import renderTriggerNotifications from './atomic-search-notification-render.js';

function createEl(tag = 'div') {
  const children = [];
  const el = {
    tagName: tag.toUpperCase(),
    part: '',
    style: { display: '' },
    textContent: '',
    children,
    parentNode: null,
    firstElementChild: null,
    querySelector(sel) {
      if (sel === '[part="text"]') return this.textEl || null;
      if (sel === '[part="icon"]') return this.iconEl || null;
      return null;
    },
    querySelectorAll(sel) {
      if (sel === 'a') return this.links || [];
      if (sel === '[part="trigger-notification"]') {
        return children.filter((c) => c.part === 'trigger-notification');
      }
      if (sel === '[part="notification"]') {
        return children.filter((c) => c.part === 'notification');
      }
      return [];
    },
    append(...nodes) {
      nodes.forEach((child) => {
        children.push(child);
        child.parentNode = el;
        if (!el.firstElementChild) el.firstElementChild = child;
      });
    },
    remove() {
      if (!this.parentNode) return;
      const list = this.parentNode.children;
      const i = list.indexOf(this);
      if (i >= 0) list.splice(i, 1);
      this.parentNode = null;
    },
  };
  return el;
}

function htmlToElement(html) {
  const wrap = createEl('div');
  wrap.part = '';
  const span = createEl('span');
  span.textContent = String(html)
    .replace(/<[^>]+>/g, ' ')
    .trim();
  wrap.append(span);
  wrap.links = [];
  return wrap;
}

function makeParent(nativeTexts) {
  const parent = createEl('div');
  parent.part = 'notifications';
  nativeTexts.forEach((text) => {
    const native = createEl('div');
    native.part = 'notification';
    native.textEl = { textContent: text };
    native.iconEl = createEl('div');
    native.iconEl.part = 'icon';
    native.iconEl.parentNode = native;
    parent.append(native);
  });
  return parent;
}

function render(parent) {
  renderTriggerNotifications(parent, htmlToElement);
}

const parent = makeParent(['<div>New: Learn how to get started with Experience Manager.</div>']);

render(parent);
assert.equal(parent.querySelectorAll('[part="trigger-notification"]').length, 1);

render(parent);
render(parent);
render(parent);
assert.equal(parent.querySelectorAll('[part="trigger-notification"]').length, 1, 're-entry must not stack duplicates');

const dupParent = makeParent(['<div>Same trigger</div>', '<div>Same trigger</div>']);
render(dupParent);
assert.equal(
  dupParent.querySelectorAll('[part="trigger-notification"]').length,
  1,
  'identical native payloads must dedupe',
);
const dupNatives = dupParent.querySelectorAll('[part="notification"]');
assert.equal(dupNatives.length, 2, 'both native nodes remain in the shadow tree');
assert.ok(
  dupNatives.every((n) => n.style.display === 'none'),
  'duplicate native notifications must all be hidden',
);

// Prove the test exercises the production export (not a local copy).
assert.equal(typeof renderTriggerNotifications, 'function');

const nullConvertParent = makeParent(['<div>Keep me visible</div>']);
renderTriggerNotifications(nullConvertParent, () => null);
assert.equal(
  nullConvertParent.querySelectorAll('[part="trigger-notification"]').length,
  0,
  'failed conversion must not append a custom trigger',
);
assert.equal(
  nullConvertParent.querySelectorAll('[part="notification"]')[0].style.display,
  '',
  'failed conversion must leave the native notification visible',
);

process.stdout.write('atomic-search-notification.test.mjs: all assertions passed\n');
