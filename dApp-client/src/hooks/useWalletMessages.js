import { useState, useEffect, useCallback } from 'react';
import walletService from '../services/walletService';
import { WALLET_METHODS } from '../constants/constants';

/**
 * Hook that manages Wallet messages and functions
 * 
 * @param {Object} walletConnection - Result of useWalletConnection Hooks
 * @returns {Object} - Message and wallet functions
 */
export function useWalletMessages(walletConnection) {
    const { connected, setStatus } = walletConnection;

    const [messages, setMessages] = useState([]);

    //Event-Listener for messages
    useEffect(() => {
        const handleMessage = (data) => {
            try {
                if (data.type === 'response') {
                    
                    if (data.method === WALLET_METHODS.SIGN_TX) {
                        if (data.error) {
                            addMessage('Wallet', `Transaction REJECTED: ${data.error}`);
                        } else {
                            addMessage('Wallet', `Transaction SIGNED! Hash: ${data.data.txHash}`);
                            addMessage('Wallet', `Signature: ${data.data.signature}`);
                        }
                    } else {
                        addMessage('Wallet', `${data.method}: ${JSON.stringify(data.data)}`);
                    }
                } else if (data.message) {
                    //Simple text message
                    addMessage('Wallet', data.message);
                } else {
                    //Unknown format
                    addMessage('Wallet', JSON.stringify(data));
                }
            } catch (e) {
                addMessage('Wallet', String(data));
            }
        };

        walletService.on('message', handleMessage);

        return () => {
            walletService.off('message', handleMessage);
        };
    }, []);

    //Add a message
    const addMessage = useCallback((from, text) => {
        setMessages(prev => [
            ...prev,
            {
                from,
                text,
                time: new Date().toLocaleTimeString()
            }
        ]);
    }, []);

    //Add a system messge
    const addSystemMessage = useCallback((text) => {
        addMessage('System', text);
    }, [addMessage]);

    //Send a text message
    const sendMessage = useCallback((text) => {
        if (!connected) return false;

        const success = walletService.sendMessage(text);

        if (success) {
            addMessage('dApp', text);
        }

        return success;
    }, [connected, addMessage]);

    //Call a wallet function
    const callWalletFunction = useCallback((method, data = null) => {
        if (!connected) return false;

        const success = walletService.callWalletFunction(method, data);

        if (success) {
            addMessage('dApp', `Called: ${method}`);
        }

        return success;
    }, [connected, addMessage]);

    //Sign a transaction
    const signTransaction = useCallback((txData = null) => {
        if (!connected) {
            console.log("Cannot sign tx: Not connected to wallet");
            return false;
        }

        console.log("Sending sign transaction request");
        const success = walletService.signTransaction(txData);

        if (success) {
            addMessage('dApp', 'Requesting transaction signature...');
            setStatus("Waiting for transaction approval...");

        } else {
            console.error("Failed to send transaction signing request");
        }

        return success;
    }, [connected, addMessage, setStatus]);

    return {
        messages,
        sendMessage,
        callWalletFunction,
        signTransaction,
        addMessage,
        addSystemMessage
    };
}