import type { Nullable, UUID } from '@shared/types';
import type { CreateInvitationParams, ListInvitationFilters } from '@shared/types/admin.types';
import type { Invitation } from '@shared/types/auth.types';

export interface CreateInvitationRecord extends CreateInvitationParams {
  code: string;
}

export interface InvitationRepository {
  findActiveByCode(code: string): Promise<Nullable<Invitation>>;
  markAsAccepted(invitationId: UUID, userId: UUID): Promise<void>;
  findPendingByEmail(email: string): Promise<Nullable<Invitation>>;
  create(input: CreateInvitationRecord): Promise<Invitation>;
  list(filters?: ListInvitationFilters): Promise<Invitation[]>;
}
