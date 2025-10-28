import { useState, useEffect, useCallback, useRef } from 'react';
import peerService from '../services/peerService';

/**
 * Hook for PeerJS connection management
 * Uses ServiceManager for Initialization
 * 
 * @returns {Object} - Connection status 
 */
export function usePeerConnection() {
    const [peerId, setPeerId] = useState('');
    const [status, setStatus] = useState('initializing');
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState(null);
    const listenerSetupRef = useRef(false);

    //Function for reconnecting with peerjs
    const handleReconnect = useCallback(() => {

        if (isReady) {
            console.log('PeerJS already connected');
            return;
        }

        console.log('Attempting to reconnect PeerJS...');
        setStatus('reconnecting');
        peerService.reconnect();
    }, [isReady]);

    useEffect(() => {

        if (listenerSetupRef.current) {
            console.log("PeerJS listeners already set up, skipping duplicate setup");
            return;
        }

        console.log("Setting up PeerJS event listeners");
        listenerSetupRef.current = true;

        if (peerService.peer && peerService.peer.open) {
            console.log("PeerJS already connected, syncing state");
            setPeerId(peerService.peer.id);
            setStatus('ready');
            setIsReady(true);
        }

        const onOpen = (id) => {
            console.log("PeerJS open event - dApp ready for wallet connections:", id);
            setPeerId(id);
            setStatus('ready');
            setIsReady(true);
        };

        const onError = (err) => {
            console.error("PeerJS error in hook:", err);
            setError(err.message || 'Connection error');
            setStatus('error');
        };

        const onDisconnected = () => {
            console.log("PeerJS disconnected from server");
            setStatus('disconnected');
        };

        const onClose = () => {
            console.log("PeerJS connection closed");
            setStatus('closed');
            setIsReady(false);
        };

        peerService.on('open', onOpen);
        peerService.on('error', onError);
        peerService.on('disconnected', onDisconnected);
        peerService.on('close', onClose);

        return () => {
            
            console.log("Cleaning up PeerJS event listeners");
            peerService.off('open', onOpen);
            peerService.off('error', onError);
            peerService.off('disconnected', onDisconnected);
            peerService.off('close', onClose);
            
            listenerSetupRef.current = false;
        };
    }, []);

    useEffect(() => {

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && status === 'disconnected') {
                console.log("Tab became visible, attempting reconnect");
                handleReconnect();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleReconnect);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleReconnect);
        };
    }, [status, handleReconnect]);

    return {
        peerId,
        status,
        isReady,
        error,
        reconnect: handleReconnect
    };
}