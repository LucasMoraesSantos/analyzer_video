import { Injectable } from '@nestjs/common';
import { calculateTrendScore, TrendScoreInput, TrendScoreResult } from './trend-score.logic';

@Injectable()
export class TrendScoreService {
  calculate(input: TrendScoreInput): TrendScoreResult {
    return calculateTrendScore(input);
  }
}
