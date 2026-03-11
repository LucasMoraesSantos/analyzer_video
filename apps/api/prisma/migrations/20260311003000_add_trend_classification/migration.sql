CREATE TYPE "TrendClassification" AS ENUM ('SUBINDO', 'ESTAVEL', 'EXPLODINDO', 'SATURADO');

ALTER TABLE "TrendAnalysis"
ADD COLUMN "trendClassification" "TrendClassification" NOT NULL DEFAULT 'ESTAVEL';
