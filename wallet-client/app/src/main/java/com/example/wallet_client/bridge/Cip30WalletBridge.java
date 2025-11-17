package com.example.wallet_client.bridge;

import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.util.Log;
import org.json.JSONObject;
import org.json.JSONArray;

/**
 * CIP-30 JavaScript Bridge for In-App Browser
 * 
 * Provides Cardano wallet functionality to dApps loaded in WebView.
 * Implements CIP-30-like API via window.cardano interface.
 * 
 * CIP-30 Reference: https://cips.cardano.org/cip/CIP-0030
 */
public class Cip30WalletBridge {

    private static final String TAG = "Cip30Bridge";

    /**
     * Listener interface for bridge events
     * Implemented by Cip158BrowserActivity
     */
    public interface BridgeListener {
        /**
         * Called when dApp requests transaction signature
         * @param txId Unique transaction ID
         * @param txCbor CBOR-encoded transaction (hex string)
         * @param metadata Additional transaction metadata (JSON)
         */
        void onSignTxRequest(String txId, String txCbor, String metadata);
        
        /**
         * Called when dApp requests wallet balance
         * @param callbackId Callback ID for async response
         */
        void onGetBalance(String callbackId);
        
        /**
         * Called when dApp requests wallet addresses
         * @param callbackId Callback ID for async response
         */
        void onGetAddresses(String callbackId);
        
        /**
         * Called when error occurs in bridge
         * @param error Error message
         */
        void onError(String error);
    }

    private final WebView webView;
    private final BridgeListener listener;

    /**
     * Constructor
     * 
     * @param webView WebView instance from Cip158BrowserActivity
     * @param listener Event listener for bridge callbacks
     */
    public Cip30WalletBridge(WebView webView, BridgeListener listener) {
        this.webView = webView;
        this.listener = listener;
    }

    // ===========================================
    // CIP-30: WALLET IDENTIFICATION
    // ===========================================

    /**
     * CIP-30: Get API version
     * @return API version string
     */
    @JavascriptInterface
    public String getApiVersion() {
        return "0.1.0";
    }

    /**
     * CIP-30: Get wallet name
     * @return Wallet name
     */
    @JavascriptInterface
    public String getName() {
        return "Demo Wallet";
    }

    /**
     * CIP-30: Get wallet icon (base64 SVG)
     * @return Base64-encoded wallet icon
     */
    @JavascriptInterface
    public String getIcon() {
        // TODO
        return "";
    }

    /**
     * CIP-30: Check if wallet is enabled
     * Always true in In-App Browser
     * @return true
     */
    @JavascriptInterface
    public boolean isEnabled() {
        return true;
    }

    // ===========================================
    // CIP-30: TRANSACTION SIGNING
    // ===========================================

    /**
     * CIP-30: Sign transaction
     * 
     * Called from JavaScript with JSON request
     * 
     * @param requestJson JSON string with transaction data
     */
    @JavascriptInterface
    public void signTx(String requestJson) {
        Log.d(TAG, "signTx called with: " + requestJson);
        
        try {
            JSONObject request = new JSONObject(requestJson);
            String txId = request.getString("txId");
            String txCbor = request.optString("txCbor", "");
            String metadata = request.optString("metadata", "{}");

            // Delegate to activity
            listener.onSignTxRequest(txId, txCbor, metadata);

        } catch (Exception e) {
            Log.e(TAG, "Error parsing signTx request", e);
            listener.onError("Failed to parse signTx request: " + e.getMessage());
        }
    }

    /**
     * Send transaction result back to WebView
     * Called by activity after user approves/rejects
     * 
     * @param txId Transaction ID
     * @param approved True if approved
     * @param signature Signature hex string (or null if rejected)
     */
    public void sendTxResult(String txId, boolean approved, String signature) {
        String js;
        if (approved && signature != null) {
            // Success response
            js = String.format(
                "if(window.__cardanoCallbacks && window.__cardanoCallbacks['%s']) {" +
                "  window.__cardanoCallbacks['%s']({ success: true, signature: '%s' });" +
                "  delete window.__cardanoCallbacks['%s'];" +
                "} else { console.error('No callback for txId: %s'); }",
                txId, txId, signature, txId, txId
            );
        } else {
            // Rejection response
            js = String.format(
                "if(window.__cardanoCallbacks && window.__cardanoCallbacks['%s']) {" +
                "  window.__cardanoCallbacks['%s']({ success: false, error: 'User rejected transaction' });" +
                "  delete window.__cardanoCallbacks['%s'];" +
                "}",
                txId, txId, txId
            );
        }
        
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    // ===========================================
    // CIP-30: WALLET DATA
    // ===========================================

    /**
     * CIP-30: Get wallet balance
     * 
     * @param callbackId Callback ID for async response
     */
    @JavascriptInterface
    public void getBalance(String callbackId) {
        Log.d(TAG, "getBalance called with callbackId: " + callbackId);
        listener.onGetBalance(callbackId);
    }

    /**
     * Send balance back to WebView
     * 
     * @param callbackId Callback ID
     * @param balance Balance in Lovelace (string)
     */
    public void sendBalance(String callbackId, String balance) {
        String js = String.format(
            "if(window.__cardanoCallbacks && window.__cardanoCallbacks['%s']) {" +
            "  window.__cardanoCallbacks['%s']('%s');" +
            "  delete window.__cardanoCallbacks['%s'];" +
            "}",
            callbackId, callbackId, balance, callbackId
        );
        
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    /**
     * CIP-30: Get wallet addresses
     * 
     * @param callbackId Callback ID for async response
     */
    @JavascriptInterface
    public void getAddresses(String callbackId) {
        Log.d(TAG, "getAddresses called with callbackId: " + callbackId);
        listener.onGetAddresses(callbackId);
    }

    /**
     * Send addresses back to WebView
     * 
     * @param callbackId Callback ID
     * @param addressesJson JSON array of addresses
     */
    public void sendAddresses(String callbackId, String addressesJson) {
        String js = String.format(
            "if(window.__cardanoCallbacks && window.__cardanoCallbacks['%s']) {" +
            "  window.__cardanoCallbacks['%s'](%s);" +
            "  delete window.__cardanoCallbacks['%s'];" +
            "}",
            callbackId, callbackId, addressesJson, callbackId
        );
        
        webView.post(() -> webView.evaluateJavascript(js, null));
    }
}