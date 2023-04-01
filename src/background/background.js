/* eslint-disable import/extensions */
import {
  DEFAULT_BADGE_TEXT,
  DEFAULT_COLOR,
  FETCH_RESULT_URL,
  getBrowserPolyfill,
  setBadge,
  setBadgeLocalStorage,
} from '../common.js';

let tabUrl = '';
const currentBrowser = getBrowserPolyfill();

async function updateBadge(ecoindexData) {
  if (!ecoindexData['latest-result'].id) {
    await setBadge(DEFAULT_COLOR(), DEFAULT_BADGE_TEXT());
    await setBadgeLocalStorage(tabUrl, DEFAULT_COLOR(), DEFAULT_BADGE_TEXT());
  } else {
    const { color, grade: text } = ecoindexData['latest-result'];
    setBadgeLocalStorage(tabUrl, color, text)
      .then()
      .catch(async () => {
        await setBadge(DEFAULT_COLOR(), DEFAULT_BADGE_TEXT());
      });
    await setBadge(color, text);
  }
}

async function getBadgeInfo() {
  currentBrowser.storage.local.get([tabUrl]).then(async (result) => {
    if (tabUrl === 'about:newtab') {
      await setBadge('transparent', '');
      return;
    }

    if ((!result[tabUrl] || result[tabUrl]?.expirationTimestamp < Date.now())) {
      await setBadge(DEFAULT_COLOR(), DEFAULT_BADGE_TEXT());
      fetch(FETCH_RESULT_URL(tabUrl))
        .then((r) => r.json())
        .then(updateBadge)
        .catch(async () => {
          await setBadge(DEFAULT_COLOR(), DEFAULT_BADGE_TEXT());
          await setBadgeLocalStorage(tabUrl, DEFAULT_COLOR(), DEFAULT_BADGE_TEXT());
        });
    } else {
      const { text, color } = result[tabUrl];
      await setBadge(color, text);
    }
  });
}

currentBrowser.tabs.onUpdated.addListener(async (_tabId, changeInfo) => {
  if (changeInfo.url !== undefined && changeInfo.url !== '') {
    tabUrl = changeInfo.url;
  }

  if (changeInfo.status === 'loading') {
    await getBadgeInfo();
  }
});

currentBrowser.tabs.onActivated.addListener(async () => {
  const [tab] = await currentBrowser.tabs.query({ active: true, currentWindow: true });
  tabUrl = tab.url;
  await getBadgeInfo();
});
