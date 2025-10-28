package com.example.wallet_client.ui;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.wallet_client.R;
import com.example.wallet_client.model.MockTransaction;

import java.util.ArrayList;
import java.util.List;

/**
 * RecyclerView Adapter for displaying mock transaction history
 * 
 * Shows a simple list of sent/received ADA transactions with:
 * - Transaction type (Sent/Received)
 * - Transaction amount (with +/- prefix)
 * - Transaction date
 * - Color coding (green for received, red for sent)
 * 
 * This adapter is used in MainActivity to display static mock transaction data.
 */
public class MockTransactionAdapter extends RecyclerView.Adapter<MockTransactionAdapter.TransactionViewHolder> {
    
    private List<MockTransaction> transactions = new ArrayList<>();

    /**
     * Set the list of transactions to display
     * 
     * @param transactions List of mock transactions (null-safe)
     */
    public void setTransactions(List<MockTransaction> transactions) {
        this.transactions = transactions != null ? transactions : new ArrayList<>();
        notifyDataSetChanged();
    }

    /**
     * Create ViewHolder for transaction item
     * 
     * @param parent Parent ViewGroup
     * @param viewType View type (unused, all items same type)
     * @return New TransactionViewHolder instance
     */
    @NonNull
    @Override
    public TransactionViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_transaction, parent, false);
        return new TransactionViewHolder(view);
    }

    /**
     * Bind transaction data to ViewHolder
     * 
     * @param holder ViewHolder to bind data to
     * @param position Position in the transactions list
     */
    @Override
    public void onBindViewHolder(@NonNull TransactionViewHolder holder, int position) {
        MockTransaction transaction = transactions.get(position);
        holder.bind(transaction);
    }

    /**
     * Get total number of transactions
     * 
     * @return Transaction count
     */
    @Override
    public int getItemCount() {
        return transactions.size();
    }

    /**
     * ViewHolder for individual transaction items
     * 
     * Holds references to UI elements and binds transaction data:
     * - Type text (Sent/Received)
     * - Amount text (e.g., "+50 ADA")
     * - Date text (e.g., "Jan 15")
     */
    static class TransactionViewHolder extends RecyclerView.ViewHolder {
        
        private final TextView typeText;
        private final TextView amountText;
        private final TextView dateText;

        /**
         * Constructor - finds and caches view references
         * 
         * @param itemView Root view of the transaction item layout
         */
        public TransactionViewHolder(@NonNull View itemView) {
            super(itemView);
            typeText = itemView.findViewById(R.id.typeText);
            amountText = itemView.findViewById(R.id.amountText);
            dateText = itemView.findViewById(R.id.dateText);
        }

        /**
         * Bind transaction data to the view elements
         * 
         * Sets:
         * - Transaction type (Sent/Received)
         * - Transaction amount
         * - Color based on type (green for received, red for sent)
         * - Transaction date
         * 
         * @param transaction The mock transaction to display
         */
        public void bind(MockTransaction transaction) {
            //Set transaction type (Sent/Received)
            typeText.setText(transaction.getType());
            
            //Set amount
            amountText.setText(transaction.getAmount());
            
            //Set color based on transaction type
            if (transaction.isReceived()) {
                //Green for received transactions
                amountText.setTextColor(itemView.getContext().getColor(R.color.transaction_green));
                typeText.setTextColor(itemView.getContext().getColor(R.color.transaction_green));
            } else {
                //Red for sent transactions
                amountText.setTextColor(itemView.getContext().getColor(R.color.transaction_red));
                typeText.setTextColor(itemView.getContext().getColor(R.color.transaction_red));
            }
            
            //Set date
            dateText.setText(transaction.getDate());
        }
    }
}