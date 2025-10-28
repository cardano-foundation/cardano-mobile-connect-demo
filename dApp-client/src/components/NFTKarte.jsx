import React, { useState } from 'react';

/**
 * NFT Card with unspalsh picture
 */
export default function NftCard({ nft, selected, connected, onPurchase, theme }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const colors = theme || {
    background: '#121218',
    cardBg: '#1E1E2E',
    accentPrimary: '#8B5CF6',
    accentSecondary: '#6D28D9',
    accentGlow: 'rgba(139, 92, 246, 0.15)',
    textPrimary: '#FFFFFF',
    textSecondary: '#A9A9BC',
    border: '#2D2D3A'
  };
  
  return (
    <div 
      style={{
        border: selected ? `1px solid ${colors.accentPrimary}` : `1px solid ${colors.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: colors.cardBg,
        transition: 'all 0.3s ease',
        boxShadow: selected 
          ? `0 8px 32px ${colors.accentGlow}` 
          : isHovered 
            ? '0 8px 16px rgba(0, 0, 0, 0.2)' 
            : '0 4px 12px rgba(0, 0, 0, 0.1)',
        transform: (selected || isHovered) ? 'translateY(-4px)' : 'none',
        position: 'relative',
        backdropFilter: 'blur(5px)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      {selected && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: '16px',
          boxShadow: `inset 0 0 2px ${colors.accentPrimary}`,
          pointerEvents: 'none',
          zIndex: 2
        }} />
      )}
      
      <div style={{ 
        position: 'relative',
        width: '100%',
        paddingTop: '100%',
        backgroundColor: 'rgba(20, 20, 30, 0.7)',
        overflow: 'hidden'
      }}>
        
        {!imageLoaded && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(20, 20, 30, 0.9)',
            zIndex: 1
          }}>
            <div className="pulse" style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: colors.accentPrimary,
              opacity: 0.6
            }} />
          </div>
        )}
        
        {/* Unsplash-Picture */}
        <img 
          src={nft.image} 
          alt={nft.name}
          onLoad={() => setImageLoaded(true)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.5s ease',
            zIndex: 0
          }}
        />
        

        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(30, 30, 46, 0.85)',
          backdropFilter: 'blur(4px)',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: 'bold',
          color: colors.accentPrimary,
          border: `1px solid ${colors.border}`,
          zIndex: 1
        }}>
          {nft.price}
        </div>
      </div>
      
      <div style={{ padding: '20px' }}>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            fontSize: '18px',
            margin: '0',
            color: colors.textPrimary,
            flex: '1'
          }}>{nft.name}</h3>
          
          <div style={{ 
            fontSize: '13px', 
            color: colors.textSecondary,
            padding: '4px 8px',
            backgroundColor: 'rgba(30, 30, 46, 0.7)',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            marginLeft: '10px'
          }}>
            Edition: {nft.edition}
          </div>
        </div>
        
        <button
          onClick={onPurchase}
          disabled={!connected}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: connected 
              ? colors.accentPrimary 
              : 'rgba(30, 30, 46, 0.7)', 
            color: connected ? 'white' : colors.textSecondary, 
            border: connected ? 'none' : `1px solid ${colors.border}`, 
            borderRadius: '12px',
            cursor: connected ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            fontSize: '15px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            transform: isHovered && connected ? 'scale(1.02)' : 'scale(1)',
            boxShadow: connected ? (isHovered ? `0 4px 12px ${colors.accentGlow}` : 'none') : 'none' 
          }}
        >
          {connected ? (
            <>
              <span>Buy</span>
            </>
          ) : (
            'Connect Wallet to Buy'
          )}
        </button>
      </div>
    </div>
  );
}