/**
 * Constants and config
 */

//PeerJS config
export const PEER_CONFIG = {
  debug: 2,
  config: {
    //Test Server
    host: 'peerjs.dev.ecosyseng.cf-deployments.org',
    port: 443,
    path: '/',
    secure: true,
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }
};

//Connection constants
export const CONNECTION_CONSTANTS = {
  MAX_RECONNECT_ATTEMPTS: 100,
  RECONNECT_INTERVAL: 200,
  CONNECTION_TIMEOUT: 20000
};

//Message types
export const MESSAGE_TYPES = {
  REQUEST: 'request',
  RESPONSE: 'response'
};

//Wallet Functions
export const WALLET_METHODS = {
  SIGN_TX: 'signTx'
};

//Local keys
export const STORAGE_KEYS = {
  DAPP_PEER_ID: 'dapp-peer-id',
  LAST_WALLET_USED: 'last-wallet-used'
};