Title: Admin - Invitations
Methods: GET, POST
URLs:
  - GET /api/admin/invitations → ApiResponse<Invitation[]>
  - POST /api/admin/invitations → ApiResponse<Invitation>
Auth: Bearer + adminOnly
Query (GET):
  status?: 'pending' | 'accepted' | 'expired'
  search?: string (2..160 chars)
  limit?: number (1..100, default 50)
Body (POST):
  email: string (valid email)
  role: UserRole
  grantedAccess?: FeatureAccessKey[] (max 12, default [])
  expiresAt: ISO string (must be future date)
  templateId?: UUID | null
  sendEmail?: boolean
Success:
  200 (GET), 201 (POST)
Errors:
  400 VALIDATION_ERROR
  403 FORBIDDEN (roleGuard)
  409 ADMIN_INVITE_DUPLICATE (já existe convite pendente para o e-mail)
Notes:
  - GET delega para `AdminService.listInvitations`, aplicando filtros opcionais antes de consultar o repositório.
  - POST valida com Zod, injeta `invitedBy` a partir do usuário autenticado e chama `AdminService.createInvitation`.
  - Service gera `code`, grava via `InvitationRepository.create` e retorna o convite completo.
  - `sendEmail` fica disponível para o orquestrador de mensagens; API apenas encaminha o sinalizador.
  - Respostas usam helper `respondSuccess`, incluindo `meta.requestId` quando disponível.
