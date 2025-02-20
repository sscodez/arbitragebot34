import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';

const STORAGE_PREFIX = 'arbitrage_bot_';
const WALLET_KEY = `${STORAGE_PREFIX}wallet`;
const ADDRESS_KEY = `${STORAGE_PREFIX}address`;
const SETTINGS_KEY = `${STORAGE_PREFIX}settings`;

export const encryptData = (data, password) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), password).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
};

export const decryptData = (encryptedData, password) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
};

export const saveWallet = async (privateKey, password) => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;

    // Encrypt the private key
    const encryptedKey = await wallet.encrypt(password);
    
    // Save to localStorage
    localStorage.setItem(WALLET_KEY, encryptedKey);
    localStorage.setItem(ADDRESS_KEY, address);

    return { address };
  } catch (error) {
    console.error('Failed to save wallet:', error);
    throw new Error('Failed to save wallet');
  }
};

export const loadWallet = async (password) => {
  try {
    const encryptedKey = localStorage.getItem(WALLET_KEY);
    if (!encryptedKey) {
      throw new Error('No wallet found');
    }

    const wallet = await ethers.Wallet.fromEncryptedJson(encryptedKey, password);
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    console.error('Failed to load wallet:', error);
    throw new Error('Failed to load wallet');
  }
};

export const removeWallet = () => {
  localStorage.removeItem(WALLET_KEY);
  localStorage.removeItem(ADDRESS_KEY);
};

export const hasStoredWallet = () => {
  return !!localStorage.getItem(WALLET_KEY);
};

export const getStoredAddress = () => {
  return localStorage.getItem(ADDRESS_KEY);
};

export const saveWalletSettings = (settings, password) => {
  const encrypted = encryptData(settings, password);
  localStorage.setItem(SETTINGS_KEY, encrypted);
};

export const loadWalletSettings = (password) => {
  try {
    const encrypted = localStorage.getItem(SETTINGS_KEY);
    if (!encrypted) return null;
    return decryptData(encrypted, password);
  } catch (error) {
    console.error('Failed to load wallet settings:', error);
    return null;
  }
};

export const validatePrivateKey = (privateKey) => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    return {
      isValid: true,
      address: wallet.address,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid private key format',
    };
  }
};

export const formatAddress = (address, start = 6, end = 4) => {
  if (!address) return '';
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

export const getAddressBalance = async (address, provider) => {
  try {
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw new Error('Failed to get balance');
  }
};
