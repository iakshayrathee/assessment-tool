import { MassAssessmentRepository } from '../repositories/MassAssessmentRepository';

interface DomainScores {
    reading?: number;
    readingComprehension?: number;
    spelling?: number;
    numeracy?: number;
    writing?: number;
}

interface BehavioralFlags {
    attentionFlag?: boolean;
    behavioralFlag?: boolean;
}

enum TierLevel {
    TIER_1_UNIVERSAL = 'TIER_1_UNIVERSAL',
    TIER_2_AT_RISK = 'TIER_2_AT_RISK',
    TIER_3_HIGH_RISK = 'TIER_3_HIGH_RISK',
}

export class MassAssessmentService {
    constructor(private repository: MassAssessmentRepository) { }

    // Create new mass assessment session
    async createMassAssessment(data: {
        educatorId: string;
        schoolId?: string;
        centerId?: string;
        grade: string;
        className?: string;
        totalStudents: number;
    }) {
        return this.repository.create(data);
    }

    // Submit individual student scores
    async submitStudentScores(
        assessmentId: string,
        studentId: string,
        scores: DomainScores,
        flags: BehavioralFlags = {}
    ) {
        const tier = this.calculateTierAllocation(scores, flags);
        const tierRationale = this.generateTierRationale(scores, flags, tier);
        const skillGaps = this.identifySkillGaps(scores);

        const result = await this.repository.createResult({
            massAssessmentId: assessmentId,
            studentId,
            ...scores,
            allocatedTier: tier,
            tierRationale,
            attentionFlag: flags.attentionFlag || false,
            behavioralFlag: flags.behavioralFlag || false,
            skillGaps,
        });

        // Create tier allocation history
        await this.repository.createTierAllocation({
            studentId,
            massAssessmentId: assessmentId,
            tier,
            domainScores: scores,
        });

        return result;
    }

    // Batch submit for entire class
    async batchSubmitScores(
        assessmentId: string,
        results: Array<{
            studentId: string;
            scores: DomainScores;
            flags?: BehavioralFlags;
        }>
    ) {
        const processedResults = results.map((r) => {
            const tier = this.calculateTierAllocation(r.scores, r.flags || {});
            return {
                massAssessmentId: assessmentId,
                studentId: r.studentId,
                ...r.scores,
                allocatedTier: tier,
                tierRationale: this.generateTierRationale(r.scores, r.flags || {}, tier),
                attentionFlag: r.flags?.attentionFlag || false,
                behavioralFlag: r.flags?.behavioralFlag || false,
                skillGaps: this.identifySkillGaps(r.scores),
            };
        });

        await this.repository.batchCreateResults(processedResults);

        // Update assessment status
        await this.repository.updateStatus(assessmentId, 'COMPLETED', new Date());

        return processedResults;
    }

    // Calculate tier allocation based on scores and flags
    calculateTierAllocation(scores: DomainScores, flags: BehavioralFlags): TierLevel {
        const domainScores = [
            scores.reading,
            scores.readingComprehension,
            scores.spelling,
            scores.numeracy,
            scores.writing,
        ].filter((s) => s !== null && s !== undefined) as number[];

        if (domainScores.length === 0) {
            return TierLevel.TIER_2_AT_RISK; // Default if no scores
        }

        const avgScore = domainScores.reduce((a, b) => a + b, 0) / domainScores.length;
        const lowScoreCount = domainScores.filter((s) => s < 40).length;
        const mediumScoreCount = domainScores.filter((s) => s >= 40 && s < 70).length;

        // Tier 3 - High Risk
        if (lowScoreCount >= 1 || flags.behavioralFlag || avgScore < 40) {
            return TierLevel.TIER_3_HIGH_RISK;
        }

        // Tier 2 - At Risk
        if (mediumScoreCount >= 1 || avgScore < 70) {
            return TierLevel.TIER_2_AT_RISK;
        }

        // Tier 1 - Universal
        return TierLevel.TIER_1_UNIVERSAL;
    }

