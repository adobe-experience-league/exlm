let languagePromise = null;
export const loadLanguageFragment = async () => {
  languagePromise =
    languagePromise ||
    new Promise((resolve) => {
      fetch(`/fragments/en/languages/languages.plain.html`)
        .then((response) => response.text())
        .then((text) => {
          resolve(text);
        });
    });
  return languagePromise;
};

export const getCurrentLanguage = () => {
  // first part of url is the language
  const url = window.location.pathname;
  const parts = url.split('/');
  return parts.length > 0 ? url.split('/')[1] : 'en';
};

export const isIndex = () => {
  const url = window.location.pathname;
  return url === '/';
};

export const switchLanguage = async (language) => {
  const currentLanguage = getCurrentLanguage();
  if (currentLanguage === language) {
    return;
  }

  if (isIndex()) {
    window.location.pathname = `/${language}`;
  } else {
    const newPath = window.location.pathname.replace(currentLanguage, language);
    window.location.pathname = newPath;
  }
};
