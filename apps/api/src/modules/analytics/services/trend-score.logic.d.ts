export interface SnapshotLike {
  capturedAt: Date;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
}

export interface TrendScoreInput {
  title: string;
  description: string | null;
  publishedAt: Date | null;
  nicheKeywords: string[];
  latestSnapshot: SnapshotLike;
  previousSnapshot: SnapshotLike | null;
}

export type TrendClassification =
  | 'SUBINDO'
  | 'ESTAVEL'
  | 'EXPLODINDO'
  | 'SATURADO';

export interface TrendScoreResult {
  trendScore: number;
  trendClassification: TrendClassification;
  trendDirection: 'UP' | 'STABLE' | 'DOWN';
  factors: {
    viewsNormalized: number;
    engagementRate: number;
    commentRate: number;
    growthVelocity: number;
    keywordRelevance: number;
    freshnessScore: number;
  };
}

export const TREND_SCORE_WEIGHTS: {
  viewsNormalized: number;
  engagementRate: number;
  commentRate: number;
  growthVelocity: number;
  keywordRelevance: number;
  freshnessScore: number;
};

export function calculateTrendScore(input: TrendScoreInput): TrendScoreResult;
