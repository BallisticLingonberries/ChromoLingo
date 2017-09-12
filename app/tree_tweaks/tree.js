"use strict";

console.log("Injecting tree hacks");

var root, observer, buttonsDiv, observerTimeout;

const retryInterval = window.setInterval(initialize, 1500);

// Functions

function initialize() {
    console.log("Checking for store button");
    const storeButton = getStoreButton();
    if (!storeButton) return;
    window.clearInterval(retryInterval);

    root = document.getElementById("root");
    observer = new MutationObserver(refreshTree);

    chrome.runtime.onMessage.addListener(refreshTree);

    initializeButtons(storeButton);
    refreshTree();
}

function initializeButtons(storeButton) {
    buttonsDiv = document.createElement("div");
    buttonsDiv.id = "cl-tree-mods";

    const hideGoldButton = storeButton.cloneNode();
    hideGoldButton.id = "hide_gold";
    hideGoldButton.removeAttribute("data-test");
    hideGoldButton.setAttribute("href", "javascript:void(0);");

    const titleSpan = document.createElement("span"),
        iconSpan = document.createElement("span"),
        flipTreeButton = hideGoldButton.cloneNode(),
        hideLockedButton = hideGoldButton.cloneNode();

    titleSpan.innerText = "Flip Tree";
    iconSpan.id = "cl-icon-arrow";
    flipTreeButton.id = "flip_tree";
    hideLockedButton.id = "hide_locked";

    flipTreeButton.appendChild(iconSpan);
    flipTreeButton.appendChild(titleSpan);

    [flipTreeButton, hideGoldButton, hideLockedButton].forEach(wireButton);

    // Functions

    function wireButton(button) {
        button.addEventListener("click", handleButtonClick);
        buttonsDiv.appendChild(button);
    }

    function handleButtonClick() {
        const id = this.id,
            toggle = !root.classList.contains(id);

        chrome.storage.sync.set({ [id]: toggle });
    }
}

function refreshTree() { // Called frequently; do not nest functions
    const storeButton = getStoreButton();
    if (!storeButton) return;

    stopObserver();
    classifyAllSkillParents();

    if (!storeButton.getAttribute("data-hooked")) {
        storeButton.parentElement.appendChild(buttonsDiv);
        storeButton.setAttribute("data-hooked", true);
    }

    matchRootClassesToAllSettings();
    startObserver();
}

function getStoreButton() {
    return document.querySelector("[data-test=lingot-store-button]");
}

function classifyAllSkillParents() {
    Array.from(document.querySelector("[data-test=skill-tree]").children).forEach(classifyParent);
}

function classifyParent(parentGroup) {
    parentGroup.classList.toggle("gold-only", parentGroup.querySelectorAll("[data-test~=gold]").length === parentGroup.children.length);
    parentGroup.classList.toggle("locked", !parentGroup.querySelector("a") || !!parentGroup.querySelector("[data-test=test-out-button]"));
}

function matchRootClassesToAllSettings() {
    chrome.storage.sync.get(["hide_locked", "hide_gold", "flip_tree"], gotSettingValues);
}

function gotSettingValues(settings) {
    for (let setting in settings) {
        if (!settings.hasOwnProperty(setting)) continue;

        matchRootClassToSetting(setting, settings[setting]);
    }
}

function matchRootClassToSetting(className, val) {
    root.classList.toggle(className, val);
    console.log("Update class", className, val);
}

function startObserver() {
    if (!observer) return;

    window.clearTimeout(observerTimeout);

    observerTimeout = window.setTimeout(observe, 500);
}

function observe() {
    observer.observe(root,
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