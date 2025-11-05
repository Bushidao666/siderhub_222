import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import path from 'path';

let envLoaded = false;

function ensureEnvLoaded() {
  if (envLoaded) return;
  loadEnv({ path: path.resolve(process.cwd(), '.env') });
  envLoaded = true;
}

export function createPrismaTestClient() {
  ensureEnvLoaded();
  const url = process.env.DATABASE_URL ?? 'file:./dev.db';
  return new PrismaClient({ datasources: { db: { url } } });
}

export async function disconnectPrisma(client: PrismaClient) {
  await client.$disconnect();
}
