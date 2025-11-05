import type { Nullable, UUID } from '@shared/types';
import type { CourseMeta, CourseTree } from '@shared/types/academy.types';
import type { CourseStatus, Visibility } from '@shared/types/common.types';

export interface CourseListQuery {
  page: number;
  pageSize: number;
  status?: CourseStatus;
  visibility?: Visibility;
  tag?: string;
  search?: string;
}

export interface CourseListResult {
  items: CourseMeta[];
  totalItems: number;
}

export interface CourseRepository {
  list(query: CourseListQuery): Promise<CourseListResult>;
  findTreeById(courseId: UUID): Promise<Nullable<CourseTree>>;
  findById?(courseId: UUID): Promise<Nullable<CourseMeta>>;
  listFeatured(limit: number): Promise<CourseMeta[]>;
  findByIds(courseIds: UUID[]): Promise<CourseMeta[]>;
}
