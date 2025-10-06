import { randomBytes, createCipher, createDecipher } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-character-encryption-key';
const ALGORITHM = 'aes-256-ctr';

export function encryptSecret(secret: string): string {
  if (!secret) return '';
  
  try {
    const iv = randomBytes(16);
    const cipher = createCipher(ALGORITHM, ENCRYPTION_KEY);
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return secret;
  }
}

export function decryptSecret(encryptedSecret: string): string {
  if (!encryptedSecret) return '';
  
  try {
    const parts = encryptedSecret.split(':');
    if (parts.length !== 2) {
      return encryptedSecret;
    }
    
    const decipher = createDecipher(ALGORITHM, ENCRYPTION_KEY);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedSecret;
  }
}
