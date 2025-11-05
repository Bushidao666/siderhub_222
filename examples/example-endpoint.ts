import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import type { ApiResponse } from '../src/shared/types/api.types';
import type { LoginResponse } from '../src/shared/types/auth.types';
import { UserRole } from '../src/shared/types/common.types';
import { loginRequestSchema } from '../src/shared/utils/validation';

const router = Router();

router.post('/example/auth/login', async (req: Request, res: Response) => {
  const parseResult = loginRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    const payload: ApiResponse<never> = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Credenciais inválidas',
        details: parseResult.error.flatten(),
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(400).json(payload);
  }

  // Exemplifica chamada ao AuthService (a ser implementado pelo subagent)
  const data: LoginResponse = {
    user: {
      id: 'uuid',
      email: parseResult.data.email,
      role: UserRole.Member,
      profile: {
        displayName: 'Nome Exemplo',
        avatarUrl: null,
        bio: null,
        timezone: 'America/Sao_Paulo',
        badges: [],
        socialLinks: [],
      },
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    accessToken: 'jwt.access.token',
    refreshToken: 'jwt.refresh.token',
    accessMap: [],
    activeSessions: [],
  };

  const payload: ApiResponse<LoginResponse> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return res.status(200).json(payload);
});

export default router;
