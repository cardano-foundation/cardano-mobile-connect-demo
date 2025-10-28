import React from 'react';

/**
 * Shows the message history
 * 
 * @param {Object} props - Component properties
 * @param {Array} props.messages - Array with messages
 * @param {boolean} props.compact - For compact version
 */
export default function MessageList({ messages, compact = true }) {

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
      backgroundColor: theme.cardBg,
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '24px',
      border: `1px solid ${theme.border}`,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ 
          margin: '0', 
          fontSize: '18px',
          color: theme.textPrimary,
          background: `linear-gradient(135deg, ${theme.textPrimary} 0%, ${theme.accentPrimary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Message history
          {messages.length > 0 && <span style={{marginLeft: '8px', fontSize: '16px'}}>({messages.length})</span>}
        </h3>
      </div>
      
      <div style={{
        border: `1px solid ${theme.border}`,
        height: compact ? '125px' : '240px',
        overflowY: 'auto',
        padding: '12px',
        backgroundColor: theme.background,
        borderRadius: '8px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            color: theme.textSecondary, 
            fontStyle: 'italic', 
            textAlign: 'center', 
            paddingTop: '30px',
            fontSize: '14px'
          }}>
            No messages found...
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{
              marginBottom: '8px',
              padding: '8px 12px',
              backgroundColor: 'rgba(30, 30, 46, 0.6)',
              borderRadius: '8px',
              fontSize: '13px',
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '0px',
                flexWrap: 'wrap'
              }}>
                <strong style={{
                  fontSize: '13px',
                  color: msg.from === 'System' 
                    ? '#6c757d' 
                    : msg.from === 'dApp' 
                      ? '#28a745' 
                      : theme.accentPrimary
                }}>{msg.from}</strong>
                <span style={{ 
                  color: theme.textSecondary, 
                  fontSize: '11px',
                  marginLeft: '4px'
                }}>
                  {msg.time}
                </span>
              </div>
              <div style={{
                fontSize: '13px', 
                marginBottom: '4px',
                wordBreak: 'break-word',
                color: theme.textPrimary
              }}>{msg.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}