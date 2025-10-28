package com.example.wallet_client.ui;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.webkit.WebView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import android.util.Log;

import com.example.wallet_client.R;
import com.example.wallet_client.model.ConnectionRequest;
import com.example.wallet_client.model.TransactionRequest;
import com.example.wallet_client.webview.WalletWebViewManager;

import com.example.wallet_client.MainActivity;

/**
 * Wallet Connection Activity - WebView for P2P Connection Management
 * 
 * Responsibilities:
 * - Handles QR-code initiated dApp connections
 * - Manages P2P connection lifecycle via WebView
 * - Shows approval dialogs for connections and transactions
 * - Automatically returns to MainActivity when connection closes
 * 
 * Lifecycle:
 * 1. Started by MainActivity when QR code is scanned
 * 2. Shows connection approval dialog
 * 3. Establishes P2P connection if approved
 * 4. Handles transaction requests from dApp
 * 5. Closes and returns to MainActivity when P2P connection ends
 */
public class WalletConnectionActivity extends AppCompatActivity 
    implements WalletWebViewManager.WebViewListener,
               DialogManager.ConnectionDialogListener,
               DialogManager.TransactionDialogListener {


    private static final String TAG = "WalletConnectionActivity";

    private WalletWebViewManager webViewManager;
    private DialogManager dialogManager;
    private TextView connectionHeaderText;
    
    private String dappPeerId;
    private TransactionRequest pendingTransactionRequest;

    private boolean isInitialLaunch = true;

    /**
     * Activity creation and initialization
     * 
     * Flow:
     * 1. Extract dApp peer ID from intent
     * 2. Initialize UI components
     * 3. Setup WebView with wallet.html
     * 4. Start connection process (PeerJS initialization)
     * 
     * @param savedInstanceState Bundle with saved state
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.d(TAG, "onCreate - Intent: " + getIntent().getDataString());

        setContentView(R.layout.activity_wallet_connection);
        
        initializeFromIntent();
        initializeViews();
        initializeComponents();
        startConnection();
    }

    /**
     * Return to MainActivity and finish this activity
     * Clears activity stack to ensure MainActivity is on top
     */
    private void returnToMainActivity() {
        Intent intent = new Intent(this, MainActivity.class);

        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        //Finish WalletConnectionActivity
        finish();
    }

    /**
     * Extract dApp peer ID from QR-code scan intent
     * Finishes activity if no valid peer ID is provided
     */
    private void initializeFromIntent() {
        Intent intent = getIntent();
        dappPeerId = intent.getStringExtra("dapp_peer_id");
        
        Log.d(TAG, "QR-Code connection to dApp: " + dappPeerId);
        
        if (dappPeerId == null) {
            Log.e(TAG, "No dApp peer ID provided - invalid QR connection");
            Toast.makeText(this, "Invalid QR connection", Toast.LENGTH_SHORT).show();
            finish();
        }
    }

    /**
     * Initialize UI elements
     * Sets connection header text with dApp peer ID
     */
    private void initializeViews() {
        connectionHeaderText = findViewById(R.id.connectionHeaderText);
        
        if (dappPeerId != null) {
            connectionHeaderText.setText("QR Connection: " + dappPeerId);
        } else {
            connectionHeaderText.setText("QR dApp Connection");
        }
    }

    /**
     * Initialize core components
     * Creates WebView manager and dialog manager instances
     */
    private void initializeComponents() {
        WebView webView = findViewById(R.id.connectionWebView);
        
        webViewManager = new WalletWebViewManager(webView, this);
        dialogManager = new DialogManager(this);
    }

    /**
     * Start wallet connection process
     * 
     * Flow:
     * 1. Force PeerJS reconnect to ensure fresh connection
     * 2. Wait for wallet to be ready (PeerJS connected)
     * 3. Show connection approval dialog
     * 4. If timeout occurs, return to MainActivity
     */
    private void startConnection() {
        Toast.makeText(this, "Preparing wallet connection...", Toast.LENGTH_SHORT).show();
        
        // Force reconnect and wait for wallet ready
        webViewManager.forceReconnect();
        
        webViewManager.checkWalletReady(
            () -> {
                runOnUiThread(() -> {
                    
                    if (dappPeerId != null) {
                        //Show connection approval dialog
                        dialogManager.showConnectionDialog(dappPeerId, this);
                    }
                });
            },
            () -> {
                runOnUiThread(() -> {
                    Toast.makeText(this, "Wallet connection timeout", Toast.LENGTH_LONG).show();
                    returnToMainActivity();
                });
            }
        );
    }

    // ===========================================
    // WebView Listener Implementation
    // ===========================================

    /**
     * Called when wallet is ready (PeerJS connected)
     * 
     * @param walletId The wallet's PeerJS ID
     */
    @Override
    public void onWalletReady(String walletId) {
        runOnUiThread(() -> {
            Toast.makeText(this, "Wallet ready", Toast.LENGTH_SHORT).show();
        });
    }

    /**
     * Called when P2P connection is established with dApp
     * Marks connection as active in SharedPreferences
     * 
     * @param dappPeerId PeerJS ID of connected dApp
     */
    @Override
    public void onP2PConnected(String dappPeerId) {
        runOnUiThread(() -> {

            SharedPreferences prefs = getSharedPreferences("wallet_connection", MODE_PRIVATE);
            prefs.edit().putBoolean("active_connection", true).apply();
            Toast.makeText(this, "P2P connection established", Toast.LENGTH_SHORT).show();

        });
    }

    /**
     * Called when dApp requests transaction signature
     * 
     * Shows transaction approval dialog on UI thread with delay to ensure
     * activity is in foreground and not finishing/destroyed
     * 
     * @param request Transaction request from dApp
     */
    @Override
    public void onTransactionRequest(TransactionRequest request) {
        this.pendingTransactionRequest = request;
    
        //Don't show dialogs if activity is finishing
        if (isFinishing() || isDestroyed()) {
            Log.e(TAG, "Cannot show transaction dialog - activity finishing/destroyed");
            return;
        }
    
        //Execute on UI thread with delay to ensure activity is ready
        new Handler(getMainLooper()).postDelayed(() -> {
            //Final check before showing dialog
            if (!isFinishing() && !isDestroyed()) {
                dialogManager.showTransactionDialog(request, this);
            }
        }, 200);
    }

    /**
     * Called when P2P connection errors occur
     * 
     * Checks if P2P connection is still active:
     * - If active: Show warning but keep connection alive
     * - If inactive: Return to MainActivity
     * 
     * @param error Error message from JavaScript
     */
    @Override
    public void onError(String error) {
        runOnUiThread(() -> {
            checkP2PConnectionStatus(isConnected -> {
                //Connection is still active despite error
                if (isConnected) {
                    Toast.makeText(this, "PeerJS server warning (P2P still active)", Toast.LENGTH_SHORT).show();
                    
                    SharedPreferences prefs = getSharedPreferences("wallet_connection", MODE_PRIVATE);
                    prefs.edit().putBoolean("active_connection", true).apply();
                //Connection is lost => return to MainActivity
                } else {
                    Toast.makeText(this, "QR connection lost: " + error, Toast.LENGTH_LONG).show();
                    
                    SharedPreferences prefs = getSharedPreferences("wallet_connection", MODE_PRIVATE);
                    prefs.edit().putBoolean("active_connection", false).apply();
                    
                    new Handler().postDelayed(() -> {
                        returnToMainActivity();
                    }, 2000);
                }
            });
        });
    }

    /**
     * Check P2P connection status via JavaScript
     * 
     * @param callback Callback with connection status (true = connected)
     */
    private void checkP2PConnectionStatus(java.util.function.Consumer<Boolean> callback) {
        webViewManager.checkP2PStatus(callback);
    }

    // ===========================================
    // Connection Dialog Listener Implementation
    // ===========================================

    /**
     * User approved the dApp connection
     * Initiates P2P connection to dApp via WebView
     */
    @Override
    public void onConnectionApproved() {
        Log.d(TAG, "User approved QR connection to dApp: " + dappPeerId);
    
        //Initiate P2P connection
        webViewManager.connectToDapp(dappPeerId);
    
        Toast.makeText(this, "Connecting to dApp...", Toast.LENGTH_LONG).show();
    }

    /**
     * User denied the dApp connection
     * Returns to MainActivity without establishing connection
     */
    @Override
    public void onConnectionDenied() {
        Toast.makeText(this, "QR connection denied", Toast.LENGTH_SHORT).show();
        returnToMainActivity();
    }

    // ===========================================
    // Transaction Dialog Listener Implementation
    // ===========================================

    /**
     * User approved the transaction
     * Sends approval with mock signature back to dApp
     * 
     * @param signature Mock signature string
     */
    @Override
    public void onTransactionApproved(String signature) {
        if (pendingTransactionRequest != null) {
        
            webViewManager.sendTransactionResult(
                pendingTransactionRequest.getId(), true, signature);
        
            Toast.makeText(this, "Transaction signed! Wallet ready for more transactions.", 
                Toast.LENGTH_LONG).show();
        
        }
    }

    /**
     * User rejected the transaction
     * Sends rejection back to dApp
     */
    @Override
    public void onTransactionRejected() {
        if (pendingTransactionRequest != null) {
            webViewManager.sendTransactionResult(
                pendingTransactionRequest.getId(), false, null);
        
            Toast.makeText(this, "Transaction rejected", Toast.LENGTH_SHORT).show();
        
        }
    }

    // ===========================================
    // Activity Lifecycle
    // ===========================================

    /**
     * Activity going to background
     * Preserves WebView state to keep P2P connection alive
     */
    @Override
    protected void onPause() {
        super.onPause();

        Log.d(TAG, "onPause");

        //Preserve WebView state
        if (webViewManager != null) {
            //Tell WebView to stay alive in background
            webViewManager.preserveWebViewState();
        }
    }

    /**
     * Activity coming to foreground
     * 
     * Behavior differs on first launch vs. returning:
     * - First launch: Skip check (connection not established yet)
     * - Returning: Check if P2P connection is still active
     *   - If inactive: Return to MainActivity
     *   - If active: Stay in activity
     */
    @Override 
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "onResume");

        //Different Logic, when app is started for the first time

        if (isInitialLaunch) {
            isInitialLaunch = false;
            return;
        }

        if (webViewManager != null) {

            //Wait for WebView to finish loading before checking status
            webViewManager.setOnPageFinishedCallback(() -> {
                Log.d(TAG, "WebView page finished loading, now checking P2P status.");
                webViewManager.checkP2PStatus(isConnected -> {
                    if (!isConnected) {

                        Log.w(TAG, "onResume: No active P2P connection found. Returning to MainActivity.");
                        Toast.makeText(this, "No active connection.", Toast.LENGTH_SHORT).show();
                        returnToMainActivity();
                    }
                });
            });
        }
    }

    /**
     * Activity stopping (going to background or finishing)
     * Dismiss any open dialogs to prevent window leaks
     */
    @Override
    protected void onStop() {
        super.onStop();

        Log.d(TAG, "onStop");

        if (dialogManager != null) {
            dialogManager.onActivityStop();
        }
    }

    /**
     * Activity destruction
     * Cleanup WebView and reset connection status
     */
    @Override
    protected void onDestroy() {
        super.onDestroy();

        Log.d(TAG, "onDestroy");
    

        SharedPreferences prefs = getSharedPreferences("wallet_connection", MODE_PRIVATE);
        prefs.edit().putBoolean("active_connection", false).apply();
    
        if (webViewManager != null) {
            webViewManager.cleanup();
        }
    }

    /**
     * Called when P2P connection is closed by dApp
     * 
     * Cleanup sequence:
     * 1. Reset connection status in SharedPreferences
     * 2. Show notification to user
     * 3. Cleanup WebView
     * 4. Return to MainActivity after delay
     */
    @Override
    public void onP2PConnectionClosed() {
        runOnUiThread(() -> {
        
            // Connection-Status zurücksetzen
            SharedPreferences prefs = getSharedPreferences("wallet_connection", MODE_PRIVATE);
            prefs.edit().putBoolean("active_connection", false).apply();
        
            Toast.makeText(this, "P2P connection closed by dApp", Toast.LENGTH_LONG).show();

            webViewManager.cleanup();

            new Handler().postDelayed(() -> {
                returnToMainActivity();
            }, 500);

        });
    }

    /**
     * Handle hardware back button
     * Moves activity to background instead of destroying it
     * This keeps P2P connection alive
     */
    @Override
    public void onBackPressed() {

        moveTaskToBack(true);

    }
}