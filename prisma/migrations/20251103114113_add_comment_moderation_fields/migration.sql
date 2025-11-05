-- CreateEnum
CREATE TYPE "public"."LessonCommentModerationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "academy"."lesson_comment_replies" ADD COLUMN     "moderated_at" TIMESTAMP(3),
ADD COLUMN     "moderated_by_id" TEXT,
ADD COLUMN     "moderation_status" "public"."LessonCommentModerationStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "parent_reply_id" TEXT,
ADD COLUMN     "pending_moderation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "academy"."lesson_comments" ADD COLUMN     "moderated_at" TIMESTAMP(3),
ADD COLUMN     "moderated_by_id" TEXT,
ADD COLUMN     "moderation_status" "public"."LessonCommentModerationStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "lesson_comment_replies_moderation_status_created_at_idx" ON "academy"."lesson_comment_replies"("moderation_status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "lesson_comment_replies_parent_reply_id_idx" ON "academy"."lesson_comment_replies"("parent_reply_id");

-- CreateIndex
CREATE INDEX "lesson_comments_moderation_status_created_at_idx" ON "academy"."lesson_comments"("moderation_status", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "academy"."lesson_comments" ADD CONSTRAINT "lesson_comments_moderated_by_id_fkey" FOREIGN KEY ("moderated_by_id") REFERENCES "core"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."lesson_comment_replies" ADD CONSTRAINT "lesson_comment_replies_parent_reply_id_fkey" FOREIGN KEY ("parent_reply_id") REFERENCES "academy"."lesson_comment_replies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."lesson_comment_replies" ADD CONSTRAINT "lesson_comment_replies_moderated_by_id_fkey" FOREIGN KEY ("moderated_by_id") REFERENCES "core"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
