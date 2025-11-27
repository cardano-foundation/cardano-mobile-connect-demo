/**
 * Wallet Core - Main wallet functionality
 */

// ===========================================
// GLOBAL VARIABLES
// ===========================================

//PeerJS peer instance
let peer = null;

//Active P2P connection to dApp
let connection = null;

//Unique wallet identifier
let walletId = null;

// ===========================================
// PEER INITIALIZATION
// ===========================================

/**
 * Create and configure a new PeerJS peer instance
 * Exact same configuration as peerclient.html
 */
function createSimplePeer() {
    //Clean up old peer
    if (peer && !peer.destroyed) {
        console.log('Destroying old peer before creating new one');
        peer.destroy();
    }

    updatePeerJsStatus('Connecting...');

    const config = {
        debug: 1,
        config: {
        'iceServers': [
            //ICE servers for NAT traversal
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    }
    };

    console.log('Creating simple peer with ID:', walletId);
    peer = new Peer(walletId, config);
    setupPeerEvents();
}

/**
 * Set up event handlers for PeerJS peer
 */
function setupPeerEvents() {
    //Peer connected to PeerJS server
    peer.on('open', (id) => {
        console.log('PeerJS connection opened with ID:', id);
        walletId = id;
        window.walletId = id;
        updatePeerJsStatus('Connected as ' + id, true);

        //Notify Android that wallet is ready
        if (typeof Android !== 'undefined' && Android.onWalletReady) {
            Android.onWalletReady(id);
        }
    });

    //Incoming connection from a dApp
    peer.on('connection', (conn) => {
        console.log('Incoming P2P connection from:', conn.peer);
        addMessage(`Incoming P2P connection from: ${conn.peer}`, 'info');
        handleIncomingConnection(conn);
    });

    //PeerJS error
    peer.on('error', (err) => {
        console.error('PeerJS Error:', err);
        updatePeerJsStatus('Error: ' + err.message, false);

        //Notify Android of error
        if (typeof Android !== 'undefined' && Android.onError) {
            Android.onError('PeerJS Error: ' + err.message);
        }
    });

    //PeerJS connection closed
    peer.on('close', () => {
        console.log('PeerJS connection closed');
        updatePeerJsStatus('Disconnected', false);
    });
}

// ===========================================
// P2P CONNECTION HANDLING
// ===========================================

/**
 * Handle incoming P2P connection from a dApp
 */
function handleIncomingConnection(conn) {
    connection = conn;
    updateP2pStatus('Connecting to ' + conn.peer, false);

    //P2P connection established
    conn.on('open', () => {
        console.log('P2P connection established with:', conn.peer);
        updateP2pStatus('Connected to ' + conn.peer, true);

        addMessage(`P2P connected to: ${conn.peer}`, 'success');

        startHeartbeat();

        //Notify Android of P2P connection
        if (typeof Android !== 'undefined' && Android.onConnected) {
            Android.onConnected(conn.peer);
        }
    });

    //Message received from dApp
    conn.on('data', (data) => {
        console.log('Received P2P message:', data);
        handleP2PMessage(data);
    });

    //P2P connection closed
    conn.on('close', () => {
        console.log('P2P connection closed');
        connection = null;
        updateP2pStatus('Connection closed', false);

        stopHeartbeat();

        if (typeof Android !== 'undefined' && Android.onP2PConnectionClosed) {
            Android.onP2PConnectionClosed();
        }
    });

    //P2P connection error
    conn.on('error', (err) => {
        console.error('P2P Error:', err);
        updateP2pStatus('Error: ' + err.message, false);
    });
}

/**
 * Handle messages received from connected dApp
 */
function handleP2PMessage(data) {
    try {
        //Parse message
        const request = typeof data === 'string' ? JSON.parse(data) : data;

        console.log('Received request:', request);

        //Special handling for heartbeat messages
        if (request.type === 'heartbeat') {
            handleHeartbeat(request);
            return;
        }

        addMessage(`Received: ${request.method || 'unknown'}`, 'info');

        switch (request.method) {
            case 'signTx':
                addMessage('Transaction signature requested', 'info');
                if (typeof Android !== 'undefined') {
                    Android.requestTransactionSignature(JSON.stringify(request));
                }
                break;
            default:
                addMessage(`Unknown method: ${request.method}`, 'error');
                sendToDapp({
                    id: request.id,
                    error: 'Unknown method: ' + request.method
                });
        }

    } catch (error) {
        console.error('Error processing message:', error);
        addMessage(`Error: ${error.message}`, 'error');
    }
}

// ===========================================
// RESPONSE FUNCTIONS
// ===========================================

/**
 * Send data to connected dApp
 */
function sendToDapp(data) {
    if (connection && connection.open) {
        connection.send(JSON.stringify(data));
        console.log('Sent to dApp:', data);
    } else {
        console.error('Cannot send to dApp - no P2P connection');
        updateP2pStatus('No connection available', false);
    }
}

// ===========================================
// ANDROID CALLABLE FUNCTIONS
// ===========================================

/**
 * Initialize the wallet
 * Exact same as peerclient.html
 */
function initializeWallet() {
    console.log('Initializing simple wallet...');

    //Get persistent wallet ID
    walletId = getPersistentWalletId();

    //Create simple peer
    createSimplePeer();

    console.log('Wallet initialized with ID:', walletId);
}

/**
 * Clean up wallet resources
 * Called by Android when activity is destroyed
 */
function cleanupWallet() {
    console.log('Cleaning up wallet...');

    stopHeartbeat();

    try {
        if (connection) {
            connection.close();
            connection = null;
        }
        if (peer) {
            peer.destroy();
            peer = null;
        }

        updatePeerJsStatus('Disconnected', false);
        updateP2pStatus('Disconnected', false);

        addMessage('Wallet connection fully reset', 'info');
    } catch (e) {
        console.log('Cleanup error:', e);
    }
}

/**
 * Connect to a dApp using QR-scanned peer ID
 * Called by Android after user approves connection
 * 
 * @param {string} dappPeerId - PeerJS ID of the dApp to connect to
 */
function connectToDapp(dappPeerId) {
    addMessage(`Connecting to dApp: ${dappPeerId}`, 'info');
    
    //Validate wallet peer is ready
    if (!peer || !peer.open) {
        console.error('Wallet peer not ready');
        addMessage('Wallet peer not ready', 'error');
        //Notify Android
        if (typeof Android !== 'undefined') {
            Android.onError('Wallet not ready for connection');
        }
        return false;
    }

    addMessage(`Wallet ready: ${peer.id}`, 'info');

    if (connection && connection.open) {
        console.log('Closing existing connection');
        addMessage('Closing existing connection', 'info');
        connection.close();
        connection = null;
    }

    let attempts = 0;
    const maxAttempts = 25;
    let connectionVerified = false;
    
    const attemptConnection = async () => {
        attempts++;
        addMessage(`Attempt ${attempts}/${maxAttempts}...`, 'info');

        try {
            //Check if wallet peer is still active
            if (!peer || !peer.open) {
                console.error('Wallet peer lost during connection');
                if (typeof Android !== 'undefined') {
                    Android.onError('Wallet peer disconnected');
                }
                return false;
            }

            //Create P2P connection to dApp
            connection = peer.connect(dappPeerId, {
                reliable: true,
                serialization: 'json'
            });

            if (!connection) {
                console.error('Failed to create connection');
                
                if (attempts >= maxAttempts) {
                    addMessage('Max attempts reached - dApp not available', 'error');
                    if (typeof Android !== 'undefined') {
                        Android.onError('dApp not available after ' + maxAttempts + ' attempts');
                    }
                    return false;
                }

                //Retry after 200ms
                addMessage(`Retry in 200ms...`, 'info');
                await new Promise(resolve => setTimeout(resolve, 200));
                return attemptConnection();
            }

            addMessage('Connection created, waiting for open...', 'info');

            connection.on('open', () => {
                addMessage(`Successfully connected to dApp: ${dappPeerId}`, 'success');
                updateP2pStatus('Connected to ' + dappPeerId, true);
                
                if (typeof Android !== 'undefined') {
                    Android.onConnected(dappPeerId);
                }
            });

            connection.on('data', (data) => {
                console.log('Received from dApp:', data);
                handleP2PMessage(data);
            });

            connection.on('close', () => {
                addMessage('Connection to dApp closed', 'info');
                connection = null;
                updateP2pStatus('Disconnected', false);
                
                if (typeof Android !== 'undefined' && Android.onP2PConnectionClosed) {
                    Android.onP2PConnectionClosed();
                }
            });

            connection.on('error', (err) => {
                addMessage(`Connection error: ${err.type}`, 'error');
                
                connection = null;
                updateP2pStatus('Connection failed', false);

                if (attempts >= maxAttempts) {
                    if (typeof Android !== 'undefined') {
                        Android.onError('Connection failed: ' + err.message);
                    }
                    return false;
                } else {
                    //Retry after error
                    console.log('Retry after error in 200ms...');
                    setTimeout(() => attemptConnection(), 200);
                }
            });

            return true;

        } catch (error) {
            
            if (attempts >= maxAttempts) {
                addMessage(`Connection failed: ${error.message}`, 'error');
                if (typeof Android !== 'undefined') {
                    Android.onError('Connection error: ' + error.message);
                }
                return false;
            }

            //Retry after exception
            console.log('Retry after exception in 200ms...');
            await new Promise(resolve => setTimeout(resolve, 200));
            return attemptConnection();
        }

    };
    attemptConnection();
}

/**
 * Force reconnect to PeerJS server
 * Called by Android when connection needs to be refreshed
 */
function forceReconnectForP2P() {
    console.log('Force reconnecting wallet...');

    stopHeartbeat();

    if (connection) {
        try {
            if (connection.open) {
                console.log('  Closing existing P2P connection to:', connection.peer);
                connection.close();
            }
            connection = null;
            updateP2pStatus('Cleaned up for reconnect', false);
        } catch (e) {
            console.log('  P2P cleanup error:', e);
            connection = null;
        }
    }

    if (peer && !peer.destroyed) {
        try {
            console.log('  Destroying existing PeerJS peer');
            peer.destroy();
        } catch (e) {
            console.log('  PeerJS cleanup error:', e);
        }
    }
    peer = null;

    console.log('Connection request - forcing fresh PeerJS connection...');
    updatePeerJsStatus('Connection request - reconnecting...');

    walletId = getPersistentWalletId();

    createSimplePeer();
}

/**
 * Send transaction result to dApp
 * Called by Android after user approves/rejects transaction
 * 
 * @param {string} requestId - Transaction request ID
 * @param {boolean} approved - Whether user approved the transaction
 * @param {string} signature - Mock signature (if approved)
 */
function sendTransactionResult(requestId, approved, signature) {
    if (approved && signature) {
        addMessage(`Transaction approved and signed (ID: ${requestId})`, 'success');
        sendToDapp({
            id: parseInt(requestId),
            type: 'response',
            method: 'signTx',
            data: {
                signature: signature || 'sig_' + Date.now() + '_xyz789',
                txHash: 'tx_' + Date.now() + '_hash',
                status: 'signed'
            }
        });
    } else {
        addMessage(`Transaction rejected by user (ID: ${requestId})`, 'error');
        sendToDapp({
            id: parseInt(requestId),
            type: 'response',
            method: 'signTx',
            error: 'Transaction rejected by user'
        });
    }
}

// ===========================================
// HEARTBEAT MONITORING SYSTEM
// ===========================================

let heartbeatInterval = null;
let heartbeatTimeout = null;
const HEARTBEAT_INTERVAL = 5000;
const HEARTBEAT_TIMEOUT = 3000;

/**
 * Start the heartbeat monitoring system
 */
function startHeartbeat() {
    //Clear any existing heartbeat
    stopHeartbeat();

    //Don't start heartbeat if no connection
    if (!connection || !connection.open) {
        console.log('Cannot start heartbeat - no active connection');
        return;
    }

    console.log('Starting P2P connection heartbeat monitoring');

    heartbeatInterval = setInterval(() => {
        //Send heartbeat ping if connection exists
        if (connection && connection.open) {
            const pingTime = Date.now();

            try {
                connection.send(JSON.stringify({
                    type: 'heartbeat',
                    action: 'ping',
                    timestamp: pingTime
                }));

                console.log('Sent heartbeat ping', pingTime);

                //Set timeout for waiting for pong response
                clearTimeout(heartbeatTimeout);
                heartbeatTimeout = setTimeout(() => {
                    console.error('Heartbeat timeout - no response received');

                    //Connection appears dead, but PeerJS might not know yet
                    updateP2pStatus('Connection unresponsive', false);

                    //Try to force close and notify Android
                    if (connection) {
                        try {
                            connection.close();
                        } catch (e) {
                            console.error('Error closing unresponsive connection:', e);
                        }
                        connection = null;

                        //Notify Android
                        if (typeof Android !== 'undefined' && Android.onP2PConnectionClosed) {
                            Android.onP2PConnectionClosed();
                        }
                    }
                }, HEARTBEAT_TIMEOUT);

            } catch (e) {
                console.error('Failed to send heartbeat:', e);
                stopHeartbeat();

                //Connection is definitely broken
                updateP2pStatus('Connection error', false);

                //Notify Android of connection error
                if (typeof Android !== 'undefined' && Android.onError) {
                    Android.onError('Heartbeat error: ' + e.message);
                }
            }
        } else {
            console.log('Stopping heartbeat - connection no longer active');
            stopHeartbeat();
        }
    }, HEARTBEAT_INTERVAL);
}

/**
 * Stop the heartbeat monitoring system
 */
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
    if (heartbeatTimeout) {
        clearTimeout(heartbeatTimeout);
        heartbeatTimeout = null;
    }
}

