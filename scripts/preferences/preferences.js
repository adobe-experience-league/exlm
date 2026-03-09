class PreferenceStore {
  constructor(objectKey) {
    this.storeKey = 'exl-preferences';
    this.objectKey = objectKey;

    if (!this.isAllowed()) {
      return;
    }

    // Initialize preferences for the object key if it doesn't exist
    const preferences = JSON.parse(localStorage.getItem(this.storeKey));
    if (!preferences) {
      localStorage.setItem(this.storeKey, JSON.stringify({ [this.objectKey]: {} }));
    }
  }

  // eslint-disable-next-line class-methods-use-this
  isAllowed() {
    return typeof Storage !== 'undefined';
  }

  set(key, value) {
    if (!this.isAllowed()) {
      return;
    }

    const preferences = JSON.parse(localStorage.getItem(this.storeKey) || '{}');
    preferences[this.objectKey] = {
      ...preferences[this.objectKey],
      [key]: value,
    };
    localStorage.setItem(this.storeKey, JSON.stringify(preferences));
  }

  get(key) {
    if (!this.isAllowed()) {
      return null;
    }

    const preferences = JSON.parse(localStorage.getItem(this.storeKey) || '{}');

    // Initialize preferences.slide if it doesn't exist
    if (!preferences[this.objectKey]) {
      preferences[this.objectKey] = {};
    }

    return preferences[this.objectKey][key];
  }
}

export default PreferenceStore;
