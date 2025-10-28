package com.example.wallet_client.model;

/**
 * Mock Transaction Model
 * 
 * Represents a single transaction in the mock wallet's transaction history.
 * This is a simple data object used only for UI display purposes in MainActivity.
 * 
 * This is NOT a real Cardano transaction - it's just static demo data
 * to show what a transaction list would look like in the wallet UI.
 * 
 */
public class MockTransaction {
    
    //Transaction amount with currency
    private String amount;
    
    //Transaction date
    private String date;
    
    //True if this is a received transaction, false if sent
    private boolean isReceived;

    /**
     * Constructor - Creates a mock transaction
     * 
     * @param amount Transaction amount with currency and direction
     * @param date Display date string
     * @param isReceived True for received transactions (green), false for sent (red)
     */
    public MockTransaction(String amount, String date, boolean isReceived) {
        this.amount = amount;
        this.date = date;
        this.isReceived = isReceived;
    }

    /**
     * Get transaction amount
     * @return Amount string with currency
     */
    public String getAmount() { 
        return amount; 
    }
    
    /**
     * Get transaction date
     * @return Date string
     */
    public String getDate() { 
        return date; 
    }
    
    /**
     * Check if transaction was received or sent
     * @return True if received, false if sent
     */
    public boolean isReceived() { 
        return isReceived; 
    }
    
    /**
     * Get transaction type as display string
     * @return "Received" or "Sent"
     */
    public String getType() {
        return isReceived ? "Received" : "Sent";
    }
}