/**
 * Handle heartbeat response from dApp
 * 
 * @param {Object} data - Heartbeat message (ping or pong)
 */
function handleHeartbeat(data) {
    if (data.action === 'ping') {
        //Respond to ping with pong
        sendToDapp({
            type: 'heartbeat',
            action: 'pong',
            timestamp: data.timestamp,
            received: Date.now()
        });
        console.log('Received ping, sent pong', data.timestamp);
    } else if (data.action === 'pong') {
        //Received pong response, clear timeout
        clearTimeout(heartbeatTimeout);
        const latency = Date.now() - data.timestamp;
        console.log(`Heartbeat confirmed (${latency}ms latency)`);

        //Connection is confirmed healthy
        updateP2pStatus('Connected to ' + connection.peer, true);
    }
}

function connectToDappWithConfig(dappPeerId, host, port, path, secure) {

    console.log(`Switching to custom server: ${host}`);
    addMessage(`Switching to custom server...`, 'info');

    //Close old connection to default PeerJS Server
    if (peer && !peer.destroyed) {
        peer.destroy();
    }
    peer = null;

    const customConfig = {
        host: host,
        port: port,
        path: path,
        secure: secure,
        debug: 2,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        }
    };

    walletId = getPersistentWalletId();
    peer = new Peer(walletId, customConfig);

    setupPeerEvents();

    peer.on('open', (id) => {
        console.log('Connected to custom server with ID:', id);
        updatePeerJsStatus(`Custom Server: ${host}`, true);
        
        // Jetzt verbinden wir uns zur dApp
        connectToDapp(dappPeerId);
    });

    peer.on('error', (err) => {
        console.error('Custom Server Error:', err);
        addMessage('Server connection failed: ' + err.type, 'error');
    });
}

