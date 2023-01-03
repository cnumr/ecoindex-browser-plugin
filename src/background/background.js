const apiUrl = 'https://bff.ecoindex.fr';
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        await getAndUpdateEcoindexData(changeInfo.url);
    }
});

chrome.tabs.onActivated.addListener(async function (activeInfo) {
    let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    if (tab.url) {
        await getAndUpdateEcoindexData(tab.url);
    }
});

async function setBadgeUnknownGrade() {
    await chrome.action.setBadgeBackgroundColor({color: '#5b5b5b'});
    await chrome.action.setBadgeText({text: '?'});
}

async function getAndUpdateEcoindexData(url) {
    fetch(`${apiUrl}?url=${url}`)
        .then((r) => r.json())
        .then(updateBadge);
}

async function updateBadge(ecoindexData) {
    if (!ecoindexData['latest-result'].id) {
        await setBadgeUnknownGrade();
    } else {
        const {color, grade: text} = ecoindexData['latest-result'];
        await chrome.action.setBadgeBackgroundColor({color});
        await chrome.action.setBadgeText({text});
    }
}