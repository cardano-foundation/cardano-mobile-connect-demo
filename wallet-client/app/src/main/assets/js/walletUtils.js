/**
 * Wallet Utilities - Helper functions for wallet operations
 * This file contains utility functions used by the main wallet core
 */

// ===========================================
// WALLET ID GENERATION
// ===========================================

/**
 * Get or generate a persistent wallet ID that remains the same across app restarts
 * Uses device fingerprinting to create a unique, stable identifier
 * 
 * @returns {string} Persistent wallet identifier in format "wallet-{hash}-{timestamp}"
 */
function getPersistentWalletId() {
    //Try to get existing ID from localStorage
    let id = localStorage.getItem('wallet-peer-id');
    
    if (!id) {
        //Generate new ID if none exists
        const deviceId = generateWalletDeviceId();
        id = `wallet-${deviceId}`;
        
        //Store for future use
        localStorage.setItem('wallet-peer-id', id);
        console.log('Generated new persistent Wallet ID:', id);
    } else {
        console.log('Using existing Wallet ID:', id);
    }
    
    return id;
}

/**
 * Generate a device-specific identifier using browser/WebView properties
 * Creates a fingerprint that should be consistent for the same Android device
 * 
 * @returns {string} Device identifier in format "{hash}-{installTime}"
 */
function generateWalletDeviceId() {
    //Collect device/browser properties for fingerprinting
    const fingerprint = [
        navigator.userAgent,
        screen.width + 'x' + screen.height,
        navigator.hardwareConcurrency || 'unknown',
        navigator.language,
        new Date().getTimezoneOffset()
    ].join('|');

    //Create hash from fingerprint string
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        //Convert to 32-bit integer
        hash = hash & hash;
    }

    const deviceHash = Math.abs(hash).toString(36);

    //Use installation timestamp for additional uniqueness
    //This ensures each app installation gets a unique ID
    let installTime = localStorage.getItem('wallet-install-time');
    if (!installTime) {
        installTime = Date.now().toString(36);
        localStorage.setItem('wallet-install-time', installTime);
    }

    return `${deviceHash}-${installTime}`;
}

// ===========================================
// UI UPDATE FUNCTIONS
// ===========================================

/**
 * Update PeerJS connection status display
 * 
 * @param {string} text - Status message to show
 * @param {boolean} ok - Whether this indicates a successful state
 */
function updatePeerJsStatus(text, ok = false) {
    const el = document.getElementById('status-peerjs');
    if (el) {
        const indicator = el.querySelector('.status-indicator');
        const textEl = el.querySelector('.status-text');
        
        textEl.textContent = text;
        indicator.className = 'status-indicator' + (ok ? ' connected' : ' error');
        
        //Add card background color class
        el.className = 'status-card' + (ok ? ' connected' : ' error');
    }
    console.log('PeerJS Status:', text, ok ? 'connected' : 'error');
}

/**
 * Update P2P connection status display
 * 
 * @param {string} text - Status message to show
 * @param {boolean} ok - Whether this indicates a successful state
 */
function updateP2pStatus(text, ok = false) {
    const el = document.getElementById('status-p2p');
    if (el) {
        const indicator = el.querySelector('.status-indicator');
        const textEl = el.querySelector('.status-text');
        
        textEl.textContent = text;
        
        //Set indicator class
        if (ok) {
            indicator.className = 'status-indicator connected';
            el.className = 'status-card connected';
        } else if (text.includes('Waiting')) {
            indicator.className = 'status-indicator waiting';
            el.className = 'status-card waiting';
        } else {
            indicator.className = 'status-indicator error';
            el.className = 'status-card error';
        }
    }
    console.log('P2P Status:', text, ok ? 'connected' : 'error');
}

/**
 * Display a message in the messages area
 * 
 * @param {string} text - Message to display
 * @param {string} type - Message type: 'info', 'success', 'error'
 */
function addMessage(text, type = 'info') {
    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) return;
    
    //Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    
    //Add to messages area
    messagesDiv.appendChild(messageEl);
    
    //Auto-scroll to latest message
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    //Remove old messages if too many (keep last 50)
    const messages = messagesDiv.children;
    if (messages.length > 50) {
        messagesDiv.removeChild(messages[0]);
    }
    
    console.log(`Message (${type}):`, text);
}

/**
 * Clear all messages from the display
 */
function clearMessages() {
    const messagesDiv = document.getElementById('messages');
    if (messagesDiv) {
        messagesDiv.innerHTML = '';
    }
}

// ===========================================
// MESSAGE FORMATTING HELPERS
// ===========================================

/**
 * Format a transaction request for display
 * 
 * @param {Object} txRequest - Transaction request object
 * @returns {string} Formatted transaction details
 */
function formatTransaction(txRequest) {
    const data = txRequest.data || {};
    return `Transaction Request:\n` +
           `ID: ${txRequest.id}\n` +
           `Type: ${data.type || 'Unknown'}\n` +
           `Amount: ${data.amount || 'Unknown'}\n` +
           `Recipient: ${data.recipient || 'Unknown'}\n` +
           `Fee: ${data.fee || 'Unknown'}`;
}

// ===========================================
// DEBUGGING HELPERS
// ===========================================

/**
 * Get comprehensive debug information about the wallet state
 * 
 * @returns {Object} Debug information object
 */
function getDebugInfo() {
    return {
        walletId: window.walletId || 'Not set',
        peerConnected: window.peer && window.peer.open,
        p2pConnected: window.connection && window.connection.open,
        connectedTo: window.connection ? window.connection.peer : 'None',
        localStorage: {
            walletId: localStorage.getItem('wallet-peer-id'),
            installTime: localStorage.getItem('wallet-install-time')
        },
        browser: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            onLine: navigator.onLine,
            screen: `${screen.width}x${screen.height}`
        },
        timestamp: new Date().toISOString()
    };
}

/**
 * Print debug information to console
 */
function printDebugInfo() {
    console.log('Wallet Debug Information:', getDebugInfo());
}

/**
 * Test if Android bridge is available
 * 
 * @returns {boolean} True if Android interface is accessible
 */
function isAndroidAvailable() {
    return typeof window.Android !== 'undefined';
}

// ===========================================
// ERROR HANDLING
// ===========================================

/**
 * Handle and log errors consistently
 * 
 * @param {string} context - Where the error occurred
 * @param {Error|string} error - The error that occurred
 */
function handleError(context, error) {
    const errorMessage = error instanceof Error ? error.message : error;
    const fullMessage = `${context}: ${errorMessage}`;
    
    //Log to console
    console.error('Error', fullMessage);
    
    //Show in UI
    addMessage(fullMessage, 'error');
    
    //Update status if it's a connection error
    if (context.includes('PeerJS')) {
        updatePeerJsStatus(errorMessage, false);
    } else if (context.includes('P2P')) {
        updateP2pStatus(errorMessage, false);
    }
    
    //Notify Android if available
    if (isAndroidAvailable() && window.Android.onError) {
        window.Android.onError(fullMessage);
    }
}

// ===========================================
// GLOBAL UTILITIES
// ===========================================

/**
 * Wait for a specified amount of time
 * 
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Safely parse JSON with error handling
 * 
 * @param {string} jsonString - JSON string to parse
 * @returns {Object|null} Parsed object or null if parsing failed
 */
function safeJsonParse(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.warn('Failed to parse JSON:', jsonString, error);
        return null;
    }
}

/**
 * Generate a simple random ID
 * 
 * @param {number} length - Length of the ID (default: 8)
 * @returns {string} Random alphanumeric ID
 */
function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Make debug function globally accessible
window.debugWallet = printDebugInfo;