    // Generate rationale for tier allocation
    private generateTierRationale(
        scores: DomainScores,
        flags: BehavioralFlags,
        tier: TierLevel
    ): string {
        const reasons: string[] = [];

        const domainScores = [
            { name: 'Reading', score: scores.reading },
            { name: 'Reading Comprehension', score: scores.readingComprehension },
            { name: 'Spelling', score: scores.spelling },
            { name: 'Numeracy', score: scores.numeracy },
            { name: 'Writing', score: scores.writing },
        ].filter((d) => d.score !== null && d.score !== undefined);

        const avgScore =
            domainScores.reduce((sum, d) => sum + (d.score || 0), 0) / domainScores.length;

        if (tier === TierLevel.TIER_3_HIGH_RISK) {
            const lowDomains = domainScores.filter((d) => (d.score || 0) < 40);
            if (lowDomains.length > 0) {
                reasons.push(
                    `Critical weakness in ${lowDomains.map((d) => d.name).join(', ')} (< 40%)`
                );
            }
            if (flags.behavioralFlag) {
                reasons.push('Behavioral concerns flagged');
            }
            if (avgScore < 40) {
                reasons.push(`Overall average score ${avgScore.toFixed(1)}% is below threshold`);
            }
        } else if (tier === TierLevel.TIER_2_AT_RISK) {
            const mediumDomains = domainScores.filter(
                (d) => (d.score || 0) >= 40 && (d.score || 0) < 70
            );
            if (mediumDomains.length > 0) {
                reasons.push(
                    `Moderate difficulty in ${mediumDomains.map((d) => d.name).join(', ')} (40-70%)`
                );
            }
            if (flags.attentionFlag) {
                reasons.push('Attention concerns noted');
            }
        } else {
            reasons.push(`Strong performance across all domains (avg: ${avgScore.toFixed(1)}%)`);
        }

        return reasons.join('. ');
    }

    // Identify skill gaps
    private identifySkillGaps(scores: DomainScores): string[] {
        const gaps: string[] = [];

        if (scores.reading && scores.reading < 70) gaps.push('Reading fluency');
        if (scores.readingComprehension && scores.readingComprehension < 70)
            gaps.push('Reading comprehension');
        if (scores.spelling && scores.spelling < 70) gaps.push('Spelling accuracy');
        if (scores.numeracy && scores.numeracy < 70) gaps.push('Numeracy skills');
        if (scores.writing && scores.writing < 70) gaps.push('Writing proficiency');

        return gaps;
    }

    // Get class heatmap data
    async getClassHeatmap(assessmentId: string) {
        const assessment = await this.repository.findById(assessmentId);
        if (!assessment) throw new Error('Assessment not found');

        const heatmapData = assessment.results.map((result) => ({
            studentId: result.studentId,
            studentName: result.student.fullName,
            scores: {
                reading: result.readingScore,
                readingComprehension: result.readingComprehensionScore,
                spelling: result.spellingScore,
                numeracy: result.numeracyScore,
                writing: result.writingScore,
            },
            tier: result.allocatedTier,
            flags: {
                attention: result.attentionFlag,
                behavioral: result.behavioralFlag,
            },
        }));

        return heatmapData;
    }

    // Get tier distribution
    async getTierDistribution(assessmentId: string) {
        const stats = await this.repository.getAssessmentStats(assessmentId);
        return stats.tierDistribution;
    }

    // Get students by tier
    async getStudentsByTier(assessmentId: string, tier: TierLevel) {
        return this.repository.getResultsByTier(assessmentId, tier);
    }

    // Override tier allocation
    async overrideTierAllocation(
        resultId: string,
        newTier: TierLevel,
        educatorId: string,
        reason: string
    ) {
        return this.repository.overrideTier(resultId, newTier, educatorId, reason);
    }
}
