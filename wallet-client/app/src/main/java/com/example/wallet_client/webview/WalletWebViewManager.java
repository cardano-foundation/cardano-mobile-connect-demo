package com.example.wallet_client.webview;

import android.annotation.SuppressLint;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.example.wallet_client.model.TransactionRequest;

import java.util.function.Consumer;

/**
 * WebView Manager for Wallet P2P Connection
 * 
 * Responsibilities:
 * - Loads wallet.html with PeerJS functionality
 * - Manages Android-JavaScript bridge communication
 * - Handles P2P connection lifecycle
 * - Processes transaction signature requests from dApp
 */
public class WalletWebViewManager {

    //Prevents multiple calls for the ready check
    private boolean walletReadyCallbackExecuted = false;

    private Runnable onPageFinishedCallback;
    
    /**
     * Listener interface for WebView events
     * Implemented by WalletConnectionActivity
     */
    public interface WebViewListener {
        void onWalletReady(String walletId);
        void onP2PConnected(String dappPeerId);
        void onTransactionRequest(TransactionRequest request);
        void onError(String error);
        void onP2PConnectionClosed();
    }
    
    private final WebView webView;
    private final WebViewListener listener;
    
    /**
     * Constructor
     * 
     * @param webView WebView instance from WalletConnectionActivity
     * @param listener Event listener for wallet events
     */
    public WalletWebViewManager(WebView webView, WebViewListener listener) {
        this.webView = webView;
        this.listener = listener;
        setupWebView();
    }
    
