// eslint-disable-next-line import/no-cycle
import { getConfig } from '../scripts.js';

function deserialize(arg = '') {
  // eslint-disable-next-line no-useless-escape
  return /^[\[\{\"].*[\"|\}\]]$/.test(arg) ? JSON.parse(arg) : arg;
}

export default function initStream() {
  // eslint-disable-next-line no-use-before-define
  const { eventSourceStreamUrl } = getConfig();
  const eventSource = new EventSource(eventSourceStreamUrl);

  eventSource.addEventListener(
    'analytics',
    (event) => {
      const data = deserialize(event.data);
      if (data === 'reg-complete') {
        eventSource.close();
      }
    },
    false,
  );

  eventSource.onerror = (error) => {
    // eslint-disable-next-line no-console
    console.error('Error receiving event:', error);
    eventSource.close();
  };

  setTimeout(() => {
    eventSource.close();
  }, 15000);
}
