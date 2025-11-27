/**
 * Service for In-App Browser Wallet (CIP-158 + CIP-30)
 * 
 * Detects if dApp runs in wallet browser and provides
 * CIP-30-like API access
 */
class InAppWalletService {
    constructor() {
        this.walletApi = null;
        this.isInWalletBrowser = false;
        this.listeners = new Map();
    }

    /**
     * Initialize and detect wallet browser
     * Called once at app startup
     */
    async initialize() {
        console.log('InAppWalletService: Checking for wallet browser...');

        // Check if window.cardano exists (injected by Cip158BrowserActivity)
        if (window.cardano?.demoWallet) {
            console.log('Wallet browser detected:', window.cardano.demoWallet.name);
            
            try {
                // Enable wallet (in In-App Browser this is instant)
                this.walletApi = await window.cardano.demoWallet.enable();
                this.isInWalletBrowser = true;

                // Get wallet info
                const balance = await this.walletApi.getBalance();
                console.log('Wallet balance:', balance, 'Lovelace');

                // Notify listeners
                this._notifyListeners('connected', {
                    name: window.cardano.demoWallet.name,
                    balance: balance
                });

                return true;
            } catch (error) {
                console.error('Failed to enable wallet:', error);
                return false;
            }
        } else {
            console.log('Not running in wallet browser. P2P mode available');
            return false;
        }
    }

    /**
     * Check if running in wallet browser
     * @returns {boolean}
     */
    isWalletBrowser() {
        return this.isInWalletBrowser;
    }

    /**
     * Get wallet API (if available)
     * @returns {Object|null}
     */
    getWalletApi() {
        return this.walletApi;
    }

    /**
     * Sign transaction via In-App Browser wallet
     * 
     * @param {Object} txData - Transaction data
     * @returns {Promise<string>} - Transaction signature
     */
    async signTransaction(txData) {
        if (!this.walletApi) {
            throw new Error('Wallet API not available');
        }

        // Mock transaction CBOR
        const mockTxCbor = "84a40081825820" + "00".repeat(32) + "00";

        // Metadata for native dialog
        const metadata = {
            type: txData.type || "Payment",
            amount: txData.amount,
            recipient: txData.recipient,
            fee: txData.fee || "0.17 ADA",
            item: txData.productName,
            description: txData.metadata || `Transaction ${Date.now()}`
        };

        try {
            // Send to wallet for signing (shows native dialog)
            const signature = await this.walletApi.signTx(mockTxCbor, false, metadata);
            
            console.log('Transaction signed:', signature);
            
            // Notify listeners
            this._notifyListeners('transaction_signed', { signature, txData });

            return signature;
        } catch (error) {
            console.error('Transaction signing failed:', error);
            
            // Notify listeners
            this._notifyListeners('transaction_rejected', { error, txData });
            
            throw error;
        }
    }

    /**
     * Get current balance
     * @returns {Promise<string>}
     */
    async getBalance() {
        if (!this.walletApi) {
            throw new Error('Wallet API not available');
        }
        return await this.walletApi.getBalance();
    }

    /**
     * Get wallet addresses
     * @returns {Promise<Array<string>>}
     */
    async getAddresses() {
        if (!this.walletApi) {
            throw new Error('Wallet API not available');
        }
        return await this.walletApi.getUsedAddresses();
    }

    /**
     * Disconnect from In-App Browser
     * Closes the WebView and returns to wallet
     */
    disconnect() {
        if (!this.isInWalletBrowser) {
            console.log('Not in wallet browser, cannot close WebView');
            return;
        }

        console.log('Closing In-App Browser WebView');

        // Trigger Android back navigation
        if (window.history.length > 1) {
            // Go back to wallet
            window.history.back();
        } else {
            // No history
            // The wallet should handle this via finishWithCallback
            if (typeof Android !== 'undefined' && Android.closeWebView) {
                Android.closeWebView();
            } else {
                // Fallback
                window.close();
            }
        }

        this._notifyListeners('disconnected', {});
    }

    /**
     * Subscribe to wallet events
     * 
     * Events:
     * - 'connected' - Wallet connected
     * - 'transaction_signed' - Transaction signed
     * - 'transaction_rejected' - Transaction rejected
     * 
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    /**
     * Unsubscribe from wallet events
     */
    off(event, callback) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
            callbacks.splice(index, 1);
        }
    }

    /**
     * Notify all listeners of an event
     * @private
     */
    _notifyListeners(event, data) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in event listener:', error);
            }
        });
    }
}

export default new InAppWalletService();