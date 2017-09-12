chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.create(getMenuItem("launch_practice", "Launch Practice", "normal"));
    chrome.contextMenus.create(getMenuItem("sep1", "Separator", "separator"));

    const ids = ["flip_tree", "hide_gold", "hide_locked"],
        titles = ["Flip Tree", "Hide Gold Skills", "Hide Locked Skills"];

    for (let i = 0, l = ids.length; i < l; i++) {
        chrome.contextMenus.create(getMenuItem(ids[i], titles[i], "checkbox"));
    }

   // chrome.contextMenus.create(getMenuItem("sep2", "Separator", "separator"));
    chrome.contextMenus.create(getMenuItem("hide_stickied", "Hide Stickied Posts", "checkbox"));
});

function getMenuItem(id, title, type) {
    return {
        "contexts": ["all"],
        "documentUrlPatterns": ["*://*.duolingo.com/*"],
        "id": id,
        "title": title,
        "type": type
    };
}

chrome.runtime.onStartup.addListener(function() {
    chrome.storage.sync.get(["flip_tree", "hide_gold", "hide_locked"],
        function(settings) {
            for (let setting in settings) {
                if (!settings.hasOwnProperty(setting)) continue;

                chrome.contextMenus.update(setting, { "checked": settings[setting] });
            }
        });
});

chrome.contextMenus.onClicked.addListener(function(info) {
    switch (info.menuItemId) {
        case "launch_practice":
            launchPractice();
            break;
        case "sep1":
            break;
        default:
            setSetting(info.menuItemId, info.checked);
    }
});

chrome.storage.onChanged.addListener(function(setting) {
    console.log("Setting changed", setting);

    const settingName = Object.keys(setting)[0],
        newValue = setting[settingName]["newValue"];

    chrome.contextMenus.update(settingName, { "checked": newValue });

    chrome.tabs.query({
        url: "*://*.duolingo.com/*"
    }, sendMessageToTabs);
});

function sendMessageToTabs(tabs) {
    tabs.forEach(sendMessage);
}

function sendMessage(tab) {
    chrome.tabs.sendMessage(tab.id, { "reason": "settingsUpdated" });
}

chrome.commands.onCommand.addListener(function(command) {
    console.log("Command:", command);

    if (command.indexOf("toggle_") !== -1) {
        toggleSetting(command.replace("toggle_", ""));
    } else if (command === "launch_practice") {
        launchPractice();
    } else {
        console.log("Unknown command. How did this even happen?");
    }
});

function toggleSetting(setting) {
    chrome.storage.sync.get(setting, function(settings) {
        setSetting(setting, !settings[setting]);
    });
}

function setSetting(setting, value) {
    chrome.storage.sync.set({ [setting]: value });
}

function launchPractice() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const url = { "url": "https://www.duolingo.com/practice" }

        if (tabs[0].url.indexOf("duolingo") === -1) {
            chrome.tabs.query(url, function(tabs2) {
                if (tabs2.length) {
                    chrome.tabs.update(tabs2[0].id, { "active": true });
                } else {
                    chrome.tabs.create(url);
                }
            });
        } else {
            chrome.tabs.update(tabs[0].id, url);
        }
    });
}