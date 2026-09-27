const getBackendUrl = (callback) => {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['backendUrl'], (result) => {
      callback(result.backendUrl || 'http://localhost:3000');
    });
  } else {
    callback('http://localhost:3000');
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkStatus") {
    getBackendUrl((backendUrl) => {
      fetch(`${backendUrl}/api/status`)
        .then(res => res.json())
        .then(data => sendResponse(data))
        .catch(err => {
          console.error("Status check failed", err);
          sendResponse({ active: false, error: err.toString() });
        });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === "analyze") {
    getBackendUrl((backendUrl) => {
      fetch(`${backendUrl}/api/analyze`, {
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
