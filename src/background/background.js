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

async function setBadge(color, text) {
  await currentBrowser.browserAction.setBadgeBackgroundColor({ color });
  await currentBrowser.browserAction.setBadgeText({ text });
}
async function updateBadge(ecoindexData) {
  if (!ecoindexData['latest-result'].id) {
    await setBadgeUnknownGrade();
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
    if ((!result[tabUrl] || result[tabUrl]?.expirationTimestamp < Date.now()) && tabUrl !== 'about:newtab') {
      await setBadgeUnknownGrade();
      fetch(`${apiUrl}?url=${tabUrl}`)
        .then((r) => r.json())
        .then(updateBadge)
        .catch(async () => {
          await setBadgeUnknownGrade();
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
