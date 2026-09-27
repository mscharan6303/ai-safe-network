
(function() {
    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest.prototype.open;
    const originalSendBeacon = navigator.sendBeacon;

    // Hook Fetch
    window.fetch = async function(...args) {
        let url = args[0];
        if (typeof url === 'string') {
             // Send for analysis
             checkNetworkRequest(url, 'fetch');
        }
        return originalFetch.apply(this, args);
    };

    // Hook XHR
    window.XMLHttpRequest.prototype.open = function(method, url) {
        if (typeof url === 'string') {
            checkNetworkRequest(url, 'xhr');
        }
        return originalXHR.apply(this, arguments);
    };

    // Hook Beacon
    navigator.sendBeacon = function(url, data) {
         if (typeof url === 'string') {
            checkNetworkRequest(url, 'beacon');
        }
        return originalSendBeacon.apply(this, arguments);
    };

    function checkNetworkRequest(url, type) {
        // We act on the assumption that content.js will listen to this custom event
        window.dispatchEvent(new CustomEvent('ai_guard_net_request', { 
            detail: { url: url, type: type } 
        }));
    }

})();
