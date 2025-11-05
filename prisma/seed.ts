import {
  PrismaClient,
  UserRole,
  FeatureAccessKey,
  CourseStatus,
  Visibility,
  CourseLevel,
  LessonType,
  BannerStatus,
  ResourceType,
  ContactImportSource,
  EvolutionConnectionStatus,
  CampaignStatus,
  CampaignChannel,
  RecommendationBadge,
  LessonCommentModerationStatus,
} from '@prisma/client';
type BcryptModule = {
  hash: (data: string, saltOrRounds: string | number) => Promise<string>;
  compare: (data: string, encrypted: string) => Promise<boolean>;
};

const loadBcrypt = (): BcryptModule => {
  try {
    const mod = require('bcrypt');
    return (mod.default ?? mod) as BcryptModule;
  } catch (error) {
    console.warn('[seed] Falling back to bcryptjs for hashing (native bcrypt unavailable).');
    const fallback = require('bcryptjs');
    return (fallback.default ?? fallback) as BcryptModule;
  }
};

const bcrypt = loadBcrypt();

const prisma = new PrismaClient();

async function seedAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@siderhub.dev';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.super_admin,
      profileDisplayName: 'SiderHub Admin',
      profileAvatarUrl: null,
      profileBio: 'Conta administrativa inicial gerada pela seed.',
      profileTimezone: 'America/Sao_Paulo',
      profileBadges: ['founder'],
      profileSocialLinks: [],
      lastLoginAt: null,
    },
    create: {
      email,
      passwordHash,
      role: UserRole.super_admin,
      profileDisplayName: 'SiderHub Admin',
      profileAvatarUrl: null,
      profileBio: 'Conta administrativa inicial gerada pela seed.',
      profileTimezone: 'America/Sao_Paulo',
      profileBadges: ['founder'],
      profileSocialLinks: [],
    },
  });

  const featureFlags = [
    FeatureAccessKey.academy,
    FeatureAccessKey.hidra,
    FeatureAccessKey.cybervault,
    FeatureAccessKey.admin_console,
  ];

  for (const feature of featureFlags) {
    await prisma.memberAccess.upsert({
      where: {
        userId_feature: {
          userId: admin.id,
          feature,
        },
      },
      update: {
        enabled: true,
        permissions: ['*'],
      },
      create: {
        userId: admin.id,
        feature,
        enabled: true,
        permissions: ['*'],
      },
    });
  }

  return { admin, email, password };
}

async function seedMentorUser() {
  const email = process.env.SEED_MENTOR_EMAIL ?? 'mentor@siderhub.dev';
  const password = process.env.SEED_MENTOR_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 12);

  const mentor = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.mentor,
      profileDisplayName: 'Academy Mentor',
      profileAvatarUrl: null,
      profileBio: 'Mentor responsável pela curadoria da Academia no seed.',
      profileTimezone: 'America/Sao_Paulo',
      profileBadges: ['mentor'],
      profileSocialLinks: [],
      lastLoginAt: null,
    },
    create: {
      email,
      passwordHash,
      role: UserRole.mentor,
      profileDisplayName: 'Academy Mentor',
      profileAvatarUrl: null,
      profileBio: 'Mentor responsável pela curadoria da Academia no seed.',
      profileTimezone: 'America/Sao_Paulo',
      profileBadges: ['mentor'],
      profileSocialLinks: [],
    },
  });

  await prisma.memberAccess.upsert({
    where: {
      userId_feature: {
        userId: mentor.id,
        feature: FeatureAccessKey.academy,
      },
    },
    update: {
      enabled: true,
      permissions: ['comments:moderate'],
    },
    create: {
      userId: mentor.id,
      feature: FeatureAccessKey.academy,
      enabled: true,
      permissions: ['comments:moderate'],
    },
  });

  return { mentor, email, password };
}

