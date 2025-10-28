package com.example.wallet_client.model;

/**
 * Connection Request Model
 * 
 * Represents a dApp connection request initiated via QR code scan.
 * This is a simple immutable data object containing only the dApp's PeerJS ID.
 * 
 * Flow:
 * 1. User scans QR code containing wallet://connect?dappPeer=xyz
 * 2. DeepLinkHandler extracts dappPeer parameter
 * 3. Creates ConnectionRequest instance
 * 4. Forwards to MainActivity.onConnectionRequest()
 * 5. MainActivity starts WalletConnectionActivity with dApp peer ID
 * 
 */
public class ConnectionRequest {
    
    /** PeerJS ID of the dApp requesting connection */
    private final String dappPeerId;
    
    /**
     * Constructor - Creates immutable connection request
     * 
     * @param dappPeerId PeerJS ID of the dApp (extracted from QR code)
     */
    public ConnectionRequest(String dappPeerId) {
        this.dappPeerId = dappPeerId;
    }
    
    /**
     * Get dApp peer ID
     * 
     * @return PeerJS ID of the requesting dApp
     */
    public String getDappPeerId() { 
        return dappPeerId; 
    }
}