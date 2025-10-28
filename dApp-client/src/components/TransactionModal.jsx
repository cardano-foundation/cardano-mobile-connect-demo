import React from 'react';

/**
 * Modal for transaction conformation
 */
export default function TransactionModal({ transaction, onConfirm, onCancel }) {
  const theme = {
    background: '#0F0F17',
    cardBg: '#1E1E2E',
    accentPrimary: '#8B5CF6',
    accentSecondary: '#6D28D9',
    accentGlow: 'rgba(139, 92, 246, 0.15)',
    textPrimary: '#FFFFFF',
    textSecondary: '#A9A9BC',
    border: '#2D2D3A'
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 15, 23, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: theme.cardBg,
        borderRadius: '16px',
        width: '100%',
        maxWidth: '400px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: `1px solid ${theme.border}`,
        color: theme.textPrimary
      }} className="glass">
        <h3 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '20px',
          background: `linear-gradient(135deg, ${theme.textPrimary} 0%, ${theme.accentPrimary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>Confirm Purchase</h3>
        
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: `1px solid ${theme.border}`
          }}>
            <span style={{ fontWeight: '500' }}>Item:</span>
            <span>{transaction.productName}</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: `1px solid ${theme.border}`
          }}>
            <span style={{ fontWeight: '500' }}>Price:</span>
            <span>{transaction.amount}</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '10px 0',
            borderBottom: `1px solid ${theme.border}`
          }}>
            <span style={{ fontWeight: '500' }}>Network Fee:</span>
            <span>{transaction.fee}</span>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '16px 0',
            marginTop: '8px',
            fontWeight: 'bold'
          }}>
            <span>Total:</span>
            <span style={{
              color: theme.accentPrimary
            }}>{transaction.amount}</span>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '12px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: theme.textPrimary,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={onConfirm}
            style={{
              padding: '12px 20px',
              background: `linear-gradient(135deg, ${theme.accentPrimary} 0%, ${theme.accentSecondary} 100%)`,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              boxShadow: `0 4px 12px ${theme.accentGlow}`
            }}
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}