// 1) Create a shared CSSStyleSheet
const sheet = new CSSStyleSheet();

// 2) Load your external CSS once
fetch(new URL('./coachmark.css', import.meta.url))
  .then((r) => r.text())
  .then((cssText) => sheet.replaceSync(cssText));

const HTML = ({ type }) => `
<div class="spectrum-CoachMark spectrum-CoachMark--${type}" style="">
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
          Try playing with a pixel brush
        </div>
      </div>
      <div class="spectrum-CoachMark-content">
        Pixel brushes use pixels to create brush strokes, just like in other
        design and drawing tools. Start drawing, and zoom in to see the pixels
        in each stroke.
      </div>
    </div>
</div>
`;

class EXLCoachmark extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    // 3) Adopt it into every instance
    shadow.adoptedStyleSheets = [sheet];

    // 4) Stamp your HTML
    shadow.innerHTML += HTML({
      type: this.getAttribute('type') || 'circle',
    });
  }
}

customElements.define('exl-coachmark', EXLCoachmark);
