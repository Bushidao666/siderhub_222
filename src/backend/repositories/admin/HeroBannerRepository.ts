import type { Nullable, UUID } from '@shared/types';
import type { HeroBanner } from '@shared/types/admin.types';
import type { z } from 'zod';
import type { bannerSchema } from '@utils/validation';

export type BannerInput = z.infer<typeof bannerSchema>;

export interface HeroBannerRepository {
  list(): Promise<HeroBanner[]>;
  findById(id: UUID): Promise<Nullable<HeroBanner>>;
  create(input: BannerInput): Promise<HeroBanner>;
  update(id: UUID, input: BannerInput): Promise<HeroBanner>;
  delete(id: UUID): Promise<void>;
}
