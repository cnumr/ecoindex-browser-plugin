/* eslint-disable no-console */
// eslint-disable-next-line import/extensions
import getBrowserPolyfill from '../custom-polyfill.js';

const ecoindexUrl = 'https://www.ecoindex.fr';
const apiUrl = 'https://bff.ecoindex.fr/api';
let tabUrl;
const domTitle = document.getElementById('title');
const currentBrowser = getBrowserPolyfill();

/**
 * display error message
 * @param string title
 * @param any detail
 */
function displayError(title, detail) {
  document.getElementById('loader').style.display = 'none';
  const errorTitle = document.querySelector('#error summary');
  const errorDetail = document.querySelector('#error code');
  errorDetail.textContent = detail;
  errorTitle.textContent = title;
  document.getElementById('error').style.display = 'block';
}

/**
 * Display error message if an error occurs while fetching data
 * @param Error error
 */
function handleApiError(error) {
  console.error(error);
  displayError("Une erreur est survenue en essayant de récupérer les données de l'API", error.message);
}

/**
 * Propose to analyze the current page if no analysis is available
 * @param string message
 */
function proposeAnalysis(message) {
  const noAnalyzis = document.getElementById('no-analysis');
  domTitle.textContent = message;
  noAnalyzis.style.display = 'block';
  domTitle.style.display = 'block';
}

/**
 * Helper to display date in french
 * @param Date date
 * @returns string
 */
function convertDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });
}

/**
 * Display the image of the analysis if exists
 * @param string id
 */
function displayImage(id) {
  fetch(`${apiUrl}/screenshot/${id}`)
    .then((response) => {
      if (response.status !== 200) {
        throw new Error(`Pas de screenshot pour l'analyse ${id}`);
      }
      return response.blob();
    })
    .then((imageBlob) => {
      const screenshot = document.getElementById('screenshot');
      screenshot.setAttribute('src', URL.createObjectURL(imageBlob));
      screenshot.style.display = 'block';
    })
    .catch((error) => console.error(error));
}

/**
 * Reset list element
 * @param Element section
 */
function resetList(section) {
  const ul = section.getElementsByTagName('ul')[0];
  ul.innerHTML = '';
}

/**
 * Display list element for other results
 * @param Element section
 * @param any ecoindex
 */
function makeList(section, ecoindex) {
  const b = document.createElement('button');
  b.style.backgroundColor = ecoindex.color;
  b.style.color = '#FFF';
  b.style.padding = '10px';
  b.textContent = ecoindex.grade;

  const resultLink = document.createElement('a');
  resultLink.appendChild(b);
  resultLink.setAttribute('href', `${ecoindexUrl}/resultat/?id=${ecoindex.id}`);
  resultLink.setAttribute('target', '_blank');

  const li = document.createElement('li');
  li.style.listStyleType = 'none';
  li.setAttribute('title', `(${ecoindex.score} / 100) le ${convertDate(ecoindex.date)}`);
  li.appendChild(resultLink);

  const pageLink = document.createElement('a');
  pageLink.textContent = ecoindex.url;
  pageLink.setAttribute('href', ecoindex.url);
  pageLink.style.paddingLeft = '5px';
  li.appendChild(pageLink);

  const ul = section.getElementsByTagName('ul')[0];
  ul.appendChild(li);
}

/**
 * Display other results
 * @param any ecoindexData
 * @param string tag
 * @returns null
 */
function setOtherResults(ecoindexData, tag) {
  const section = document.getElementById(`${tag}-results`);
  const data = ecoindexData[`${tag}-results`];

  if ((data?.length || 0) === 0) {
    return;
  }

  resetList(section);

  data.slice(-5).forEach((ecoindex) => {
    makeList(section, ecoindex);
  });

  section.style.display = 'block';
}

async function updateLocalStorage(value) {
  const date = new Date();
  const tomorrow = date.setDate(date.getDate() + 1);
  await currentBrowser.storage.local.set({
    [tabUrl]: {
      color: value.color,
      text: value.grade,
      expirationTimestamp: tomorrow,
    },
  });
}

/**
 * Display the result of the analysis using data from the API
 * @param any ecoindexData results from the BFF API
 */