    /**
     * Setup WebView configuration and load wallet.html
     */
    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        //Enable JavaScript and local storage for wallet functionality
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        
        //Setup console logging for debugging
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage cm) {
                android.util.Log.d("WalletConsole", 
                    cm.message() + " -- Line " + cm.lineNumber());
                return true;
            }
        });
        
        //Setup page loading handler
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);

                if (onPageFinishedCallback != null) {
                    onPageFinishedCallback.run();
                    onPageFinishedCallback = null;
                }
            }
        });
        
        //Add JavaScript bridge for Android communication
        webView.addJavascriptInterface(new WalletJsBridge(), "Android");
        
        //Load the wallet HTML
        webView.loadUrl("file:///android_asset/wallet.html");
    }

    /**
     * Set callback for page finished event
     * 
     * @param callback Callback to execute when page finishes loading
     */
    public void setOnPageFinishedCallback(Runnable callback) {
        this.onPageFinishedCallback = callback;
    }
    
    /**
     * Force PeerJS reconnect
     * Called when wallet needs to reconnect to PeerJS server
     */
    public void forceReconnect() {
        webView.evaluateJavascript("if(window.forceReconnectForP2P) window.forceReconnectForP2P();", null);
    }
    
    /**
     * Check if wallet is ready (PeerJS connected and wallet ID available)
     * 
     * @param onReady Callback when wallet is ready
     * @param onTimeout Callback when timeout occurs
     */
    public void checkWalletReady(Runnable onReady, Runnable onTimeout) {
        walletReadyCallbackExecuted = false;
        checkWalletReadyRecursive(onReady, onTimeout, 0, 20);
    }
    
    /**
     * Recursive helper for wallet ready check
     * Retries every 500ms up to maxAttempts
     * 
     * @param onReady Callback when wallet is ready
     * @param onTimeout Callback when max attempts reached
     * @param attempts Current attempt number
     * @param maxAttempts Maximum number of attempts
     */
    private void checkWalletReadyRecursive(Runnable onReady, Runnable onTimeout, 
                                      int attempts, int maxAttempts) {
        //Checks if wallet is ready
        webView.evaluateJavascript("window.walletId", result -> {
            boolean isReady = result != null && 
                             !result.equals("null") && 
                             !result.equals("undefined") &&
                             !result.isEmpty();
        
            System.out.println("Wallet ready check - walletId: " + result + " isReady: " + isReady);
        
            if (isReady && !walletReadyCallbackExecuted) {
                walletReadyCallbackExecuted = true;
                onReady.run();
            } else if (!isReady && attempts < maxAttempts) {
                webView.postDelayed(() -> 
                    checkWalletReadyRecursive(onReady, onTimeout, attempts + 1, maxAttempts), 
                    500);
            } else if (!isReady) {
                onTimeout.run();
            }
        });
    }
    
    /**
     * Send transaction result to dApp
     * Called after user approves/rejects transaction in dialog
     * 
     * @param requestId Transaction request ID
     * @param approved True if approved, false if rejected
     * @param signature Mock signature (or null if rejected)
     */
    public void sendTransactionResult(String requestId, boolean approved, String signature) {
            String js = String.format("if(window.sendTransactionResult) window.sendTransactionResult('%s', %b, '%s');", 
            requestId, approved, signature != null ? signature : "");
        webView.evaluateJavascript(js, null);
    }
    
    /**
     * Get wallet ID from WebView
     * 
     * @param callback Callback with wallet ID (or null if not ready)
     */
    public void getWalletId(Consumer<String> callback) {
        webView.evaluateJavascript("window.walletId", result -> {
            String walletId = result != null && !result.equals("null") ? result.replace("\"", "") : null;
            callback.accept(walletId);
        });
    }

    /**
     * Connect to a specific dApp with custom server config
     */
    public void connectToDappWithConfig(String dappPeerId, String host, int port, String path, boolean secure) {
        String js = String.format(
            "window.connectToDappWithConfig && window.connectToDappWithConfig('%s', '%s', %d, '%s', %b)", 
            dappPeerId, host, port, path, secure
        );
        webView.evaluateJavascript(js, null);
    }

    /**
     * Connect to a specific dApp (QR-initiated connection)
     * 
     * @param dappPeerId PeerJS ID of the dApp to connect to
     */
    public void connectToDapp(String dappPeerId) {
        // Einfacher Aufruf ohne komplexen String-Bau
        webView.evaluateJavascript(
            "window.connectToDapp && window.connectToDapp('" + dappPeerId + "')", 
            null
        );
    }
    
    /**
     * JavaScript bridge class for Android-WebView communication
     * Provides methods that can be called from JavaScript (wallet.html)
     */
    private class WalletJsBridge {

        /**
         * Called when wallet is ready (PeerJS connected)
         * 
         * @param walletId The wallet's PeerJS ID
         */
        @JavascriptInterface
        public void onWalletReady(String walletId) {
            listener.onWalletReady(walletId);
        }
        
        /**
         * Called when P2P connection is established with dApp
         * 
         * @param dappPeerId PeerJS ID of connected dApp
         */
        @JavascriptInterface
        public void onConnected(String dappPeerId) {
            listener.onP2PConnected(dappPeerId);
        }
        
        /**
         * Message Handler
         * 
         * @param message Message from dApp
         */
        @JavascriptInterface
        public void onMessage(String message) {
        }
        
        /**
         * Called when error occurs in JavaScript
         * 
         * @param error Error message
         */
        @JavascriptInterface
        public void onError(String error) {
            listener.onError(error);
        }
        
        /**
         * Called when dApp requests transaction signature
         * Parses JSON request and forwards to activity
         * 
         * @param requestJson JSON string with transaction data
         */
        @JavascriptInterface
        public void requestTransactionSignature(String requestJson) {
            try {
                //Parse transaction request from dApp
                org.json.JSONObject request = new org.json.JSONObject(requestJson);
                org.json.JSONObject txData = request.getJSONObject("data");
                
                //Create transaction request object
                TransactionRequest txRequest = new TransactionRequest(
                    request.getString("id"),
                    txData.optString("type", "Unknown"),
                    txData.optString("amount", "Unknown"),
                    txData.optString("recipient", "Unknown"),
                    txData.optString("fee", "Unknown"),
                    txData.optString("metadata", "None")
                );
                
                //Forward to listener
                listener.onTransactionRequest(txRequest);
                
            } catch (Exception e) {
                listener.onError("Error parsing transaction request: " + e.getMessage());
            }
        }

        /**
         * Called when P2P connection is closed
         * Triggered when dApp closes connection or connection is lost
         */
        @JavascriptInterface
        public void onP2PConnectionClosed() {
            if (listener != null) {
                listener.onP2PConnectionClosed();
            }
        }

    }

    /**
     * Preserve WebView state when activity goes to background
     * Ensures P2P connection stays alive
     */
    public void preserveWebViewState() {
        //Tell WebView to stay alive even when in background
        webView.evaluateJavascript(
            "console.log('WebView going to background - keeping P2P connection alive');", 
            null);
    }

    /**
     * Check P2P connection status
     * 
     * @param callback Callback with true if connected, false otherwise
     */
    public void checkP2PStatus(Consumer<Boolean> callback) {
        webView.evaluateJavascript(
            "(function() { return connection && connection.open ? true : false; })();",
            result -> callback.accept("true".equals(result))
        );
    }

    /**
     * Cleanup WebView resources
     * Called when WalletConnectionActivity is destroyed
     */
    public void cleanup() {
        try {

            //Clear callback
            onPageFinishedCallback = null;

            //Clean up JavaScript resources
            webView.evaluateJavascript("if(window.cleanupWallet) window.cleanupWallet();", null);
        
            //Clear WebView
            webView.loadUrl("about:blank");
        
            webView.removeJavascriptInterface("Android");
        
            android.util.Log.d("WalletWebViewManager", "WebView cleanup complete");

            walletReadyCallbackExecuted = false;
        } catch (Exception e) {
            android.util.Log.e("WalletWebViewManager", "Error during cleanup: " + e.getMessage());
        }
    }   
}    