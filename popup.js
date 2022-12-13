const ecoindexUrl = "https://www.ecoindex.fr/";
const apiUrl = "http://ecoindex-badge.lebondeveloppeur.fr";
var tabUrl;

const badgeSvg = document.getElementById("badge-svg");
const badgeTitle = document.getElementById("badge-title");
const badgeGrade = document.getElementById("badge-grade");
const badgeLink = document.getElementById("badge-link");
const badgeColor = document.getElementById("badge-color");
const olderResults = document.getElementById("older-results");
const hostResults = document.getElementById("host-results");
const noAnalyzis = document.getElementById("no-analyzis");
const noAnalyzisMessage = noAnalyzis.getElementsByTagName("p")[0]

chrome.tabs.query({
    active: true,
    lastFocusedWindow: true
}, function (tabs) {
    tabUrl = tabs[0].url;

    fetch(apiUrl + "?url=" + tabUrl)
        .then(r => r.json())
        .then(updatePopup)
        .catch(console.error.bind(console));
});

noAnalyzis.getElementsByTagName("button")[0].addEventListener("click", openNewTabEcoindex)

function openNewTabEcoindex() {
    chrome.tabs.create({ url: ecoindexUrl });
    return false;
}

function updatePopup(ecoindexData) {
    if (ecoindexData["count"] === 0 && (ecoindexData["older-results"]?.length || 0) === 0) {
        proposeAnalysis("Aucune analyse pour ce site")
    } else if (ecoindexData["latest-result"]["id"] === "") {
        proposeAnalysis("Aucune analyse pour cette page")
    } else {
        setBadge(ecoindexData["latest-result"])
        showElement(badgeSvg)
    }

    setSection(olderResults, ecoindexData["older-results"], "older")
    setSection(hostResults, ecoindexData["host-results"], "host")
}

function proposeAnalysis(message) {
    noAnalyzisMessage.innerHTML = message;
    showElement(noAnalyzis);
}

function setBadge(ecoindex) {
    badgeSvg.ariaLabel = "ECOINDEX: " + ecoindex["grade"]
    badgeTitle.innerHTML = ecoindex["score"] + " / 100 au " + ecoindex["date"]
    badgeLink.setAttribute("href", ecoindexUrl + "resultat?id=" + ecoindex["id"])
    badgeGrade.innerHTML = ecoindex["grade"]
    badgeColor.setAttribute("fill", ecoindex["color"])
}

function setSection(section, data, tag) {
    if ((data?.length || 0) === 0) {
        return
    }

    var summary = section.getElementsByTagName("summary")[0]
    var title = data.length + " autres résultats"

    switch (tag) {
        case "older":
            title += " pour cette page"
            break;

        case "host":
            title += " sur ce site"
            break;
    }

    summary.innerHTML = title

    data.forEach(ecoindex => {
        makeList(section, ecoindex)
    });
    showElement(section)
}

function makeList(section, ecoindex) {
    var ul = section.getElementsByTagName("ul")[0]
    var li = document.createElement("li");
    const title = "<b style='color:" + ecoindex['color'] + "';>" + ecoindex["grade"] + "</b>"
    var link = document.createElement("a")
    link.setAttribute("href", ecoindexUrl + "/resultat/?id=" + ecoindex["id"])
    link.innerHTML = title
    link.setAttribute("title", "(" + ecoindex["score"] + " / 100) le " + ecoindex["date"])
    li.appendChild(link);

    var text = document.createElement("span")
    text.innerHTML = " : " + ecoindex["url"]
    li.appendChild(text)

    ul.appendChild(li);
}

function showElement(element) {
    element.style.display = "block";
}
