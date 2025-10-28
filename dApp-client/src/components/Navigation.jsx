import React, { useState } from 'react';
import { EnvelopeIcon } from "@phosphor-icons/react";
import Cip158TestButton from './Cip158TestButton'
import QRCodeConnector from './QRCodeConnector';

/**
 * Nav bar with wallet connector
 */
export default function Navigation({ peerId, isReady, connected, walletId, messageCount, onToggleMessages, onConnectWallet, connectedWalletId, onDisconnect }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

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

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };

  const toggleQRCode = () => {
    setShowQRCode(prev => !prev);
  };

  const handleDisconnect = () => {
    onDisconnect();
    setDropdownOpen(false);
  };

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 16px',
      backgroundColor: theme.background,
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      marginBottom: '20px',
      backdropFilter: 'blur(10px)',
      borderBottom: `1px solid ${theme.border}`
    }}>
      <div style={{
        fontSize: '20px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        color: theme.textPrimary
      }}>
        <span style={{
          background: `linear-gradient(135deg, ${theme.textPrimary} 0%, ${theme.accentPrimary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginRight: '4px'
        }}>NFT Market</span>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Messages Button */}
        <button
          onClick={onToggleMessages}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            minWidth: '40px',
            minHeight: '40px',
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.background,
            borderRadius: '10px',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s ease',
            padding: '0',
            margin: '0',
            boxSizing: 'content-box',
            lineHeight: '1'
          }}
        >

          <EnvelopeIcon
            size={20}
            weight="bold"
            color={theme.textSecondary}
          />

          {messageCount > 0 && (
            <div style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              backgroundColor: theme.accentPrimary,
              color: 'white',
              fontSize: '10px',
              fontWeight: 'bold',
              borderRadius: '10px',
              padding: '2px 6px',
              minWidth: '10px',
              textAlign: 'center'
            }}>
              {messageCount}
            </div>
          )}
        </button>

        {/* Connection Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={toggleDropdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: connected
                ? 'rgba(139, 92, 246, 0.15)'
                : 'rgba(255, 255, 255, 0.05)',
              color: connected ? theme.accentPrimary : theme.textSecondary,
              border: `1px solid ${connected ? theme.accentPrimary : theme.border}`,
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(5px)'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: connected ? theme.accentPrimary : theme.textSecondary,
              boxShadow: connected ? `0 0 10px ${theme.accentGlow}` : 'none'
            }}></span>
            {connected ? 'Connected' : 'Connect Wallet'}
            <span style={{ fontSize: '10px', marginLeft: '4px' }}>▼</span>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              backgroundColor: theme.background,
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              padding: '12px',
              minWidth: '280px',
              border: `1px solid ${theme.border}`,
              backdropFilter: 'blur(10px)'
            }}>
              {!connected ? (
                <>
                  {/* Not Connected State */}
                  <div style={{
                    fontSize: '14px',
                    padding: '8px 12px',
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.textPrimary
                  }}>
                    Connect your Wallet:
                  </div>

                  <Cip158TestButton isReady={isReady} onOpenModal={() => onConnectWallet('cip158')}/>

                  {/* QR Code Section */}
                  <div style={{
                    borderTop: `1px solid ${theme.border}`,
                    marginTop: '12px',
                    paddingTop: '12px'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: theme.textPrimary,
                      marginBottom: '8px',
                      padding: '0 4px'
                    }}>
                      QR Code Connection
                    </div>

                    <button
                      onClick={toggleQRCode}
                      disabled={!isReady || !peerId}
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: 'rgba(139, 92, 246, 0.15)',
                        color: theme.textPrimary,
                        border: `1px solid rgba(139, 92, 246, 0.2)`,
                        borderRadius: '8px',
                        cursor: isReady && peerId ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: '500',
                        opacity: isReady && peerId ? 1 : 0.5,
                        transition: 'all 0.2s'
                      }}
                    >
                      {showQRCode ? 'Hide QR Code' : 'Generate QR Code'}
                    </button>

                    {showQRCode && isReady && peerId && (
                      <div style={{ marginTop: '12px' }}>
                        <QRCodeConnector 
                          peerId={peerId} 
                          isReady={isReady} 
                          connected={connected}
                          onWalletConnected={() => {
                            setShowQRCode(false);
                            setDropdownOpen(false);
                          }}
                        />
                      </div>
                    )}
                  </div>

                </>
              ) : (
                <>
                  {/* Connected State */}
                  <div style={{
                    fontSize: '14px',
                    padding: '8px 12px',
                    borderBottom: `1px solid ${theme.border}`,
                    color: theme.textPrimary
                  }}>
                    Connected to Wallet
                  </div>

                  <div style={{ padding: '12px' }}>
                    
                    <div style={{
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: theme.textPrimary,
                      marginBottom: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: `linear-gradient(135deg, ${theme.accentPrimary} 0%, ${theme.accentSecondary} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                      }}>
                        
                      </div>
                      <span>Demo Wallet</span>
                    </div>

                    <div style={{
                      fontSize: '12px',
                      marginTop: '12px',
                      padding: '10px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '6px',
                      wordBreak: 'break-all',
                      color: theme.textSecondary,
                      border: `1px solid ${theme.border}`,
                      fontFamily: 'monospace'
                    }}>
                      ID: {walletId || 'Unknown'}
                    </div>

                    <button
                      onClick={handleDisconnect}
                      style={{
                        width: '100%',
                        marginTop: '12px',
                        padding: '10px',
                        backgroundColor: 'rgba(255, 59, 48, 0.15)',
                        color: '#ff3b30',
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>Disconnect Wallet</span>
                    </button>


                  </div>


                </>
              )}

              <div style={{
                fontSize: '11px',
                padding: '8px 12px',
                color: theme.textSecondary,
                borderTop: `1px solid ${theme.border}`,
                marginTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div>
                  dApp ID:
                  <code style={{
                    fontSize: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    marginLeft: '6px',
                    fontFamily: 'monospace'
                  }}>
                    {peerId || "..."}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}