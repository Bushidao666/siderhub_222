-- Adjust defaults for profile_social_links and hero banner CTA

-- Ensure profile_social_links defaults to [] and is non-null
ALTER TABLE "core"."users" ALTER COLUMN "profile_social_links" SET DEFAULT '[]'::jsonb;
UPDATE "core"."users" SET "profile_social_links" = '[]'::jsonb WHERE "profile_social_links" IS NULL;
ALTER TABLE "core"."users" ALTER COLUMN "profile_social_links" SET NOT NULL;

-- Default hero banners primary CTA external flag to false
ALTER TABLE "admin"."hero_banners" ALTER COLUMN "primary_cta_external" SET DEFAULT false;
UPDATE "admin"."hero_banners" SET "primary_cta_external" = false WHERE "primary_cta_external" IS NULL;
