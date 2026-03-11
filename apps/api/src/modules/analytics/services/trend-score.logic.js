const TREND_SCORE_WEIGHTS = {
  viewsNormalized: 0.35,
  engagementRate: 0.2,
  commentRate: 0.1,
  growthVelocity: 0.2,
  keywordRelevance: 0.1,
  freshnessScore: 0.05
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round2(value) {
  return Number(value.toFixed(2));
}

function normalizeViews(views) {
  return clamp((views ?? 0) / 100000, 0, 1);
}

function calcEngagementRate(views, likes, comments) {
  return clamp(((likes ?? 0) + (comments ?? 0)) / Math.max(views ?? 0, 1), 0, 1);
}

function calcCommentRate(views, comments) {
  return clamp((comments ?? 0) / Math.max(views ?? 0, 1), 0, 1);
}

function calcGrowthVelocity(latest, previous) {
  if (!latest || !previous) {
    return 0;
  }

  const latestViews = latest.viewCount ?? 0;
  const previousViews = previous.viewCount ?? 0;
  const hours = Math.max(
    (new Date(latest.capturedAt).getTime() - new Date(previous.capturedAt).getTime()) /
      (1000 * 60 * 60),
    1
  );

  const viewsPerHour = (latestViews - previousViews) / hours;
  return clamp(viewsPerHour / 500, 0, 1);
}

function calcKeywordRelevance(title, description, keywords) {
  const text = `${(title ?? '').toLowerCase()} ${(description ?? '').toLowerCase()}`;
  const normalizedKeywords = (keywords ?? [])
    .map((k) => (k ?? '').toLowerCase().trim())
    .filter(Boolean);

  if (normalizedKeywords.length === 0) {
    return 0;
  }

  const matches = normalizedKeywords.filter((keyword) => text.includes(keyword)).length;
  return clamp(matches / normalizedKeywords.length, 0, 1);
}

function calcFreshnessScore(publishedAt, now = new Date()) {
  if (!publishedAt) {
    return 0.2;
  }

  const hours = (now.getTime() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  if (hours <= 6) return 1;
  if (hours <= 24) return 0.8;
  if (hours <= 72) return 0.6;
  if (hours <= 168) return 0.4;
  return 0.2;
}

function classifyTrend(score) {
  if (score >= 80) {
    return { classification: 'EXPLODINDO', direction: 'UP' };
  }
  if (score >= 60) {
    return { classification: 'SUBINDO', direction: 'UP' };
  }
  if (score >= 35) {
    return { classification: 'ESTAVEL', direction: 'STABLE' };
  }
  return { classification: 'SATURADO', direction: 'DOWN' };
}

function calculateTrendScore(input) {
  const views = input.latestSnapshot?.viewCount ?? 0;
  const likes = input.latestSnapshot?.likeCount ?? 0;
  const comments = input.latestSnapshot?.commentCount ?? 0;

  const factors = {
    viewsNormalized: normalizeViews(views),
    engagementRate: calcEngagementRate(views, likes, comments),
    commentRate: calcCommentRate(views, comments),
    growthVelocity: calcGrowthVelocity(input.latestSnapshot, input.previousSnapshot),
    keywordRelevance: calcKeywordRelevance(
      input.title,
      input.description,
      input.nicheKeywords
    ),
    freshnessScore: calcFreshnessScore(input.publishedAt)
  };

  const weighted =
    factors.viewsNormalized * TREND_SCORE_WEIGHTS.viewsNormalized +
    factors.engagementRate * TREND_SCORE_WEIGHTS.engagementRate +
    factors.commentRate * TREND_SCORE_WEIGHTS.commentRate +
    factors.growthVelocity * TREND_SCORE_WEIGHTS.growthVelocity +
    factors.keywordRelevance * TREND_SCORE_WEIGHTS.keywordRelevance +
    factors.freshnessScore * TREND_SCORE_WEIGHTS.freshnessScore;

  const trendScore = round2(clamp(weighted * 100, 0, 100));
  const { classification, direction } = classifyTrend(trendScore);

  return {
    trendScore,
    trendClassification: classification,
    trendDirection: direction,
    factors
  };
}

module.exports = {
  TREND_SCORE_WEIGHTS,
  calculateTrendScore
};
