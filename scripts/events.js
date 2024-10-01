export default class EventEmitter {
  constructor(initialValue = {}) {
    this.listeners = {};
    this.data = initialValue;
  }

  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(callback);
  }

  emit(eventName, data) {
    if (this.listeners[eventName]) {
      this.listeners[eventName].forEach((listener) => listener(data));
    }
  }

  off(eventName, callback) {
    if (this.listeners[eventName]) {
      this.listeners[eventName] = this.listeners[eventName].filter((listener) => listener !== callback);
    }
  }

  set(key, value) {
    if (this.data[key] !== value) {
      this.data[key] = value;
      this.emit('dataChange', { key, value });
    }
  }

  get(key) {
    return this.data[key];
  }
}

export const globalEmitter = new EventEmitter();
/* TODO: Below Emitters to be cleaned up and make use of globalEmitter and update the set method */
export const productExperienceEventEmitter = new EventEmitter();
export const bookmarksEventEmitter = new EventEmitter();
