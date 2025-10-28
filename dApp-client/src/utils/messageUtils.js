import { MESSAGE_TYPES } from '../constants/constants';

/**
 * Creates a wallet request in the right format
 * 
 * @param {string} method - The called method
 * @param {*} data 
 * @returns {Object} Die formated request
 */
export function createWalletRequest(method, data = null) {
  return {
    type: MESSAGE_TYPES.REQUEST,
    method: method,
    data: data,
    id: Date.now()
  };
}

/**
 * Creates a simple message
 * 
 * @param {string} message - The text
 * @returns {Object} The formated message
 */
export function createTextMessage(message) {
  return { message };
}

/**
 * Parses a message from the wallet
 * 
 * @param {*} data - The message to analyze
 * @returns {*} The parsed message
 */
export function parseWalletMessage(data) {
  try {
    return typeof data === 'string' ? JSON.parse(data) : data;
  } catch (e) {
    console.error('Failed to parse wallet message:', e);
    return data;
  }
}