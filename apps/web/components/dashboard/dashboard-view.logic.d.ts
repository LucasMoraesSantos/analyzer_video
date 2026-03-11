export function countExploding(topTrends: Array<{ trendClassification?: string }>): number;
export function mapTopNichesToChartData(
  niches: Array<{ name: string; metrics: { avgTrendScore: number } }>,
  limit?: number
): Array<{ name: string; score: number }>;
