// Message handler for the web worker
self.onmessage = function (event) {
  if (event.data === 'loadAdobeLaunch') {
    // Set up a callback for when the script is loaded
    self.postMessage('adobeLaunchLoaded');
  }
};
