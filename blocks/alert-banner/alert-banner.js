const DISMISS_DELAY_MS = 5000;
const ALERT_API_PATH = '/api/alert';

async function loadAlertData(path) {
  const response = await fetch(path);
  return response.json();
}

function createCloseButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = 'Dismiss';
  return btn;
}

function createMessageElement(text) {
  const el = document.createElement('p');
  el.innerHTML = text;
  return el;
}

export default function decorate(block) {
  const allAlerts = document.querySelectorAll('.alert-banner');
  if (allAlerts.length > 1) {
    allAlerts[0].remove();
  }

  const rows = [...block.children];
  const rawText = rows[0] ? rows[0].textContent.trim() : '';

  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.justifyContent = 'space-between';
  wrapper.style.alignItems = 'center';

  const message = createMessageElement(rawText);
  const closeBtn = createCloseButton();

  closeBtn.addEventListener('click', () => {
    block.style.display = 'none';
    sessionStorage.setItem('alert-dismissed', 'true');
  });

  wrapper.append(message, closeBtn);
  block.append(wrapper);

  message.className = 'alert-banner-content';

  setTimeout(() => {
    block.style.display = 'none';
  }, DISMISS_DELAY_MS);

  loadAlertData(ALERT_API_PATH).then((data) => {
    block.querySelector('.alert-banner-content').innerHTML = data.message;
    block.querySelector('.alert-banner-content').dataset.type = data.type;
  });
}
