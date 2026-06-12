chrome.action.onClicked.addListener(function(tab) {
    chrome.tabs.create({ url: 'viewer.html' });
});
