import { loadCSS } from '../lib-franklin.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/swiper/swiper.css`);

export default class Swiper {
  constructor(container, items, dynamicallyChangeItems, handleSwipe, leftBtn, rightBtn) {
    this.container = container;
    this.handleSwipe = handleSwipe;
    this.items = items;
    this.itemsPerSwipe = 1;
    this.currentIndex = 0;
    this.totalSlides = Math.ceil(this.items.length / this.itemsPerSwipe);
    this.startX = 0;
    this.currentX = 0;
    this.isDragging = false;
    this.itemGap = 0;
    this.itemWidth = 0;
    this.translateLength = 0;
    if (dynamicallyChangeItems) {
      this.calculateVisibleItems();
    }
    this.leftBtn = leftBtn;
    this.rightBtn = rightBtn;
    this.init();
    if (leftBtn && rightBtn) {
      this.handleArrowClick();
    }
  }

  init() {
    this.container.classList.add('swiper-container');
    this.container.style.overflow = 'hidden';
    this.container.addEventListener('touchstart', (e) => {
      this.startX = e.touches[0].clientX;
    });

    this.container.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      if (this.startX > endX + 50) {
        this.swipe(true);
      } else if (this.startX < endX - 50) {
        this.swipe(false);
      }
    });
  }

  reset() {
    this.currentIndex = 0;
    this.items.forEach((item) => {
      item.style.transform = `translateX(0px)`;
    });
    if (this.leftBtn && this.rightBtn) {
      this.leftBtn.disabled = true;
      if (this.totalSlides <= 1) {
        this.rightBtn.disabled = true;
      } else {
        this.rightBtn.disabled = false;
      }
    }
  }

  swipe(direction) {
    if (this.handleSwipe) this.handleSwipe(direction);
    if (this.leftBtn && this.rightBtn) {
      this.leftBtn.disabled = false;
      this.rightBtn.disabled = false;
      if (direction) {
        if (this.currentIndex >= this.totalSlides - 2) {
          this.rightBtn.disabled = true;
        }
      } else if (this.currentIndex <= 1) {
        this.leftBtn.disabled = true;
      }
    }
    if (direction) {
      if (this.currentIndex >= this.totalSlides - 1) return;
      this.currentIndex += 1;
      this.translateLength -= (this.itemWidth + this.itemGap) * this.itemsPerSwipe;
    } else {
      if (this.currentIndex <= 0) return;
      this.currentIndex -= 1;
      this.translateLength += (this.itemWidth + this.itemGap) * this.itemsPerSwipe;
    }
    this.items.forEach((item) => {
      item.style.transform = `translateX(${this.translateLength}px)`;
    });
  }

  handleArrowClick() {
    this.leftBtn.addEventListener('click', () => {
      this.swipe(false);
    });

    this.rightBtn.addEventListener('click', () => {
      this.swipe(true);
    });
  }

  calculateVisibleItems() {
    // Create a ResizeObserver instance
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        this.itemGap = parseInt(getComputedStyle(this.container).gap, 10);
        this.itemWidth = this.items[0].offsetWidth;
        const containerWidth = entry.contentRect.width;
        const visibleItems = Math.floor((containerWidth + this.itemGap) / (this.itemWidth + this.itemGap));
        this.itemsPerSwipe = visibleItems;
        this.totalSlides = Math.ceil(this.items.length / this.itemsPerSwipe);
        this.container.style.width = `${this.container.parentElement.offsetWidth}px`;
        this.reset();
      });
    });
    resizeObserver.observe(this.container.parentElement);
  }
}
