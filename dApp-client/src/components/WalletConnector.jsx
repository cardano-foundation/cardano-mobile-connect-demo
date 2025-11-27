
import React, { useState, useEffect } from 'react';

import { usePeerConnection } from '../hooks/usePeerConnection';
import { useWalletConnection } from '../hooks/useWalletConnection.jsx';
import { useWalletMessages } from '../hooks/useWalletMessages';

import serviceManager from '../services/serviceManager';
import inAppWalletService from '../services/inAppWalletService';

import Navigation from './Navigation';
import NftShop from './NFTShop';
import MessageList from './MessageList';
import TransactionModal from './TransactionModal';
import WalletConnectModal from './WalletConnectModal';

/**
 * Main Component for shop
 */
export default function WalletConnector() {
    const [showMessages, setShowMessages] = useState(false);
    const [showTransaction, setShowTransaction] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [currentTransaction, setCurrentTransaction] = useState(null);
    const [connectedWalletId, setConnectedWalletId] = useState(null);

    const [connectionMode, setConnectionMode] = useState(null);

    //Hooks
    const peerConnection = usePeerConnection();
    const walletConnection = useWalletConnection(peerConnection);
    const walletMessages = useWalletMessages(walletConnection);

    const { peerId, isReady } = peerConnection;
    const { walletId, connected: p2pConnected, disconnectWallet } = walletConnection;
    const { messages, signTransaction, addSystemMessage } = walletMessages;

    //Check for connection mode
    const connected = connectionMode === 'in-app-browser' 
        ? inAppWalletService.isWalletBrowser()
        : p2pConnected;

    useEffect(() => {
        console.log('WalletConnector: Checking for connection mode...');
        
        const checkConnectionMode = () => {
            const mode = serviceManager.getConnectionMode();
            console.log('Connection mode check:', mode);
            
            if (mode !== null) {
                console.log('Connection mode detected:', mode);
                setConnectionMode(mode);
                return true;
            }
            return false;
        };

        if (!checkConnectionMode()) {
            console.log('Connection mode not ready yet, starting polling...');
            
            const interval = setInterval(() => {
                if (checkConnectionMode()) {
                    console.log('Polling stopped - connection mode ready');
                    clearInterval(interval);
                }
            }, 100);

            // Cleanup
            return () => {
                console.log('Cleaning up connection mode polling');
                clearInterval(interval);
            };
        }
    }, []);

    useEffect(() => {
        if (connectionMode === 'in-app-browser') {
            addSystemMessage("Connected via Wallet In-App Browser (CIP-158)");
            console.log('Running in In-App Browser mode');
        } else if (connectionMode === 'p2p') {
            addSystemMessage("Welcome. Connect your wallet via QR code or open this dApp in your wallets In-App Browser.");
            console.log('Running in P2P mode');
        } else {
            console.log('Connection mode still pending...');
        }
    }, [connectionMode, addSystemMessage]);

    //Toggle for messages
    const toggleMessages = () => {
        setShowMessages(prev => !prev);
    };

    //Handler for wallet connection
    const handleConnectWallet = (type) => {

        //Disconnect (only p2p)
        if (type === null && connectionMode === 'p2p') {

            addSystemMessage("Disconnecting wallet...");
            walletConnection.disconnectWallet();
            setConnectedWalletId(null);
            return;
        }

        if (connectionMode === 'in-app-browser') {
            addSystemMessage("Already connected via Wallet Browser");
            return;
        }

        if (!isReady) return;

        if (type === 'cip158') {
            //CIP-158 Connection
            setShowConnectModal(true);
        }
    };

    const handleDisconnect = () => {
        console.log('Disconnect requested, mode:', connectionMode);

        if (connectionMode === 'in-app-browser') {
            // In-App Browser closes webView
            console.log('Closing In-App Browser WebView');
            addSystemMessage("Closing wallet browser");
            
            inAppWalletService.disconnect();
        } else if (connectionMode === 'p2p') {
            // P2P Mode
            console.log('Disconnecting P2P connection');
            addSystemMessage("Disconnecting wallet");
            
            disconnectWallet();
            setConnectedWalletId(null);
        }
    };

    // Confirm CIP-158 Deep Link
    const confirmWalletConnect = () => {
        setShowConnectModal(false);
    
        addSystemMessage("Opening wallet via CIP-158...");
    
        //CIP-158 Deep Link creation
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        const deepLink = `web+cardano://browse/v1/${url.protocol.replace(':', '')}/${url.host}${url.pathname}${url.search}${url.hash}`;
    
        //open wallet
        window.location.href = deepLink;
    };

    const cancelWalletConnect = () => {
        setShowConnectModal(false);
        addSystemMessage("Wallet connection cancelled by user");
    };

    //Purchase
    const handlePurchase = async (purchaseData) => {
        setCurrentTransaction(purchaseData);
        
        if (connectionMode === 'in-app-browser') {
            //In-App
            try {
                addSystemMessage(`Signing transaction in wallet: ${purchaseData.productName}`);
                
                const signature = await inAppWalletService.signTransaction(purchaseData);
                
                addSystemMessage(`Transaction signed! Signature: ${signature.substring(0, 20)}...`);
                
            } catch (error) {
                addSystemMessage(`Transaction rejected: ${error.message}`);
            }
        } else {

            setShowTransaction(true);
            addSystemMessage(`Purchase started: ${purchaseData.productName} for ${purchaseData.amount}`);
        }
    };

    //Transaction confirmation (p2p only)
    const confirmTransaction = () => {
        if (currentTransaction && connectionMode === 'p2p') {
            signTransaction(currentTransaction);
            setShowTransaction(false);
        }
    };

    return (
        <div style={{
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
            maxWidth: '100%',
            margin: '0',
            padding: '0'
        }}>

            <Navigation
                peerId={peerId}
                isReady={isReady}
                connected={connected}
                onConnectWallet={handleConnectWallet}
                walletId={connectionMode === 'in-app-browser' ? 'In-App Wallet' : walletId}
                messageCount={messages.length}
                onToggleMessages={toggleMessages}
                connectedWalletId={connectedWalletId}
                onDisconnect={handleDisconnect}
            />

            <div style={{
                position: 'relative',
                padding: '0 16px',
                maxWidth: '1400px',
                margin: '0 auto',
                boxSizing: 'border-box'
            }}>

                {showMessages && (
                    <MessageList messages={messages} />
                )}

                {connectionMode === 'in-app-browser' && (
                    <div style={{
                        padding: '12px',
                        marginBottom: '20px',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        color: '#8B5CF6',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        Connected via Wallet In-App Browser (CIP-158)
                    </div>
                )}

                <NftShop
                    connected={connected}
                    onPurchase={handlePurchase}
                />
            </div>


            {showTransaction && currentTransaction && connectionMode === 'p2p' && (
                <TransactionModal
                    transaction={currentTransaction}
                    onConfirm={confirmTransaction}
                    onCancel={() => setShowTransaction(false)}
                />
            )}

            {showConnectModal && connectionMode === 'p2p' && (
                <WalletConnectModal
                    onConfirm={confirmWalletConnect}
                    onCancel={cancelWalletConnect}
                />
            )}
        </div>
    );
}