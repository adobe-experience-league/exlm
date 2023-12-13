import { htmlToElement } from './scripts.js';

const threshold = 5; // Touch hold threshold

export default class CardCarousel {
  constructor(carouselContainer, cardsContainer) {
    this.cardsContainer = cardsContainer;
    this.carouselContainer = carouselContainer;
    this.createCarouselControls();
    this.controlsContainer = this.cardsContainer.nextElementSibling;
    const ro = new ResizeObserver(() => {
      carouselContainer.children[0].replaceWith(carouselContainer.children[0].cloneNode(true));
      this.initialize(carouselContainer.children[0]);
    });

    ro.observe(carouselContainer);
  }

  getCardWidth() {
    return this.cardsContainer.children[0].offsetLeft - this.cardsContainer.children[1].offsetLeft;
  }

  initialize(cardsContainer) {
    this.cardsContainer = cardsContainer;
    this.reset();
    if (window.innerWidth < 1200 || this.cardsContainer.children.length >= 5) {
      this.carouselContainer.style.overflow = 'hidden';
      this.transformValue = this.getCardWidth();
      this.cardsContainer.dataset.activeSlide = 'slide-1';
      this.cardsContainer.style.display = 'flex';
      this.cardsContainer.style.flexWrap = 'nowrap';
      this.controlsContainer.style.display = 'flex';
      this.handleClick();
      this.handleSwipe();
    } else {
      this.controlsContainer.style.display = 'none';
    }
  }

  reset() {
    this.cardsContainer.dataset.activeSlide = 'slide-1';
    this.cardsContainer.style.transform = 'none';
    [...this.controlsContainer.children].forEach((btn) => {
      if (btn.ariaSelected === 'true') btn.ariaSelected = 'false';
    });
    this.controlsContainer.children[0].ariaSelected = 'true';
  }

  animate() {
    const currentTab = parseInt(this.cardsContainer.dataset.activeSlide.split('-')[1], 10);
    this.cardsContainer.style.transform = `translateX(${this.transformValue * (currentTab - 1)}px)`;
  }

  handleClick() {
    this.controlsContainer.addEventListener('click', (e) => {
      if (e.target.getAttribute('type') === 'button' && e.target.ariaSelected === 'false') {
        [...this.controlsContainer.children].forEach((btn) => {
          if (btn.ariaSelected === 'true') btn.ariaSelected = 'false';
        });
        e.target.ariaSelected = 'true';
        this.cardsContainer.dataset.activeSlide = e.target.dataset.slideValue;
        this.animate();
      }
    });
  }

  swipeHandler(activeCardMutator) {
    const { activeSlide } = this.cardsContainer.dataset;
    const currentTab = parseInt(activeSlide.split('-')[1], 10) + activeCardMutator;
    if (currentTab <= this.cardsContainer.children.length && currentTab > 0) {
      this.cardsContainer.dataset.activeSlide = `slide-${currentTab}`;
      const buttons = Array.from(this.cardsContainer.nextElementSibling.children);
      buttons.forEach((btn) => {
        if (btn.ariaSelected === 'true') {
          btn.ariaSelected = 'false';
        }
      });
      buttons[currentTab - 1].ariaSelected = 'true';
      this.animate();
    }
  }

  swipeLeft() {
    this.swipeHandler(1);
  }

  swipeRight() {
    this.swipeHandler(-1);
  }

  getDirection(xAxisValue, xAxisValue1, yAxisValue, yAxisValue1) {
    const a = xAxisValue - xAxisValue1;
    const b = yAxisValue - yAxisValue1;
    if (!(parseInt(Math.sqrt(a * a + b * b), 10) < threshold)) {
      if (xAxisValue1 - xAxisValue > Math.abs(yAxisValue - yAxisValue1)) {
        this.swipeLeft();
      }
      if (xAxisValue - xAxisValue1 > Math.abs(yAxisValue - yAxisValue1)) {
        this.swipeRight();
      }
    }
    return 'none';
  }

  handleSwipe() {
    let xAxisValue = 0;
    let yAxisValue = 0;
    let xAxisValue1 = 0;
    let yAxisValue1 = 0;
    let recordedTime = new Date().getTime();

    this.cardsContainer.addEventListener(
      'touchstart',
      (a) => {
        if (new Date().getTime() - recordedTime > 50) {
          xAxisValue = parseInt(a.changedTouches[0].pageX, 10);
          yAxisValue = parseInt(a.changedTouches[0].pageY, 10);
          recordedTime = new Date().getTime();
        }
      },
      { passive: true },
    );
    this.cardsContainer.addEventListener(
      'touchend',
      (a) => {
        xAxisValue1 = xAxisValue;
        yAxisValue1 = yAxisValue;
        xAxisValue = parseInt(a.changedTouches[0].pageX, 10);
        yAxisValue = parseInt(a.changedTouches[0].pageY, 10);
        this.getDirection(xAxisValue, xAxisValue1, yAxisValue, yAxisValue1);
        recordedTime = new Date().getTime();
      },
      { passive: true },
    );
    this.cardsContainer.addEventListener(
      'mousedown',
      (a) => {
        if (new Date().getTime() - recordedTime > 50) {
          xAxisValue = a.clientX;
          yAxisValue = a.clientY;
          recordedTime = new Date().getTime();
        }
      },
      { passive: true },
    );
    this.cardsContainer.addEventListener(
      'mouseup',
      (a) => {
        xAxisValue1 = xAxisValue;
        yAxisValue1 = yAxisValue;
        xAxisValue = a.clientX;
        yAxisValue = a.clientY;
        this.getDirection(xAxisValue, xAxisValue1, yAxisValue, yAxisValue1);
        recordedTime = new Date().getTime();
      },
      { passive: true },
    );

    this.cardsContainer.style.userSelect = 'none';
  }

  createCarouselControls() {
    const carouselControls = htmlToElement(`
    <div class="carousel-controls" role="tablist" aria-label="Slides">
      ${[...this.cardsContainer.children]
        .map(
          (el, i) => `<button class="carousel-tab-${i + 1}" 
                  type="button" role="tab"
                  aria-label="Slide ${i + 1}"
                  data-slide-value="slide-${i + 1}"
                  aria-selected=${i === 0 ? 'true' : 'false'}
                  aria-controls="carousel-item-${i + 1}">
                </button>`,
        )
        .join('')}
    </div>
  `);

    this.cardsContainer.after(carouselControls);
  }
}