async function seedMemberUser() {
  const email = process.env.SEED_MEMBER_EMAIL ?? 'member@siderhub.dev';
  const password = process.env.SEED_MEMBER_PASSWORD ?? 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 12);

  const member = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: UserRole.member,
      profileDisplayName: 'Academy Member',
      profileAvatarUrl: null,
      profileBio: 'Membro seed utilizado para simular interações na Academia.',
      profileTimezone: 'America/Sao_Paulo',
      profileBadges: ['founding-member'],
      profileSocialLinks: [],
      lastLoginAt: null,
    },
    create: {
      email,
      passwordHash,
      role: UserRole.member,
      profileDisplayName: 'Academy Member',
      profileAvatarUrl: null,
      profileBio: 'Membro seed utilizado para simular interações na Academia.',
      profileTimezone: 'America/Sao_Paulo',
      profileBadges: ['founding-member'],
      profileSocialLinks: [],
    },
  });

  await prisma.memberAccess.upsert({
    where: {
      userId_feature: {
        userId: member.id,
        feature: FeatureAccessKey.academy,
      },
    },
    update: {
      enabled: true,
      permissions: ['comments:create'],
    },
    create: {
      userId: member.id,
      feature: FeatureAccessKey.academy,
      enabled: true,
      permissions: ['comments:create'],
    },
  });

  return { member, email, password };
}

