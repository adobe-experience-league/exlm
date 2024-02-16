export function interceptpoc() {
  // replace these constants with qualtricsintercept spreadsheet vars
  const interceptId = 'SI_cNofPKT9FnxHmGW';
  const interceptURL = 'https://znekvehiws9gurnne-adobe.siteintercept.qualtrics.com/SIE/?Q_SIID=SI_cNofPKT9FnxHmGW&Q_VERSION=0&Q_BOOKMARKLET';
  
  (function () { var id = interceptId, c = `${interceptId}_container`; var o = document.getElementById(c); if (o) { o.innerHTML = ''; var d = o; } else { var d = document.createElement('div'); d.id = c; } var s = document.createElement('script'); s.type = 'text/javascript'; s.src = interceptURL; if (document.body) { document.body.appendChild(s); document.body.appendChild(d); } })();
}
