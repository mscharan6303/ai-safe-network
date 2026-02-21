const statusEl = document.getElementById('status');
const toggleEl = document.getElementById('extension-toggle');

// 1. Load local state
chrome.storage.local.get(['extensionEnabled'], (result) => {
    // Default to true if not set
    const enabled = result.extensionEnabled !== false;
    toggleEl.checked = enabled;
});

// 2. Check Backend Status (Global)
chrome.runtime.sendMessage({ action: "checkStatus" }, (response) => {
    if (chrome.runtime.lastError) {
        statusEl.textContent = "Backend Offline";
        statusEl.className = "status inactive";
        return;
    }
    
    if (response && response.active) {
        statusEl.textContent = "Backend Active 🛡️";
        statusEl.className = "status active";
    } else {
        statusEl.textContent = "Backend Paused";
        statusEl.className = "status inactive";
    }
});

// 3. Handle Toggle Change
toggleEl.addEventListener('change', () => {
    const isEnabled = toggleEl.checked;
    chrome.storage.local.set({ extensionEnabled: isEnabled }, () => {
        console.log('Extension protection toggled:', isEnabled);
        
        // Notify background/content scripts to update immediately
        chrome.runtime.sendMessage({ action: "toggleExtension", enabled: isEnabled });
    });
});
