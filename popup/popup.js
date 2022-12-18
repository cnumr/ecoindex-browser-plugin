"use strict";

const ecoindexUrl = "https://www.ecoindex.fr/";
const apiUrl = "https://ecoindex-badge.lebondeveloppeur.fr";
var tabUrl;
var title = document.getElementById("title");

chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
}, function (tabs) {
    tabUrl = tabs[0].url;

    fetch(apiUrl + "?url=" + tabUrl)
        .then(r => r.json())
        .then(updatePopup)
        .catch(handleApiError);
});

document.getElementById("run-analysis").addEventListener("click", runAnalysis);

function handleApiError(error) {
    console.error(error);
    displayError("Une erreur est survenue en essayant de récupérer les données de l'API", error.message);
}

function updatePopup(ecoindexData) {
    if (ecoindexData["count"] === 0 && (ecoindexData["older-results"]?.length || 0) === 0) {
        proposeAnalysis("Aucune analyse pour ce site")
    } else if (ecoindexData["latest-result"]["id"] === "") {
        proposeAnalysis("Aucune analyse pour cette page")
    } else {
        displayResult(ecoindexData["latest-result"])
    }
    if (ecoindexData["older-results"]?.length > 0 || ecoindexData["host-results"]?.length > 0) {
        showElement(document.getElementById("other-results"))
        setOtherResults(ecoindexData, "older")
        setOtherResults(ecoindexData, "host")
    }
}

function proposeAnalysis(message) {
    const noAnalyzis = document.getElementById("no-analysis");
    title.textContent = message;
    showElement(noAnalyzis);
}

function displayResult(ecoindex) {
    const dateResult = new Date(ecoindex["date"])
    var dateResultElement = document.getElementById("result-date")

    dateResultElement.textContent = dateResult.toLocaleDateString("fr-FR", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });

    title.textContent = "Résultat pour cette page";

    var activeLevelChart = document.querySelector('[data-grade-result="' + ecoindex["grade"] + '"]')
    activeLevelChart.classList.add("--active")

    var resultScore = document.getElementById("result-score")
    resultScore.textContent = ecoindex["score"]

    var resultLink = document.getElementById("result-link")
    resultLink.setAttribute("href", ecoindexUrl + "resultat/?id=" + ecoindex["id"])

    var screenshot = document.getElementById("screenshot")
    screenshot.setAttribute("src", ecoindexUrl + "/screenshots/v1/" + ecoindex["id"] + ".webp")

    showElement(document.getElementById("result"));
}

function displayImage(id) {
    fetch(apiUrl + "/v1/ecoindexes/" + id + "/screenshot")
        .then(response => response.blob())
        .then(imageBlob => {
            var screenshot = document.getElementById("screenshot")
            screenshot.setAttribute("src", URL.createObjectURL(imageBlob))
            showElement(screenshot);
        });
}

function setOtherResults(ecoindexData, tag) {
    var section = document.getElementById(tag + "-results")
    var data = ecoindexData[tag + "-results"]

    if ((data?.length || 0) === 0) {
        return
    }

    data.forEach(ecoindex => {
        makeList(section, ecoindex)
    });

    showElement(section)
}

function makeList(section, ecoindex) {
    var b = document.createElement("button");
    b.style.backgroundColor = ecoindex["color"];
    b.style.color = "#FFF";
    b.style.padding = "10px";
    b.textContent = ecoindex["grade"];

    var link = document.createElement("a")
    link.appendChild(b);
    link.setAttribute("href", ecoindexUrl + "/resultat/?id=" + ecoindex["id"])
    link.setAttribute("target", "_blank");

    var li = document.createElement("li");
    li.style.listStyleType = "none";
    li.setAttribute("title", "(" + ecoindex["score"] + " / 100) le " + ecoindex["date"])
    li.appendChild(link);

    var text = document.createElement("span")
    text.textContent = ecoindex["url"]
    text.style.paddingLeft = "5px";
    li.appendChild(text)

    var ul = section.getElementsByTagName("ul")[0]
    ul.appendChild(li);
}

function showElement(element) {
    element.style.display = "block";
}

function hideElement(element) {
    element.style.display = "none";
}

async function runAnalysis() {
    showElement(document.getElementById("loader"));
    hideElement(document.getElementById("error"));

    fetch(apiUrl + "/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "url": tabUrl,
        }),
    })
        .then(r => r.json())
        .then(async id => {
            await fetchWithRetries(apiUrl + "/tasks/" + id, {
                headers: {
                    "Content-Type": "application/json",
                },
                method: "GET",
            });
        })
}


const fetchWithRetries = async (url, options, retryCount = 0) => {
    const { maxRetries = 30, ...remainingOptions } = options;
    fetch(url, remainingOptions)
        .then(async r => {
            if (retryCount < maxRetries && r.status === 425) {
                await new Promise(r => setTimeout(r, 2000));
                await fetchWithRetries(url, options, retryCount + 1);
            }

            return r.json();
        })
        .then(taskResult => {
            if (taskResult === undefined) {
                return
            }

            const ecoindex = taskResult.ecoindex_result;

            if (taskResult.status === "SUCCESS" && ecoindex.status === "SUCCESS") {
                hideElement(document.getElementById("loader"))
                hideElement(document.getElementById("no-analysis"))
                displayResult({ id: taskResult.id, ...ecoindex.detail });
            }

            if (taskResult.status === "SUCCESS" && ecoindex.status === "FAILURE") {
                const e = taskResult.ecoindex_result.error;
                displayError(e.message, e.detail);
            }

            if (taskResult.status === "FAILURE") {
                displayError("Erreur lors de l'analyse de la page", taskResult.task_error);
            }
        })
        .catch(async err => {
            if (retryCount < maxRetries && err.status === 425) {
                await new Promise(r => setTimeout(r, 2000));
                await fetchWithRetries(url, options, retryCount + 1);
            }

            throw err;
        });
}

function displayError(title, detail) {
    hideElement(document.getElementById("loader"))
    const errorTitle = document.querySelector("#error summary");
    const errorDetail = document.querySelector("#error code");
    errorDetail.textContent = detail;
    errorTitle.textContent = title;
    showElement(error);
}