
import React, { useState, useEffect } from 'react';

import { usePeerConnection } from '../hooks/usePeerConnection';
import { useWalletConnection } from '../hooks/useWalletConnection.jsx';
import { useWalletMessages } from '../hooks/useWalletMessages';

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

    //Hooks
    const peerConnection = usePeerConnection();
    const walletConnection = useWalletConnection(peerConnection);
    const walletMessages = useWalletMessages(walletConnection);

    const { peerId, isReady } = peerConnection;
    const { walletId, connected, disconnectWallet } = walletConnection;
    const { messages, signTransaction, addSystemMessage } = walletMessages;

    useEffect(() => {
        addSystemMessage("Welcome. Incoming Messages are displayed here.");
    }, [addSystemMessage]);

    //Toggle for messages
    const toggleMessages = () => {
        setShowMessages(prev => !prev);
    };

    //Handler for wallet connection
    const handleConnectWallet = (type) => {

        if (type === null) {

            addSystemMessage("Disconnecting wallet...");
            walletConnection.disconnectWallet();
            setConnectedWalletId(null);
            setSelectedWallet(null);
            return;
        }

        if (!isReady) return;

        if (type === 'cip158') {
            //CIP-158 Connection
            setShowConnectModal(true);
        }
    };

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
    const handlePurchase = (purchaseData) => {
        setCurrentTransaction(purchaseData);
        setShowTransaction(true);
        addSystemMessage(`Purchase started: ${purchaseData.productName} for ${purchaseData.amount}`);
    };

    //Transaction confirmation
    const confirmTransaction = () => {
        if (currentTransaction) {
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
                walletId={walletId}
                messageCount={messages.length}
                onToggleMessages={toggleMessages}
                connectedWalletId={connectedWalletId}
                onDisconnect={disconnectWallet}
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

                <NftShop
                    connected={connected}
                    onPurchase={handlePurchase}
                />
            </div>


            {showTransaction && currentTransaction && (
                <TransactionModal
                    transaction={currentTransaction}
                    onConfirm={confirmTransaction}
                    onCancel={() => setShowTransaction(false)}
                />
            )}

            {showConnectModal && (
                <WalletConnectModal
                    onConfirm={confirmWalletConnect}
                    onCancel={cancelWalletConnect}
                />
            )}
        </div>
    );
}