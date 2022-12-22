/* eslint-disable no-console */
const ecoindexUrl = 'https://www.ecoindex.fr/';
const apiUrl = 'https://ecoindex-badge.lebondeveloppeur.fr';
let tabUrl;
const domTitle = document.getElementById('title');

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
    .then((response) => response.blob())
    .then((imageBlob) => {
      const screenshot = document.getElementById('screenshot');
      screenshot.setAttribute('src', URL.createObjectURL(imageBlob));
      screenshot.style.display = 'block';
    })
    .catch(handleApiError);
}

/**
 * Display the result of the analysis using data from the API
 * @param any ecoindex
 */
function displayResult(ecoindex) {
  const dateResultElement = document.getElementById('result-date');
  dateResultElement.textContent = convertDate(ecoindex.date);

  domTitle.textContent = 'Résultat pour cette page';

  const activeLevelChart = document.querySelector(`[data-grade-result="${ecoindex.grade}"]`);
  activeLevelChart.classList.add('--active');

  const resultScore = document.getElementById('result-score');
  resultScore.textContent = ecoindex.score;

  const resultLink = document.getElementById('result-link');
  resultLink.setAttribute('href', `${ecoindexUrl}resultat/?id=${ecoindex.id}`);

  document.getElementById('result').style.display = 'block';
  displayImage(ecoindex.id);
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

  const link = document.createElement('a');
  link.appendChild(b);
  link.setAttribute('href', `${ecoindexUrl}/resultat/?id=${ecoindex.id}`);
  link.setAttribute('target', '_blank');

  const li = document.createElement('li');
  li.style.listStyleType = 'none';
  li.setAttribute('title', `(${ecoindex.score} / 100) le ${convertDate(ecoindex.date)}`);
  li.appendChild(link);

  const text = document.createElement('span');
  text.textContent = ecoindex.url;
  text.style.paddingLeft = '5px';
  li.appendChild(text);

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

  data.slice(-5).forEach((ecoindex) => {
    makeList(section, ecoindex);
  });

  section.style.display = 'block';
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
  } else {
    displayResult(ecoindexData['latest-result']);
  }
  if (ecoindexData['older-results']?.length > 0 || ecoindexData['host-results']?.length > 0) {
    document.getElementById('other-results').style.display = 'block';
    setOtherResults(ecoindexData, 'older');
    setOtherResults(ecoindexData, 'host');
  }
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
        (document.getElementById('loader'));
        (document.getElementById('no-analysis'));
        // eslint-disable-next-line no-undef
        displayError({ id: taskResult.id, ...ecoindex.detail });
      }

      if (taskResult.status === 'SUCCESS' && ecoindex.status === 'FAILURE') {
        const e = taskResult.ecoindex_result.error;
        // eslint-disable-next-line no-undef
        displayError(e.message, e.detail);
      }

      if (taskResult.status === 'FAILURE') {
        // eslint-disable-next-line no-undef
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
 * Call the API to run an analysis
 */
async function runAnalysis() {
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

document.getElementById('run-analysis').addEventListener('click', runAnalysis);

// eslint-disable-next-line no-undef
chrome.tabs.query({
  active: true,
  lastFocusedWindow: true,
}, (tabs) => {
  tabUrl = tabs[0].url;

  fetch(`${apiUrl}?url=${tabUrl}`)
    .then((r) => r.json())
    .then(updatePopup)
    .catch(handleApiError);
});
