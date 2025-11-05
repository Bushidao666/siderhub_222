import type { Prisma, PrismaClient } from '@prisma/client';
import type { Nullable, UUID } from '@shared/types';
import type { CourseMeta, CourseTree } from '@shared/types/academy.types';
import type { CourseStatus, Visibility } from '@shared/types/common.types';
import type { CourseListQuery, CourseListResult, CourseRepository } from './CourseRepository';
import { mapPrismaCourseMeta, mapPrismaCourseTree } from './mappers';

interface CourseListWhere {
  status?: CourseStatus;
  visibility?: Visibility;
  tags?: { has: string };
  OR?: Prisma.Enumerable<Prisma.CourseWhereInput>;
}

export class PrismaCourseRepository implements CourseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async list(query: CourseListQuery): Promise<CourseListResult> {
    const where: CourseListWhere = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.visibility) {
      where.visibility = query.visibility;
    }

    if (query.tag) {
      where.tags = { has: query.tag };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.pageSize;
    const [items, totalItems] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: [{ recommendationScore: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      items: items.map(mapPrismaCourseMeta),
      totalItems,
    } satisfies CourseListResult;
  }

  async findTreeById(courseId: UUID): Promise<Nullable<CourseTree>> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!course) {
      return null;
    }

    return mapPrismaCourseTree(course);
  }

  async findById(courseId: UUID): Promise<Nullable<CourseMeta>> {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    return course ? mapPrismaCourseMeta(course) : null;
  }

  async listFeatured(limit: number): Promise<CourseMeta[]> {
    const courses = await this.prisma.course.findMany({
      where: { isFeatured: true },
      orderBy: [{ recommendationScore: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
    return courses.map(mapPrismaCourseMeta);
  }

  async findByIds(courseIds: UUID[]): Promise<CourseMeta[]> {
    if (courseIds.length === 0) {
      return [];
    }
    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
    });
    return courses.map(mapPrismaCourseMeta);
  }
}
