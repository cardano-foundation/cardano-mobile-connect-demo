import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * QR-Code Connector - Generates QR Code for peerjs connection
 */
export default function QRCodeConnector({ peerId, isReady, connected, compact = false }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (isReady && peerId) {
      generateQRCode();
    }
  }, [isReady, peerId]);

  const generateQRCode = async () => {
    try {

      const qrData = `wallet://connect?dappPeer=${peerId}`;
      
      console.log('Generating QR Code for dApp connection:', qrData);
      
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: compact ? 200 : 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
      
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error('QR Code generation failed:', error);
    }
  };

  if (!isReady || !peerId) {
    return (
      <div style={{
        padding: compact ? '15px' : '20px',
        textAlign: 'center',
        color: '#666',
        fontSize: compact ? '12px' : '14px'
      }}>
        Generating QR Code...
      </div>
    );
  }

  if (connected) {
    return (
      <div style={{
        padding: compact ? '15px' : '20px',
        textAlign: 'center',
        color: '#10B981',
        fontSize: compact ? '12px' : '14px'
      }}>
        Wallet Connected!
      </div>
    );
  }

  return (
    <div style={{
      padding: compact ? '10px' : '15px',
      textAlign: 'center'
    }}>
      {qrCodeUrl && (
        <img 
          src={qrCodeUrl} 
          alt="dApp Connection QR Code"
          style={{
            maxWidth: '100%',
            height: 'auto',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}
        />
      )}
    </div>
  );
}