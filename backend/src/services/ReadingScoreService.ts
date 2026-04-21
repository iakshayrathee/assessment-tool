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
  // Enhanced scoring fields
  environmentScore: number | null;
  environmentBuffer: number | null;
  schoolTextScore: number | null;
  knownTextScore: number | null;
  unknownTextScore: number | null;
  finalReadingScore: number | null;
  resourceContextScore: number | null;
  finalRiskScore: number | null;
  languageRiskScore: number | null;
  interventionScore: number | null;
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

    // Enhanced scoring calculations
    const environmentScore = this.computeEnvironmentScore(data);
    const environmentBuffer = this.computeEnvironmentBuffer(environmentScore);
    const schoolTextScore = this.computeSectionScore(data.schoolTextQuality, data.schoolTextFluency, data.schoolTextErrors, data.schoolTextDifficulty);
    const knownTextScore = this.computeSectionScore(data.knownTextQuality, data.knownTextFluency, data.knownTextErrors, data.knownTextDifficulty);
    const unknownTextScore = this.computeSectionScore(data.unknownTextQuality, data.unknownTextFluency, data.unknownTextErrors, data.unknownTextDifficulty);
    const finalReadingScore = this.computeFinalReadingScoreRS(schoolTextScore, knownTextScore, unknownTextScore);
    const resourceContextScore = this.computeResourceContextScore(data.materialTypes, data.materialLevels, data.readingIndependence);
    const languageRiskScore = this.mapLanguageRiskScore(data.languageMismatch);
    const interventionScore = this.mapInterventionScore(data.previousIntervention);
    const finalRiskScore = this.computeFinalRiskScore(finalReadingScore, environmentBuffer, languageRiskScore, interventionScore);

    const tier = this.classifyEnhancedTier(finalRiskScore);
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
      // Enhanced scoring fields
      environmentScore,
      environmentBuffer,
      schoolTextScore,
      knownTextScore,
      unknownTextScore,
      finalReadingScore,
      resourceContextScore,
      finalRiskScore,
      languageRiskScore,
      interventionScore,
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

  // ===== ENHANCED SCORING METHODS =====

  /**
   * Environment Score Calculation: ES = Exposure + Support + Material Access
   */
  private computeEnvironmentScore(data: any): number | null {
    const exposure = this.mapExposureScore(data.readingExposureAtHome);
    const support = this.mapSupportScore(data.readingSupportAtHome);
    const materials = this.mapMaterialAccessScore(data.readingMaterialAccess);
    
    if (exposure === null || support === null || materials === null) return null;
    return exposure + support + materials;
  }

  /**
   * Environment Buffer calculation based on ES ranges
   */
  private computeEnvironmentBuffer(environmentScore: number | null): number {
    if (environmentScore === null) return 0;
    if (environmentScore <= 2) return 15;
    if (environmentScore <= 5) return 5;
    return 0;
  }

  /**
   * Section Score Calculation: (Reading Quality × 0.5) + (Fluency × 0.3) + (Error Adjustment) + (Difficulty Adjustment)
   */
  private computeSectionScore(quality: string | null | undefined, fluency: string | null | undefined, errors: string | null | undefined, difficulty: string | null | undefined): number | null {
    if (!quality || !fluency || !errors || !difficulty) return null;

    const qualityScore = this.mapQualityScore(quality);
    const fluencyScore = this.mapFluencyScore(fluency);
    const errorPenalty = this.mapErrorPenalty(errors);
    const difficultyAdjustment = this.mapDifficultyAdjustment(difficulty);

    if (qualityScore === null || fluencyScore === null || errorPenalty === null || difficultyAdjustment === null) return null;

    return (qualityScore * 0.5) + (fluencyScore * 0.3) + errorPenalty + difficultyAdjustment;
  }

  /**
   * Final Reading Score: RS = (School × 0.2) + (Known × 0.3) + (Unknown × 0.5)
   * Special Logic: Unknown Text penalty if << Known Score by 20+ points
   */
  private computeFinalReadingScoreRS(schoolScore: number | null, knownScore: number | null, unknownScore: number | null): number | null {
    if (schoolScore === null || knownScore === null || unknownScore === null) return null;

    let finalScore = (schoolScore * 0.2) + (knownScore * 0.3) + (unknownScore * 0.5);

    // Special Logic: Unknown Text penalty
    if (unknownScore < knownScore - 20) {
      finalScore -= 10;
    }

    return Math.max(0, Math.min(100, finalScore));
  }

  /**
   * Resource Context Scoring: Material usage + Level alignment + Independence
   */
  private computeResourceContextScore(materialTypes: string[] | null | undefined, materialLevels: string[] | null | undefined, independence: string | null | undefined): number | null {
    if (!materialTypes || !materialLevels || !independence) return null;

    let score = 0;

    // Material Usage
    materialTypes.forEach(material => {
      if (material === 'Storybooks') score += 2;
      if (material === 'Digital content') score += 1;
      if (material === 'Knowledge Material') score += 2;
    });

    // Level Alignment
    materialLevels.forEach(level => {
      if (level === 'Below grade level') score += 1;
      if (level === 'At grade level') score += 2;
      if (level === 'Above grade level') score += 2;
    });

    // Reading Independence
    if (independence === 'Reads independently') score += 2;
    if (independence === 'Needs support') score += 1;
    if (independence === 'Avoids reading') score += 0;

    return score;
  }

  /**
   * Final Risk Score: FRS = (100 - RS) - Buffer - LR - IF
   */
  private computeFinalRiskScore(readingScore: number | null, buffer: number | null, languageRisk: number | null, interventionFlag: number | null): number | null {
    if (readingScore === null || buffer === null || languageRisk === null || interventionFlag === null) return null;

    const frs = (100 - readingScore) - buffer - languageRisk - interventionFlag;
    return Math.max(0, Math.min(100, frs));
  }

  /**
   * Enhanced Tier Classification based on FRS
   */
  private classifyEnhancedTier(finalRiskScore: number | null): string | null {
    if (finalRiskScore === null) return null;
    if (finalRiskScore <= 20) return 'Tier 1';
    if (finalRiskScore <= 40) return 'Tier 2';
    return 'Tier 3';
  }

  // ===== MAPPING FUNCTIONS =====

  private mapExposureScore(exposure: string | null | undefined): number | null {
    if (!exposure) return null;
    const mapping: Record<string, number> = {
      'Daily': 3, 'Few times a week': 2, 'Occasionally': 1, 'Rarely': 0, 'Never': 0
    };
    return mapping[exposure] ?? null;
  }

  private mapSupportScore(support: string | null | undefined): number | null {
    if (!support) return null;
    const mapping: Record<string, number> = {
      'Regular support (daily/weekly)': 2, 'Occasional support': 1, 'No support': 0
    };
    return mapping[support] ?? null;
  }

  private mapMaterialAccessScore(access: string | null | undefined): number | null {
    if (!access) return null;
    const mapping: Record<string, number> = {
      'Books available': 2, 'Digital content (videos/apps)': 1, 'Very limited access': 0, 'No access': 0
    };
    return mapping[access] ?? null;
  }

  private mapLanguageRiskScore(mismatch: string | null | undefined): number | null {
    if (!mismatch) return null;
    const mapping: Record<string, number> = {
      'No': 0, 'Yes - minor difference': 1, 'Yes - major difference': 2
    };
    return mapping[mismatch] ?? null;
  }

  private mapInterventionScore(intervention: string | null | undefined): number | null {
    if (!intervention) return null;
    const mapping: Record<string, number> = {
      'None': 0, 'School-based support': 1, 'Private tutoring': 1, 'Therapy (speech / special education)': 2, 'Not sure': 0
    };
    return mapping[intervention] ?? null;
  }

  private mapQualityScore(quality: string | null | undefined): number | null {
    if (!quality) return null;
    const mapping: Record<string, number> = {
      'Excellent': 90, 'Good': 75, 'Developing': 60, 'Needs Support': 40
    };
    return mapping[quality] ?? null;
  }

  private mapFluencyScore(fluency: string | null | undefined): number | null {
    if (!fluency) return null;
    const mapping: Record<string, number> = {
      'Fast': 90, 'On-level': 75, 'Slow': 60, 'Very slow': 40
    };
    return mapping[fluency] ?? null;
  }

  private mapErrorPenalty(errors: string | null | undefined): number | null {
    if (!errors) return null;
    const mapping: Record<string, number> = {
      'Minimal': 0, 'Moderate': -10, 'Frequent': -20
    };
    return mapping[errors] ?? null;
  }

  private mapDifficultyAdjustment(difficulty: string | null | undefined): number | null {
    if (!difficulty) return null;
    const mapping: Record<string, number> = {
      'Easy': -5, 'Grade Level': 0, 'Hard': 5
    };
    return mapping[difficulty] ?? null;
  }
}
