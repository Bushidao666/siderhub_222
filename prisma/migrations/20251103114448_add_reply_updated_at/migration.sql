-- AlterTable
ALTER TABLE "academy"."lesson_comment_replies"
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "lesson_comment_replies_comment_id_created_at_idx"
  ON "academy"."lesson_comment_replies"("comment_id", "created_at" DESC);
