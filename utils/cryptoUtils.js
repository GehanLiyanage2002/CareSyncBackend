const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

// AES-256-GCM requires a 32-byte key. 
// For production, this should be set in .env as a 64-character hex string.
// For development, we provide a fallback 32-byte key.
const rawKey = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
// Ensure the key is exactly 32 bytes (256 bits)
const ENCRYPTION_KEY = Buffer.from(rawKey.padEnd(32, '0').substring(0, 32), 'utf-8');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes is standard for GCM

/**
 * Encrypts a plain text string using AES-256-GCM
 * @param {string} text - The plain text to encrypt
 * @returns {string|null} The encrypted string in format iv:authTag:encryptedText
 */
function encrypt(text) {
  if (text === null || text === undefined || text === '') return text;
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return concatenated payload: IV + AuthTag + Ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error.message);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypts an AES-256-GCM encrypted string
 * @param {string} encryptedText - The string to decrypt (iv:authTag:encryptedText)
 * @returns {string|null} The decrypted plain text
 */
function decrypt(encryptedText) {
  if (encryptedText === null || encryptedText === undefined || encryptedText === '') return encryptedText;
  
  // If the text doesn't match our encryption format, return it as-is (e.g. legacy plain text data)
  if (typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
    return encryptedText;
  }
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    return encryptedText; // Not our format, return as-is
  }
  
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const ciphertext = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    // If decryption fails (e.g. wrong key), return null to prevent leaking garbage
    return null; 
  }
}

module.exports = {
  encrypt,
  decrypt,
  // Exporting as requested for compatibility with upcoming steps
  encryptText: encrypt,
  decryptText: decrypt
};
