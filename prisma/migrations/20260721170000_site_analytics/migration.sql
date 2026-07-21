-- Site analytics tables (trafik / davranış)
-- TODO: yüksek hacimde DailyTrafficStat rollup + eski satır cleanup cron

CREATE TYPE "AnalyticsReferrerChannel" AS ENUM ('organic', 'direct', 'social', 'paid', 'referral', 'email', 'app');
CREATE TYPE "AnalyticsDeviceType" AS ENUM ('mobile', 'desktop', 'tablet', 'unknown');
CREATE TYPE "WebVitalName" AS ENUM ('LCP', 'INP', 'CLS', 'TTFB');
CREATE TYPE "WebVitalRating" AS ENUM ('good', 'needs_improvement', 'poor');

CREATE TABLE "page_views" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "user_agent" TEXT,
    "device_type" "AnalyticsDeviceType" NOT NULL DEFAULT 'unknown',
    "country" TEXT,
    "city" TEXT,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "page_views_path_idx" ON "page_views"("path");
CREATE INDEX "page_views_created_at_idx" ON "page_views"("created_at");
CREATE INDEX "page_views_session_id_idx" ON "page_views"("session_id");

CREATE TABLE "analytics_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" TEXT NOT NULL,
    "first_path" TEXT NOT NULL,
    "referrer_channel" "AnalyticsReferrerChannel" NOT NULL DEFAULT 'direct',
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "device_type" "AnalyticsDeviceType" NOT NULL DEFAULT 'unknown',
    "country" TEXT,
    "city" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "page_view_count" INTEGER NOT NULL DEFAULT 1,
    "user_id" TEXT,
    CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "analytics_sessions_session_id_key" ON "analytics_sessions"("session_id");
CREATE INDEX "analytics_sessions_started_at_idx" ON "analytics_sessions"("started_at");
CREATE INDEX "analytics_sessions_referrer_channel_idx" ON "analytics_sessions"("referrer_channel");

CREATE TABLE "web_vital_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "path" TEXT NOT NULL,
    "metric" "WebVitalName" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rating" "WebVitalRating" NOT NULL,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "web_vital_metrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "web_vital_metrics_path_metric_created_at_idx" ON "web_vital_metrics"("path", "metric", "created_at");
CREATE INDEX "web_vital_metrics_metric_created_at_idx" ON "web_vital_metrics"("metric", "created_at");

CREATE TABLE "site_search_queries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "query" TEXT NOT NULL,
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "site_search_queries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "site_search_queries_created_at_idx" ON "site_search_queries"("created_at");
CREATE INDEX "site_search_queries_query_idx" ON "site_search_queries"("query");

CREATE TABLE "not_found_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "not_found_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "not_found_logs_path_idx" ON "not_found_logs"("path");
CREATE INDEX "not_found_logs_created_at_idx" ON "not_found_logs"("created_at");
