import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { createApiRouter } from './api';
import { createLogger } from './logger';
import type { ApiServices } from './api/types';

// Import services
import { AuthService } from './services/auth/AuthService';
import { TokenService } from './services/auth/TokenService';
import { PasswordService } from './services/auth/PasswordService';
import { HidraService } from './services/hidra/HidraService';
import { AcademyService } from './services/academy/AcademyService';
import { CybervaultService } from './services/cybervault/CybervaultService';
import { AdminService } from './services/admin/AdminService';
import { HubService } from './services/hub/HubService';

// Import Prisma Repository implementations
import { PrismaUserRepository } from './repositories/auth/PrismaUserRepository';
import { PrismaSessionRepository } from './repositories/auth/PrismaSessionRepository';
import { PrismaMemberAccessRepository } from './repositories/auth/PrismaMemberAccessRepository';
import { PrismaInvitationRepository } from './repositories/auth/PrismaInvitationRepository';
import {
  PrismaCourseRepository,
  PrismaLessonRepository,
  PrismaCourseProgressRepository,
  PrismaLessonCommentRepository,
  PrismaLessonCommentReplyRepository,
  PrismaCourseRecommendationRepository,
  PrismaLessonRatingRepository,
  PrismaLessonProgressRepository,
} from './repositories/academy';
import {
  PrismaBannerRepository,
  PrismaFeatureToggleRepository,
  PrismaMemberAccessOverrideRepository,
} from './repositories/admin';
import {
  PrismaResourceRepository,
  PrismaResourceDownloadRepository,
} from './repositories/cybervault';
import {
  PrismaHidraConfigRepository,
  PrismaCampaignRepository,
  PrismaCampaignRunRepository,
} from './repositories/hidra';
import { CryptoEncryptionService } from './services/hidra/CryptoEncryptionService';
import { UnavailableEncryptionService } from './services/hidra/EncryptionService';
import { apiLimiter } from './middleware/rateLimit';
import { initJobs, shutdownJobs } from './jobs';

const logger = createLogger('server');
const prisma = new PrismaClient();
let jobsRuntime: ReturnType<typeof initJobs> | null = null;

const parseEnvInteger = (value: string | undefined): number | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

// Load environment variables
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_ACCESS_TTL = (process.env.JWT_ACCESS_TTL ?? '15m') as import('ms').StringValue;
const JWT_REFRESH_TTL = (process.env.JWT_REFRESH_TTL ?? '7d') as import('ms').StringValue;
const REFRESH_TOKEN_TTL = (process.env.REFRESH_TOKEN_TTL ?? '7d') as import('ms').StringValue;
const HIDRA_ENCRYPTION_KEY = process.env.HIDRA_ENCRYPTION_KEY;
const HIDRA_EVOLUTION_TIMEOUT_MS = parseEnvInteger(process.env.HIDRA_EVOLUTION_TIMEOUT_MS);
const HIDRA_EVOLUTION_MAX_ATTEMPTS = parseEnvInteger(process.env.HIDRA_EVOLUTION_MAX_ATTEMPTS);
const FRONTEND_ORIGIN = (() => {
  try {
    return new URL(FRONTEND_URL).origin;
  } catch (error) {
    logger.warn('Invalid FRONTEND_URL provided, falling back to raw value', {
      error: error instanceof Error ? error.message : String(error),
    });
    return FRONTEND_URL;
  }
})();

// Initialize Prisma Repositories
const userRepository = new PrismaUserRepository(prisma);
const sessionRepository = new PrismaSessionRepository(prisma);
const memberAccessRepository = new PrismaMemberAccessRepository(prisma);
const invitationRepository = new PrismaInvitationRepository(prisma);
const courseRepository = new PrismaCourseRepository(prisma);
const lessonRepository = new PrismaLessonRepository(prisma);
const courseProgressRepository = new PrismaCourseProgressRepository(prisma);
const lessonCommentRepository = new PrismaLessonCommentRepository(prisma);
const lessonCommentReplyRepository = new PrismaLessonCommentReplyRepository(prisma);
const courseRecommendationRepository = new PrismaCourseRecommendationRepository(prisma);
const lessonRatingRepository = new PrismaLessonRatingRepository(prisma);
const lessonProgressRepository = new PrismaLessonProgressRepository(prisma);
const bannerRepository = new PrismaBannerRepository(prisma);
const featureToggleRepository = new PrismaFeatureToggleRepository(prisma);
const memberAccessOverrideRepository = new PrismaMemberAccessOverrideRepository(prisma);
const resourceRepository = new PrismaResourceRepository(prisma);
const resourceDownloadRepository = new PrismaResourceDownloadRepository(prisma);
const hidraConfigRepository = new PrismaHidraConfigRepository(prisma);
const campaignRepository = new PrismaCampaignRepository(prisma);
const campaignRunRepository = new PrismaCampaignRunRepository(prisma);

