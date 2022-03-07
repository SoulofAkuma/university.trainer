function removeInvalid(el) {
    if (el.classList.contains("is-invalid")) el.classList.remove("is-invalid");
}
function addInvalid(el) {
    if (!el.classList.contains("is-invalid")) el.classList.add("is-invalid");
}
function addValid(el) {
    if (!el.classList.contains("is-valid")) el.classList.add("is-valid");
}
function removeValid(el) {
    if (el.classList.contains("is-valid")) el.classList.remove("is-valid");
}
/**
 * Returns the html element found by the given selector
 * @param {string} selector the selector of the element
 * @returns {HTMLElement}
 */
function $(selector) {
    return document.querySelector(selector);
}

let blacklist = ["ul"];
let topic = $("#topic");
let loadTopic = $("#loadTopic");
let resetTopic = $("#resetTopic");
let nextLine = $("#nextLine");
let undoLine = $("#undoLine");
let topicContent = $("#topicContent");

let converter = new showdown.Converter({
    literalMidWordUnderscores: true,
    literalMidWordAsterisks: true
});
let currentStep = {
    val: 0,
    get v() {
        return this.val;
    },
    set v(value) {
        this.val = value;
        window.history.pushState(value, "Trainer - " + topicname, "/app/" + topicname + "/" + value.toString());
    }
};
let maxStep = -1;

let headers = new Headers();
headers.append("pragma", "no-cache");
headers.append("Cache-Control", "no-cache");

let topics = [];

let url = "";
let topicname = "";
let currentHash = "";
let isReload = false;

let autocomplete = new autoComplete({
    selector: "#topic",
    placeHolder: "Search for a topic",
    data: {
        src: getTopics,
        cache: false
    },
    resultsList: {
        tabSelect: true,
        element: (list, data) => {
            if (!data.results.length) {
                let msg = document.createElement("div");
                msg.setAttribute("class", "no_result");
                msg.innerHTML = `<span>No topic named "${data.query}"</span>`
                list.prepend(msg);
            }
        },
        noResults: true,
    },
    resultItem: {
        highlight: true
    },
    events: {
        input: {
            selection: (e) => {
                topic.value = e.detail.selection.value;
            }
        }
    }
});

async function reloadTopic() {
    topicContent.style.minHeight = topicContent.scrollHeight.toString() + "px";
    isReload = true;
    await loadTopicProcess(null, currentStep.v, topicname);
    isReload = false;
    topicContent.style.minHeight = "";
}

function fetchTopics() {
    fetch("http://localhost:8181/api/topics", {
        method: "get",
        headers: headers
    })
    .then(response => response.json())
    .then(response => {
        topics = response;
    });
}

async function checkTopic() {
    updateInProgress = true;
    if (url !== "" && topicname !== "" && currentHash !== "") {
        let wasMax = currentStep.v >= maxStep;
        let reloaded = false;
        await fetch("http://localhost:8181/api/status/" + topicname + ".md/" + currentHash, {
            method: "get"
        })
        .then(response => response.status)
        .then(response => {
            if (response === 205) {
                reloaded = true;
                iziToast.info({
                    title: 'File Changed',
                    message: 'Initiating reload because of modified file!',
                    timeout: 3000,
                });
                return reloadTopic();
            }
            return null;
        })
        .then(() => {
            while (reloaded && wasMax && topicNext()) {};
        })
        .catch(err => {
            
        });
    }
    updateInProgress = false;
}

async function getTopics() {
    return topics;
}

// fetchTopics();
let manualChange = false;
let updateInProgress = false;
// let rep = setInterval(fetchTopics, 4000);
// let updateInt = setInterval(() => {
//     if (!updateInProgress) checkTopic();
// }, 1000);
let refreshTopics = null;
let topicStatus = null;
async function setupRefreshTopics() {
    refreshTopics = new WebSocket("ws://localhost:8181/ws/topiclist");
    await new Promise((res, rej) => {
        refreshTopics.onopen = () => {res()};
        refreshTopics.onerror = () => {rej()};
    });
    refreshTopics.onmessage = (e) => {
        topics = JSON.parse(e.data).topics;
    }
    refreshTopics.onclose = (e) => {
        setTimeout(() => {
            setupRefreshTopics();
        }, 1000);
    }
}
async function setupTopicStatus() {
    topicStatus = new WebSocket("ws://localhost:8181/ws/topicstatus");
    await new Promise((res, rej) => {
        topicStatus.onopen = () => {res()};
        topicStatus.onerror = () => {rej()};
    });
    topicStatus.onmessage = (e) => {
        let msg = JSON.parse(e.data);
        if (msg.status === "outdated") {
            let wasMax = currentStep.v >= maxStep;
            iziToast.info({
                title: 'File Changed',
                message: 'Reloading topic because of modified file!',
                timeout: 3000,
            });
            reloadTopic().then(() => {
                if (wasMax) while (topicNext()) {};
            });
        }
    }
    topicStatus.onclose = (e) => {
        setTimeout(() => {
            setupTopicStatus();
            setTimeout(() => {
                topicStatus.send(JSON.stringify({
                    topic: topicname + ".md",
                    hash: currentHash
                }));
            }, 750)
        }, 1500);
    }
}

