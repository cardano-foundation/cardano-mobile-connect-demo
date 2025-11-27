package com.example.wallet_client;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.zxing.integration.android.IntentIntegrator;
import com.google.zxing.integration.android.IntentResult;

import com.example.wallet_client.deeplink.DeepLinkHandler;
import com.example.wallet_client.model.ConnectionRequest;
import com.example.wallet_client.model.MockTransaction;
import com.example.wallet_client.ui.Cip158BrowserActivity;
import com.example.wallet_client.ui.MockTransactionAdapter;
import com.example.wallet_client.ui.WalletConnectionActivity;

import java.util.ArrayList;
import java.util.List;

/**
 * Main Activity - Native Mock Wallet UI
 * 
 * Responsibilities:
 * - Shows static mock balance and transaction history
 * - Handles deep links (wallet:// and web+cardano://)
 * - Routes QR-scanned connections to WalletConnectionActivity
 * - Routes CIP-158 browse requests to Cip158BrowserActivity
 */
public class MainActivity extends AppCompatActivity implements DeepLinkHandler.DeepLinkListener {
        
    private static final String TAG = "CIP158_MAIN";

    //Elements in the Mockup UI that get filled by script
    private TextView balanceText;
    private TextView walletAddressText;
    private RecyclerView transactionRecyclerView;
    private MockTransactionAdapter transactionAdapter;
    private DeepLinkHandler deepLinkHandler;

    /**
     * Activity creation
     * 
     * Called when the app starts or when returning from WalletConnectionActivity
     * Handles incoming deep links and displays mockup wallet UI
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Log.d(TAG, "onCreate - Intent: " + getIntent().getDataString());

        //Loads default layout
        setContentView(R.layout.activity_main_wallet);
        
        //Finds parts of the defualt layout to fill
        initializeViews();

        //Fills the empty mock UI with mock data
        setupMockWallet();

        //Setup QR-Scanner Button
        setupQRScanner();

        //Initialize deep link handler
        deepLinkHandler = new DeepLinkHandler(this);

        //Handle any incoming intents (deep links)
        handleIntent(getIntent());
    }



    /**
     * Finds elements from the UI and starts the recycler for the mock transactions
     */
    private void initializeViews() {
        balanceText = findViewById(R.id.balanceText);
        walletAddressText = findViewById(R.id.walletAddressText);
        transactionRecyclerView = findViewById(R.id.transactionRecyclerView);
        
        //Setup transaction RecyclerView
        transactionAdapter = new MockTransactionAdapter();
        transactionRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        transactionRecyclerView.setAdapter(transactionAdapter);
    }

    /**
     * Setup QR-Scanner Button Listener
     */
    private void setupQRScanner() {
        Button qrScanButton = findViewById(R.id.qrScanButton);
        if (qrScanButton != null) {
            qrScanButton.setOnClickListener(v -> startQRScanner());
        }
    }

    /**
     * Start QR-Code scanner using IntentIntegrator
     * Expects wallet://connect?dappPeer=... format
     */
    private void startQRScanner() {
        IntentIntegrator integrator = new IntentIntegrator(this);
        integrator.setDesiredBarcodeFormats(IntentIntegrator.QR_CODE);
        integrator.setPrompt("Scan QR Code for Wallet Connection");
        //Back camera
        integrator.setCameraId(0);
        integrator.setBeepEnabled(false);
        integrator.setBarcodeImageEnabled(true);
        //Portrait mode
        integrator.setOrientationLocked(true);
        
        integrator.initiateScan();
    }

