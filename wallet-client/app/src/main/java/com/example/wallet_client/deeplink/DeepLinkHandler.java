package com.example.wallet_client.deeplink;

import android.app.ActivityManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.Toast;

import android.util.Log;

import com.example.wallet_client.model.ConnectionRequest;
import com.example.wallet_client.ui.WalletConnectionActivity;

import java.util.List;

/**
 * Deep Link Handler for wallet:// scheme
 * 
 * Responsibilities:
 * - Parses wallet:// deep links from QR codes
 * - Routes connection requests to MainActivity
 * - Validates deep link format and required parameters
 * 
 * Supported Deep Link Format:
 * - wallet://connect?dappPeer=xyz - Initiates P2P connection to dApp
 * 
 * Flow:
 * 1. User scans QR code containing wallet://connect?dappPeer=xyz
 * 2. MainActivity receives Intent with wallet:// URI
 * 3. Calls handleIntent() to parse and validate
 * 4. Extracts dappPeer parameter
 * 5. Creates ConnectionRequest and calls MainActivity.onConnectionRequest()
 * 6. MainActivity starts WalletConnectionActivity with dApp peer ID
 * 
 * Used by:
 * - MainActivity (implements DeepLinkListener)
 */
public class DeepLinkHandler {
    
    private static final String TAG = "DeepLinkHandler";


    /**
     * Listener interface for deep link events
     * Implemented by MainActivity
     */
    public interface DeepLinkListener {

        /**
         * Called when a connection request is received via QR code
         * @param request Connection request with dApp peer ID
         */
        void onConnectionRequest(ConnectionRequest request);
    }
    
    private final DeepLinkListener listener;
    private final Context context;
    
    /**
     * Constructor
     * 
     * @param listener The listener to handle deep link events (MainActivity)
     */
    public DeepLinkHandler(DeepLinkListener listener) {
        this.listener = listener;
        this.context = (Context) listener;
    }
    
    /**
     * Handle wallet:// deep links
     * 
     * Supported format:
     * - wallet://connect?dappPeer=xyz - Connection request from dApp
     * 
     * Validates scheme and delegates to connection handler.
     * 
     * @param intent Intent containing the deep link URI
     */
    public void handleIntent(Intent intent) {
        Uri data = intent.getData();
    
        if (data == null || !"wallet".equals(data.getScheme())) {
            Log.d(TAG, "Not a wallet:// deep link");
            return;
        }
    
        String host = data.getHost();
        Log.d(TAG, "Handling QR wallet deep link: " + data.toString());
    
        switch (host) {
            case "connect":
                handleConnectionRequest(data);
                break;
                
            default:
                Log.w(TAG, "Unknown wallet deep link host: " + host);
                Toast.makeText(context, "Unknown wallet action: " + host, Toast.LENGTH_SHORT).show();
                break;
        }
    }
    
    /**
     * Handle connection request deep link
     * 
     * Expected format: wallet://connect?dappPeer=xyz
     * Extracts dApp peer ID and forwards to MainActivity listener.
     * 
     * @param data URI containing the dappPeer query parameter
     */
    private void handleConnectionRequest(Uri data) {
        String dappPeerId = data.getQueryParameter("dappPeer");

        String host = data.getQueryParameter("host");
        String portStr = data.getQueryParameter("port");
        String path = data.getQueryParameter("path");
        String secureStr = data.getQueryParameter("secure");

        // Default value if parameter is missing
        int port = (portStr != null && !portStr.isEmpty()) ? Integer.parseInt(portStr) : 0;
        boolean secure = !"false".equalsIgnoreCase(secureStr);
        
        if (dappPeerId != null) {
            Log.d(TAG, "Processing connection request from: " + dappPeerId);
            ConnectionRequest request = new ConnectionRequest(dappPeerId, host, port, path, secure);
            listener.onConnectionRequest(request);
        } else {
            Log.e(TAG, "Missing dappPeer parameter in connection request");
            Toast.makeText(context, "Invalid connection request: missing dApp ID", Toast.LENGTH_SHORT).show();
        }
    }
}