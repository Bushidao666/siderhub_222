export type UUID = string;
export type ISODateString = string;
export type Timestamp = string;

export type Nullable<T> = T | null;

export enum UserRole {
  Member = 'member',
  Mentor = 'mentor',
  Admin = 'admin',
  SuperAdmin = 'super_admin',
}

export enum FeatureAccessKey {
  Hidra = 'hidra',
  Cybervault = 'cybervault',
  Academy = 'academy',
  Admin = 'admin_console',
  Community = 'community',
}

export enum CourseStatus {
  Draft = 'draft',
  Scheduled = 'scheduled',
  Published = 'published',
  Archived = 'archived',
}

export enum Visibility {
  Private = 'private',
  Members = 'members',
  Mentors = 'mentors',
  Public = 'public',
}

export enum LessonType {
  Video = 'video',
  Article = 'article',
  Live = 'live',
  Download = 'downloadable',
  Quiz = 'quiz',
}

export enum CampaignStatus {
  Draft = 'draft',
  Scheduled = 'scheduled',
  Running = 'running',
  Paused = 'paused',
  Completed = 'completed',
  Failed = 'failed',
}

export enum CampaignChannel {
  WhatsApp = 'whatsapp',
}

export enum ResourceType {
  Template = 'template',
  Playbook = 'playbook',
  Script = 'script',
  Asset = 'asset',
  Spreadsheet = 'spreadsheet',
  Presentation = 'presentation',
  Other = 'other',
}

export enum BannerStatus {
  Active = 'active',
  Inactive = 'inactive',
  Scheduled = 'scheduled',
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
