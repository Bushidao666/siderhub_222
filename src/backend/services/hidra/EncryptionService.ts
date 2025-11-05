import { AppError } from '../../errors/AppError';

export interface EncryptionService {
  encrypt(plaintext: string): Promise<string>;
  decrypt(encrypted: string): Promise<string>;
}

export class UnavailableEncryptionService implements EncryptionService {
  async encrypt(_plaintext: string): Promise<string> {
    throw new AppError({ code: 'HIDRA_KEY_UNAVAILABLE', message: 'Encryption service not available' });
  }

  async decrypt(_encrypted: string): Promise<string> {
    throw new AppError({ code: 'HIDRA_KEY_UNAVAILABLE', message: 'Encryption service not available' });
  }
}
