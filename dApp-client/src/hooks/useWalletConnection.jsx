import { useState, useEffect, useCallback } from 'react';
import walletService from '../services/walletService';

/**
 * Hook for Wallet connection management
 * 
 * @param {Object} peerConnection - Result of usePeerConnection Hooks
 * @returns {Object} - Wallet connection status
 */
export function useWalletConnection(peerConnection) {
    const { peerId, isReady } = peerConnection;

    const [walletId, setWalletId] = useState('');
    const [connected, setConnected] = useState(walletService.connected);
    const [status, setStatus] = useState(walletService.connected ? 'Connected to wallet' : 'Waiting for wallet connection');
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);

    //New Message
    const addSystemMessage = useCallback((text) => {
        setMessages(prev => [
            ...prev,
            {
                from: 'System',
                text,
                time: new Date().toLocaleTimeString()
            }
        ]);
    }, []);

    //Initializes URLFragmentService
    useEffect(() => {
        console.log("Initialisiere Wallet-Verbindung, aktueller Status:", walletService.connected ? "verbunden" : "getrennt");

        //Is already connected?
        if (walletService.connected) {
            console.log("Wallet ist bereits verbunden!");
            setConnected(true);
            setStatus('connected');

            //Already has wallet ID
            if (walletService.walletId) {
                setWalletId(walletService.walletId);
            }
        }

        //Event Listener
        const onConnect = (id) => {
            console.log("Wallet connection established in hook");
            setConnected(true);
            setStatus('connected');
            addSystemMessage("Connected to wallet!");
        };

        const onDisconnect = () => {
            console.log("Wallet disconnected");
            setConnected(false);
            setStatus('disconnected');
            addSystemMessage("Wallet disconnected");
        };

        const onError = (err) => {
            console.error("Wallet connection error:", err);
            setError(err.message || String(err));
            setStatus('error');
            addSystemMessage(`Error: ${err.message || String(err)}`);
        };

        walletService.on('connect', onConnect);
        walletService.on('disconnect', onDisconnect);
        walletService.on('error', onError);

        return () => {
            walletService.off('connect', onConnect);
            walletService.off('disconnect', onDisconnect);
            walletService.off('error', onError);
        };
    }, [addSystemMessage]);

    //Closes Connection
    const disconnectWallet = useCallback(() => {
        addSystemMessage("Disconnecting from wallet...");
        //Close the actual PeerJS connection
        if (walletService.connected) {
            try {
                //Tell wallet service to disconnect
                walletService.disconnect();

                //Update UI state
                setConnected(false);
                setStatus('disconnected');
                setWalletId('');
                addSystemMessage("Disconnected from wallet");
            } catch (err) {
                setError(`Error disconnecting: ${err.message}`);
                addSystemMessage(`Error disconnecting: ${err.message}`);
            }
        }
    }, [addSystemMessage]);

    return {
        walletId,
        connected,
        status,
        setStatus,
        error,
        disconnectWallet,
        messages,
        addSystemMessage
    };
}