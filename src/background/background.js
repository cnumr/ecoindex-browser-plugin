/* global chrome,browser */

const apiUrl = 'https://bff.ecoindex.fr';
let currentBrowser;
let tabUrl = '';

if (navigator.userAgent.includes('Firefox')) {
  currentBrowser = browser;
} else {
  currentBrowser = chrome;
  currentBrowser.browserAction = chrome.action;
}

async function setBadgeUnknownGrade() {
  await currentBrowser.browserAction.setBadgeBackgroundColor({ color: '#5b5b5b' });
  await currentBrowser.browserAction.setBadgeText({ text: '?' });
}

async function updateBadge(ecoindexData) {
  if (!ecoindexData['latest-result'].id) {
    await setBadgeUnknownGrade();
  } else {
    const { color, grade: text } = ecoindexData['latest-result'];
    await currentBrowser.browserAction.setBadgeBackgroundColor({ color });
    await currentBrowser.browserAction.setBadgeText({ text });
  }
}

async function getBadgeInfo() {
  await setBadgeUnknownGrade();
  fetch(`${apiUrl}?url=${tabUrl}`)
    .then((r) => r.json())
    .then(updateBadge)
    .catch(async () => {
      await setBadgeUnknownGrade();
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
