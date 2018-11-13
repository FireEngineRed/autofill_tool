/*
 * Add page match rules on install
 * 
 * When the url contains (fireworkscrm) or (pull-requests and the page contains
 * the PR description field), then we enable the extension icon
 */
chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { urlContains: 'fireworkscrm.' },
                    }),
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { pathContains: 'pull-requests' },
                        css: ["textarea[id='pull-request-description']"]
                    })
                ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }
        ]);
    });
});

// /*
//  * Send message to the page script to manually fill in 
//  * the PR template text
//  */
// chrome.pageAction.onClicked.addListener(() => {
//     // chrome.tabs.executeScript(null, { file: 'fill.js' });
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       chrome.tabs.sendMessage(tabs[0].id, {
//         action: 'forceFillTemplate',
//         value: true,
//       });
//     });
//   });