/* eslint-disable max-classes-per-file */
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
    this.active = true;
    window.addEventListener('message', this.onMessage.bind(this), false);
  }

  onMessage(event) {
    if (!this.active) return;
    if (event?.data?.type === 'mpcStatus') {
      this.emit(event.data.state, event.data);
    }
  }

  emit(event, data) {
    this.handlers[event]?.forEach((fn) => fn(data));
  }

  on(event, fn) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(fn);
  }

  pause() {
    this.active = false;
  }

  resume() {
    this.active = true;
  }
}
