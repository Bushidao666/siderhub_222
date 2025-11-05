-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "academy";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "admin";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "core";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "cybervault";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "hidra";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('member', 'mentor', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "public"."FeatureAccessKey" AS ENUM ('hidra', 'cybervault', 'academy', 'admin_console', 'community');

-- CreateEnum
CREATE TYPE "public"."CourseStatus" AS ENUM ('draft', 'scheduled', 'published', 'archived');

-- CreateEnum
CREATE TYPE "public"."CourseLevel" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "public"."Visibility" AS ENUM ('private', 'members', 'mentors', 'public');

-- CreateEnum
CREATE TYPE "public"."LessonType" AS ENUM ('video', 'article', 'live', 'downloadable', 'quiz');

-- CreateEnum
CREATE TYPE "public"."RecommendationBadge" AS ENUM ('new', 'popular', 'mentor_pick');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "public"."CampaignChannel" AS ENUM ('whatsapp');

-- CreateEnum
CREATE TYPE "public"."BannerStatus" AS ENUM ('active', 'inactive', 'scheduled');

-- CreateEnum
CREATE TYPE "public"."FeatureToggleStatus" AS ENUM ('enabled', 'disabled', 'gradual');

-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('pending', 'accepted', 'expired');

-- CreateEnum
CREATE TYPE "public"."EvolutionConnectionStatus" AS ENUM ('connected', 'disconnected', 'error');

-- CreateEnum
CREATE TYPE "public"."ContactImportSource" AS ENUM ('csv_upload', 'manual', 'api');

-- CreateEnum
CREATE TYPE "public"."ResourceType" AS ENUM ('template', 'playbook', 'script', 'asset', 'spreadsheet', 'presentation', 'other');

-- CreateTable
CREATE TABLE "core"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'member',
    "profile_display_name" TEXT NOT NULL,
    "profile_avatar_url" TEXT,
    "profile_bio" TEXT,
    "profile_timezone" TEXT NOT NULL,
    "profile_badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "profile_social_links" JSONB,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device" TEXT NOT NULL DEFAULT 'unknown',
    "user_agent" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "core"."member_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "feature" "public"."FeatureAccessKey" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "granted_by_id" TEXT,
    "granted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."hero_banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "primary_cta_label" TEXT NOT NULL,
    "primary_cta_href" TEXT NOT NULL,
    "primary_cta_external" BOOLEAN NOT NULL,
    "secondary_cta_label" TEXT,
    "secondary_cta_href" TEXT,
    "secondary_cta_external" BOOLEAN,
    "image_url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "public"."BannerStatus" NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."feature_toggles" (
    "id" TEXT NOT NULL,
    "feature_key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."FeatureToggleStatus" NOT NULL,
    "rollout_percentage" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_toggles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."member_access_overrides" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reason" TEXT NOT NULL,
    "granted_by_id" TEXT NOT NULL,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_access_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."invitation_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body_markdown" TEXT NOT NULL,
    "visibility" "public"."Visibility" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin"."invitations" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "status" "public"."InvitationStatus" NOT NULL DEFAULT 'pending',
    "invited_by_id" TEXT NOT NULL,
    "granted_access" "public"."FeatureAccessKey"[],
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_by_id" TEXT,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."courses" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cover_image" TEXT,
    "level" "public"."CourseLevel" NOT NULL,
    "status" "public"."CourseStatus" NOT NULL,
    "visibility" "public"."Visibility" NOT NULL,
    "estimated_duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "total_lessons" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "release_date" TIMESTAMP(3),
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."course_modules" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."lessons" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "type" "public"."LessonType" NOT NULL,
    "content" JSONB NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "is_preview" BOOLEAN NOT NULL DEFAULT false,
    "release_at" TIMESTAMP(3),

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."course_progress" (
    "course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "completed_lesson_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_lesson_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_progress_pkey" PRIMARY KEY ("course_id","user_id")
);

-- CreateTable
CREATE TABLE "academy"."lesson_comments" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."lesson_comment_replies" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_comment_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy"."course_recommendations" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "badge" "public"."RecommendationBadge",

    CONSTRAINT "course_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hidra"."evolution_api_config" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "base_url" TEXT NOT NULL,
    "api_key_encrypted" BYTEA NOT NULL,
    "connected_at" TIMESTAMP(3),
    "last_health_check_at" TIMESTAMP(3),
    "status" "public"."EvolutionConnectionStatus" NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evolution_api_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hidra"."contact_segments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "import_source" "public"."ContactImportSource" NOT NULL,
    "total_contacts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hidra"."message_templates" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "media_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hidra"."campaigns" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "evolution_config_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "channel" "public"."CampaignChannel" NOT NULL,
    "status" "public"."CampaignStatus" NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "segment_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "external_id" TEXT,
    "max_messages_per_minute" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hidra"."campaign_runs" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "initiated_by" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "status" "public"."CampaignStatus" NOT NULL,
    "summary" TEXT,

    CONSTRAINT "campaign_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hidra"."campaign_metrics" (
    "campaign_id" TEXT NOT NULL,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "pending" INTEGER NOT NULL DEFAULT 0,
    "average_delivery_ms" INTEGER NOT NULL DEFAULT 0,
    "last_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_metrics_pkey" PRIMARY KEY ("campaign_id")
);

-- CreateTable
CREATE TABLE "hidra"."campaign_timeline_points" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "campaign_timeline_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cybervault"."resource_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cybervault"."resource_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "resource_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cybervault"."resources" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."ResourceType" NOT NULL,
    "category_id" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "visibility" "public"."Visibility" NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cybervault"."resource_tag_assignments" (
    "resource_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "resource_tag_assignments_pkey" PRIMARY KEY ("resource_id","tag_id")
);

