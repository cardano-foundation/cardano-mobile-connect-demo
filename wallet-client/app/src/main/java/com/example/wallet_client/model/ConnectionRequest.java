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

    /** Fields for the custom peerjs server */
    private final String host;
    private final int port;
    private final String path;
    private final boolean secure;
    
    /**
     * Constructor - Creates immutable connection request
     * 
     * @param dappPeerId PeerJS ID of the dApp (extracted from QR code)
     */
    public ConnectionRequest(String dappPeerId, String host, int port, String path, boolean secure) {
        this.dappPeerId = dappPeerId;
        this.host = host;
        this.port = port;
        this.path = path;
        this.secure = secure;
    }
    
    /**
     * Get dApp peer ID
     * 
     * @return PeerJS ID of the requesting dApp
     */
    public String getDappPeerId() { return dappPeerId; }
    public String getHost() { return host; }
    public int getPort() { return port; }
    public String getPath() { return path; }
    public boolean isSecure() { return secure; }
}