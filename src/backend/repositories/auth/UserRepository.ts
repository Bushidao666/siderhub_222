import type { Nullable, User, UserRole, UUID } from '@shared/types';
import type { UserProfile } from '@shared/types/auth.types';

export type UserWithSecrets = User & {
  passwordHash: string;
};

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  role: UserRole;
  profile: UserProfile;
  inviteId: Nullable<UUID>;
}

export interface UserRepository {
  findByEmail(email: string): Promise<Nullable<UserWithSecrets>>;
  findById(userId: UUID): Promise<Nullable<UserWithSecrets>>;
  createUser(input: CreateUserInput): Promise<UserWithSecrets>;
  updateLastLoginAt(userId: UUID, timestamp: string): Promise<void>;
  list(query: UserListQuery): Promise<UserListResult>;
}

export interface UserListQuery {
  page: number;
  pageSize: number;
  role?: UserRole;
  search?: string;
}

export interface UserListResult {
  items: User[];
  totalItems: number;
}
