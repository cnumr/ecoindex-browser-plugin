/** Shared logic */
export default function getBrowserPolyfill() {
  let currentBrowser;
  if (navigator.userAgent.includes('Firefox')) {
    currentBrowser = browser;
  } else {
    currentBrowser = chrome;
    currentBrowser.browserAction = chrome.action;
  }
  return currentBrowser;
}
