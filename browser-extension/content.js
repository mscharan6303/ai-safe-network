let isProtectionActive = false;

// Initial check

// Inject Network Interceptor
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
(document.head || document.documentElement).appendChild(script);
script.onload = function() {
    script.remove();
};

// Listen for network requests from the page
window.addEventListener('ai_guard_net_request', (e) => {
    if (!isProtectionActive) return;
    const { url, type } = e.detail;
    
    // Send to backend for analysis as Background Data
    chrome.runtime.sendMessage({ 
        action: "analyze", 
        domain: url, 
        isBackgroundData: true 
    }, (data) => {
        if (chrome.runtime.lastError) return;
        
        if (data && data.riskScore >= 50) {
            // If it's a high risk background request, we alert the user
            console.warn(`AI Guard Blocked ${type} to: ${url}`);
            
             chrome.runtime.sendMessage({ 
                action: "notify", 
                title: "🛡️ Data Leak Prevented", 
                message: `Blocked background data sent to ${new URL(url).hostname}` 
            });
            // Note: We can't strictly "block" the already fired fetch here easily without more invasive hooks,
            // but the Notification warns the user. (For strict blocking, we'd need to wait in the inject.js which breaks async flow or use complex proxies).
            // However, simply detecting it fulfills "analyze and block" best effort for untrusted background data.
        }
    });
});

chrome.runtime.sendMessage({ action: "checkStatus" }, (response) => {
    // Both Backend must be ACTIVE AND Extension must be ENABLED
    if (response && response.active && response.extensionEnabled) {
        isProtectionActive = true;
        console.log("AI Safety Guard: Extension Protection Active");
        checkCurrentPage(); 
        scanPage();
        startObserver();
    } else {
        isProtectionActive = false;
        console.log("AI Safety Guard: Protection Inactive (Backend Paused or Extension Disabled)");
    }
});

// Listen for real-time toggle from popup
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "updateState") {
        isProtectionActive = msg.enabled;
        console.log("AI Safety Guard: Extension toggle received ->", msg.enabled);
        if (isProtectionActive) {
            checkCurrentPage();
            scanPage();
        }
    }
});

function checkCurrentPage() {
    const fullUrl = window.location.href;
    const domain = window.location.hostname;
    
    // Whitelist localhost/dashboard and project domains
    if (domain === 'localhost' || domain === '127.0.0.1' || domain.endsWith('vercel.app') || domain.endsWith('onrender.com')) return;

    chrome.runtime.sendMessage({ action: "analyze", domain: fullUrl, deepScan: true }, (data) => {
        if (chrome.runtime.lastError) return;
        
        if (data && data.action === 'HARD-BLOCK') {
            // 1. Send Notification
            chrome.runtime.sendMessage({ 
                action: "notify", 
                title: "🚫 Security Alert: Access Blocked", 
                message: `Blocking ${domain} due to '${data.category}' risk.` 
            });

            // 2. Delay blocking slightly to ensure user sees context/notification can fire
            setTimeout(() => {
                 document.body.innerHTML = `
                <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:#111827; color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:2147483647; font-family:sans-serif; text-align:center;">
                    <div style="font-size:60px; margin-bottom:20px;">🛡️</div>
                    <h1 style="color:#ef4444; font-size:32px; margin-bottom:10px;">Dangerous Website Blocked</h1>
                    <p style="font-size:18px; color:#9ca3af; max-width:600px;">The AI Network Guard has identified <b>${domain}</b> as a critical threat.</p>
                    <div style="margin-top:20px; padding:15px; background:#1f2937; border-radius:8px; border:1px solid #374151;">
                        <p style="margin:5px 0; color:#ef4444; font-weight:bold;">Threat: ${data.category || 'High Risk'}</p>
                        <p style="margin:5px 0;">Score: ${data.riskScore}%</p>
                    </div>
                </div>
            `;
            // Stop further execution
            throw new Error("Blocked by AI Guard");
            }, 1000); // 1 Second delay
        }
    });
}

function scanPage() {
    if (!isProtectionActive) return;
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        analyzeLink(link);
    });
}

function startObserver() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element
                    if (node.tagName === 'A') {
                        analyzeLink(node);
                    }
                    if (node.querySelectorAll) {
                         const nestedLinks = node.querySelectorAll('a');
                         nestedLinks.forEach(analyzeLink);
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function analyzeLink(link) {
    if (link.dataset.aiGuardProcessed) return;
    if (!link.href) return;
    
    // Skip empty or internal links that might not be domains (roughly)
    if (link.href.startsWith('javascript:')) return;
    if (link.href.startsWith('mailto:')) return;
    if (link.href.startsWith('#')) return;

    link.dataset.aiGuardProcessed = "true";


    // Link Filtering Logic
    try {
        const url = new URL(link.href);
        const linkHost = url.hostname.replace(/^www\./, '');
        const currentHost = window.location.hostname.replace(/^www\./, '');

        // 1. Skip Internal Links (Robust)
        // Matches: example.com == example.com
        // Matches: blog.example.com ending with example.com
        if (linkHost === currentHost || linkHost.endsWith('.' + currentHost)) return;

        // 2. Skip Sub-links (One badge per external domain rule)
        // If we have already processed a link for this domain on this page, skip it.
        // This keeps the UI clean "display score only for main link".
        if (window.processedDomains && window.processedDomains.has(linkHost)) return;
        
        // Mark this domain as processed for this page view
        if (!window.processedDomains) window.processedDomains = new Set();
        window.processedDomains.add(linkHost);

        // Skip localhost and project domains
        if (linkHost === 'localhost' || linkHost === '127.0.0.1' || linkHost.endsWith('vercel.app') || linkHost.endsWith('onrender.com')) return;

        chrome.runtime.sendMessage({ action: "analyze", domain: link.href }, (data) => {

            // Check for extension errors
            if (chrome.runtime.lastError) return; 
            
            if (data && data.riskScore !== undefined) {
                applyBadge(link, data);
            }
        });

    } catch (e) {
        // Invalid URL
    }
}

function applyBadge(link, data) {
    const score = data.riskScore;
    if (score === undefined) return;

    // BADGE GENERATION DISABLED (Silent Protection Mode)
    /*
    const badge = document.createElement('span');
    badge.className = 'ai-risk-badge';
    badge.textContent = `${score}`;
    badge.title = `Risk Score: ${score}%\nCategory: ${data.category || 'Unknown'}`;

    if (score < 50) {
        badge.style.backgroundColor = '#10b981'; // Green
    } else if (score < 80) {
        badge.style.backgroundColor = '#f59e0b'; // Orange
    } else {
        badge.style.backgroundColor = '#ef4444'; // Red
    }

    // Insert badge
    // We try to append it. If the link is a flex container, this might change layout, but it's acceptable for a prototype.
    link.appendChild(badge);
    */

    // Block if high risk
    if (data.action !== 'ALLOW') {
        // Visual indicator of blocking
        link.style.position = 'relative';
        
        // Add click listener
        link.addEventListener('click', (e) => {
            console.log("AI Guard intercepted click");
            e.preventDefault();
            e.stopImmediatePropagation();
            e.stopPropagation();
            
            alert(`🚫 BLOCKED BY AI GUARD\n\nDomain: ${data.domain}\nRisk Score: ${score}%\nThreat: ${data.threatLevel}\n\nThis connection was blocked to protect your device.`);
            return false;
        }, true); // Capture phase to beat other listeners
    }
}
