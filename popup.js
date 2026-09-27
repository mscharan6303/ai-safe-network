chrome.runtime.sendMessage({ action: "checkStatus" }, (response) => {
    const el = document.getElementById('status');
    if (chrome.runtime.lastError) {
        el.textContent = "Error";
        el.className = "status inactive";
        return;
    }
    
    if (response && response.active) {
        el.textContent = "ACTIVE 🛡️";
        el.className = "status active";
    } else if (response) {
        el.textContent = "PAUSED ⏸️";
        el.className = "status inactive";
    } else {
        el.textContent = "Offline";
        el.className = "status inactive";
    }
});
