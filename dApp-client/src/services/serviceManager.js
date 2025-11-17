import peerService from './peerService';
import walletService from './walletService';
import inAppWalletService from './inAppWalletService';

/**
 * Service-Manager for the application
 * Makes sure services are only established once
 */
class ServiceManager {
    constructor() {
        this.initialized = false;
        this.initPromise = null;
        this.connectionMode = null;
    }

    /**
     * Initializes all Services
     * 
     * @returns {Promise<void>}
     */
    initialize() {
        if (this.initialized) {
            console.log("Services already initialized");
            return Promise.resolve();
        }

        if (this.initPromise) {
            console.log("Services initialization in progress");
            return this.initPromise;
        }

        console.log("Initializing all services centrally");

        this.initPromise = (async () => {
            try {
                //Check if in In-App Browser
                const isWalletBrowser = await inAppWalletService.initialize();

                if (isWalletBrowser) {
                    console.log('Running in Wallet Browser - using direct API');
                    this.connectionMode = 'in-app-browser';
                    
                    
                    console.log('P2P services disabled (not needed in wallet browser)');
                } else {
                    console.log('Running in regular browser - initializing P2P');
                    this.connectionMode = 'p2p';
                    
                    await peerService.init();
                }

                console.log("All services initialized successfully");
                console.log("Connection mode:", this.connectionMode);
                this.initialized = true;
            } catch (error) {
                console.error("Error initializing services:", error);
                this.initPromise = null;
                throw error;
            }
        })();

        return this.initPromise;
    }

    /**
     * Get current connection mode
     * @returns {'in-app-browser'|'p2p'|null}
     */
    getConnectionMode() {
        return this.connectionMode;
    }

    /**
     * Check if running in wallet browser
     * @returns {boolean}
     */
    isWalletBrowser() {
        return this.connectionMode === 'in-app-browser';
    }

    /**
     * Cleans all services up
     */
    cleanup() {
        if (!this.initialized) return;

        console.log("Cleaning up all services");

        if (this.connectionMode === 'p2p') {
            peerService.destroy();
        }

        this.initialized = false;
        this.initPromise = null;
        this.connectionMode = null;
    }
}

export default new ServiceManager();