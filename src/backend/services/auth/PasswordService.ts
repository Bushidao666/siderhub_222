import bcrypt from 'bcrypt';

export interface PasswordServiceOptions {
  saltRounds?: number;
}

export class PasswordService {
  private readonly saltRounds: number;

  constructor(options?: PasswordServiceOptions) {
    this.saltRounds = options?.saltRounds ?? 12;
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
