import loadFeedbackUi from './feedback/feedback.js'; // eslint-disable-line import/no-cycle

const ID_CALLBACK_MAP = {
  ZN_1LdeP1rtDg6qXL8: loadFeedbackUi,
};

export default async function loadQualtrics() {
  const NOOP = () => {};
  fetch('/qualtrics.json')
    .then((resp) => {
      if (resp.ok) {
        return resp.json();
      }
      throw new Error(`${resp.status}: ${resp.statusText}`);
    })
    .then((json) => {
      json.data.forEach((item) => {
        const interceptId = item['Intercept Id'];
        const interceptURL = item['Intercept URL'];
        if (interceptId && interceptURL) {
          const c = `${interceptId}_container`;
          let d;
          const o = document.getElementById(c);
          if (o) {
            o.innerHTML = '';
            d = o;
          } else {
            d = document.createElement('div');
            d.id = c;
          }
          const s = document.createElement('script');
          s.type = 'text/javascript';
          s.src = interceptURL;
          s.onload = ID_CALLBACK_MAP[interceptId] || NOOP;
          if (document.body) {
            document.body.appendChild(s);
            document.body.appendChild(d);
          }
        }
      });
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log(error);
    });
}
