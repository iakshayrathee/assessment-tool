/**
 * ReadingScoreService
 * 
 * Computes composite scores, classifications, and LD risk from structured reading assessment data.
 * All scores normalized to 0-100 scale.
 */

interface ReadingResources {
  schoolText?: { gradeLevelUsed?: string; difficulty?: string };
  knownText?: { passageId?: string; accuracyPercent?: number; errorsCount?: number };
  unknownText?: { passageId?: string; accuracyPercent?: number; errorsCount?: number };
  externalResources?: { usesStorybooks?: boolean; usesApps?: boolean; materialType?: string };
}

interface PhonologicalAwareness {
  rhyming?: boolean;
  blending?: number; // score 0-5
  segmenting?: number;
  soundIdentification?: number;
}

interface DecodingSkills {
  letterSoundKnowledge?: number; // score 0-5
  cvcWords?: number;
  blendsDigraphs?: number;
  multisyllabicDecoding?: number;
}

interface ComprehensionData {
  literal?: { recallFacts?: number; identifyCharacters?: number }; // scores 0-5
  inferential?: { prediction?: number; meaningInference?: number };
  critical?: { opinionFormation?: number; realLifeConnection?: number };
  retelling?: { sequencing?: string; completeness?: number }; // sequencing: Correct/Incorrect
}

interface ErrorAnalysisData {
  substitution?: { present?: boolean; frequency?: number };
  omission?: { present?: boolean; frequency?: number };
  insertion?: { present?: boolean; frequency?: number };
  reversal?: { present?: boolean; frequency?: number };
  guessing?: { present?: boolean; frequency?: number };
  slowDecoding?: { present?: boolean; frequency?: number };
  repetition?: { present?: boolean; frequency?: number };
  skippingLines?: { present?: boolean; frequency?: number };
  errorFrequencyPercent?: number;
  dominantErrorType?: string;
}

interface RedFlagsData {
  attentionIssues?: boolean;
  languageProcessingIssues?: boolean;
  avoidanceBehavior?: boolean;
  custom?: string[];
}

export interface ReadingScoreResult {
  decodingScore: number | null;
  fluencyScore: number | null;
  comprehensionScore: number | null;
  behaviorScore: number | null;
  overallReadingScore: number | null;
  knownTextLevel: string | null;
  unknownTextLevel: string | null;
  finalReadingLevel: string | null;
  tier: string | null;
  ldRiskFlag: boolean;
  ldRiskDetails: string | null;
  errorAnalysisComputed: {
    errorFrequencyPercent: number | null;
    dominantErrorType: string | null;
  };
}

// Normalize a score from a given range to 0-100
function normalize(value: number | undefined | null, min: number, max: number): number | null {
  if (value === undefined || value === null) return null;
  const clamped = Math.max(min, Math.min(max, value));
  return Math.round(((clamped - min) / (max - min)) * 100);
}