async function seedSampleCourse(params: { adminId: string; mentorId: string; memberId: string }) {
  const { adminId, mentorId, memberId } = params;
  const slug = 'growth-foundations';
  const now = new Date();
  const moduleIntroId = 'growth-foundations-module-1';
  const moduleAutomationId = 'growth-foundations-module-2';
  const lessonIntroVideoId = 'growth-foundations-lesson-1';
  const lessonChecklistId = 'growth-foundations-lesson-2';
  const lessonSegmentationId = 'growth-foundations-lesson-3';
  const lessonPlaybookId = 'growth-foundations-lesson-4';
  const dripRelease = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const modulesData = [
    {
      id: moduleIntroId,
      order: 1,
      title: 'Planejando sua rotina de crescimento',
      description: 'Definição de metas, cadência e KPIs para squads enxutos.',
      durationMinutes: 60,
      dripReleaseAt: now,
      lessons: {
        create: [
          {
            id: lessonIntroVideoId,
            order: 1,
            title: 'Panorama do funil Blacksider',
            summary: 'Entenda o fluxo unificado entre Hidra, Cybervault e Academy.',
            type: LessonType.video,
            content: {
              type: 'video',
              video: {
                videoUrl: 'https://cdn.example.com/videos/funnel-overview.mp4',
                durationSeconds: 900,
                captionsUrl: null,
                transcript: null,
              },
            },
            durationMinutes: 15,
            isPreview: true,
            releaseAt: now,
          },
          {
            id: lessonChecklistId,
            order: 2,
            title: 'Checklist de setup inicial',
            summary: 'Configuração prática dos artefatos essenciais antes do lançamento.',
            type: LessonType.article,
            content: {
              type: 'article',
              bodyMarkdown: '# Setup Inicial\n\n- Estruture seu hub\n- Configure campanhas base\n- Prepare materiais no Cybervault',
            },
            durationMinutes: 20,
            isPreview: false,
            releaseAt: now,
          },
        ],
      },
    },
    {
      id: moduleAutomationId,
      order: 2,
      title: 'Automação orientada por dados',
      description: 'Execução de campanhas drip, segmentação dinâmica e cadências avançadas.',
      durationMinutes: 80,
      dripDaysAfter: 7,
      dripAfterModuleId: moduleIntroId,
      lessons: {
        create: [
          {
            id: lessonSegmentationId,
            order: 1,
            title: 'Segmentação avançada no Hidra',
            summary: 'Configure disparos segmentados com base em eventos e atributos.',
            type: LessonType.video,
            content: {
              type: 'video',
              video: {
                videoUrl: 'https://cdn.example.com/videos/hidra-segmentation.mp4',
                durationSeconds: 1320,
                captionsUrl: null,
                transcript: null,
              },
            },
            durationMinutes: 22,
            isPreview: false,
            releaseAt: dripRelease,
          },
          {
            id: lessonPlaybookId,
            order: 2,
            title: 'Playbook de campanhas sempre ativas',
            summary: 'Baixe o playbook para orquestrar campanhas contínuas no WhatsApp.',
            type: LessonType.downloadable,
            content: {
              type: 'downloadable',
              assets: [
                {
                  fileUrl: 'https://cdn.example.com/files/always-on-playbook.pdf',
                  fileName: 'playbook-campanhas-sempre-ativas.pdf',
                  fileSizeBytes: 1_024_000,
                },
              ],
            },
            durationMinutes: 10,
            isPreview: false,
            releaseAt: dripRelease,
          },
        ],
      },
    },
  ];

  const buildModules = () =>
    modulesData.map((module) => ({
      ...module,
      lessons: {
        create: module.lessons.create.map((lesson) => ({ ...lesson })),
      },
    }));

  const totalLessons = modulesData.reduce((total, module) => total + module.lessons.create.length, 0);

  const course = await prisma.course.upsert({
    where: { slug },
    update: {
      title: 'Growth Foundations',
      subtitle: 'Estratégias essenciais para acelerar sua operação',
      description: 'Aprenda a estruturar campanhas, recursos e automações usando o ecossistema Blacksider.',
      level: CourseLevel.intermediate,
      status: CourseStatus.published,
      visibility: Visibility.members,
      estimatedDurationMinutes: 210,
      totalLessons,
      tags: ['growth', 'automations'],
      releaseDate: now,
      isFeatured: true,
      recommendationScore: 0.92,
      createdById: adminId,
      modules: {
        deleteMany: {},
        create: buildModules(),
      },
    },
    create: {
      slug,
      title: 'Growth Foundations',
      subtitle: 'Estratégias essenciais para acelerar sua operação',
      description: 'Aprenda a estruturar campanhas, recursos e automações usando o ecossistema Blacksider.',
      coverImage: 'https://cdn.example.com/images/growth-foundations-cover.jpg',
      level: CourseLevel.intermediate,
      status: CourseStatus.published,
      visibility: Visibility.members,
      estimatedDurationMinutes: 210,
      totalLessons,
      tags: ['growth', 'automations'],
      releaseDate: now,
      isFeatured: true,
      recommendationScore: 0.92,
      createdById: adminId,
      modules: {
        create: buildModules(),
      },
    },
  });

  await prisma.courseRecommendation.deleteMany({ where: { courseId: course.id } });
  await prisma.courseRecommendation.create({
    data: {
      courseId: course.id,
      reason: 'Mentores recomendam para squads que estão iniciando automações com Hidra.',
      badge: RecommendationBadge.mentor_pick,
    },
  });

  await prisma.courseProgress.upsert({
    where: {
      courseId_userId: {
        courseId: course.id,
        userId: adminId,
      },
    },
    update: {
      completedLessonIds: [lessonIntroVideoId],
      percentage: 45,
      lastLessonId: lessonSegmentationId,
    },
    create: {
      courseId: course.id,
      userId: adminId,
      completedLessonIds: [lessonIntroVideoId],
      percentage: 45,
      lastLessonId: lessonSegmentationId,
    },
  });

  await prisma.lessonRating.upsert({
    where: {
      userId_lessonId: {
        userId: adminId,
        lessonId: lessonIntroVideoId,
      },
    },
    update: {
      value: 5,
    },
    create: {
      lessonId: lessonIntroVideoId,
      userId: adminId,
      value: 5,
    },
  });

  await prisma.lessonProgressAggregate.upsert({
    where: {
      lessonId_userId: {
        lessonId: lessonSegmentationId,
        userId: adminId,
      },
    },
    update: {
      lastPositionSec: 540,
      percentage: 68,
    },
    create: {
      lessonId: lessonSegmentationId,
      userId: adminId,
      lastPositionSec: 540,
      percentage: 68,
    },
  });

  await prisma.lessonProgressEvent.deleteMany({
    where: {
      lessonId: lessonSegmentationId,
      userId: adminId,
    },
  });

  const tenSeconds = 10 * 1000;
  const progressBase = new Date();
  await prisma.lessonProgressEvent.createMany({
    data: [
      {
        id: '00000000-0000-0000-0000-lesson-progress-1',
        lessonId: lessonSegmentationId,
        userId: adminId,
        occurredAt: new Date(progressBase.getTime() - 3 * tenSeconds),
        positionSec: 120,
      },
      {
        id: '00000000-0000-0000-0000-lesson-progress-2',
        lessonId: lessonSegmentationId,
        userId: adminId,
        occurredAt: new Date(progressBase.getTime() - 2 * tenSeconds),
        positionSec: 220,
      },
      {
        id: '00000000-0000-0000-0000-lesson-progress-3',
        lessonId: lessonSegmentationId,
        userId: adminId,
        occurredAt: new Date(progressBase.getTime() - tenSeconds),
        positionSec: 320,
      },
    ],
    skipDuplicates: true,
  });

  const commentIds = {
    pending: '00000000-0000-0000-0000-comment-pending',
    approved: '00000000-0000-0000-0000-comment-approved',
    rejected: '00000000-0000-0000-0000-comment-rejected',
  } as const;

  const replyIds = {
    mentorRoot: '00000000-0000-0000-0000-reply-mentor-1',
    adminFollowUp: '00000000-0000-0000-0000-reply-admin-1',
    pendingMember: '00000000-0000-0000-0000-reply-pending-1',
  } as const;

  await prisma.lessonCommentReply.deleteMany({
    where: {
      commentId: { in: Object.values(commentIds) },
    },
  });

  await prisma.lessonComment.deleteMany({
    where: {
      id: { in: Object.values(commentIds) },
    },
  });

  const moderationBase = new Date(now.getTime() - 60 * 60 * 1000);

  await prisma.lessonComment.upsert({
    where: { id: commentIds.pending },
    update: {
      lessonId: lessonIntroVideoId,
      userId: memberId,
      body: 'Estou aguardando aprovação para compartilhar uma dúvida sobre o funil Blacksider.',
      pendingModeration: true,
      moderationStatus: LessonCommentModerationStatus.pending,
      moderatedById: null,
      moderatedAt: null,
    },
    create: {
      id: commentIds.pending,
      lessonId: lessonIntroVideoId,
      userId: memberId,
      body: 'Estou aguardando aprovação para compartilhar uma dúvida sobre o funil Blacksider.',
      pendingModeration: true,
      moderationStatus: LessonCommentModerationStatus.pending,
      moderatedById: null,
      moderatedAt: null,
    },
  });

  const approvedModeratedAt = new Date(moderationBase.getTime() + 20 * 60 * 1000);
  const approvedComment = await prisma.lessonComment.upsert({
    where: { id: commentIds.approved },
    update: {
      lessonId: lessonIntroVideoId,
      userId: memberId,
      body: 'Esse overview ajudou muito a entender como Hidra e Cybervault conversam. Sugestões de indicadores?',
      pendingModeration: false,
      moderationStatus: LessonCommentModerationStatus.approved,
      moderatedById: mentorId,
      moderatedAt: approvedModeratedAt,
    },
    create: {
      id: commentIds.approved,
      lessonId: lessonIntroVideoId,
      userId: memberId,
      body: 'Esse overview ajudou muito a entender como Hidra e Cybervault conversam. Sugestões de indicadores?',
      pendingModeration: false,
      moderationStatus: LessonCommentModerationStatus.approved,
      moderatedById: mentorId,
      moderatedAt: approvedModeratedAt,
    },
  });

  const rejectedModeratedAt = new Date(moderationBase.getTime() + 35 * 60 * 1000);
  await prisma.lessonComment.upsert({
    where: { id: commentIds.rejected },
    update: {
      lessonId: lessonIntroVideoId,
      userId: memberId,
      body: 'Link externo não permitido incluído aqui foi moderado.',
      pendingModeration: false,
      moderationStatus: LessonCommentModerationStatus.rejected,
      moderatedById: mentorId,
      moderatedAt: rejectedModeratedAt,
    },
    create: {
      id: commentIds.rejected,
      lessonId: lessonIntroVideoId,
      userId: memberId,
      body: 'Link externo não permitido incluído aqui foi moderado.',
      pendingModeration: false,
      moderationStatus: LessonCommentModerationStatus.rejected,
      moderatedById: mentorId,
      moderatedAt: rejectedModeratedAt,
    },
  });

  const replyModerationBase = new Date(moderationBase.getTime() + 45 * 60 * 1000);
  const mentorReplyModeratedAt = new Date(replyModerationBase.getTime() + 10 * 60 * 1000);
  const mentorReply = await prisma.lessonCommentReply.upsert({
    where: { id: replyIds.mentorRoot },
    update: {
      commentId: approvedComment.id,
      userId: mentorId,
      body: 'Comece rastreando tempo médio entre disparo e resposta e organize follow-ups no Hidra Dashboard.',
      pendingModeration: false,
      moderationStatus: LessonCommentModerationStatus.approved,
      moderatedById: mentorId,
      moderatedAt: mentorReplyModeratedAt,
      parentReplyId: null,
    },
    create: {
      id: replyIds.mentorRoot,
      commentId: approvedComment.id,
      userId: mentorId,
      body: 'Comece rastreando tempo médio entre disparo e resposta e organize follow-ups no Hidra Dashboard.',
      pendingModeration: false,
      moderationStatus: LessonCommentModerationStatus.approved,
      moderatedById: mentorId,
      moderatedAt: mentorReplyModeratedAt,
      parentReplyId: null,
    },
  });

  const adminReplyModeratedAt = new Date(replyModerationBase.getTime() + 20 * 60 * 1000);
  await prisma.lessonCommentReply.upsert({
    where: { id: replyIds.adminFollowUp },
    update: {
      commentId: approvedComment.id,
      userId: adminId,
      body: 'Complementando: valide também as taxas de clique dos materiais do Cybervault compartilhados.',
      pendingModeration: false,
      moderationStatus: LessonCommentModerationStatus.approved,
      moderatedById: mentorId,
      moderatedAt: adminReplyModeratedAt,
      parentReplyId: mentorReply.id,
    },
    create: {
      id: replyIds.adminFollowUp,
      commentId: approvedComment.id,
      userId: adminId,
      body: 'Complementando: valide também as taxas de clique dos materiais do Cybervault compartilhados.',
      pendingModeration: false,
      moderationStatus: LessonCommentModerationStatus.approved,
      moderatedById: mentorId,
      moderatedAt: adminReplyModeratedAt,
      parentReplyId: mentorReply.id,
    },
  });

  await prisma.lessonCommentReply.upsert({
    where: { id: replyIds.pendingMember },
    update: {
      commentId: approvedComment.id,
      userId: memberId,
      body: 'Posso compartilhar templates de acompanhamento por aqui?',
      pendingModeration: true,
      moderationStatus: LessonCommentModerationStatus.pending,
      moderatedById: null,
      moderatedAt: null,
      parentReplyId: mentorReply.id,
    },
    create: {
      id: replyIds.pendingMember,
      commentId: approvedComment.id,
      userId: memberId,
      body: 'Posso compartilhar templates de acompanhamento por aqui?',
      pendingModeration: true,
      moderationStatus: LessonCommentModerationStatus.pending,
      moderatedById: null,
      moderatedAt: null,
      parentReplyId: mentorReply.id,
    },
  });

  return course;
}

