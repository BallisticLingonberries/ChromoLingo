"use strict";

console.log("Injecting forum hacks");

var app, hideStickiedButton, observer, observerTimeout;

const retryInterval = window.setInterval(initialize, 1000);

// Functions

function initialize() {
    const askQuestionButton = document.querySelector("#ask-question");
    if (!askQuestionButton) return;
    window.clearInterval(retryInterval);

    app = document.getElementById("app");
    observer = new MutationObserver(refreshTree);

    chrome.runtime.onMessage.addListener(refreshTree);

    initializeButton();
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
    console.log("Hide stickied clicked");

    chrome.storage.sync.set({ "hide_stickied": !app.classList.contains("hide_stickied") });
}

function refreshTree() { // Called frequently; do not nest functions
    const askQuestionButton = document.querySelector("#ask-question"),
        navTabs = document.querySelector(".nav-tabs"),
        commentsList = document.getElementById("comments");

    if (!askQuestionButton || !navTabs || !commentsList) return;
    stopObserver();

    if (!commentsList.getAttribute("data-hooked")) {
        askQuestionButton.parentElement.insertBefore(hideStickiedButton, navTabs);
        commentsList.setAttribute("data-hooked", true);
    }

    Array.from(commentsList.children).forEach(classifySticky, commentsList);

    matchAppClassesToAllSettings();
    startObserver();
}

function classifySticky(post) {
    post.classList.toggle("stickied", !!post.querySelector(".sticky-discussion-message"));
}

function matchAppClassesToAllSettings() {
    chrome.storage.sync.get(["hide_stickied"], gotSettingValues);
}

function gotSettingValues(settings) {
    for (let setting in settings) {
        if (!settings.hasOwnProperty(setting)) continue;

        matchappClassToSetting(setting, settings[setting]);
    }
}

function matchappClassToSetting(className, val) {
    app.classList.toggle(className, val);
    console.log("Update class", className, val);
}

function startObserver() {
    if (!observer) return;

    window.clearTimeout(observerTimeout);

    observerTimeout = window.setTimeout(observe, 500);
}

function observe() {
    observer.observe(app,
        {
            "subtree": true,
            "childList": true,
            "attributes": true,
            "characterData": true
        });
}

function stopObserver() {
    if (!observer) return;

    observer.disconnect();
}