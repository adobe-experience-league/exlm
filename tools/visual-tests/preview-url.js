// srcdoc previews inherit a usable document base, but their location is not a URL base.
if (window.location.href === 'about:srcdoc') {
  const NativeURL = window.URL;
  window.URL = class extends NativeURL {
    constructor(url, base) {
      super(url, base === 'about:srcdoc' ? document.baseURI : base);
    }
  };
}
