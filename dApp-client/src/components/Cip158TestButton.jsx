import React from 'react';

/**
 * Simple CIP-158 Button
 */
export default function Cip158TestButton({isReady, onOpenModal}) {

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
    <button
      onClick={onOpenModal}
      disabled={!isReady}
      style={{
        width: '100%',
        padding: '24px',
        marginTop: '12px',
        backgroundColor: isReady 
          ? 'rgba(139, 92, 246, 0.15)' 
          : 'rgba(255, 255, 255, 0.05)',
        color: isReady ? theme.accentPrimary : theme.textSecondary,
        border: `1px solid ${isReady ? 'rgba(139, 92, 246, 0.2)' : theme.border}`,
        borderRadius: '8px',
        cursor: isReady ? 'pointer' : 'not-allowed',
        fontSize: '14px',
        fontWeight: '500',
        opacity: isReady ? 1 : 0.5,
        transition: 'all 0.2s'
      }}
    >
      Open in Wallet
    </button>
  );
}