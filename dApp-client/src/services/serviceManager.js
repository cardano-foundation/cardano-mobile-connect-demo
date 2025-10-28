import peerService from './peerService';
import walletService from './walletService';

/**
 * Service-Manager for the application
 * Makes sure services are only established once
 */
class ServiceManager {
    constructor() {
        this.initialized = false;
        this.initPromise = null;
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
                //Right order
                await peerService.init();

                console.log("All services initialized successfully");
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
     * Cleans all services up
     */
    cleanup() {
        if (!this.initialized) return;

        console.log("Cleaning up all services");

        peerService.destroy();


        this.initialized = false;
        this.initPromise = null;
    }
}

export default new ServiceManager();