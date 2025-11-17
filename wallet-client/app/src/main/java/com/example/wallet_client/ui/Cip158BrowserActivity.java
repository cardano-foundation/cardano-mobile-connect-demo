package com.example.wallet_client.ui;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.example.wallet_client.R;
import com.example.wallet_client.bridge.Cip30WalletBridge;
import com.example.wallet_client.model.TransactionRequest;
import com.example.wallet_client.ui.DialogManager;

import java.util.List;

/**
 * CIP-158 In-App Browser
 *
 * Purpose:
 * - Opens target URL from deep link (web+cardano://browse/v1/...)
 * - Keeps user within the app (no external browser needed)
 * - Optionally calls callback URL when user closes or navigates back
 *
 * Expected Intent Extras (set by MainActivity):
 * - EXTRA_TARGET_URL (Required): The https/http URL to open
 * - EXTRA_CALLBACK_URL (Optional): Called when closing (with status parameters)
 * - browse_action (Optional): Action extracted from path (e.g., "open") - informational only
 *
 * Security Aspects:
 * - Only http(s) allowed (validated in MainActivity)
 * - Internal web+cardano links can be processed again
 * - No File/JS interface needed here (pure browser)
 */
public class Cip158BrowserActivity extends AppCompatActivity
    implements Cip30WalletBridge.BridgeListener,
               DialogManager.TransactionDialogListener {

    private static final String TAG = "CIP158Browser";

    //Keys for Intent extras (set by MainActivity)
    public static final String EXTRA_TARGET_URL = "target_url";
    public static final String EXTRA_CALLBACK_URL = "callback_url";

    private WebView webView;
    private ProgressBar progress;
    private ImageButton backBtn;
    private ImageButton closeBtn;
    private TextView titleView;

    private String callbackUrl;

    private Cip30WalletBridge walletBridge;
    private DialogManager dialogManager;
    private String pendingTxId;

    /**
     * Activity creation and initialization
     * 
     * Sets up:
     * - Custom layout (Toolbar + Progress + WebView)
     * - UI controls (back/close buttons)
     * - WebView configuration
     * - Loads target URL from intent
     * 
     * @param savedInstanceState Bundle with saved state
     */
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        //Use custom layout (Toolbar + Progress + WebView)
        setContentView(R.layout.activity_cip158_browser);

        //Get UI references
        webView = findViewById(R.id.cip158WebView);
        progress = findViewById(R.id.cip158Progress);
        backBtn = findViewById(R.id.cip158Back);
        closeBtn = findViewById(R.id.cip158Close);
        titleView = findViewById(R.id.cip158Title);

        //Get callback & target URL from intent
        callbackUrl = getIntent().getStringExtra(EXTRA_CALLBACK_URL);
        String target = getIntent().getStringExtra(EXTRA_TARGET_URL);

        dialogManager = new DialogManager(this);
        walletBridge = new Cip30WalletBridge(webView, this);

        setupUiControls();
        setupWebView();

        //Close immediately if no target URL provided
        if (target != null) {
            webView.loadUrl(target);
        } else {
            finish();
        }
    }

    /**
     * Setup button click handlers (Back + Close)
     * 
     * Back button:
     * - If WebView has history: Navigate back in WebView
     * - Otherwise: Close activity with "back" status
     * 
     * Close button:
     * - Close activity with "closed" status
     */
    private void setupUiControls() {
        backBtn.setOnClickListener(v -> {
            if (webView.canGoBack()) {
                webView.goBack();
            } else {
                finishWithCallback("back");
            }
        });

        closeBtn.setOnClickListener(v -> finishWithCallback("closed"));
    }

    /**
     * WebView basic configuration
     * 
     * Enables:
     * - JavaScript (for dApp pages that need scripts)
     * - DOM Storage
     * - Cookies (Session/Auth)
     * - Page title & loading indicator
     * - Zoom controls
     * 
     * Sets up:
     * - Custom User-Agent (adds "CIP158Browser/1.0")
     * - WebChromeClient for title and progress updates
     * - WebViewClient for navigation and error handling
     */
    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setSupportZoom(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        s.setUserAgentString(s.getUserAgentString() + " CIP158Browser/1.0");

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(walletBridge, "CardanoWalletBridge");

        //Update title dynamically
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onReceivedTitle(WebView view, String title) {
                if (title != null && !title.trim().isEmpty()) {
                    titleView.setText(title);
                }
            }

            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    progress.setVisibility(View.VISIBLE);
                } else {
                    progress.setVisibility(View.GONE);
                }
            }
        });

        //Navigation & loading states
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
                //Temporarily show URL
                titleView.setText(url);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);

                //TODO: Call for the CIP-30 Inject testing
                injectCardanoApi();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();

                //Handle special schemes externally (email, phone, etc.)
                if ("mailto".equals(scheme) || "tel".equals(scheme) || 
                    "sms".equals(scheme) || "market".equals(scheme)) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, uri));
                        return true;
                    } catch (Exception e) {
                        Log.e("CIP158Browser", "Cannot handle scheme: " + scheme);
                        return true;
                    }
                }

                //Handle nested CIP-158 browse link => new instance (or reuse same activity)
                if (isCip158BrowseLink(uri)) {
                    String newTarget = uri.getQueryParameter("url");
                    if (newTarget != null) {
                        Intent i = new Intent(Cip158BrowserActivity.this, Cip158BrowserActivity.class);
                        i.putExtra(EXTRA_TARGET_URL, newTarget);
                        //Inherit callback
                        i.putExtra(EXTRA_CALLBACK_URL, callbackUrl);
                        startActivity(i);
                        return true;
                    }
                }
                //Load normally
                return false;
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                String errorHtml = "<html><body>" +
                        "<h2>Loading Error</h2>" +
                        "<p>Cannot load: " + failingUrl + "</p>" +
                        "<p>Error: " + description + "</p>" +
                        "</body></html>";
                view.loadData(errorHtml, "text/html", "UTF-8");
            }

        });
    }

    // ======================================
    // TODO: New Injection Method
    // ======================================

    private void injectCardanoApi() {
        String js = 
            "(function() {" +
            "  if (window.cardano) {" +
            "    console.log('Cardano API already exists');" +
            "    return;" +
            "  }" +
            "  " +
            "  console.log('Injecting Cardano Wallet API (CIP-30-like)...');" +
            "  " +
            "  window.__cardanoCallbacks = {};" +
            "  " +
            "  window.cardano = {" +
            "    demoWallet: {" +
            "      apiVersion: '" + walletBridge.getApiVersion() + "'," +
            "      name: '" + walletBridge.getName() + "'," +
            "      icon: '" + walletBridge.getIcon() + "'," +
            "      " +
            "      isEnabled: function() {" +
            "        console.log('cardano.demoWallet.isEnabled() called');" +
            "        return Promise.resolve(true);" +
            "      }," +
            "      " +
            "      enable: function() {" +
            "        console.log('cardano.demoWallet.enable() called');" +
            "        return Promise.resolve(this);" +
            "      }," +
            "      " +
            "      getNetworkId: function() {" +
            "        console.log('cardano.demoWallet.getNetworkId() called');" +
            "        return Promise.resolve(0);" + // 0 = Testnet, 1 = Mainnet
            "      }," +
            "      " +
            "      getBalance: function() {" +
            "        console.log('cardano.demoWallet.getBalance() called');" +
            "        return new Promise((resolve) => {" +
            "          const id = 'bal_' + Date.now();" +
            "          window.__cardanoCallbacks[id] = resolve;" +
            "          CardanoWalletBridge.getBalance(id);" +
            "        });" +
            "      }," +
                        "      " +
            "      getUsedAddresses: function() {" +
            "        console.log('cardano.demoWallet.getUsedAddresses() called');" +
            "        return new Promise((resolve) => {" +
            "          const id = 'addr_' + Date.now();" +
            "          window.__cardanoCallbacks[id] = resolve;" +
            "          CardanoWalletBridge.getAddresses(id);" +
            "        });" +
            "      }," +
            "      " +
            "      signTx: function(txCbor, partialSign, metadata) {" +
            "        console.log('cardano.demoWallet.signTx() called with:', { txCbor, partialSign, metadata });" +
            "        return new Promise((resolve, reject) => {" +
            "          const txId = 'tx_' + Date.now();" +
            "          window.__cardanoCallbacks[txId] = (result) => {" +
            "            console.log('Transaction result:', result);" +
            "            if (result.success) {" +
            "              resolve(result.signature);" +
            "            } else {" +
            "              reject(new Error(result.error || 'User rejected transaction'));" +
            "            }" +
            "          };" +
            "          " +
            "          CardanoWalletBridge.signTx(JSON.stringify({" +
            "            txId: txId," +
            "            txCbor: txCbor || ''," +
            "            metadata: JSON.stringify(metadata || {})" +
            "          }));" +
            "        });" +
            "      }" +
            "    }" +
            "  };" +
            "  " +
            "  console.log('✓ Cardano Wallet API injected successfully');" +
            "  console.log('Available: window.cardano.demoWallet');" +
            "})();";

        webView.evaluateJavascript(js, result -> {
            Log.d(TAG, "window.cardano API injected");
        });
    }

    @Override
    public void onSignTxRequest(String txId, String txCbor, String metadata) {
        Log.d(TAG, "Transaction signature requested: " + txId);
        
        runOnUiThread(() -> {
            pendingTxId = txId;

            // Parse metadata zu TransactionRequest
            TransactionRequest request = parseTransactionRequest(txId, metadata);

            // Zeige nativen Dialog
            dialogManager.showTransactionDialog(request, this);
        });
    }

    @Override
    public void onGetBalance(String callbackId) {
        // Mock Balance: 1234.56 ADA = 1234560000 Lovelace
        String balance = "1234560000";
        walletBridge.sendBalance(callbackId, balance);
    }

    @Override
    public void onGetAddresses(String callbackId) {
        // Mock Addresses (hex-encoded)
        String addressesJson = "[\"019f5d8c3c8e7b3a2d1f4e6c8a9b2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f\"]";
        walletBridge.sendAddresses(callbackId, addressesJson);
    }

    @Override
    public void onError(String error) {
        runOnUiThread(() -> {
            Toast.makeText(this, "Wallet Error: " + error, Toast.LENGTH_LONG).show();
        });
    }

    @Override
    public void onTransactionApproved(String signature) {
        if (pendingTxId != null) {
            Log.d(TAG, "User approved transaction: " + pendingTxId);
            walletBridge.sendTxResult(pendingTxId, true, signature);
            pendingTxId = null;
            Toast.makeText(this, "Transaction signed!", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onTransactionRejected() {
        if (pendingTxId != null) {
            Log.d(TAG, "User rejected transaction: " + pendingTxId);
            walletBridge.sendTxResult(pendingTxId, false, null);
            pendingTxId = null;
            Toast.makeText(this, "Transaction rejected", Toast.LENGTH_SHORT).show();
        }
    }

    /**
     * Parse metadata JSON zu TransactionRequest für Dialog
     */
    private TransactionRequest parseTransactionRequest(String txId, String metadata) {
        try {
            org.json.JSONObject meta = new org.json.JSONObject(metadata);
            return new TransactionRequest(
                txId,
                meta.optString("type", "Payment"),
                meta.optString("amount", "Unknown"),
                meta.optString("recipient", "Unknown"),
                meta.optString("fee", "Unknown"),
                meta.optString("metadata", "None")
            );
        } catch (Exception e) {
            Log.e(TAG, "Error parsing transaction metadata", e);
            return new TransactionRequest(
                txId, "Unknown", "Unknown", "Unknown", "Unknown", "Parse Error"
            );
        }
    }

    // =========================================

    /**
     * Extract target URL from CIP-158 deep link
     * 
     * Supports two formats:
     * 1. Path format: /v1/<scheme>/<domain>/<path>
     * 2. Query format: ?url=<encoded_url> (legacy)
     * 
     * @param uri CIP-158 deep link URI
     * @return Extracted target URL or null
     */
    private String extractTargetFromCip158(Uri uri) {
        List<String> segs = uri.getPathSegments();
        if (segs.size() >= 3) {
            //Path format
            StringBuilder url = new StringBuilder();
            url.append(segs.get(1)).append("://").append(segs.get(2));
            if (segs.size() > 3) {
                for (int i = 3; i < segs.size(); i++) {
                    url.append("/").append(segs.get(i));
                }
            }
            if (uri.getQuery() != null) {
                url.append("?").append(uri.getQuery());
            }
            return url.toString();
        } else {
            //Query format
            return uri.getQueryParameter("url");
        }
    }

    /**
     * Check if a link is a CIP-158 browse link
     * 
     * @param uri URI to check
     * @return true if URI is a valid CIP-158 browse link
     */
    private boolean isCip158BrowseLink(Uri uri) {
        return uri != null
                && "web+cardano".equalsIgnoreCase(uri.getScheme())
                && "browse".equalsIgnoreCase(uri.getHost())
                && uri.getPath() != null
                && uri.getPath().startsWith("/v1");
    }

    /**
     * Close activity and optionally call callback URL with status
     * 
     * Status values:
     * - "closed" (Close button pressed)
     * - "back" (User navigated back without history)
     * 
     * @param status Status string to append to callback URL
     */
    private void finishWithCallback(String status) {
        if (callbackUrl != null) {
            try {
                Uri base = Uri.parse(callbackUrl);
                //Preserve existing query parameters + add new one
                Uri result = base.buildUpon()
                        .appendQueryParameter("status", status)
                        .build();
                //Open externally (browser or dApp)
                startActivity(new Intent(Intent.ACTION_VIEW, result));
            } catch (Exception ignored) {
                //No hard error needed here
            }
        }
        finish();
    }

    /**
     * Handle hardware back button
     * Same logic as toolbar back button
     */
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            finishWithCallback("back");
        }
    }
}