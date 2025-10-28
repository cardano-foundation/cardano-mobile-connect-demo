package com.example.wallet_client.model;

/**
 * Transaction Request Model
 * 
 * Represents a transaction signature request from a dApp.
 * This is an immutable data object that holds all transaction details
 * needed for user approval in the wallet.
 * 
 * Flow:
 * 1. dApp sends transaction request via P2P (JSON)
 * 2. WalletWebViewManager parses JSON into TransactionRequest
 * 3. WalletConnectionActivity shows approval dialog with these details
 * 4. User approves/rejects in DialogManager
 * 5. Result sent back to dApp via P2P
 * 
 */
public class TransactionRequest {
    
    //Unique request ID for matching response to request
    private final String id;
    
    // Transaction type
    private final String type;
    
    // Transaction amount
    private final String amount;
    
    //Recipient address
    private final String recipient;
    
    // Transaction fee
    private final String fee;
    
    // Optional metadata/memo for the transaction
    private final String metadata;
    
    /**
     * Constructor - Creates immutable transaction request
     * 
     * @param id Unique request ID (used to match response)
     * @param type Transaction type
     * @param amount Transaction amount with currency
     * @param recipient Recipient address
     * @param fee Transaction fee with currency
     * @param metadata Optional metadata/memo (can be null or empty)
     */
    public TransactionRequest(String id, String type, String amount, 
                            String recipient, String fee, String metadata) {
        this.id = id;
        this.type = type;
        this.amount = amount;
        this.recipient = recipient;
        this.fee = fee;
        this.metadata = metadata;
    }
    
    /**
     * Get request ID
     * @return Unique request identifier
     */
    public String getId() { 
        return id; 
    }
    
    /**
     * Get transaction type
     * @return Transaction type
     */
    public String getType() { 
        return type; 
    }
    
    /**
     * Get transaction amount
     * @return Amount with currency
     */
    public String getAmount() { 
        return amount; 
    }
    
    /**
     * Get recipient address
     * @return Cardano address
     */
    public String getRecipient() { 
        return recipient; 
    }
    
    /**
     * Get transaction fee
     * @return Fee with currency
     */
    public String getFee() { 
        return fee; 
    }
    
    /**
     * Get transaction metadata
     * @return Metadata/memo or null if not provided
     */
    public String getMetadata() { 
        return metadata; 
    }
}