async function seedHeroBanner(adminId: string) {
  const existing = await prisma.heroBanner.findFirst();
  if (existing) {
    return existing;
  }

  return prisma.heroBanner.create({
    data: {
      title: 'Bem-vindo ao novo SiderHub',
      description: 'Centralize sua rotina: continue o curso, acione campanhas Hidra e acesse o Cybervault.',
      primaryCtaLabel: 'Retomar curso',
      primaryCtaHref: '/academy/courses/growth-foundations',
      primaryCtaExternal: false,
      secondaryCtaLabel: 'Ver recursos',
      secondaryCtaHref: '/cybervault',
      secondaryCtaExternal: false,
      imageUrl: 'https://cdn.example.com/images/hero-neon.jpg',
      order: 1,
      status: BannerStatus.active,
      startsAt: new Date(),
      endsAt: null,
      createdById: adminId,
    },
  });
}

async function seedCybervaultResources(adminId: string) {
  const category = await prisma.resourceCategory.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000ab' },
    update: {
      name: 'Templates',
      description: 'Modelos prontos para campanhas e onboarding.',
      icon: 'file-text',
      order: 1,
    },
    create: {
      id: '00000000-0000-0000-0000-0000000000ab',
      name: 'Templates',
      description: 'Modelos prontos para campanhas e onboarding.',
      icon: 'file-text',
      order: 1,
    },
  });

  const tag = await prisma.resourceTag.upsert({
    where: { name: 'onboarding' },
    update: {},
    create: {
      name: 'onboarding',
    },
  });

  const resource = await prisma.resource.upsert({
    where: { slug: 'template-boas-vindas' },
    update: {
      title: 'Template de Boas-vindas',
      description: 'Mensagem inicial para novos membros da comunidade Blacksider.',
      type: ResourceType.template,
      categoryId: category.id,
      thumbnailUrl: 'https://cdn.example.com/images/template-thumb.jpg',
      visibility: Visibility.members,
      featured: true,
      createdById: adminId,
    },
    create: {
      slug: 'template-boas-vindas',
      title: 'Template de Boas-vindas',
      description: 'Mensagem inicial para novos membros da comunidade Blacksider.',
      type: ResourceType.template,
      categoryId: category.id,
      thumbnailUrl: 'https://cdn.example.com/images/template-thumb.jpg',
      visibility: Visibility.members,
      featured: true,
      createdById: adminId,
    },
  });

  await prisma.resourceAsset.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000ac' },
    update: {
      resourceId: resource.id,
      fileUrl: 'https://cdn.example.com/files/template-boas-vindas.docx',
      fileName: 'template-boas-vindas.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 58_432,
    },
    create: {
      id: '00000000-0000-0000-0000-0000000000ac',
      resourceId: resource.id,
      fileUrl: 'https://cdn.example.com/files/template-boas-vindas.docx',
      fileName: 'template-boas-vindas.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 58_432,
    },
  });

  await prisma.resourceTagAssignment.upsert({
    where: {
      resourceId_tagId: {
        resourceId: resource.id,
        tagId: tag.id,
      },
    },
    update: {},
    create: {
      resourceId: resource.id,
      tagId: tag.id,
    },
  });

  return { resource, category };
}

