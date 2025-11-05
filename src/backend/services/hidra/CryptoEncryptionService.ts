import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { AppError } from '../../errors/AppError';
import type { EncryptionService } from './EncryptionService';

export interface CryptoEncryptionServiceConfig {
  // 32-byte key (Buffer or string in base64/hex). Required.
  key: Buffer | string;
}

function normalizeKey(key: Buffer | string): Buffer {
  let buf: Buffer;
  if (Buffer.isBuffer(key)) {
    buf = key;
  } else if (typeof key === 'string') {
    // Accept raw base64 (prefixed or not) or hex
    try {
      if (/^[A-Fa-f0-9]{64}$/.test(key)) {
        buf = Buffer.from(key, 'hex');
      } else {
        const cleaned = key.replace(/^base64:/, '');
        buf = Buffer.from(cleaned, 'base64');
      }
    } catch {
      throw new AppError({ code: 'ENCRYPTION_INVALID_KEY', message: 'Invalid encryption key encoding' });
    }
  } else {
    throw new AppError({ code: 'ENCRYPTION_INVALID_KEY', message: 'Invalid encryption key type' });
  }
  if (buf.length !== 32) {
    throw new AppError({ code: 'ENCRYPTION_INVALID_KEY_SIZE', message: 'Encryption key must be 32 bytes (AES-256-GCM)' });
  }
  return buf;
}

/**
 * AES-256-GCM encryption service.
 * Output format: base64(iv).base64(ciphertext).base64(tag)
 */
export class CryptoEncryptionService implements EncryptionService {
  private readonly key: Buffer;

  constructor(cfg: CryptoEncryptionServiceConfig) {
    this.key = normalizeKey(cfg.key);
  }

  async encrypt(plaintext: string): Promise<string> {
    try {
      const iv = randomBytes(12); // 96-bit nonce recommended for GCM
      const cipher = createCipheriv('aes-256-gcm', this.key, iv);
      const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();
      return `${iv.toString('base64')}.${ciphertext.toString('base64')}.${tag.toString('base64')}`;
    } catch (error) {
      throw new AppError({ code: 'ENCRYPTION_FAILED', message: 'Failed to encrypt payload', cause: error });
    }
  }

  async decrypt(encrypted: string): Promise<string> {
    try {
      const parts = encrypted.split('.');
      if (parts.length !== 3) {
        throw new AppError({ code: 'DECRYPTION_INVALID_FORMAT', message: 'Invalid encrypted payload format' });
      }
      const [ivB64, ctB64, tagB64] = parts;
      const iv = Buffer.from(ivB64, 'base64');
      const ciphertext = Buffer.from(ctB64, 'base64');
      const tag = Buffer.from(tagB64, 'base64');
      const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(tag);
      const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
      return plaintext;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError({ code: 'DECRYPTION_FAILED', message: 'Failed to decrypt payload', cause: error });
    }
  }
}

