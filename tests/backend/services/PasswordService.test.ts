import bcrypt from 'bcrypt';
import { PasswordService } from 'src/backend/services/auth/PasswordService';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('PasswordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hashes password using configured salt rounds', async () => {
    const hashMock = mockedBcrypt.hash as unknown as jest.Mock<Promise<string>, [string, number]>;
    hashMock.mockResolvedValue('hashed-secret');
    const service = new PasswordService({ saltRounds: 8 });

    const result = await service.hash('Secret123!');

    expect(result).toBe('hashed-secret');
    expect(hashMock).toHaveBeenCalledWith('Secret123!', 8);
  });

  it('falls back to default salt rounds when none provided', async () => {
    const hashMock = mockedBcrypt.hash as unknown as jest.Mock<Promise<string>, [string, number]>;
    hashMock.mockResolvedValue('hashed-default');
    const service = new PasswordService();

    await service.hash('Secret123!');

    expect(hashMock).toHaveBeenCalledWith('Secret123!', 12);
  });

  it('delegates compare to bcrypt.compare', async () => {
    const compareMock = mockedBcrypt.compare as unknown as jest.Mock<Promise<boolean>, [string, string]>;
    compareMock.mockResolvedValue(true);
    const service = new PasswordService();

    const isValid = await service.compare('Secret123!', 'stored-hash');

    expect(isValid).toBe(true);
    expect(compareMock).toHaveBeenCalledWith('Secret123!', 'stored-hash');
  });
});
