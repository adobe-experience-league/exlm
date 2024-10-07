/* eslint-disable max-classes-per-file */
class EventEmitter {
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

class EventChannel {
  eventEmitter = {};

  static instance = null;

  getEmitter = (emitterName) => {
    if (!this.eventEmitter[emitterName]) {
      this.eventEmitter[emitterName] = new EventEmitter();
    }
    return this.eventEmitter[emitterName];
  };

  static getInstance() {
    if (!EventChannel.instance) {
      EventChannel.instance = new EventChannel();
    }
    return EventChannel.instance;
  }
}

export default EventChannel.getInstance();