/**
 * Disconnect from the current dApp connection
 * Can be called from UI or by Android
 */
function disconnectFromDapp() {
    if (!connection) {
        console.log('No active connection to disconnect');
        return;
    }

    console.log('Manually disconnecting from dApp');
    addMessage('Manually disconnecting from dApp', 'info');

    //Stop heartbeat first
    stopHeartbeat();

    //Close the connection
    if (connection.open) {
        connection.close();
    }

    //Clear the connection variable
    connection = null;
    updateP2pStatus('Disconnected', false);

    //Notify Android of disconnect
    if (typeof Android !== 'undefined' && Android.onP2PConnectionClosed) {
        Android.onP2PConnectionClosed();
    }
}

// ===========================================
// AUTO INITIALIZATION
// ===========================================

/**
 * Auto-initialize wallet when page loads
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, auto-initializing wallet...');

    //Initialize wallet after short delay
    setTimeout(() => {
        initializeWallet();
    }, 100);
});

/**
 * Handle visibility changes to maintain connection
 */
window.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        console.log('WebView hidden - keeping P2P connection alive');
    } else {
        console.log('WebView visible - checking P2P connection');
        if (connection && !connection.open) {
            console.log('P2P connection lost - attempting to reconnect');
            //Try reconnecting if connection was lost
            forceReconnectForP2P();
        }
    }
});

