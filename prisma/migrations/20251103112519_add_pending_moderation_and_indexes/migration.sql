-- AlterTable
ALTER TABLE "academy"."lesson_comments" ADD COLUMN     "pending_moderation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "academy"."lesson_progress_aggregate" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "course_progress_course_id_user_id_percentage_idx" ON "academy"."course_progress"("course_id", "user_id", "percentage");

-- CreateIndex
CREATE INDEX "lesson_comments_lesson_id_created_at_idx" ON "academy"."lesson_comments"("lesson_id", "created_at" DESC);

-- Check constraints
DO $$
BEGIN
  ALTER TABLE "academy"."lesson_ratings"
    ADD CONSTRAINT "lesson_ratings_value_check" CHECK ("value" BETWEEN 1 AND 5);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "academy"."courses"
    ADD CONSTRAINT "courses_recommendation_score_check" CHECK ("recommendation_score" >= 0);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
