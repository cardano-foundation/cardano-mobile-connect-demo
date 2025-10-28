import { STORAGE_KEYS } from '../constants/constants';

/**
 * Generates or loads an unique dApp ID
 * 
 * @returns {string} The ID
 */
export function getPersistentDappId() {
  let id = localStorage.getItem(STORAGE_KEYS.DAPP_PEER_ID);
  if (!id) {

    const deviceId = generateDeviceId('dapp');
    id = `dapp-${deviceId}`;
    localStorage.setItem(STORAGE_KEYS.DAPP_PEER_ID, id);
    console.log('Generated new persistent dApp ID:', id);
  } else {
    console.log('Using existing dApp ID:', id);
  }
  return id;
}

/**
 * Generates an unique device ID
 * 
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export function generateDeviceId(prefix) {
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 'unknown'
  ].join('|');

  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    // Convert to 32-bit integer
    hash = hash & hash;
  }
 
  const deviceHash = Math.abs(hash).toString(36);
  const timestamp = Date.now().toString(24);

  return `${deviceHash}-${timestamp}`;
}