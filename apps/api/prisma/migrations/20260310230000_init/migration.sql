-- CreateEnum
CREATE TYPE "SourcePlatformCode" AS ENUM ('YOUTUBE');

-- CreateEnum
CREATE TYPE "CollectionJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "AiJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('UP', 'STABLE', 'DOWN');

-- CreateEnum
CREATE TYPE "ScriptDuration" AS ENUM ('S30', 'S45', 'S60');

-- CreateTable
CREATE TABLE "SourcePlatform" (
    "id" TEXT NOT NULL,
    "code" "SourcePlatformCode" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourcePlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Niche" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Niche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Keyword" (
    "id" TEXT NOT NULL,
    "nicheId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionJob" (
    "id" TEXT NOT NULL,
    "sourcePlatformId" TEXT NOT NULL,
    "nicheId" TEXT NOT NULL,
    "status" "CollectionJobStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "totalFound" INTEGER NOT NULL DEFAULT 0,
    "totalImported" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionJobVideo" (
    "id" TEXT NOT NULL,
    "collectionJobId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionJobVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "sourcePlatformId" TEXT NOT NULL,
    "nicheId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "publishedAt" TIMESTAMP(3),
    "channelId" TEXT,
    "channelTitle" TEXT,
    "thumbnailUrl" TEXT,
    "durationSeconds" INTEGER,
    "isProbableShort" BOOLEAN NOT NULL DEFAULT false,
    "languageCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoMetricSnapshot" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "viewCount" INTEGER,
    "likeCount" INTEGER,
    "commentCount" INTEGER,
    "favoriteCount" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "languageCode" TEXT,
    "provider" TEXT,
    "status" "AiJobStatus" NOT NULL DEFAULT 'PENDING',
    "rawText" TEXT,
    "segmentsJson" JSONB,
    "fetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendAnalysis" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "trendScore" DECIMAL(6,2) NOT NULL,
    "trendDirection" "TrendDirection" NOT NULL DEFAULT 'STABLE',
    "heuristicVersion" TEXT NOT NULL,
    "factorsJson" JSONB,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSummary" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "status" "AiJobStatus" NOT NULL DEFAULT 'PENDING',
    "model" TEXT,
    "prompt" TEXT,
    "responseJson" JSONB,
    "errorMessage" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScriptGeneration" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "contentSummaryId" TEXT,
    "status" "AiJobStatus" NOT NULL DEFAULT 'PENDING',
    "duration" "ScriptDuration" NOT NULL,
    "model" TEXT,
    "prompt" TEXT,
    "responseJson" JSONB,
    "errorMessage" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScriptGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SourcePlatform_code_key" ON "SourcePlatform"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Niche_slug_key" ON "Niche"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Niche_name_key" ON "Niche"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_nicheId_term_key" ON "Keyword"("nicheId", "term");

-- CreateIndex
CREATE INDEX "Keyword_nicheId_isActive_idx" ON "Keyword"("nicheId", "isActive");

-- CreateIndex
CREATE INDEX "CollectionJob_sourcePlatformId_status_createdAt_idx" ON "CollectionJob"("sourcePlatformId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CollectionJob_nicheId_status_createdAt_idx" ON "CollectionJob"("nicheId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionJobVideo_collectionJobId_videoId_key" ON "CollectionJobVideo"("collectionJobId", "videoId");

-- CreateIndex
CREATE INDEX "CollectionJobVideo_videoId_idx" ON "CollectionJobVideo"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_sourcePlatformId_externalId_key" ON "Video"("sourcePlatformId", "externalId");

-- CreateIndex
CREATE INDEX "Video_nicheId_publishedAt_idx" ON "Video"("nicheId", "publishedAt");

-- CreateIndex
CREATE INDEX "Video_isProbableShort_createdAt_idx" ON "Video"("isProbableShort", "createdAt");

-- CreateIndex
CREATE INDEX "VideoMetricSnapshot_videoId_capturedAt_idx" ON "VideoMetricSnapshot"("videoId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_videoId_key" ON "Transcript"("videoId");

-- CreateIndex
CREATE INDEX "Transcript_status_createdAt_idx" ON "Transcript"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TrendAnalysis_videoId_analyzedAt_idx" ON "TrendAnalysis"("videoId", "analyzedAt");

-- CreateIndex
CREATE INDEX "TrendAnalysis_trendScore_idx" ON "TrendAnalysis"("trendScore");

-- CreateIndex
CREATE INDEX "ContentSummary_videoId_status_createdAt_idx" ON "ContentSummary"("videoId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "ScriptGeneration_videoId_duration_status_idx" ON "ScriptGeneration"("videoId", "duration", "status");

-- CreateIndex
CREATE INDEX "ScriptGeneration_contentSummaryId_idx" ON "ScriptGeneration"("contentSummaryId");

-- AddForeignKey
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_nicheId_fkey" FOREIGN KEY ("nicheId") REFERENCES "Niche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionJob" ADD CONSTRAINT "CollectionJob_sourcePlatformId_fkey" FOREIGN KEY ("sourcePlatformId") REFERENCES "SourcePlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionJob" ADD CONSTRAINT "CollectionJob_nicheId_fkey" FOREIGN KEY ("nicheId") REFERENCES "Niche"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionJobVideo" ADD CONSTRAINT "CollectionJobVideo_collectionJobId_fkey" FOREIGN KEY ("collectionJobId") REFERENCES "CollectionJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionJobVideo" ADD CONSTRAINT "CollectionJobVideo_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_sourcePlatformId_fkey" FOREIGN KEY ("sourcePlatformId") REFERENCES "SourcePlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_nicheId_fkey" FOREIGN KEY ("nicheId") REFERENCES "Niche"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMetricSnapshot" ADD CONSTRAINT "VideoMetricSnapshot_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendAnalysis" ADD CONSTRAINT "TrendAnalysis_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSummary" ADD CONSTRAINT "ContentSummary_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptGeneration" ADD CONSTRAINT "ScriptGeneration_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptGeneration" ADD CONSTRAINT "ScriptGeneration_contentSummaryId_fkey" FOREIGN KEY ("contentSummaryId") REFERENCES "ContentSummary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
