"use strict";

var hideStickiedButton, rehook, observer, observerTimeout;
const bd = document.body, retryInterval = window.setInterval(initialize, 1000);

function initialize() {
    console.log("forum.js: Checking for 'Ask Question' button.");

    const askQuestionButton = document.getElementById("ask-question");
    if (!askQuestionButton) return;
    window.clearInterval(retryInterval);

    initializeButton();
    observer = new MutationObserver(refreshTree);
    chrome.runtime.onMessage.addListener(refreshTree);
    refreshTree();
}

function initializeButton() {
    hideStickiedButton = document.createElement("button");
    hideStickiedButton.id = "hide_stickied";
    hideStickiedButton.className = "btn right";
    hideStickiedButton.innerText = "";
    hideStickiedButton.setAttribute("href", "javascript:void(0);");
    hideStickiedButton.addEventListener("click", handleHideStickiedClick);
}

function handleHideStickiedClick() {
    const toggle = !bd.classList.contains("hide_stickied");

    chrome.storage.sync.set({ "hide_stickied": toggle });
}

function refreshTree() {
    if (location.pathname.indexOf("comment") !== -1) {
        console.log("Pathname:", location.pathname);
        return;
    }

    const askQuestionButton = document.getElementById("ask-question"),
        navTabs = document.getElementsByClassName("nav-tabs")[0];
    if (!askQuestionButton || !navTabs) return;
    stopObserver();

    if (!askQuestionButton.getAttribute("data-hooked")) {
        askQuestionButton.parentElement.insertBefore(hideStickiedButton, navTabs);
        askQuestionButton.setAttribute("data-hooked", true);
        rehook = true;
    }

    chrome.storage.sync.get(["hide_stickied"], gotSettings);
}

function gotSettings(settings) {
    const hideStickied = settings["hide_stickied"];
    if (hideStickied) {
        setHiding(true);
        window.setTimeout(doHideStickied, 1000);
    } else {
        setHide(false);
        startObserver();
    }
}

function doHideStickied() {
    const comments = document.getElementsByClassName("list-discussion-item"),
        cL = comments.length,
        stickyComments = document.getElementsByClassName("sticky-discussion-message");

    for (let i = 0; i < cL; i++) {
        if (!classifySticky(comments[i])) {
            break;
        };
    }

    if (stickyComments.length + 5 >= cL) {
        window.scrollTo(0, bd.scrollHeight);
        window.setTimeout(doHideStickied, 1000);
        return;
    }

    if (rehook) {
        rehook = false;
        window.scrollTo(0, 0);
    }

    setHide(true);
    setHiding(false);
    startObserver();
}

function classifySticky(post) {
    const isSticky = !!post.getElementsByClassName("sticky-discussion-message").length,
        wasSticky = post.classList.contains("stickied");

    if (wasSticky !== isSticky) {
        post.classList.toggle("stickied");
        console.log("Marking post", post, "as sticky:", isSticky, "from previous:", wasSticky);
    }

    return isSticky;
}

function setHiding(hiding) {
    bd.classList.toggle("hiding", hiding);
}

function setHide(hide) {
    bd.classList.toggle("hide_stickied", hide);
}

function startObserver() {
    if (!observer) return;
    window.clearTimeout(observerTimeout);
    observerTimeout = window.setTimeout(observe, 500);
}

function observe() {
    observer.observe(bd,
        {
            "subtree": true,
            "childList": true,
            "attributes": true,
            "characterData": true
        });

    console.log("Started observer");
}

function stopObserver() {
    if (!observer) return;

    observer.disconnect();

    console.log("Stopped observer");
}