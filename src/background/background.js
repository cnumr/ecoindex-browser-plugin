const apiUrl = 'https://bff.ecoindex.fr';
let currentBrowser;

if (navigator.userAgent.includes('Firefox')) {
  currentBrowser = browser;
} else {
  currentBrowser = chrome;
}
// TODO: browserAction if Firefox else action...

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

async function getAndUpdateEcoindexData(url) {
  fetch(`${apiUrl}?url=${url}`)
    .then((r) => r.json())
    .then(updateBadge);
}

async function getBadgeInfo(url) {
  await setBadgeUnknownGrade();

  if (typeof url === 'string' && url.startsWith('http')) {
    await getAndUpdateEcoindexData(url);
  }
}

currentBrowser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;
  await getBadgeInfo(changeInfo.url);
});

currentBrowser.tabs.onActivated.addListener(async (activeInfo) => {
  const [tab] = await currentBrowser.tabs.query({ active: true, currentWindow: true });
  await getBadgeInfo(tab.url);
});