async function seedHidraSamples(adminId: string) {
  const evolutionConfig = await prisma.evolutionApiConfig.upsert({
    where: { userId: adminId },
    update: {
      baseUrl: 'https://api.evolution.dev/blacksider',
      apiKeyEncrypted: Buffer.from('seed-key-placeholder'),
      connectedAt: new Date(),
      lastHealthCheckAt: new Date(),
      status: EvolutionConnectionStatus.connected,
      errorMessage: null,
    },
    create: {
      userId: adminId,
      baseUrl: 'https://api.evolution.dev/blacksider',
      apiKeyEncrypted: Buffer.from('seed-key-placeholder'),
      connectedAt: new Date(),
      lastHealthCheckAt: new Date(),
      status: EvolutionConnectionStatus.connected,
      errorMessage: null,
    },
  });

  const segment = await prisma.contactSegment.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000ba' },
    update: {
      userId: adminId,
      name: 'Leads Qualificados',
      description: 'Leads com interesse confirmado em campanhas de WhatsApp.',
      importSource: ContactImportSource.manual,
      totalContacts: 128,
    },
    create: {
      id: '00000000-0000-0000-0000-0000000000ba',
      userId: adminId,
      name: 'Leads Qualificados',
      description: 'Leads com interesse confirmado em campanhas de WhatsApp.',
      importSource: ContactImportSource.manual,
      totalContacts: 128,
    },
  });

  const template = await prisma.messageTemplate.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000bb' },
    update: {
      userId: adminId,
      title: 'Campanha de Boas-vindas',
      body: 'Olá {{nome}}, bem-vindo ao ecossistema Blacksider! Pronto para desbloquear novas receitas?',
      variables: ['{{nome}}'],
      mediaUrl: null,
    },
    create: {
      id: '00000000-0000-0000-0000-0000000000bb',
      userId: adminId,
      title: 'Campanha de Boas-vindas',
      body: 'Olá {{nome}}, bem-vindo ao ecossistema Blacksider! Pronto para desbloquear novas receitas?',
      variables: ['{{nome}}'],
      mediaUrl: null,
    },
  });

  const campaign = await prisma.campaign.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000bc' },
    update: {
      userId: adminId,
      evolutionConfigId: evolutionConfig.id,
      name: 'Onboarding Hidra',
      description: 'Fluxo inicial de engajamento para novos membros Blacksider.',
      channel: CampaignChannel.whatsapp,
      status: CampaignStatus.scheduled,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
      startedAt: null,
      completedAt: null,
      segmentId: segment.id,
      templateId: template.id,
      externalId: 'hidra-onboarding-seed',
      maxMessagesPerMinute: 80,
    },
    create: {
      id: '00000000-0000-0000-0000-0000000000bc',
      userId: adminId,
      evolutionConfigId: evolutionConfig.id,
      name: 'Onboarding Hidra',
      description: 'Fluxo inicial de engajamento para novos membros Blacksider.',
      channel: CampaignChannel.whatsapp,
      status: CampaignStatus.scheduled,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
      startedAt: null,
      completedAt: null,
      segmentId: segment.id,
      templateId: template.id,
      externalId: 'hidra-onboarding-seed',
      maxMessagesPerMinute: 80,
    },
  });

  await prisma.campaignMetrics.upsert({
    where: { campaignId: campaign.id },
    update: {
      totalMessages: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      averageDeliveryMs: 0,
    },
    create: {
      campaignId: campaign.id,
      totalMessages: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      averageDeliveryMs: 0,
    },
  });

  await prisma.campaignTimelinePoint.upsert({
    where: { id: '00000000-0000-0000-0000-0000000000bd' },
    update: {
      campaignId: campaign.id,
      timestamp: new Date(),
      delivered: 0,
      failed: 0,
    },
    create: {
      id: '00000000-0000-0000-0000-0000000000bd',
      campaignId: campaign.id,
      timestamp: new Date(),
      delivered: 0,
      failed: 0,
    },
  });

  return {
    evolutionConfig,
    segment,
    template,
    campaign,
  };
}

async function main() {
  const { admin, email, password } = await seedAdminUser();
  const { mentor, email: mentorEmail, password: mentorPassword } = await seedMentorUser();
  const { member, email: memberEmail, password: memberPassword } = await seedMemberUser();
  const course = await seedSampleCourse({ adminId: admin.id, mentorId: mentor.id, memberId: member.id });
  const banner = await seedHeroBanner(admin.id);
  const { resource } = await seedCybervaultResources(admin.id);
  const { campaign } = await seedHidraSamples(admin.id);

  console.log('✅ Seed concluída com sucesso');
  console.log(`Admin: ${email}`);
  console.log(`Senha: ${password}`);
  console.log(`Mentor: ${mentorEmail}`);
  console.log(`Mentor senha: ${mentorPassword}`);
  console.log(`Member: ${memberEmail}`);
  console.log(`Member senha: ${memberPassword}`);
  console.log(`Curso seed: ${course.title}`);
  console.log(`Banner seed: ${banner.title}`);
  console.log(`Resource seed: ${resource.title}`);
  console.log(`Hidra campaign seed: ${campaign.name}`);
}

main()
  .catch((error) => {
    console.error('❌ Falha ao executar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
