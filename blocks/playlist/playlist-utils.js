/* eslint-disable max-classes-per-file */

import { pushVideoEvent } from '../../scripts/analytics/lib-analytics.js';

export const LABELS = {
  tutorials: 'playlist-tutorials',
  playlist: 'playlist',
  nowViewing: 'playlist-now-viewing',
  autoPlayNextVideo: 'playlist-autoplay-next-video',
  transcript: 'playlist-transcript',
  bookmarkPlaylist: 'playlist-bookmark-playlist',
  copyPlaylistLink: 'playlist-copy-playlist-link',
  aboutPlaylist: 'playlist-about-playlist',
  transcriptNotAvailable: 'playlist-transcript-not-available',
};

/**
 * @typedef {Object} Video
 * // src, autoplay = true, title, description, transcriptUrl
 * @property {string} src
 * @property {boolean} autoplay
 * @property {string} title
 * @property {string} description
 * @property {string} transcriptUrl
 * @property {string} duration
 * @property {string} thumbnailUrl
 * @property {boolean} active
 * @property {number} currentTime
 * @property {boolean} completed
 * @property {HTMLElement} el
 * @returns
 */

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

export class Playlist {
  title = '';

  description = '';

  constructor(options) {
    this.options = options || { autoplayNext: true };
    const playlistId = window.location.pathname.split('/').join('-');
    this.localStorageKey = `playlist-${playlistId}`;
    let storedPlaylist = {
      videos: [],
    };
    if (localStorage.getItem(this.localStorageKey)) {
      try {
        storedPlaylist = JSON.parse(localStorage.getItem(this.localStorageKey));
      } catch (e) {
        localStorage.removeItem(this.localStorageKey);
      }
    }
    const thisPlaylist = this;
    /** @type {Video[]} */
    this.videos = new Proxy(storedPlaylist.videos, {
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
        const currentLocalStorage = JSON.parse(localStorage.getItem(thisPlaylist.localStorageKey));
        localStorage.setItem(thisPlaylist.localStorageKey, JSON.stringify({ ...currentLocalStorage, videos: target }));
        if (thisPlaylist.onVideoChangeCallback) return thisPlaylist.onVideoChangeCallback(target, prop, val);
        return true;
      },
    });
    this.mpcListener = new MPCListener();
    this.mpcListener.on(MCP_EVENT.TICK, this.handleSeek.bind(this));
    this.mpcListener.on(MCP_EVENT.SEEK, this.handleSeek.bind(this));
    this.mpcListener.on(MCP_EVENT.COMPLETE, this.handleComplete.bind(this));
    this.mpcListener.on(MCP_EVENT.START, () => {
      const { title, description, duration, src } = this.getActiveVideo();
      pushVideoEvent({ title, description, url: src, duration });
    });
  }

  updateOptions(options) {
    this.options = { ...this.options, ...options };
    // update localStroage
    const currentLocalStorage = JSON.parse(localStorage.getItem(this.localStorageKey));
    localStorage.setItem(this.localStorageKey, JSON.stringify({ ...currentLocalStorage, options: this.options }));
  }

  /**
   *
   * @param {(target: Video[], index: number, video: Video) => void} fn
   */
  onVideoChange(fn) {
    this.onVideoChangeCallback = fn;
  }

  /**
   * @param {number} index
   * @returns {Video}
   */
  getVideo = (index) => this.videos[index];

  getVideos = () => this.videos;

  /** @returns {number} */
  get length() {
    return this.videos.length;
  }

  /** @returns {Video} */
  getActiveVideo = () => this.videos.find((video) => video.active);

  /** @returns {number} */
  getActiveVideoIndex = () => this.videos.findIndex((video) => video.active);

  /**
   * @param {number} index
   * @param {Video} props
   */
  updateVideoByIndex(index, props) {
    this.videos[index] = { ...this.getVideo(index), ...props };
  }

  /** @param {Video} props */
  updateActiveVideo(props) {
    const activeVideoIndex = this.getActiveVideoIndex();
    if (activeVideoIndex === -1) return;
    this.updateVideoByIndex(activeVideoIndex, props);
  }

  /** @param {number|string} index */
  activateVideoByIndex(index, autoplay = false) {
    let i = parseInt(index, 10);
    if (!this.getVideo(i)) i = 0;
    const currentActiveIndex = this.getActiveVideoIndex();
    if (i !== -1 && currentActiveIndex !== index) {
      // if currentTime is at end of video, reset currentTime
      let { currentTime } = this.getVideo(i);
      currentTime = currentTime >= this.getVideo(i).duration - 1 ? 0 : currentTime;
      this.updateActiveVideo({ active: false, autoplay: false });
      this.updateVideoByIndex(i, { active: true, autoplay, currentTime });
    }
  }

  next(autoplay = false) {
    const activeVideoIndex = this.getActiveVideoIndex();
    if (activeVideoIndex === -1) return;
    if (activeVideoIndex + 1 >= this.length) return;
    this.activateVideoByIndex(activeVideoIndex + 1, autoplay);
  }

  prev(autoplay = false) {
    const activeVideoIndex = this.getActiveVideoIndex();
    if (activeVideoIndex === -1) return;
    if (activeVideoIndex - 1 < 0) return;
    this.activateVideoByIndex(activeVideoIndex - 1, autoplay);
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
    if (this.options.autoplayNext) {
      this.next(this.options.autoplayNext);
    }
  }
}
