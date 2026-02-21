chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkStatus") {
    // 1. Check local extension state first
    chrome.storage.local.get(['extensionEnabled'], (result) => {
        const extensionEnabled = result.extensionEnabled !== false;
        
        // 2. Check backend state
        fetch('http://localhost:3000/api/status')
          .then(res => res.json())
          .then(data => {
            // Return BOTH local and backend status
            sendResponse({ active: data.active, extensionEnabled: extensionEnabled });
          })
          .catch(err => {
            sendResponse({ active: false, extensionEnabled: extensionEnabled, error: err.toString() });
          });
    });
    return true; 
  }

  if (request.action === "toggleExtension") {
      // Broadcast to all tabs so content scripts update their 'isProtectionActive' immediately
      chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
              chrome.tabs.sendMessage(tab.id, { action: "updateState", enabled: request.enabled }).catch(() => {});
          });
      });
      return false;
  }
  
  if (request.action === "analyze") {
    fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ domain: request.domain, source: 'extension', deepScan: request.deepScan })
    })
    .then(res => res.json())
    .then(data => sendResponse(data))
    .catch(err => {
      console.error("Analysis failed", err);
      sendResponse({ error: err.toString() });
    });
    return true; // Keep channel open
  }

  if (request.action === "notify") {
      chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon-128.png', // Fallback if no icon, but notification still works
          title: request.title,
          message: request.message,
          priority: 2
      });
      return false;
  }
});
