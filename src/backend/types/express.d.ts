import type { UserRole, UUID } from '@shared/types/common.types'

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: UUID
      sessionId: UUID
      role: UserRole
    }
  }

  interface Locals {
    requestId?: string
  }
}

