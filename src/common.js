/** Shared logic */
const ecoindexUrl = 'https://www.ecoindex.fr';
const apiUrl = 'https://bff.ecoindex.fr/api';

export const DEFAULT_COLOR = () => '#5b5b5b';
export const DEFAULT_BADGE_TEXT = () => '?';

export const FETCH_RESULT_URL = (url, refresh = false) => `${apiUrl}/results/?url=${url}&refresh=${refresh}`;
export const FETCH_TASK_URL = `${apiUrl}/tasks`;
export const FETCH_ID_TASK_URL = (id) => `${FETCH_TASK_URL}/${id}`;
export const FETCH_SCREENSHOT_URL = (id) => `${apiUrl}/screenshot/${id}`;
export const FETCH_RESULT_ECOINDEX_URL = (id) => `${ecoindexUrl}/resultat/?id=${id}`;

let currentBrowser;
if (navigator.userAgent.includes('Firefox')) {
  currentBrowser = browser;
} else {
  currentBrowser = chrome;
  currentBrowser.browserAction = chrome.action;
}
export function getBrowserPolyfill() {
  return currentBrowser;
}

export async function setBadgeLocalStorage(tabUrl, color, text) {
  const date = new Date();
  const tomorrow = date.setDate(date.getDate() + 1);
  return currentBrowser.storage.local.set({
    [tabUrl]: {
      color,
      text,
      expirationTimestamp: tomorrow,
    },
  });
}

export async function setBadge(color, text) {
  await currentBrowser.browserAction.setBadgeBackgroundColor({ color });
  await currentBrowser.browserAction.setBadgeText({ text });
}
