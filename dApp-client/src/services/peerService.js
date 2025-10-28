import Peer from "peerjs";
import { PEER_CONFIG } from "../constants/constants";
import { getPersistentDappId } from "../utils/idUtils";

/**
 * PeerJS Service for managing P2P connection
 */
class PeerService {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.isInitializing = false;
        this.initPromise = null;
        this.listeners = {
            open: [],
            error: [],
            close: [],
            disconnected: [],
            connection: [],
            data: [],
            connectionClosed: []
        };
    }

    /**
     * Initializing new PeerJS Client
     * 
     * @returns {Promise<string>} peerID after succesfull connection
     */
    init() {

        if (this.peer && this.peer.open) {
            console.log("PeerJS bereits verbunden, nutze bestehende Verbindung");
            return Promise.resolve(this.peer.id);
        }

        if (this.isInitializing && this.initPromise) {
            console.log("PeerJS-Initialisierung läuft bereits, warte auf Ergebnis");
            return this.initPromise;
        }

        console.log("Starte neue PeerJS-Initialisierung");
        this.isInitializing = true;

        this.initPromise = new Promise((resolve, reject) => {
            //Kills already established connection
            if (this.peer && !this.peer.destroyed) {
                console.log("Bestehende PeerJS-Instanz wird zerstört");
                this.peer.destroy();
                this.peer = null;
            }

            const persistentId = getPersistentDappId();
            console.log("Creating new dApp peer with ID:", persistentId);

            this.peer = new Peer(persistentId, {
                debug: 1,
                config: {
                    iceServers: [
                        { urls: 'stun:stun.l.google.com:19302' },
                        { urls: 'stun:stun1.l.google.com:19302' }
                    ]
                }
            });

            //Event handler of 'open'
            this.peer.once('open', (id) => {
                console.log("PeerJS connection opened with ID:", id);
                this.isInitializing = false;
                this._notifyListeners('open', id);

                resolve(id);
            });

            //On connection from wallet
            this.peer.on('connection', (conn) => {
                console.log("Incoming wallet connection:", conn.peer);
                this.connection = conn;

                //Sucessfull connection
                conn.on('open', () => {
                    console.log("Wallet connection established:", conn.peer);
                    this._notifyListeners('connection', conn);
                });

                //Recieved data from wallet
                conn.on('data', (data) => {
                    console.log("Received data from wallet:", data);
                    this._notifyListeners('data', data);
                });

                //Connection closed
                conn.on('close', () => {
                    console.log("Wallet connection closed");
                    this.connection = null;
                    this._notifyListeners('connectionClosed');
                });

                //Error
                conn.on('error', (err) => {
                    console.error("Wallet connection error:", err);
                    this._notifyListeners('error', err);
                });
            });

            //Event Handler for Error
            this.peer.on('error', (err) => {
                console.error("PeerJS error:", err);
                
                if (err.type !== 'peer-unavailable') {
                    this.isInitializing = false;
                }
                this._notifyListeners('error', err);
                if (!this.peer || !this.peer.open) reject(err);
            });

            //Event Handler for lost connections
            this.peer.on("disconnected", () => {
                console.log("PeerJS disconnected from server");

                if (this.connection && this.connection.open) {
                    console.log("P2P connection active - PeerJS server disconnect is OK");
                } else {
                    this._notifyListeners('disconnected');
                }
            });

            //Event Handler for closed connections
            this.peer.on('close', () => {
                console.log("PeerJS connection closed");
                this.isInitializing = false;
                this._notifyListeners('close');
            });
        });

        return this.initPromise;
    }

    /**
     * Sendet Daten an den verbundenen Peer
     * 
     * @param {*} data - Zu sendende Daten
     * @returns {boolean} True, wenn erfolgreich gesendet
     */
    send(data) {
        if (!this.connection || !this.connection.open) {
            console.error("Cannot send: No open connection");
            return false;
        }

        try {
            const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
            this.connection.send(serializedData);
            return true;
        } catch (err) {
            console.error("Error sending data:", err);
            return false;
        }
    }

    /**
     * Versucht, die Verbindung wiederherzustellen
     */
    reconnect() {
        if (this.peer && !this.peer.destroyed) {
            console.log("Reconnecting to PeerJS server...");
            this.peer.reconnect();
        } else {
            console.log("Creating new PeerJS connection...");
            this.init();
        }
    }

    /**
     * Bereinigt die PeerJS-Verbindung
     */
    destroy() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }

        if (this.peer && !this.peer.destroyed) {
            this.peer.destroy();
            this.peer = null;
        }

        // Leeren der Listener-Arrays
        Object.keys(this.listeners).forEach(key => {
            this.listeners[key] = [];
        });

        console.log("PeerJS connections destroyed");
    }

    /**
     * Registriert einen Event-Listener
     * 
     * @param {string} event - Event-Name
     * @param {Function} callback - Callback-Funktion
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Entfernt einen Event-Listener
     * 
     * @param {string} event - Event-Name
     * @param {Function} callback - Die zu entfernende Callback-Funktion
     */
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Benachrichtigt alle registrierten Listener eines Events
     * 
     * @param {string} event - Event-Name
     * @param {*} data - Event-Daten
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
}

export default new PeerService();