function displayResult(ecoindexData) {
  const latestResult = ecoindexData['latest-result'];
  if (latestResult.id !== '') {
    const dateResultElement = document.getElementById('result-date');
    dateResultElement.textContent = convertDate(latestResult.date);

    domTitle.textContent = 'Résultat pour cette page';
    domTitle.style.display = 'block';

    const activeLevelChart = document.querySelector(`[data-grade-result="${latestResult.grade}"]`);
    activeLevelChart.classList.add('--active');

    const resultScore = document.getElementById('result-score');
    resultScore.textContent = latestResult.score;

    const resultLink = document.getElementById('result-link');
    resultLink.setAttribute('href', `${ecoindexUrl}/resultat/?id=${latestResult.id}`);

    document.getElementById('result').style.display = 'block';
    displayImage(latestResult.id);
    updateLocalStorage(latestResult);
  }

  if (ecoindexData['older-results']?.length > 0 || ecoindexData['host-results']?.length > 0) {
    document.getElementById('other-results').style.display = 'block';
    setOtherResults(ecoindexData, 'older');
    setOtherResults(ecoindexData, 'host');
  }
}

/**
 * Update the popup with data from the API
 * @param any ecoindexData
 */
function updatePopup(ecoindexData) {
  if (ecoindexData.count === 0 && (ecoindexData['older-results']?.length || 0) === 0) {
    proposeAnalysis('Aucune analyse pour ce site');
  } else if (ecoindexData['latest-result'].id === '') {
    proposeAnalysis('Aucune analyse pour cette page');
  }

  displayResult(ecoindexData);
}

/**
 * Get data from the API and update the popup
 * @param string url
 */
function getAndUpdateEcoindexData(url) {
  fetch(`${apiUrl}/results/?refresh=true&url=${url}`)
    .then((r) => r.json())
    .then(updatePopup)
    .catch(handleApiError);
}

const fetchWithRetries = async (url, options, retryCount = 0) => {
  const { maxRetries = 30, ...remainingOptions } = options;
  fetch(url, remainingOptions)
    .then(async (r) => {
      if (retryCount < maxRetries && r.status === 425) {
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((t) => setTimeout(t, 2000));
        await fetchWithRetries(url, options, retryCount + 1);
      }

      return r.json();
    })
    .then((taskResult) => {
      if (taskResult === undefined) {
        return;
      }

      const ecoindex = taskResult.ecoindex_result;

      if (taskResult.status === 'SUCCESS' && ecoindex.status === 'SUCCESS') {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('no-analysis').style.display = 'none';

        getAndUpdateEcoindexData(tabUrl);
      }

      if (taskResult.status === 'SUCCESS' && ecoindex.status === 'FAILURE') {
        const e = taskResult.ecoindex_result.error;
        displayError(e.message, e.detail);
      }

      if (taskResult.status === 'FAILURE') {
        displayError("Erreur lors de l'analyse de la page", taskResult.task_error);
      }
    })
    .catch(async (err) => {
      if (retryCount < maxRetries && err.status === 425) {
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 2000));
        await fetchWithRetries(url, options, retryCount + 1);
      }

      displayError('Erreur lors de l\'analyse de la page', err);
    });
};

/**
 * Reset the display
 * @returns null
 */
function resetDisplay() {
  document.getElementById('loader').style.display = 'none';
  document.getElementById('title').style.display = 'none';
  document.getElementById('no-analysis').style.display = 'none';
  document.getElementById('result').style.display = 'none';
  document.getElementById('screenshot').style.display = 'none';
  document.getElementById('other-results').style.display = 'none';
  document.getElementById('older-results').style.display = 'none';
  document.getElementById('host-results').style.display = 'none';
  document.getElementById('error').style.display = 'none';
}

/**
 * Call the API to run an analysis
 */
async function runAnalysis() {
  resetDisplay();
  document.getElementById('loader').style.display = 'block';

  fetch(`${apiUrl}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: tabUrl,
    }),
  })
    .then((r) => r.json())
    .then(async (id) => {
      await fetchWithRetries(`${apiUrl}/tasks/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });
    });
}

resetDisplay();

document.querySelector('#no-analysis button').addEventListener('click', runAnalysis);
document.getElementById('retest').addEventListener('click', runAnalysis);

currentBrowser.tabs.query({
  active: true,
  lastFocusedWindow: true,
}, (tabs) => {
  tabUrl = tabs[0].url;

  getAndUpdateEcoindexData(tabUrl);
});