async function loadTopicProcess(e, startAt = false, explicitTopic = topic.value) {
    url = "http://localhost:8181/md/" + explicitTopic + ".md";
    let preTopicName = explicitTopic;
    await fetch(url, {
        method: "get",
        headers: headers
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        }
        throw new Error("Topic Not Found!");
    })
    .then(response => {
        topicname = preTopicName;
        currentHash = CryptoJS.SHA256(response).toString(CryptoJS.enc.Hex);

        topicStatus.send(JSON.stringify({
            topic: preTopicName + ".md",
            hash: currentHash
        }));
        
        manualChange = true;
        window.history.pushState("", "Trainer - " + preTopicName, "/app/" + preTopicName);
        setTimeout(() => {manualChange = false}, 50);

        removeInvalid(topic);
        addValid(topic);
        currentStep.v = 0;
        while (topicContent.firstChild) {
            topicContent.lastChild.remove();
        }

        let html = converter.makeHtml(response);
        let tmp = document.createElement("div");

        let counter = 0;
        tmp.innerHTML = html;
        let exploreChildren = (el) => {
            for (let node of el.childNodes) {
                if (node.nodeType === node.ELEMENT_NODE && blacklist.indexOf(node.tagName.toLowerCase()) == -1) {
                    node.setAttribute("id", "topic-line-" + (counter++).toString());
                    node.classList.add("d-none");
                }
                if (el.childNodes.length > 0) exploreChildren(node);
            }
        }
        exploreChildren(tmp);
        maxStep = counter - 1;
        topicContent.innerHTML = tmp.innerHTML;
        window.MathJax.typeset();
        topic.blur();
        if (startAt !== false) {
            jumpTo(startAt)
        }
        if (isReload) {
            iziToast.success({
                title: 'Reloaded',
                message: 'Topic successfully reloaded!',
                timeout: 3000,
            });
        } else {
            iziToast.success({
                title: 'Loaded',
                message: 'Topic successfully loaded!',
                timeout: 3000,
            });
        }
    })
    .catch(err => {
        console.log(err);
        topicname = "";
        url = "";
        currentHash = "";
        iziToast.error({
            title: 'Unknown Topic',
            message: 'The entered topic could not be found!',
            timeout: 3000,
        });
        removeValid(topic);
        addInvalid(topic);
    });
}

function jumpTo(ind) {
    if (ind < currentStep.v) {
        for (; currentStep.v > Math.max(ind, 0); currentStep.val--) {
            document.getElementById("topic-line-" + (currentStep.val - 1).toString()).classList.add("d-none");
            window.scrollTo({
                top: document.documentElement.scrollHeight - document.documentElement.clientHeight,
                behavior: "smooth"
            });
        }
    } else {
        for (; currentStep.v < Math.min(ind, maxStep + 1); currentStep.val++) {
            document.getElementById("topic-line-" + (currentStep.val).toString()).classList.remove("d-none");
            window.scrollTo({
                top: document.documentElement.scrollHeight - document.documentElement.clientHeight,
                behavior: "smooth"
            });
        }
    }
    currentStep.v = currentStep.val;
}

function topicNext() {
    if (currentStep.v <= maxStep) {
        document.getElementById("topic-line-" + (currentStep.v++).toString()).classList.remove("d-none");
        window.scrollTo({
            top: document.documentElement.scrollHeight - document.documentElement.clientHeight,
            behavior: "smooth"
        });
        return true;
    }
    return false;
}

function topicPrev() {
    if (currentStep.v > 0) {
        document.getElementById("topic-line-" + (--currentStep.v).toString()).classList.add("d-none");
        window.scrollTo({
            top: document.documentElement.scrollHeight - document.documentElement.clientHeight,
            behavior: "smooth"
        });
    }
}

function resetTopicProcess() {
    for (; currentStep.v > 0; currentStep.v--) {
        document.getElementById("topic-line-" + (currentStep.v - 1).toString()).classList.add("d-none");
    }
}

loadTopic.addEventListener("click", loadTopicProcess);
topic.addEventListener("input", () => {
    removeValid(topic);
    removeInvalid(topic);
});
document.addEventListener("keydown", (e) => {
    if (!e.target.matches("input") && (e.key === "Enter" || (e.key === "z" && e.ctrlKey) || (e.key === "z" && e.altKey) || (e.key === "r" && e.ctrlKey))) {
        if (!e.target.matches("input") && e.key === "Enter") topicNext();
        if (!e.target.matches("input") && e.key === "z" && e.ctrlKey) topicPrev();
        if (!e.target.matches("input") && e.key === "r" && e.ctrlKey) {
            reloadTopic();
        }
        if (!e.target.matches("input") && e.key === "z" && e.altKey) resetTopicProcess();
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
});
topic.addEventListener("keydown", (e) => {
    if (e.key === "Enter") setTimeout(() => {loadTopicProcess();}, 100);
});
resetTopic.addEventListener("click", resetTopicProcess);
nextLine.addEventListener("click", topicNext);
undoLine.addEventListener("click", topicPrev);

async function startup() {
    await setupRefreshTopics();
    await setupTopicStatus();
    let pathParams = /\/app\/([a-zA-Z0-9-_+\.]+)(\/([0-9]+))?/;
    let matches = pathParams.exec(window.location.pathname)
    if (matches) {
        topic.value = matches[1];
        if (matches[3]) {
            loadTopicProcess(null, parseInt(matches[3]));
        } else {
            loadTopicProcess();
        }
    }
} 

let startupWait = setInterval(() => {
    if (window.mathJaxReady) {
        clearInterval(startupWait);
        startup();
    } 
}, 100)

window.addEventListener("popstate", (e) => {
    jumpTo(e.state);
});