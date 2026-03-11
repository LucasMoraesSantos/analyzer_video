import { Injectable } from '@nestjs/common';
import {
  classifyProbableShort,
  ShortClassificationInput,
  ShortClassificationResult
} from './short-classifier.logic';

@Injectable()
export class ShortClassifierService {
  classify(input: ShortClassificationInput): ShortClassificationResult {
    return classifyProbableShort(input);
  }
}