/**
 * Setup UI event handlers
 */
document.addEventListener('DOMContentLoaded', function () {
    //Setup Clear Log button
    const clearButton = document.getElementById('clear-log');
    if (clearButton) {
        clearButton.addEventListener('click', function () {
            clearMessages();
        });
    }

    //Setup Disconnect button
    const disconnectButton = document.getElementById('disconnect-button');
    if (disconnectButton) {
        // Update button state based on connection
        function updateDisconnectButtonState() {
            disconnectButton.disabled = !connection;
        }

        //Initial state
        updateDisconnectButtonState();

        //Event handler
        disconnectButton.addEventListener('click', function () {
            disconnectFromDapp();
            updateDisconnectButtonState();
        });

        //Update state when connection changes
        setInterval(updateDisconnectButtonState, 1000);
    }

});

// ===========================================
// GLOBAL EXPORTS
// ===========================================

//Makes functions globally accessible for Android WebView
window.initializeWallet = initializeWallet;
window.cleanupWallet = cleanupWallet;
window.forceReconnectForP2P = forceReconnectForP2P;
window.sendTransactionResult = sendTransactionResult;
window.disconnectFromDapp = disconnectFromDapp;
window.connectToDappWithConfig = connectToDappWithConfig;

console.log('Wallet core loaded and ready');