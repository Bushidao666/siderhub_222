-- Academy — feature flags for hub listings
ALTER TABLE "academy"."courses" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "academy"."courses" ADD COLUMN IF NOT EXISTS "recommendation_score" DOUBLE PRECISION NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "courses_is_featured_idx" ON "academy"."courses" ("is_featured");
CREATE INDEX IF NOT EXISTS "courses_recommendation_score_idx" ON "academy"."courses" ("recommendation_score");

-- Academy — drip configuration on modules
ALTER TABLE "academy"."course_modules" ADD COLUMN IF NOT EXISTS "drip_days_after" INTEGER;
ALTER TABLE "academy"."course_modules" ADD COLUMN IF NOT EXISTS "drip_release_at" TIMESTAMP(3);
ALTER TABLE "academy"."course_modules" ADD COLUMN IF NOT EXISTS "drip_after_module_id" TEXT;
CREATE INDEX IF NOT EXISTS "course_modules_course_id_drip_release_at_idx" ON "academy"."course_modules" ("course_id", "drip_release_at");
CREATE INDEX IF NOT EXISTS "course_modules_drip_after_module_id_idx" ON "academy"."course_modules" ("drip_after_module_id");
DO $$
BEGIN
  ALTER TABLE "academy"."course_modules"
    ADD CONSTRAINT "course_modules_drip_after_module_id_fkey"
    FOREIGN KEY ("drip_after_module_id")
    REFERENCES "academy"."course_modules"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Academy — lesson ratings and progress tracking
CREATE TABLE IF NOT EXISTS "academy"."lesson_ratings" (
  "id" TEXT NOT NULL,
  "lesson_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "value" SMALLINT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lesson_ratings_pkey" PRIMARY KEY ("id")
);
DO $$
BEGIN
  ALTER TABLE "academy"."lesson_ratings"
    ADD CONSTRAINT "lesson_ratings_user_id_lesson_id_key" UNIQUE ("user_id", "lesson_id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE "academy"."lesson_ratings"
    ADD CONSTRAINT "lesson_ratings_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "academy"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE "academy"."lesson_ratings"
    ADD CONSTRAINT "lesson_ratings_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "lesson_ratings_lesson_id_idx" ON "academy"."lesson_ratings" ("lesson_id");
CREATE INDEX IF NOT EXISTS "lesson_ratings_user_id_idx" ON "academy"."lesson_ratings" ("user_id");
CREATE INDEX IF NOT EXISTS "lesson_ratings_lesson_id_user_id_idx" ON "academy"."lesson_ratings" ("lesson_id", "user_id");

CREATE TABLE IF NOT EXISTS "academy"."lesson_progress_events" (
  "id" TEXT NOT NULL,
  "lesson_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "occurred_at" TIMESTAMP(3) NOT NULL,
  "position_sec" INTEGER NOT NULL,
  CONSTRAINT "lesson_progress_events_pkey" PRIMARY KEY ("id")
);
DO $$
BEGIN
  ALTER TABLE "academy"."lesson_progress_events"
    ADD CONSTRAINT "lesson_progress_events_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "academy"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE "academy"."lesson_progress_events"
    ADD CONSTRAINT "lesson_progress_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "lesson_progress_events_lesson_id_idx" ON "academy"."lesson_progress_events" ("lesson_id");
CREATE INDEX IF NOT EXISTS "lesson_progress_events_user_id_idx" ON "academy"."lesson_progress_events" ("user_id");
CREATE INDEX IF NOT EXISTS "lesson_progress_events_user_id_lesson_id_occurred_at_idx" ON "academy"."lesson_progress_events" ("user_id", "lesson_id", "occurred_at");
CREATE INDEX IF NOT EXISTS "lesson_progress_events_lesson_id_user_id_idx" ON "academy"."lesson_progress_events" ("lesson_id", "user_id");

CREATE TABLE IF NOT EXISTS "academy"."lesson_progress_aggregate" (
  "lesson_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "last_position_sec" INTEGER NOT NULL DEFAULT 0,
  "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lesson_progress_aggregate_pkey" PRIMARY KEY ("lesson_id", "user_id")
);
DO $$
BEGIN
  ALTER TABLE "academy"."lesson_progress_aggregate"
    ADD CONSTRAINT "lesson_progress_aggregate_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "academy"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE "academy"."lesson_progress_aggregate"
    ADD CONSTRAINT "lesson_progress_aggregate_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "lesson_progress_aggregate_lesson_id_idx" ON "academy"."lesson_progress_aggregate" ("lesson_id");
CREATE INDEX IF NOT EXISTS "lesson_progress_aggregate_user_id_idx" ON "academy"."lesson_progress_aggregate" ("user_id");

CREATE INDEX IF NOT EXISTS "lessons_release_at_idx" ON "academy"."lessons" ("release_at");

-- Admin / Cybervault optimisations
CREATE INDEX IF NOT EXISTS "hero_banners_status_order_idx" ON "admin"."hero_banners" ("status", "order");
CREATE INDEX IF NOT EXISTS "resources_featured_idx" ON "cybervault"."resources" ("featured");

-- Hidra — idempotency and dashboard view
DO $$
BEGIN
  ALTER TABLE "hidra"."campaigns" ADD CONSTRAINT "campaigns_external_id_key" UNIQUE ("external_id");
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "campaigns_user_id_status_idx" ON "hidra"."campaigns" ("user_id", "status");
CREATE OR REPLACE VIEW "hidra"."campaign_owner_metrics_view" AS
SELECT
  c.user_id AS owner_id,
  COUNT(*) AS total_campaigns,
  COUNT(*) FILTER (WHERE c.status = 'running') AS running_campaigns,
  COUNT(*) FILTER (WHERE c.status = 'scheduled') AS scheduled_campaigns,
  COALESCE(SUM(m.delivered), 0) AS delivered_messages,
  COALESCE(SUM(m.failed), 0) AS failed_messages,
  COALESCE(SUM(m.pending), 0) AS pending_messages
FROM "hidra"."campaigns" c
LEFT JOIN "hidra"."campaign_metrics" m ON m.campaign_id = c.id
GROUP BY c.user_id;