-- CreateTable
CREATE TABLE "cybervault"."resource_assets" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cybervault"."resource_download_logs" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET NOT NULL,

    CONSTRAINT "resource_download_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "core"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "core"."sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "core"."sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "core"."sessions"("expires_at");

-- CreateIndex
CREATE INDEX "member_access_feature_idx" ON "core"."member_access"("feature");

-- CreateIndex
CREATE UNIQUE INDEX "member_access_user_id_feature_key" ON "core"."member_access"("user_id", "feature");

-- CreateIndex
CREATE INDEX "hero_banners_status_idx" ON "admin"."hero_banners"("status");

-- CreateIndex
CREATE UNIQUE INDEX "feature_toggles_feature_key_key" ON "admin"."feature_toggles"("feature_key");

-- CreateIndex
CREATE UNIQUE INDEX "member_access_overrides_user_id_feature_key" ON "admin"."member_access_overrides"("user_id", "feature");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_code_key" ON "admin"."invitations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "academy"."courses"("slug");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "academy"."courses"("status");

-- CreateIndex
CREATE INDEX "courses_visibility_idx" ON "academy"."courses"("visibility");

-- CreateIndex
CREATE INDEX "courses_created_by_id_idx" ON "academy"."courses"("created_by_id");

-- CreateIndex
CREATE INDEX "course_modules_course_id_idx" ON "academy"."course_modules"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "course_modules_course_id_order_key" ON "academy"."course_modules"("course_id", "order");

-- CreateIndex
CREATE INDEX "lessons_module_id_idx" ON "academy"."lessons"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_module_id_order_key" ON "academy"."lessons"("module_id", "order");

-- CreateIndex
CREATE INDEX "course_progress_user_id_idx" ON "academy"."course_progress"("user_id");

-- CreateIndex
CREATE INDEX "lesson_comments_lesson_id_idx" ON "academy"."lesson_comments"("lesson_id");

-- CreateIndex
CREATE INDEX "lesson_comments_user_id_idx" ON "academy"."lesson_comments"("user_id");

-- CreateIndex
CREATE INDEX "lesson_comment_replies_comment_id_idx" ON "academy"."lesson_comment_replies"("comment_id");

-- CreateIndex
CREATE INDEX "lesson_comment_replies_user_id_idx" ON "academy"."lesson_comment_replies"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "evolution_api_config_user_id_key" ON "hidra"."evolution_api_config"("user_id");

-- CreateIndex
CREATE INDEX "contact_segments_user_id_idx" ON "hidra"."contact_segments"("user_id");

-- CreateIndex
CREATE INDEX "message_templates_user_id_idx" ON "hidra"."message_templates"("user_id");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "hidra"."campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_user_id_idx" ON "hidra"."campaigns"("user_id");

-- CreateIndex
CREATE INDEX "campaigns_segment_id_idx" ON "hidra"."campaigns"("segment_id");

