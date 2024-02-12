const langMap = {
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  nl: 'nl-NL',
  sv: 'sv-SE',
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
};

export default function getLangCode(shortLang) {
  return langMap[shortLang] || shortLang;
}
