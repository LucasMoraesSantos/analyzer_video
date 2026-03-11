function countExploding(topTrends) {
  return topTrends.filter((item) => item.trendClassification === 'EXPLODINDO').length;
}

function mapTopNichesToChartData(niches, limit = 5) {
  return niches.slice(0, limit).map((item) => ({
    name: item.name,
    score: item.metrics.avgTrendScore
  }));
}

module.exports = {
  countExploding,
  mapTopNichesToChartData
};
