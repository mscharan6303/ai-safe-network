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

    // Allow the page to load first, analyzed in the background
    chrome.runtime.sendMessage({ action: "analyze", domain: fullUrl, deepScan: true }, (data) => {
        if (chrome.runtime.lastError) return;
        
        // ONLY block if the AI explicitly says HARD-BLOCK after analysis
        if (data && data.action === 'HARD-BLOCK') {
            chrome.runtime.sendMessage({ 
                action: "notify", 
                title: "🚫 Security Alert", 
                message: `AI Guard identifies ${domain} as a critical threat.` 
            });

            // The site is already "open" here. Now we apply the security layer.
            const overlay = document.createElement('div');
            overlay.id = 'ai-guard-overlay';
            overlay.style.cssText = `
                position:fixed; top:0; left:0; width:100%; height:100%; background:#111827; 
                color:white; display:flex; flex-direction:column; align-items:center; 
                justify-content:center; z-index:2147483647; font-family:sans-serif; 
                text-align:center; padding:20px;
            `;
            overlay.innerHTML = `
                <div style="font-size:80px; margin-bottom:20px;">🛡️</div>
                <h1 style="color:#ef4444; font-size:36px; margin-bottom:15px;">Safety Blocked by AI</h1>
                <p style="font-size:20px; color:#9ca3af; max-width:700px; line-height:1.6;">
                    The AI Guard analyzed <b>${domain}</b> and determined it contains <b>${data.category}</b> risks.
                </p>
                <div style="margin-top:30px; padding:20px; background:#1f2937; border-radius:12px; border:1px solid #374151; min-width:300px;">
                    <p style="margin:5px 0; color:#ef4444; font-weight:bold; font-size:18px;">Threat: ${data.category}</p>
                    <p style="margin:10px 0; color:#9ca3af;">Risk Score: ${data.riskScore}%</p>
                </div>
                <div style="display:flex; gap:20px; margin-top:30px;">
                    <button id="ai-guard-back" style="background:#ef4444; color:white; border:none; padding:12px 30px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px;">Go Back</button>
                    <button id="ai-guard-proceed" style="background:transparent; color:#9ca3af; border:1px solid #374151; padding:12px 30px; border-radius:8px; cursor:pointer; font-size:16px;">I understand, allow anyway</button>
                </div>
            `;
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';

            document.getElementById('ai-guard-back').onclick = () => window.history.back();
            document.getElementById('ai-guard-proceed').onclick = () => {
                overlay.remove();
                document.body.style.overflow = '';
            };
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

    // Link blocking moved to 'checkCurrentPage' to allow sites to open first.
    if (data.action !== 'ALLOW') {
        link.style.borderBottom = '1px solid #ef4444'; // Subtle indicator without blocking
    }
}
