chrome.contextMenus.create({
    type: 'normal',
    title: '5000兆',
    contexts: ['selection'],
    onclick(info, tab){
        chrome.tabs.executeScript(tab.id!, {
            file: 'dist/page.js',
        });
    },
});
