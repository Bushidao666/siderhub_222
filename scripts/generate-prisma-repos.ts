#!/usr/bin/env tsx
/**
 * Script para gerar automaticamente implementações Prisma dos Repositories
 * Lê as interfaces e gera as implementações seguindo o padrão do projeto
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const REPOS_BASE = 'src/backend/repositories';

type RepoToGenerate = {
  domain: string;
  interfaceFile: string;
  outputFile: string;
};

const reposToGenerate: RepoToGenerate[] = [
  // Academy
  { domain: 'academy', interfaceFile: 'CourseRecommendationRepository.ts', outputFile: 'PrismaCourseRecommendationRepository.ts' },

  // Hidra
  { domain: 'hidra', interfaceFile: 'HidraConfigRepository.ts', outputFile: 'PrismaHidraConfigRepository.ts' },
  { domain: 'hidra', interfaceFile: 'CampaignRepository.ts', outputFile: 'PrismaCampaignRepository.ts' },
  { domain: 'hidra', interfaceFile: 'CampaignRunRepository.ts', outputFile: 'PrismaCampaignRunRepository.ts' },

  // Cybervault
  { domain: 'cybervault', interfaceFile: 'ResourceRepository.ts', outputFile: 'PrismaResourceRepository.ts' },
  { domain: 'cybervault', interfaceFile: 'ResourceDownloadRepository.ts', outputFile: 'PrismaResourceDownloadRepository.ts' },

  // Admin
  { domain: 'admin', interfaceFile: 'BannerRepository.ts', outputFile: 'PrismaBannerRepository.ts' },
  { domain: 'admin', interfaceFile: 'FeatureToggleRepository.ts', outputFile: 'PrismaFeatureToggleRepository.ts' },
  { domain: 'admin', interfaceFile: 'MemberAccessOverrideRepository.ts', outputFile: 'PrismaMemberAccessOverrideRepository.ts' },
  { domain: 'admin', interfaceFile: 'HeroBannerRepository.ts', outputFile: 'PrismaHeroBannerRepository.ts' },
];

function generatePrismaRepository(repo: RepoToGenerate): string {
  const interfacePath = join(REPOS_BASE, repo.domain, repo.interfaceFile);

  if (!existsSync(interfacePath)) {
    console.warn(`⚠️  Interface não encontrada: ${interfacePath}`);
    return '';
  }

  const interfaceContent = readFileSync(interfacePath, 'utf-8');

  // Extrair nome da interface
  const interfaceMatch = interfaceContent.match(/export interface (\w+Repository)/);
  if (!interfaceMatch) {
    console.warn(`⚠️  Interface não encontrada em: ${interfacePath}`);
    return '';
  }

  const interfaceName = interfaceMatch[1];
  const className = repo.outputFile.replace('.ts', '');

  // Template básico
  const template = `import type { PrismaClient } from '@prisma/client';
import type { ${interfaceName} } from './${repo.interfaceFile.replace('.ts', '')}';

/**
 * Implementação Prisma do ${interfaceName}
 *
 * TODO: Implementar todos os métodos da interface
 * Gerado automaticamente por scripts/generate-prisma-repos.ts
 */
export class ${className} implements ${interfaceName} {
  constructor(private readonly prisma: PrismaClient) {}

  // TODO: Implementar métodos da interface ${interfaceName}
  // Referência: veja src/backend/repositories/auth/PrismaUserRepository.ts como exemplo
}
`;

  return template;
}

function main() {
  console.log('🚀 Gerando Prisma Repositories...\n');

  let generated = 0;
  let skipped = 0;

  for (const repo of reposToGenerate) {
    const outputPath = join(REPOS_BASE, repo.domain, repo.outputFile);

    // Verificar se já existe
    if (existsSync(outputPath)) {
      console.log(`⏭️  Já existe: ${repo.domain}/${repo.outputFile}`);
      skipped++;
      continue;
    }

    const content = generatePrismaRepository(repo);
    if (!content) {
      continue;
    }

    writeFileSync(outputPath, content, 'utf-8');
    console.log(`✅ Gerado: ${repo.domain}/${repo.outputFile}`);
    generated++;
  }

  console.log(`\n✨ Concluído!`);
  console.log(`   Gerados: ${generated}`);
  console.log(`   Já existiam: ${skipped}`);
  console.log(`\n⚠️  ATENÇÃO: Os arquivos gerados são STUBS!`);
  console.log(`   Você precisa implementar os métodos seguindo o padrão dos repositories existentes.`);
}

main();
