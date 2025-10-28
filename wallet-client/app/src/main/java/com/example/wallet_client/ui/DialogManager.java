package com.example.wallet_client.ui;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.util.Log;

import com.example.wallet_client.model.TransactionRequest;

/**
 * Dialog Manager for Connection and Transaction Approval Dialogs
 * 
 * Responsibilities:
 * - Shows connection approval dialogs when dApp requests connection
 * - Shows transaction approval dialogs when dApp requests signature
 * - Manages dialog lifecycle to prevent window leaks
 * - Validates activity state before showing dialogs
 * 
 * Used by WalletConnectionActivity to handle user approvals.
 */
public class DialogManager {

    /**
     * Listener interface for connection approval dialog
     * Implemented by WalletConnectionActivity
     */
    public interface ConnectionDialogListener {

        /**
         * Called when user approves dApp connection
         */
        void onConnectionApproved();

        /**
         * Called when user denies dApp connection
         */        
        void onConnectionDenied();
    }

    /**
     * Listener interface for transaction approval dialog
     * Implemented by WalletConnectionActivity
     */
    public interface TransactionDialogListener {

        /**
         * Called when user approves transaction signature
         * @param signature Mock signature string
         */
        void onTransactionApproved(String signature);

        /**
         * Called when user rejects transaction signature
         */
        void onTransactionRejected();
    }

    private final Context context;
    private AlertDialog currentDialog;

    /**
     * Constructor
     * @param context Activity context for showing dialogs
     */
    public DialogManager(Context context) {
        this.context = context;
    }

    /**
     * Show connection approval dialog
     * 
     * Displays a dialog asking user to approve/deny dApp connection.
     * Automatically dismisses any previous dialog before showing new one.
     * 
     * @param dappPeerId PeerJS ID of the dApp requesting connection
     * @param listener Callback listener for user's decision
     */
    public void showConnectionDialog(String dappPeerId, ConnectionDialogListener listener) {
        if (isContextInvalid()) return;

        //Dismiss any previous dialog
        dismissCurrentDialog();

        currentDialog = new AlertDialog.Builder(context)
            .setTitle("Connection Request")
            .setMessage("dApp " + dappPeerId + " is requesting to connect.")
            .setPositiveButton("Approve", (dialog, which) -> {
                if (listener != null) listener.onConnectionApproved();
            })
            .setNegativeButton("Deny", (dialog, which) -> {
                if (listener != null) listener.onConnectionDenied();
            })
            .setCancelable(false)
            .show();
    }

    /**
     * Show transaction approval dialog
     * 
     * Displays a dialog asking user to sign/reject transaction.
     * Generates mock signature if user approves.
     * Automatically dismisses any previous dialog before showing new one.
     * 
     * @param request Transaction request containing amount and details
     * @param listener Callback listener for user's decision
     */
    public void showTransactionDialog(TransactionRequest request, TransactionDialogListener listener) {
        if (isContextInvalid()) return;

        //Dismiss any previous dialog
        dismissCurrentDialog();

        currentDialog = new AlertDialog.Builder(context)
            .setTitle("Transaction Request")
            .setMessage("Do you want to sign transaction for " + request.getAmount() + "?")
            .setPositiveButton("Sign", (dialog, which) -> {
                //Generate mock signature
                String mockSignature = "sig_" + System.currentTimeMillis();
                if (listener != null) listener.onTransactionApproved(mockSignature);
            })
            .setNegativeButton("Reject", (dialog, which) -> {
                if (listener != null) listener.onTransactionRejected();
            })
            .setCancelable(false)
            .show();
    }

    /**
     * Cleanup method to prevent window leaks
     * 
     * Call this in Activity's onStop() lifecycle method to dismiss
     * any open dialogs before activity goes to background.
     */
    public void onActivityStop() {
        dismissCurrentDialog();
    }

    /**
     * Dismiss currently open dialog if any
     * Sets currentDialog to null after dismissing
     */
    private void dismissCurrentDialog() {
        if (currentDialog != null && currentDialog.isShowing()) {
            currentDialog.dismiss();
        }
        currentDialog = null;
    }

    /**
     * Validate if context is valid for showing dialogs
     * 
     * Checks:
     * - Context is an Activity instance
     * - Activity is not finishing
     * - Activity is not destroyed
     * 
     * @return true if context is invalid and dialogs should NOT be shown
     */
    private boolean isContextInvalid() {
        if (!(context instanceof Activity)) {
            return true;
        }
        Activity activity = (Activity) context;
        if (activity.isFinishing() || activity.isDestroyed()) {
            Log.e("DialogManager", "Cannot show dialog - activity is finishing or destroyed.");
            return true;
        }
        return false;
    }
}