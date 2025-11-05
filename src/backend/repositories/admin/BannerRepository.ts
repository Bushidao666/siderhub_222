import type { HeroBanner, UUID } from '@shared/types';

export interface CreateBannerInput {
  title: string;
  description: string;
  primaryCta: HeroBanner['primaryCta'];
  secondaryCta?: HeroBanner['secondaryCta'];
  imageUrl: string;
  status: HeroBanner['status'];
  startsAt: HeroBanner['startsAt'];
  endsAt: HeroBanner['endsAt'];
  order: number;
  createdBy: UUID;
}

export interface UpdateBannerInput extends Omit<CreateBannerInput, 'createdBy' | 'order'> {
  order?: number;
  updatedBy: UUID;
}

export interface BannerRepository {
  list(): Promise<HeroBanner[]>;
  create(input: CreateBannerInput): Promise<HeroBanner>;
  update(id: UUID, input: UpdateBannerInput): Promise<HeroBanner>;
  remove(id: UUID): Promise<void>;
}