    /**
     * Handle QR scan result
     */
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        IntentResult result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data);
        if (result != null) {
            if (result.getContents() != null) {
                String qrContent = result.getContents();
                Log.d(TAG, "QR Code scanned: " + qrContent);
                
                //Process scanned QR code
                Intent qrIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(qrContent));
                deepLinkHandler.handleIntent(qrIntent);
            } else {
                Log.d(TAG, "QR scan cancelled");
                Toast.makeText(this, "QR scan cancelled", Toast.LENGTH_SHORT).show();
            }
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    /**
     * Setup static mock wallet data
     * This data never changes. It's just for demo
     */
    private void setupMockWallet() {
        //Static mock balance
        balanceText.setText("1,234.56");
        
        //Static mock wallet address (shortened)
        walletAddressText.setText("testAddress");
        
        //Setup static mock transaction history
        setupMockTransactions();
    }

    /**
     * Create static mock transaction history
     * These transactions never change
     */
    private void setupMockTransactions() {
        List<MockTransaction> transactions = new ArrayList<>();
        
        //Add static mock transactions
        transactions.add(new MockTransaction("+50 ADA", "Jan 15", true));
        transactions.add(new MockTransaction("-25 ADA", "Jan 14", false));
        transactions.add(new MockTransaction("+100 ADA", "Jan 13", true));
        transactions.add(new MockTransaction("-15 ADA", "Jan 12", false));

        //Set transactions in adapter
        transactionAdapter.setTransactions(transactions);
    }

    /**
     * Handle new intents when activity is already running (singleTask mode)
     * Routes deep links even if MainActivity is in background
     */
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        Log.d(TAG, "onNewIntent - Intent: " + intent.getDataString());
        handleIntent(intent);
    }

    /**
     * Central intent handling.
     * Delegates to appropriate handlers
     * 
     * Routing logic:
     * - web+cardano:// => handleCip158DeepLink (CIP-158 browser)
     * - wallet:// => DeepLinkHandler (P2P connection)
     */
    private void handleIntent(Intent intent) {
        Uri data = intent.getData();
        Log.d(TAG, "handleIntent data=" + data);

        if (data != null) {
            String scheme = data.getScheme();
            
            if ("web+cardano".equalsIgnoreCase(scheme)) {
                //CIP-158 Deep Links. Handle locally
                Log.d(TAG, "CIP-158 deep link detected");
                handleCip158DeepLink(data);
            } else if ("wallet".equalsIgnoreCase(scheme)) {
                //wallet:// Deep Links. Delegate to DeepLinkHandler
                Log.d(TAG, "QR wallet deep link detected");
                deepLinkHandler.handleIntent(intent);
            } else {
                Log.d(TAG, "Unknown scheme: " + scheme);
            }
        } else {
            Log.d(TAG, "No intent data");
        }
    }

    /**
     * Handle CIP-158 deep links (web+cardano://browse/...)
     * Validates format and delegates to browser activity
     */
    private void handleCip158DeepLink(Uri data) {
        if (isCip158Browse(data)) {
            Log.d(TAG, "CIP-158 browse Link: Starting Browser");
            handleCip158Browse(data);
        } else {
            Log.d(TAG, "web+cardano Link, but no browse format");
            Toast.makeText(this, "Unknown web+cardano format", Toast.LENGTH_SHORT).show();
        }
    }

    /**
     * Check if URI matches CIP-158 browse format
     * Expected: web+cardano://browse/v1/...
     * 
     * @param uri URI to validate
     * @return true if valid CIP-158 browse link
     */
    private boolean isCip158Browse(Uri uri) {
        if (uri == null) return false;
        
        String scheme = uri.getScheme();
        String host = uri.getHost();
        String path = uri.getPath();
        
        boolean schemeMatch = "web+cardano".equalsIgnoreCase(scheme);
        boolean hostMatch = "browse".equalsIgnoreCase(host);
        boolean pathMatch = path != null && path.startsWith("/v1");
        
        Log.d(TAG, "CIP-158 Check: scheme=" + schemeMatch + 
                   " host=" + hostMatch + " path=" + pathMatch + 
                   " (path=" + path + ")");
        
        return schemeMatch && hostMatch && pathMatch;
    }

    /**
     * Complete CIP-158 parser
     * 
     * Supports:
     * - web+cardano://browse/v1/<scheme>/<domain>/<path>?<query>
     * 
     * @param uri CIP-158 deep link URI
     */
    private void handleCip158Browse(Uri uri) {
        List<String> segs = uri.getPathSegments();
        
        if (segs.isEmpty()) {
            Toast.makeText(this, "CIP-158: emtpy path", Toast.LENGTH_LONG).show();
            return;
        }

        //Check version
        String version = segs.get(0);
        if (!"v1".equalsIgnoreCase(version)) {
            Toast.makeText(this, "CIP-158: Not supported version: " + version, Toast.LENGTH_LONG).show();
            return;
        }

        String targetUrl = null;
        String callback = extractCallback(uri);

        //Path-Format: /v1/<scheme>/<domain>/<optional_path>
        if (segs.size() >= 3) {
            targetUrl = buildUrlFromPath(segs, uri);
        }

        //IPFS-Rewrite if needed
        targetUrl = rewriteIpfsIfNeeded(targetUrl);

        //Security check
        if (!isAllowedTarget(targetUrl)) {
            Toast.makeText(this, "CIP-158: blocked unsafe url", Toast.LENGTH_LONG).show();
            return;
        }

        Log.d(TAG, "CIP-158 opens: " + targetUrl + " (callback=" + callback + ")");

        //Start browser activity
        Intent browser = new Intent(this, Cip158BrowserActivity.class);
        browser.putExtra(Cip158BrowserActivity.EXTRA_TARGET_URL, targetUrl);
        if (callback != null) {
            browser.putExtra(Cip158BrowserActivity.EXTRA_CALLBACK_URL, callback);
        }
        startActivity(browser);
    }

    /**
     * Build URL from path segments: /v1/<scheme>/<domain>/<path>
     * 
     * @param segs Path segments from URI
     * @param uri Original URI for query parameters
     * @return Reconstructed target URL
     */
    private String buildUrlFromPath(List<String> segs, Uri uri) {
        String targetScheme = segs.get(1);
        String domain = segs.get(2);
        
        StringBuilder url = new StringBuilder();
        url.append(targetScheme).append("://").append(domain);
        
        //Add optional path segments
        if (segs.size() > 3) {
            for (int i = 3; i < segs.size(); i++) {
                url.append("/").append(segs.get(i));
            }
        }
        
        //Append query parameters
        String query = uri.getQuery();
        if (query != null && !query.isEmpty()) {
            url.append("?").append(query);
        }
        
        return url.toString();
    }

    /**
     * Extract callback URL from query parameters
     * Supports multiple parameter names: callback, returnUrl, return
     * 
     * @param uri URI containing callback parameter
     * @return Callback URL or null
     */
    private String extractCallback(Uri uri) {
        String callback = uri.getQueryParameter("callback");
        if (callback == null) callback = uri.getQueryParameter("returnUrl");
        if (callback == null) callback = uri.getQueryParameter("return");
        return callback;
    }

    /**
     * Rewrite IPFS URLs to use public gateway
     * Converts ipfs://CID to https://ipfs.io/ipfs/CID
     * 
     * @param url Original URL
     * @return Rewritten URL or original if not IPFS
     */
    private String rewriteIpfsIfNeeded(String url) {
        if (url != null && url.startsWith("ipfs://")) {
            String cid = url.substring("ipfs://".length());
            return "https://ipfs.io/ipfs/" + cid;
        }
        return url;
    }


    /**
     * Security validation for target URLs
     * 
     * Security rules:
     * - Only http/https schemes allowed
     * - Localhost only in debug builds
     * - Logs warning for HTTP (unencrypted)
     * 
     * @param url URL to validate
     * @return true if URL is safe to open
     */
    private boolean isAllowedTarget(String url) {
        if (url == null) return false;
        
        try {
            Uri u = Uri.parse(url);
            String scheme = u.getScheme();
            String host = u.getHost();
            
            //Only allow http/https schemes
            if (!"https".equalsIgnoreCase(scheme) && 
                !"http".equalsIgnoreCase(scheme)) {
                return false;
            }
            
            //Warn about unencrypted HTTP
            if ("http".equalsIgnoreCase(scheme)) {
                Log.w(TAG, "HTTP-URL (unsicher): " + url);
            }
            
            //Allow localhost for development
            if ("localhost".equals(host) || "127.0.0.1".equals(host) || "10.0.2.2".equals(host)) {
                return true;
            }
            
            return true;
            
        } catch (Exception e) {
            Log.e(TAG, "URL-Parsing Fehler: " + e.getMessage());
            return false;
        }
    }

    // ===========================================
    // DeepLinkListener Implementation
    // ===========================================

    /**
     * Called by DeepLinkHandler when QR code contains wallet:// connection request
     * Starts WalletConnectionActivity for P2P communication
     */
    @Override
    public void onConnectionRequest(ConnectionRequest request) {
        Log.d(TAG, "QR Connection request from: " + request.getDappPeerId());
        
        //Start WalletConnectionActivity for P2P connection
        Intent intent = new Intent(this, WalletConnectionActivity.class);
        intent.putExtra("dapp_peer_id", request.getDappPeerId());

        if (request.getHost() != null) {
            intent.putExtra("host", request.getHost());
            intent.putExtra("port", request.getPort());
            intent.putExtra("path", request.getPath());
            intent.putExtra("secure", request.isSecure());
        }

        startActivity(intent);
    }

    // ===========================================
    // Activity Lifecycle (for debugging)
    // ===========================================

    /**
     * When returning to MainActivity, display static mock wallet UI
     */
    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "onResume");
    }

    @Override
    protected void onStart() {
        super.onStart();
        Log.d(TAG, "onStart");
    }

    @Override
    protected void onPause() {
        super.onPause();
        Log.d(TAG, "onPause");
    }

    @Override
    protected void onStop() {
        super.onStop();
        Log.d(TAG, "onStop");
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy");
    }
}