// Initialize Services
const passwordService = new PasswordService();

const tokenService = new TokenService({
  accessTokenSecret: JWT_SECRET,
  refreshTokenSecret: JWT_SECRET,
  accessTokenTtl: JWT_ACCESS_TTL,
  refreshTokenTtl: JWT_REFRESH_TTL,
});

const authService = new AuthService({
  userRepository,
  sessionRepository,
  memberAccessRepository,
  invitationRepository,
  passwordService,
  tokenService,
  refreshTokenTtl: REFRESH_TOKEN_TTL,
  logger: createLogger('AuthService')
});
let encryptionService = new UnavailableEncryptionService();
if (HIDRA_ENCRYPTION_KEY) {
  try {
    encryptionService = new CryptoEncryptionService({ key: HIDRA_ENCRYPTION_KEY });
  } catch (error) {
    logger.error('Failed to initialize Hidra encryption service, falling back to no-op implementation', {
      error,
    });
  }
} else {
  logger.warn('HIDRA_ENCRYPTION_KEY is not configured. Hidra API keys will not be persisted securely.');
}

const hidraService = new HidraService({
  hidraConfigRepository,
  campaignRepository,
  campaignRunRepository,
  encryptionService,
  logger: createLogger('HidraService'),
  evolutionClientOptions: {
    ...(HIDRA_EVOLUTION_TIMEOUT_MS !== undefined ? { timeoutMs: HIDRA_EVOLUTION_TIMEOUT_MS } : {}),
    ...(HIDRA_EVOLUTION_MAX_ATTEMPTS !== undefined ? { maxAttempts: HIDRA_EVOLUTION_MAX_ATTEMPTS } : {}),
  },
});

const academyService = new AcademyService({
  courseRepository,
  lessonRepository,
  progressRepository: courseProgressRepository,
  lessonCommentRepository,
  lessonCommentReplyRepository,
  recommendationRepository: courseRecommendationRepository,
  lessonRatingRepository,
  lessonProgressRepository,
  userRepository,
  logger: createLogger('AcademyService'),
});

const cybervaultService = new CybervaultService({
  resourceRepository,
  resourceDownloadRepository,
  logger: createLogger('CybervaultService'),
});

const adminService = new AdminService({
  bannerRepository,
  featureToggleRepository,
  memberAccessOverrideRepository,
  invitationRepository,
  userRepository,
  memberAccessRepository,
  logger: createLogger('AdminService'),
});

const hubService = new HubService({
  adminService,
  academyService,
  hidraService,
  cybervaultService,
  logger: createLogger('HubService'),
});

const services: ApiServices = {
  authService,
  tokenService,
  hidraService,
  academyService,
  cybervaultService,
  adminService,
  hubService,
};

// Create Express app
const app = express();

app.set('trust proxy', 1);

// Security middleware
const connectSources = Array.from(new Set<string>(["'self'", FRONTEND_ORIGIN]));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: connectSources,
      imgSrc: ["'self'", 'data:', 'blob:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:'],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 63072000,
    includeSubDomains: true,
    preload: true,
  },
}));

// Middleware
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  const queuesEnabled = (process.env.BULLMQ_ENABLED ?? 'true').toLowerCase() !== 'false';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'siderhub-api',
    database: prisma ? 'connected' : 'disconnected',
    queues: queuesEnabled ? (jobsRuntime ? 'enabled' : 'pending') : 'disabled',
  });
});

// Mount API routes with rate limiting
app.use('/api', apiLimiter, createApiRouter(services));

// Start server
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Initialize background jobs (BullMQ)
    jobsRuntime = initJobs();

    app.listen(PORT, () => {
      logger.info('🚀 ==============================================');
      logger.info(`🚀 SiderHub Backend Server is running!`);
      logger.info(`🚀 ==============================================`);
      logger.info(`🌐 Server: http://localhost:${PORT}`);
      logger.info(`📊 Health: http://localhost:${PORT}/health`);
      logger.info(`🔌 API: http://localhost:${PORT}/api`);
      logger.info(`🎨 Frontend: ${FRONTEND_URL}`);
      logger.info(`🚀 ==============================================`);
      logger.info('');
      logger.info('💡 Dica: Use Ctrl+C para parar o servidor');
      logger.info('📝 Auth: admin@siderhub.dev / ChangeMe123!');
      logger.info('');
    });
  } catch (error) {
    logger.error('❌ Failed to start server', { error });
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  await shutdownJobs(jobsRuntime);
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  await shutdownJobs(jobsRuntime);
  process.exit(0);
});

start();
