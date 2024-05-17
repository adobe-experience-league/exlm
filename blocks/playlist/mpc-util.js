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

export class PlaylistStore {
  constructor() {
    const playlistId = window.location.pathname.split('/').join('-');
    const localStorageKey = `playlist-${playlistId}`;
    let storedVideos = [];
    if (localStorage.getItem(localStorageKey)) {
      try {
        storedVideos = JSON.parse(localStorage.getItem(localStorageKey));
      } catch (e) {
        localStorage.removeItem(localStorageKey);
      }
    }
    const thisPlaylist = this;
    this.videos = new Proxy(storedVideos, {
      /**
       * @param {Array} target
       * @param {string} index
       * @param {Video} video
       */
      set(target, prop, val) {
        if (prop === 'length' || typeof prop === 'symbol') return target[prop];
        target[prop] = {
          ...target[prop],
          ...val,
        };
        localStorage.setItem(localStorageKey, JSON.stringify(target));
        if (thisPlaylist.onVideoChangeCallback) return thisPlaylist.onVideoChangeCallback(target, prop, val);
        return true;
      },
    });
    this.mpcListener = new MPCListener();
    this.mpcListener.on(MCP_EVENT.TICK, this.handleSeek.bind(this));
    this.mpcListener.on(MCP_EVENT.SEEK, this.handleSeek.bind(this));
    this.mpcListener.on(MCP_EVENT.COMPLETE, this.handleComplete.bind(this));
  }

  onVideoChange(fn) {
    this.onVideoChangeCallback = fn;
  }

  getVideo = (index) => this.videos[index];

  get length() {
    return this.videos.length;
  }

  getActiveVideo = () => this.videos.find((video) => video.active);

  getActiveVideoIndex = () => this.videos.findIndex((video) => video.active);

  updateVideoByIndex(index, props) {
    this.videos[index] = { ...this.getVideo(index), ...props };
  }

  updateActiveVideo(props) {
    const activeVideoIndex = this.getActiveVideoIndex();
    if (activeVideoIndex === -1) return;
    this.updateVideoByIndex(activeVideoIndex, props);
  }

  /**
   * @param {number|string} index
   */
  activateVideoByIndex(index) {
    let i = parseInt(index, 10);
    if (!this.getVideo(i)) i = 0;
    const currentActiveIndex = this.getActiveVideoIndex();
    if (i !== -1 && currentActiveIndex !== index) {
      this.updateActiveVideo({ active: false });
      this.updateVideoByIndex(i, { active: true });
    }
  }

  handleSeek(event) {
    const { currentTime } = event;
    let activeVideoIndex = this.getActiveVideoIndex();
    if (activeVideoIndex === -1) activeVideoIndex = 0;
    if (currentTime >= 0) {
      this.updateActiveVideo({ currentTime });
    }
  }

  handleComplete() {
    this.updateActiveVideo({ complete: true });
  }
}
