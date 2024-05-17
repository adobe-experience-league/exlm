export const MCP_EVENT = {
  LOAD: 'load',
  START: 'start',
  PLAY: 'play',
  PAUSE: 'pause',
  TICK: 'tick',
  MILESTONE: 'milestone',
  SEEK: 'seek',
  CHAPTER: 'chapter',
  COMPLETE: 'complete',
  ENTER_FULLSCREEN: 'enterFullscreen',
  EXIT_FULLSCREEN: 'exitFullscreen',
};

export class MPCListener {
  constructor() {
    this.handlers = {};
    window.addEventListener(
      'message',
      (event) => {
        if (event?.data?.type === 'mpcStatus') {
          this.emit(event.data.state, event.data);
        }
      },
      false,
    );
  }

  emit(event, data) {
    this.handlers[event]?.forEach((fn) => fn(data));
  }

  on(event, fn) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(fn);
  }
}
