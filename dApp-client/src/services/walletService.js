import peerService from './peerService';
import { createWalletRequest, createTextMessage, parseWalletMessage } from '../utils/messageUtils';

/**
 * Service for wallet communication
 */
class WalletService {
    constructor() {
        this.walletId = null;
        this.connected = false;
        this.listeners = {
            message: [],
            connect: [],
            disconnect: [],
            error: []
        };

        this.HEARTBEAT_INTERVAL = 5000;
        this.HEARTBEAT_TIMEOUT = 3000;
        this.heartbeatInterval = null;
        this.heartbeatTimeout = null;

        //Event Listener for incoming messages
        peerService.on('data', (data) => this._handleIncomingData(data));

        //Event Listener for connections
        peerService.on('connection', () => {
            this.connected = true;
            this._notifyListeners('connect', this.walletId);

            this._startHeartbeat();
        });

        //Event Listener for lost connections
        peerService.on('connectionClosed', () => {
            this.connected = false;
            this._notifyListeners('disconnect');

            this._stopHeartbeat();
        });

        //Sync of connection status
        this.connected = peerService.connection && peerService.connection.open;
        if (this.connected) {
            console.log("WalletService: Bestehende Verbindung gefunden!");
            this._notifyListeners('connect', this.walletId);

            this._startHeartbeat();
        }
    }

    /**
     * Starts the heartbeat monitoring system
     * @private
     */
    _startHeartbeat() {
        this._stopHeartbeat();

        if (!this.connected || !peerService.connection || !peerService.connection.open) {
            console.log('Cannot start heartbeat - no wallet connection');
            return;
        }

        console.log('Starting wallet heartbeat monitoring');

        this.heartbeatInterval = setInterval(() => {
            if (peerService.connection && peerService.connection.open) {
                const pingTime = Date.now();
                try {
                    peerService.send({
                        type: 'heartbeat',
                        action: 'ping',
                        timestamp: pingTime
                    });

                    console.log('Sent heartbeat ping to wallet');

                    this.heartbeatTimeout = setTimeout(() => {
                        console.error('Wallet heartbeat timeout - connection may be dead');
                        //Mark as disconnected and notify listeners
                        if (this.connected) {
                            this.connected = false;
                            this._notifyListeners('disconnect');
                        }

                    }, this.HEARTBEAT_TIMEOUT);

                } catch (e) {
                    console.error('Failed to send heartbeat:', e);
                    this._stopHeartbeat();
                    if (this.connected) {
                        this.connected = false;
                        this._notifyListeners('error', new Error('Heartbeat failed: ' + e.message));
                    }
                }
            } else {
                this._stopHeartbeat();
            }
        }, this.HEARTBEAT_INTERVAL);
    }

    /**
     * Stops the heartbeat monitoring system
     * @private
     */
    _stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = null;
        }
    }

    /**
     * Process heartbeat messages
     * @param {Object} message - The heartbeat message
     * @returns {boolean} - True if message was a heartbeat, false otherwise
     * @private
     */
    _processHeartbeatMessage(message) {
        if (message && message.type === 'heartbeat') {
            if (message.action === 'ping') {

                peerService.send({
                    type: 'heartbeat',
                    action: 'pong',
                    timestamp: message.timestamp,
                    received: Date.now()
                });
                console.log('Received heartbeat ping, sent pong');
            } else if (message.action === 'pong') {
                //Process pong response
                if (this.heartbeatTimeout) {
                    clearTimeout(this.heartbeatTimeout);
                    this.heartbeatTimeout = null;
                }
                const latency = Date.now() - message.timestamp;
                console.log(`Wallet connection confirmed (${latency}ms latency)`);

                //Update connection status if needed
                if (!this.connected) {
                    this.connected = true;
                    this._notifyListeners('connect', this.walletId);
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Sends a text message to the wallet
     * 
     * @param {string} message - The message
     * @returns {boolean} True, if successfull
     */
    sendMessage(message) {
        if (!this.connected) {
            console.error("Cannot send: Not connected to wallet");
            return false;
        }

        const messageObj = createTextMessage(message);
        return peerService.send(messageObj);
    }

    /**
     * Calls a wallet function
     * 
     * @param {string} method - The method
     * @param {*} data - data for the function
     * @returns {boolean} True, if successfull
     */
    callWalletFunction(method, data = null) {
        if (!this.connected) {
            console.error(`Cannot call ${method}: Not connected to wallet`);
            return false;
        }

        const request = createWalletRequest(method, data);
        return peerService.send(request);
    }

    /**
     * For transaction signing
     * 
     * @param {Object} txData - data
     * @returns {boolean} True, if successfull
     */
    signTransaction(txData = null) {

        if (!this.connected) {
            console.error("Cannot sign transaction: Not connected to wallet");
            return false;
        }

        console.log("Creating transaction signing request...");

        if (!txData) {
            //Demo transaction
            txData = {
                type: "Payment",
                amount: "2.5 ADA",
                recipient: "addr1qxyz...abc123",
                fee: "0.17 ADA",
                metadata: "dApp Payment #" + Date.now()
            };
        }
        //TODO!! Connection via in App Browser is not yet implemented
        console.log("Signing needs to be implemented")

        return false;
    }

    /**
     * Handles incoming data
     * 
     * @param {*} data
     * @private
     */
    _handleIncomingData(data) {
        const message = parseWalletMessage(data);

        //First check if its a heartbeat message
        if (this._processHeartbeatMessage(message)) {

            return;
        }

        this._notifyListeners('message', message);
    }

    /**
     * Registers an Event Listener
     * 
     * @param {string} event - Event Name
     * @param {Function} callback - Callback Function
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Removes an Event Listener
     * 
     * @param {string} event - Event Name
     * @param {Function} callback - removed Callback Function
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Notifies Listeners
     * 
     * @param {string} event - Event Name
     * @param {*} data - Event data
     * @private
     */
    _notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (err) {
                    console.error(`Error in ${event} listener:`, err);
                }
            });
        }
    }

    /**
     * Disconnects from the currently connected wallet
    */
    disconnect() {
        if (!this.connected) {
            console.log("Not connected to a wallet");
            return false;
        }

        this._stopHeartbeat();

        //Close the P2P connection
        if (peerService.connection && peerService.connection.open) {
            console.log("Closing P2P connection to wallet");
            peerService.connection.close();
        }

        this.connected = false;
        this._notifyListeners('disconnect');

        return true;
    }

}

export default new WalletService();