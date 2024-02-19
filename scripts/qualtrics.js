export default async function loadQualtrics() {
  fetch('/qualtrics.json')
    .then((resp) => {
      if (resp.ok) {
        return resp.json();
      }
      throw new Error(`${resp.status}: ${resp.statusText}`);
    })
    .then((json) => {
      let d;

      json.data.forEach((item) => {
        const interceptId = item['Intercept Id'];
        const interceptURL = item['Intercept URL'];
        const id = interceptId;
        const c = `${id}_container`;
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
        if (document.body) {
          document.body.appendChild(s);
          document.body.appendChild(d);
        }
      });
    })
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.log(e);
    });
}
