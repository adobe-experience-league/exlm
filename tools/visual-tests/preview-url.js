// srcdoc previews inherit a usable document base, but their location is not a URL base.
if (window.location.href === 'about:srcdoc') {
  const NativeURL = window.URL;
  window.URL = class extends NativeURL {
    constructor(url, base) {
      let resolvedBase = base;
      if (base === 'about:srcdoc') {
        resolvedBase = document.baseURI;
      } else if (base === 'null') {
        resolvedBase = new NativeURL(document.baseURI).origin;
      }
      super(url, resolvedBase);
    }
  };
}