-- CreateIndex
CREATE INDEX "campaigns_template_id_idx" ON "hidra"."campaigns"("template_id");

-- CreateIndex
CREATE INDEX "campaigns_evolution_config_id_idx" ON "hidra"."campaigns"("evolution_config_id");

-- CreateIndex
CREATE INDEX "campaign_runs_campaign_id_idx" ON "hidra"."campaign_runs"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_timeline_points_campaign_id_timestamp_key" ON "hidra"."campaign_timeline_points"("campaign_id", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "resource_tags_name_key" ON "cybervault"."resource_tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "resources_slug_key" ON "cybervault"."resources"("slug");

-- CreateIndex
CREATE INDEX "resources_category_id_idx" ON "cybervault"."resources"("category_id");

-- CreateIndex
CREATE INDEX "resources_visibility_idx" ON "cybervault"."resources"("visibility");

-- CreateIndex
CREATE INDEX "resources_created_by_id_idx" ON "cybervault"."resources"("created_by_id");

-- CreateIndex
CREATE INDEX "resource_download_logs_resource_id_idx" ON "cybervault"."resource_download_logs"("resource_id");

-- CreateIndex
CREATE INDEX "resource_download_logs_user_id_idx" ON "cybervault"."resource_download_logs"("user_id");

-- AddForeignKey
ALTER TABLE "core"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."member_access" ADD CONSTRAINT "member_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."member_access" ADD CONSTRAINT "member_access_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "core"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin"."hero_banners" ADD CONSTRAINT "hero_banners_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "core"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin"."feature_toggles" ADD CONSTRAINT "feature_toggles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "core"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin"."member_access_overrides" ADD CONSTRAINT "member_access_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin"."member_access_overrides" ADD CONSTRAINT "member_access_overrides_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "core"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin"."invitations" ADD CONSTRAINT "invitations_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "core"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin"."invitations" ADD CONSTRAINT "invitations_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "core"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."courses" ADD CONSTRAINT "courses_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "core"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."course_modules" ADD CONSTRAINT "course_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "academy"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."lessons" ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "academy"."course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."course_progress" ADD CONSTRAINT "course_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "academy"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."course_progress" ADD CONSTRAINT "course_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."lesson_comments" ADD CONSTRAINT "lesson_comments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "academy"."lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."lesson_comments" ADD CONSTRAINT "lesson_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."lesson_comment_replies" ADD CONSTRAINT "lesson_comment_replies_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "academy"."lesson_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."lesson_comment_replies" ADD CONSTRAINT "lesson_comment_replies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy"."course_recommendations" ADD CONSTRAINT "course_recommendations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "academy"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidra"."evolution_api_config" ADD CONSTRAINT "evolution_api_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidra"."contact_segments" ADD CONSTRAINT "contact_segments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidra"."message_templates" ADD CONSTRAINT "message_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidra"."campaigns" ADD CONSTRAINT "campaigns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidra"."campaigns" ADD CONSTRAINT "campaigns_evolution_config_id_fkey" FOREIGN KEY ("evolution_config_id") REFERENCES "hidra"."evolution_api_config"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidra"."campaigns" ADD CONSTRAINT "campaigns_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "hidra"."contact_segments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidra"."campaigns" ADD CONSTRAINT "campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "hidra"."message_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidra"."campaign_runs" ADD CONSTRAINT "campaign_runs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "hidra"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidra"."campaign_runs" ADD CONSTRAINT "campaign_runs_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "core"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidra"."campaign_metrics" ADD CONSTRAINT "campaign_metrics_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "hidra"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hidra"."campaign_timeline_points" ADD CONSTRAINT "campaign_timeline_points_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "hidra"."campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cybervault"."resources" ADD CONSTRAINT "resources_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "cybervault"."resource_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cybervault"."resources" ADD CONSTRAINT "resources_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "core"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cybervault"."resource_tag_assignments" ADD CONSTRAINT "resource_tag_assignments_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "cybervault"."resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cybervault"."resource_tag_assignments" ADD CONSTRAINT "resource_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "cybervault"."resource_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cybervault"."resource_assets" ADD CONSTRAINT "resource_assets_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "cybervault"."resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cybervault"."resource_download_logs" ADD CONSTRAINT "resource_download_logs_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "cybervault"."resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cybervault"."resource_download_logs" ADD CONSTRAINT "resource_download_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "core"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

