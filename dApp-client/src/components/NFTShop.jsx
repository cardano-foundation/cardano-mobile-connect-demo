import React, { useState } from 'react';
import NftCard from './NFTKarte';


const theme = {
  background: '#121218',
  cardBg: '#1E1E2E',
  accentPrimary: '#8B5CF6',
  accentSecondary: '#6D28D9',
  accentGlow: 'rgba(139, 92, 246, 0.15)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A9A9BC',
  border: '#2D2D3A'
};

const nfts = [
  {
    id: 'nft1',
    name: 'Fractal Noise',
    price: '45 ADA',
    image: 'https://images.unsplash.com/photo-1750841896872-e09747c58c15?w=500&auto=format&fit=crop&q=80',
    edition: '1 of 10'
  },
  {
    id: 'nft2',
    name: 'Glass Waves',
    price: '20 ADA',
    image: 'https://images.unsplash.com/photo-1752606402449-0c14a2d6af70?w=500&auto=format&fit=crop&q=80',
    edition: '2 of 5'
  },
  {
    id: 'nft3',
    name: 'Powder Gravity',
    price: '30 ADA',
    image: 'https://images.unsplash.com/photo-1751336112082-66c6f90b823b?w=500&auto=format&fit=crop&q=80',
    edition: '5 of 50'
  },
  {
    id: 'nft4',
    name: 'Fanned Mountain',
    price: '120 ADA',
    image: 'https://images.unsplash.com/photo-1753837738732-46691c8e923b?w=500&auto=format&fit=crop&q=80',
    edition: '1 of 3'
  }
];

/**
 * Shop-Component for NFTs
 */
export default function NftShop({ connected, onPurchase }) {
  const [selectedNft, setSelectedNft] = useState(null);
  
  const handlePurchase = (nft) => {
    setSelectedNft(nft);
    onPurchase({
      type: "Payment",
      amount: nft.price,
      recipient: "addr1qxyz...abc123",
      productName: nft.name,
      productId: nft.id,
      fee: "0.17 ADA",
      metadata: "Purchase: " + nft.name + " #" + Date.now()
    });
  };
  
  return (
    <div style={{ 
      padding: '0', 
      width: '100%',
      color: theme.textPrimary,
      marginTop: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        padding: '0 0px', 
      marginBottom: '24px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600',
          margin: 0,
          background: `linear-gradient(135deg, ${theme.textPrimary} 0%, ${theme.accentPrimary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Discover unique NFTs
        </h2>
        
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px',
        marginBottom: '40px',
        padding: '0 0px',
        width: '100%',
        boxSizing: 'border-box'
      }} className="nft-grid">
        {nfts.map(nft => (
          <NftCard 
            key={nft.id}
            nft={nft}
            selected={selectedNft?.id === nft.id}
            connected={connected}
            onPurchase={() => handlePurchase(nft)}
            theme={theme}
          />
        ))}
      </div>
    </div>
  );
}