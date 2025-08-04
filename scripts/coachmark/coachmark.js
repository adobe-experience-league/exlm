// 1) Create a shared CSSStyleSheet
const sheet = new CSSStyleSheet();

// 2) Load your external CSS once
fetch(new URL('./coachmark.css', import.meta.url))
  .then((r) => r.text())
  .then((cssText) => sheet.replaceSync(cssText));

const HTML = ({ type }) => `
<div class="spectrum-CoachMark spectrum-CoachMark--${type}">
    <div class="spectrum-CoachIndicator">
      <div class="spectrum-CoachIndicator-ring"></div>
      <div class="spectrum-CoachIndicator-ring"></div>
      <div class="spectrum-CoachIndicator-ring"></div>
    </div>

    <div
      role="presentation"
      class="spectrum-Popover is-open spectrum-Popover--sizeM spectrum-Popover--right-top spectrum-CoachMark-popover"
    >
      <div class="spectrum-CoachMark-header">
        <div class="spectrum-CoachMark-title">
          <slot name="title"></slot>
        </div>
      </div>
      <div class="spectrum-CoachMark-content">
        <slot name="content"></slot>
      </div>
    </div>
</div>
`;

class EXLCoachmark extends HTMLElement {
  constructor() {
    super();
    this.shadow = null;

    // 3) Adopt it into every instance
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.adoptedStyleSheets = [sheet];

    // 4) Stamp your HTML
    this.shadow.innerHTML += HTML({
      type: this.getAttribute('type') || 'circle',
    });

    this.indicator = this.shadow.querySelector('.spectrum-CoachIndicator');
    this.coachmark = this.shadow.querySelector('.spectrum-CoachMark');
    this.coachmark.style.display = 'none';
  }

  show() {
    this.coachmark.style.display = 'unset';
  }

  indicatorPulse() {
    const DELTA_PX = 8;
    const w = this.indicator.getBoundingClientRect().width;
    const h = this.indicator.getBoundingClientRect().height;
    const sx1 = 1;
    const sy1 = 1;
    const sx2 = (w + DELTA_PX) / w;
    const sy2 = (h + DELTA_PX) / h;
    const sx3 = (w + DELTA_PX * 2) / w;
    const sy3 = (h + DELTA_PX * 2) / h;
    this.indicator.style.setProperty('--spectrum-coach-indicator-animation-keyframe-scale-x-1', sx1);
    this.indicator.style.setProperty('--spectrum-coach-indicator-animation-keyframe-scale-y-1', sy1);
    this.indicator.style.setProperty('--spectrum-coach-indicator-animation-keyframe-scale-x-2', sx2);
    this.indicator.style.setProperty('--spectrum-coach-indicator-animation-keyframe-scale-y-2', sy2);
    this.indicator.style.setProperty('--spectrum-coach-indicator-animation-keyframe-scale-x-3', sx3);
    this.indicator.style.setProperty('--spectrum-coach-indicator-animation-keyframe-scale-y-3', sy3);
  }

  reset() {
    this.handleSlots();
    this.indicatorPulse();
  }

  handleSlots() {
    // Check if the slot "text" is provided; if not, remove .spectrum-CoachMark-content
    const slotText = this.querySelector('[slot="content"]');
    const contentEl = this.shadow.querySelector('.spectrum-CoachMark-content');
    if (!slotText && contentEl) {
      contentEl.remove();
    }

    const slotTitle = this.querySelector('[slot="title"]');
    const titleEl = this.shadow.querySelector('.spectrum-CoachMark-title');
    if (!slotTitle && titleEl) {
      titleEl.remove();
    }
  }

  connectedCallback() {
    this.reset();
  }
}

customElements.define('exl-coachmark', EXLCoachmark);
