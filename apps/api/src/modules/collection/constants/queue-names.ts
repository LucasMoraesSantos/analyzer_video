export const QUEUE_NAMES = {
  collectVideos: 'collect-videos',
  enrichVideos: 'enrich-videos',
  analyzeTrends: 'analyze-trends',
  generateSummary: 'generate-summary',
  generateScripts: 'generate-scripts'
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
