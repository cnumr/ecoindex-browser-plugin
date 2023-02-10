// eslint-disable-next-line import/extensions
import getBrowserPolyfill from '../custom-polyfill.js';

const apiUrl = 'https://bff.ecoindex.fr/api';
let tabUrl = '';
const currentBrowser = getBrowserPolyfill();

async function setBadgeUnknownGrade() {
  await currentBrowser.browserAction.setBadgeBackgroundColor({ color: '#5b5b5b' });
  await currentBrowser.browserAction.setBadgeText({ text: '?' });
}

async function cacheUnknownUrl() {
  const date = new Date();
  const tomorrow = date.setDate(date.getDate() + 1);
  currentBrowser.storage.local.set({
    [tabUrl]: {
      color: '#5b5b5b',
      text: '?',
      expirationTimestamp: tomorrow,
    },
  }).then();
}

async function setBadge(color, text) {
  await currentBrowser.browserAction.setBadgeBackgroundColor({ color });
  await currentBrowser.browserAction.setBadgeText({ text });
}
async function updateBadge(ecoindexData) {
  if (!ecoindexData['latest-result'].id) {
    await setBadgeUnknownGrade();
    await cacheUnknownUrl();
  } else {
    const value = ecoindexData['latest-result'];
    const date = new Date();
    const tomorrow = date.setDate(date.getDate() + 1);
    currentBrowser.storage.local.set({
      [tabUrl]: {
        color: value.color,
        text: value.grade,
        expirationTimestamp: tomorrow,
      },
    }).then().catch(async () => {
      await setBadgeUnknownGrade();
    });

    const { color, grade: text } = value;
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
      await setBadgeUnknownGrade();
      fetch(`${apiUrl}?url=${tabUrl}`)
        .then((r) => r.json())
        .then(updateBadge)
        .catch(async () => {
          await setBadgeUnknownGrade();
          await cacheUnknownUrl();
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
