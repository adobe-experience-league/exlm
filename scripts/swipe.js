export default function detectSwipe(container, swipeLeft, swipeRight) {
  const THRESHOLD = 15;
  let x = 0;
  let y = 0;
  let x1 = 0;
  let y1 = 0;
  let recordedTime = new Date().getTime();

  function dir() {
    const a = x - x1;
    const b = y - y1;
    if (!(parseInt(Math.sqrt(a * a + b * b), 10) < THRESHOLD)) {
      if (x1 - x > Math.abs(y - y1)) {
        swipeLeft(container);
      }
      if (x - x1 > Math.abs(y - y1)) {
        swipeRight(container);
      }
    }
    return 'none';
  }

  container.addEventListener(
    'touchstart',
    (a) => {
      if (new Date().getTime() - recordedTime > 50) {
        x = parseInt(a.changedTouches[0].pageX, 10);
        y = parseInt(a.changedTouches[0].pageY, 10);
        recordedTime = new Date().getTime();
      }
    },
    !1,
  );
  container.addEventListener(
    'touchend',
    (a) => {
      x1 = x;
      y1 = y;
      x = parseInt(a.changedTouches[0].pageX, 10);
      y = parseInt(a.changedTouches[0].pageY, 10);
      dir();
      recordedTime = new Date().getTime();
    },
    !1,
  );
  container.addEventListener(
    'mousedown',
    (a) => {
      if (new Date().getTime() - recordedTime > 50) {
        x = a.clientX;
        y = a.clientY;
        recordedTime = new Date().getTime();
      }
    },
    !1,
  );
  container.addEventListener(
    'mouseup',
    (a) => {
      x1 = x;
      y1 = y;
      x = a.clientX;
      y = a.clientY;
      dir();
      recordedTime = new Date().getTime();
    },
    !1,
  );

  container.style.userSelect = 'none';
}
