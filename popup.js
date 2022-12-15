const ecoindexUrl = "https://www.ecoindex.fr/";
const apiUrl = "https://ecoindex-badge.lebondeveloppeur.fr";
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
    noAnalyzisMessage.textContent = message;
    showElement(noAnalyzis);
}

function setBadge(ecoindex) {
    badgeSvg.ariaLabel = "ECOINDEX: " + ecoindex["grade"]
    badgeTitle.textContent = ecoindex["score"] + " / 100 au " + ecoindex["date"]
    badgeLink.setAttribute("href", ecoindexUrl + "resultat?id=" + ecoindex["id"])
    badgeGrade.textContent = ecoindex["grade"]
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

    summary.textContent = title

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

    console.log(li)

    var ul = section.getElementsByTagName("ul")[0]
    ul.appendChild(li);
}

function showElement(element) {
    element.style.display = "block";
}
