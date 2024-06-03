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

function eventHandler() {
  const eventObject = new EventEmitter({});

  // Function to update all checkboxes
  function updateCheckboxes() {
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach((checkbox) => {
      const checkboxName = checkbox.getAttribute('data-name');
      checkbox.checked = eventObject.get(checkboxName);
    });
  }

  // Add event listener to all checkboxes
  const checkboxes = document.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const checkboxName = checkbox.getAttribute('data-name');
      const newValue = checkbox.checked;
      eventObject.set(checkboxName, newValue);
      updateCheckboxes(); // Update all checkboxes
    });
  });
}

export default eventHandler;