// Average of non-null values
function avgNonNull(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

// Classify reading level from accuracy %
function classifyLevel(accuracy: number | null | undefined): string | null {
  if (accuracy === null || accuracy === undefined) return null;
  if (accuracy >= 90) return 'Independent';
  if (accuracy >= 75) return 'Instructional';
  return 'Frustration';
}

// Classify tier from overall score
function classifyTier(score: number | null): string | null {
  if (score === null) return null;
  if (score >= 75) return 'Tier 1';
  if (score >= 50) return 'Tier 2';
  return 'Tier 3';
}

export class ReadingScoreService {

  /**
   * Compute all scores from raw assessment data.
   * Called on create/update/complete.
   */
  computeScores(data: any): ReadingScoreResult {
    const decodingScore = this.computeDecodingScore(data);
    const fluencyScore = this.computeFluencyScore(data);
    const comprehensionScore = this.computeComprehensionScore(data);
    const behaviorScore = this.computeBehaviorScore(data);

    const overallReadingScore = this.computeOverallScore(
      decodingScore, fluencyScore, comprehensionScore, behaviorScore
    );

    const knownTextAccuracy = data.knownTextAccuracy ?? data.readingResources?.knownText?.accuracyPercent ?? null;
    const unknownTextAccuracy = data.unknownTextAccuracy ?? data.readingResources?.unknownText?.accuracyPercent ?? null;

    const knownTextLevel = classifyLevel(knownTextAccuracy);
    const unknownTextLevel = classifyLevel(unknownTextAccuracy);
    const finalReadingLevel = this.computeFinalReadingLevel(knownTextLevel, unknownTextLevel);

    const tier = classifyTier(overallReadingScore);
    const { ldRiskFlag, ldRiskDetails } = this.detectLDRisk(data, decodingScore, fluencyScore);
    const errorAnalysisComputed = this.computeErrorAnalysis(data.errorAnalysis);

    return {
      decodingScore,
      fluencyScore,
      comprehensionScore,
      behaviorScore,
      overallReadingScore,
      knownTextLevel,
      unknownTextLevel,
      finalReadingLevel,
      tier,
      ldRiskFlag,
      ldRiskDetails,
      errorAnalysisComputed,
    };
  }

  /**
   * Decoding Score: from phonological awareness + decoding skills + sight words
   * Each sub-score normalized to 0-100, then averaged
   */
  private computeDecodingScore(data: any): number | null {
    const scores: (number | null)[] = [];

    // Phonological awareness (scores 0-5 each)
    const phon: PhonologicalAwareness = data.phonologicalAwareness || {};
    if (phon.rhyming !== undefined) scores.push(phon.rhyming ? 100 : 0);
    if (phon.blending !== undefined) scores.push(normalize(phon.blending, 0, 5));
    if (phon.segmenting !== undefined) scores.push(normalize(phon.segmenting, 0, 5));
    if (phon.soundIdentification !== undefined) scores.push(normalize(phon.soundIdentification, 0, 5));

    // Decoding skills (scores 0-5 each)
    const dec: DecodingSkills = data.decodingSkills || {};
    if (dec.letterSoundKnowledge !== undefined) scores.push(normalize(dec.letterSoundKnowledge, 0, 5));
    if (dec.cvcWords !== undefined) scores.push(normalize(dec.cvcWords, 0, 5));
    if (dec.blendsDigraphs !== undefined) scores.push(normalize(dec.blendsDigraphs, 0, 5));
    if (dec.multisyllabicDecoding !== undefined) scores.push(normalize(dec.multisyllabicDecoding, 0, 5));

    // Sight words (already %)
    if (data.sightWordsPercent !== undefined && data.sightWordsPercent !== null) {
      scores.push(Math.round(Math.min(100, Math.max(0, data.sightWordsPercent))));
    }

    return avgNonNull(scores);
  }

  /**
   * Fluency Score: from WPM (grade-normed), accuracy %, and error rate
   */
  private computeFluencyScore(data: any): number | null {
    const scores: (number | null)[] = [];

    // WPM normalized against grade expectation (approx: Grade 1=60, Grade 8=180)
    if (data.wordsPerMinute !== undefined && data.wordsPerMinute !== null) {
      scores.push(normalize(data.wordsPerMinute, 0, 200));
    }

    // Accuracy is already a percentage
    if (data.fluencyAccuracy !== undefined && data.fluencyAccuracy !== null) {
      scores.push(Math.round(Math.min(100, Math.max(0, data.fluencyAccuracy))));
    }

    // Error rate: lower is better (invert). Assume 0-30 range
    if (data.fluencyErrorRate !== undefined && data.fluencyErrorRate !== null) {
      const inverted = 100 - normalize(data.fluencyErrorRate, 0, 30)!;
      scores.push(Math.round(inverted));
    }

    // Hesitation count: lower is better
    if (data.hesitationCount !== undefined && data.hesitationCount !== null) {
      const inverted = 100 - normalize(data.hesitationCount, 0, 20)!;
      scores.push(Math.round(inverted));
    }

    return avgNonNull(scores);
  }

  /**
   * Comprehension Score: from literal, inferential, critical, retelling (scores 0-5)
   */
  private computeComprehensionScore(data: any): number | null {
    const comp: ComprehensionData = data.comprehension || {};
    const scores: (number | null)[] = [];

    if (comp.literal) {
      if (comp.literal.recallFacts !== undefined) scores.push(normalize(comp.literal.recallFacts, 0, 5));
      if (comp.literal.identifyCharacters !== undefined) scores.push(normalize(comp.literal.identifyCharacters, 0, 5));
    }
    if (comp.inferential) {
      if (comp.inferential.prediction !== undefined) scores.push(normalize(comp.inferential.prediction, 0, 5));
      if (comp.inferential.meaningInference !== undefined) scores.push(normalize(comp.inferential.meaningInference, 0, 5));
    }
    if (comp.critical) {
      if (comp.critical.opinionFormation !== undefined) scores.push(normalize(comp.critical.opinionFormation, 0, 5));
      if (comp.critical.realLifeConnection !== undefined) scores.push(normalize(comp.critical.realLifeConnection, 0, 5));
    }
    if (comp.retelling) {
      if (comp.retelling.sequencing) scores.push(comp.retelling.sequencing === 'Correct' ? 100 : 0);
      if (comp.retelling.completeness !== undefined) scores.push(normalize(comp.retelling.completeness, 0, 5));
    }

    return avgNonNull(scores);
  }

  /**
   * Behavior Score: from rating scales (1-5) — higher is better
   */
  private computeBehaviorScore(data: any): number | null {
    const scores: (number | null)[] = [];

    const ratingFields = ['interestInReading', 'readingStamina', 'frustrationTolerance', 'confidenceLevel'];
    for (const field of ratingFields) {
      if (data[field] !== undefined && data[field] !== null) {
        scores.push(normalize(data[field], 1, 5));
      }
    }

    // Attention span: minutes, normalize 0-30 min
    if (data.attentionSpanMinutes !== undefined && data.attentionSpanMinutes !== null) {
      scores.push(normalize(data.attentionSpanMinutes, 0, 30));
    }

    // Boolean negatives (task avoidance = bad)
    if (data.taskAvoidance !== undefined && data.taskAvoidance !== null) {
      scores.push(data.taskAvoidance ? 0 : 100);
    }

    // Self-correction ability
    if (data.selfCorrectionAbility) {
      const map: Record<string, number> = { 'Independent': 100, 'Prompted': 50, 'None': 0 };
      scores.push(map[data.selfCorrectionAbility] ?? null);
    }

    // Prompt dependency
    if (data.promptDependency) {
      const map: Record<string, number> = { 'Independent': 100, 'Needs cues': 50, 'Fully assisted': 0 };
      scores.push(map[data.promptDependency] ?? null);
    }

    return avgNonNull(scores);
  }

  /**
   * Overall Reading Score: weighted average of 4 composites
   * Weights: Decoding 30%, Fluency 25%, Comprehension 30%, Behavior 15%
   */
  private computeOverallScore(
    decoding: number | null,
    fluency: number | null,
    comprehension: number | null,
    behavior: number | null
  ): number | null {
    const weights = [
      { score: decoding, weight: 0.30 },
      { score: fluency, weight: 0.25 },
      { score: comprehension, weight: 0.30 },
      { score: behavior, weight: 0.15 },
    ];

    const valid = weights.filter(w => w.score !== null) as { score: number; weight: number }[];
    if (valid.length === 0) return null;

    // Re-normalize weights for available scores
    const totalWeight = valid.reduce((sum, w) => sum + w.weight, 0);
    const weighted = valid.reduce((sum, w) => sum + (w.score * w.weight / totalWeight), 0);
    return Math.round(weighted);
  }

  /**
   * Final reading level: use unknown text if available, else known text
   */
  private computeFinalReadingLevel(known: string | null, unknown: string | null): string | null {
    return unknown || known || null;
  }

  /**
   * LD Risk Detection: rule-based pattern matching
   */
  private detectLDRisk(data: any, decodingScore: number | null, fluencyScore: number | null): { ldRiskFlag: boolean; ldRiskDetails: string | null } {
    const risks: string[] = [];
    const errors: ErrorAnalysisData = data.errorAnalysis || {};

    // Dyslexia patterns: reversal + poor decoding + letter-sound issues
    const hasReversal = errors.reversal?.present === true;
    const lowDecoding = decodingScore !== null && decodingScore < 40;
    const phonIssues = data.phonologicalAwareness && (
      data.phonologicalAwareness.rhyming === false ||
      (data.phonologicalAwareness.blending !== undefined && data.phonologicalAwareness.blending <= 1) ||
      (data.phonologicalAwareness.segmenting !== undefined && data.phonologicalAwareness.segmenting <= 1)
    );

    if (hasReversal && (lowDecoding || phonIssues)) {
      risks.push('Dyslexia pattern: reversal errors + decoding/phonological deficits');
    } else if (hasReversal) {
      risks.push('Reversal errors noted (b/d, p/q) — monitor for dyslexia');
    }

    // Visual processing: multiple tracking issues
    const trackingIssues = [data.skipsLinesVisual, data.losesPlace, data.usesFinger]
      .filter(v => v === true).length;
    if (trackingIssues >= 2) {
      risks.push('Visual tracking difficulties — consider vision screening');
    }

    // Fluency-specific LD pattern
    if (fluencyScore !== null && fluencyScore < 30 && decodingScore !== null && decodingScore > 60) {
      risks.push('Fluency deficit with adequate decoding — possible fluency-specific LD');
    }

    // Comprehension disconnect
    const compScore = this.computeComprehensionScore(data);
    if (compScore !== null && compScore < 30 && fluencyScore !== null && fluencyScore > 60) {
      risks.push('Comprehension deficit despite adequate fluency — possible language processing issue');
    }

    // Red flags from section 10
    const redFlags: RedFlagsData = data.redFlags || {};
    if (redFlags.languageProcessingIssues) {
      risks.push('Language processing issues flagged by assessor');
    }
    if (redFlags.attentionIssues) {
      risks.push('Attention issues flagged — consider ADHD screening');
    }

    return {
      ldRiskFlag: risks.length > 0,
      ldRiskDetails: risks.length > 0 ? risks.join('; ') : null,
    };
  }

  /**
   * Compute error analysis auto-fields
   */
  private computeErrorAnalysis(errorAnalysis: ErrorAnalysisData | null | undefined): { errorFrequencyPercent: number | null; dominantErrorType: string | null } {
    if (!errorAnalysis) return { errorFrequencyPercent: null, dominantErrorType: null };

    const errorTypes = ['substitution', 'omission', 'insertion', 'reversal', 'guessing', 'slowDecoding', 'repetition', 'skippingLines'] as const;
    let maxFreq = 0;
    let dominant: string | null = null;
    let totalFreq = 0;
    let count = 0;

    for (const type of errorTypes) {
      const entry = (errorAnalysis as any)[type];
      if (entry?.present && entry?.frequency !== undefined) {
        totalFreq += entry.frequency;
        count++;
        if (entry.frequency > maxFreq) {
          maxFreq = entry.frequency;
          dominant = type;
        }
      }
    }

    return {
      errorFrequencyPercent: count > 0 ? Math.round(totalFreq / count) : null,
      dominantErrorType: dominant,
    };
  }
}
