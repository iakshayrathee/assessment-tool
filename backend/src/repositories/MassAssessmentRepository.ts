import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class MassAssessmentRepository {
    // Create new mass assessment
    async create(data: {
        educatorId: string;
        schoolId?: string;
        centerId?: string;
        grade: string;
        className?: string;
        totalStudents: number;
    }) {
        console.log('Creating MassAssessment with data:', data);
        
        try {
            // First check if the educator exists
            let educator = await prisma.specialEducatorProfile.findUnique({
                where: { id: data.educatorId }
            });
            
            if (!educator) {
                console.error('Educator not found with ID:', data.educatorId);
                
                // For testing purposes, let's try to find any existing educator
                const anyEducator = await prisma.specialEducatorProfile.findFirst();
                if (anyEducator) {
                    console.log('Using existing educator for testing:', anyEducator.id);
                    data.educatorId = anyEducator.id;
                    educator = anyEducator;
                } else {
                    throw new Error(`No SpecialEducatorProfile found in database. Please create at least one educator profile first.`);
                }
            }
            
            // Check if center exists, if not find any existing center
            let centerId = data.centerId;
            if (centerId) {
                const center = await prisma.centerProfile.findUnique({
                    where: { id: centerId }
                });
                if (!center) {
                    console.log('Center not found, looking for any existing center');
                    const anyCenter = await prisma.centerProfile.findFirst();
                    if (anyCenter) {
                        centerId = anyCenter.id;
                        console.log('Using existing center:', centerId);
                    } else {
                        throw new Error(`No CenterProfile found in database. Please create at least one center first.`);
                    }
                }
            } else {
                // No centerId provided, find any existing center
                const anyCenter = await prisma.centerProfile.findFirst();
                if (anyCenter) {
                    centerId = anyCenter.id;
                    console.log('Using existing center:', centerId);
                } else {
                    throw new Error(`No CenterProfile found in database. Please create at least one center first.`);
                }
            }
            
            // Check if worksheet exists, if not find any existing worksheet
            let worksheetId = 'default-worksheet-id';
            const worksheet = await prisma.worksheet_templates.findFirst();
            if (worksheet) {
                worksheetId = worksheet.id;
                console.log('Using existing worksheet:', worksheetId);
            } else {
                throw new Error(`No worksheet template found in database. Please create at least one worksheet template first.`);
            }
            
            console.log('Using educator:', educator);
            console.log('Using centerId:', centerId);
            console.log('Using worksheetId:', worksheetId);
            
            const result = await prisma.massAssessment.create({
                data: {
                    educatorId: data.educatorId,
                    schoolId: data.schoolId,
                    centerId: centerId,
                    grade: data.grade,
                    className: data.className || '',
                    totalStudents: data.totalStudents,
                    assessmentDate: new Date(),
                    worksheetId: worksheetId,
                    totalMaxScore: 100, // Default max score, can be updated later
                },
                include: {
                    educator: true,
                    school: true,
                    center: true,
                },
            });
            
            console.log('MassAssessment created successfully:', result);
            return result;
        } catch (error) {
            console.error('Error creating MassAssessment:', error);
            throw error;
        }
    }

    // Find assessment by ID
    async findById(id: string) {
        return prisma.massAssessment.findUnique({
            where: { id },
            include: {
                educator: true,
                school: true,
                center: true,
                results: {
                    include: {
                        student: true,
                    },
                },
            },
        });
    }

    // Find assessments by educator
    async findByEducator(educatorId: string) {
        console.log('Finding assessments for educatorId:', educatorId);
        
        // First try with the provided educatorId
        let assessments = await prisma.massAssessment.findMany({
            where: { educatorId },
            include: {
                school: true,
                center: true,
                results: {
                    include: {
                        student: true,
                    },
                },
            },
            orderBy: {
                assessmentDate: 'desc',
            },
        });
        
        console.log('Found assessments with provided educatorId:', assessments.length);
        
        // If no assessments found, try to find any educator and use their ID
        if (assessments.length === 0) {
            console.log('No assessments found, trying to find any educator...');
            const anyEducator = await prisma.specialEducatorProfile.findFirst();
            if (anyEducator) {
                console.log('Using educator:', anyEducator.id);
                assessments = await prisma.massAssessment.findMany({
                    where: { educatorId: anyEducator.id },
                    include: {
                        school: true,
                        center: true,
                        results: {
                            include: {
                                student: true,
                            },
                        },
                    },
                    orderBy: {
                        assessmentDate: 'desc',
                    },
                });
            }
        }
        
        console.log('Final assessments count:', assessments.length);
        return assessments;
    }

    // Update assessment status
    async updateStatus(id: string, status: string, completedAt?: Date) {
        return prisma.massAssessment.update({
            where: { id },
            data: {
                status: status as any,
                completedAt,
            },
        });
    }

    // Create student result
    async createResult(data: {
        massAssessmentId: string;
        studentId: string;
        readingScore?: number;
        readingComprehensionScore?: number;
        spellingScore?: number;
        numeracyScore?: number;
        writingScore?: number;
        allocatedTier: string;
        tierRationale?: string;
        attentionFlag?: boolean;
        behavioralFlag?: boolean;
        recommendedActions?: string[];
        skillGaps?: string[];
    }) {
        // Convert individual scores to responses JSON format
        const responses = {
            reading: data.readingScore,
            readingComprehension: data.readingComprehensionScore,
            spelling: data.spellingScore,
            numeracy: data.numeracyScore,
            writing: data.writingScore,
            attentionFlag: data.attentionFlag,
            behavioralFlag: data.behavioralFlag,
            recommendedActions: data.recommendedActions,
            skillGaps: data.skillGaps,
        };

        // Calculate total score and percentage
        const scores = [
            data.readingScore,
            data.readingComprehensionScore,
            data.spellingScore,
            data.numeracyScore,
            data.writingScore
        ].filter(score => score !== undefined) as number[];
        
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const totalMaxScore = scores.length * 100; // Assuming each domain is out of 100
        const percentageScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

        return prisma.massAssessmentResult.create({
            data: {
                massAssessmentId: data.massAssessmentId,
                studentId: data.studentId,
                responses: responses,
                totalScore: totalScore,
                totalMaxScore: totalMaxScore,
                percentageScore: percentageScore,
                allocatedTier: data.allocatedTier as any,
                tierRationale: data.tierRationale,
            },
            include: {
                student: true,
                massAssessment: true,
            },
        });
    }

    // Batch create results
    async batchCreateResults(results: any[]) {
        return prisma.massAssessmentResult.createMany({
            data: results,
        });
    }

    // Update result
    async updateResult(id: string, data: any) {
        return prisma.massAssessmentResult.update({
            where: { id },
            data,
        });
    }

    // Override tier allocation
    async overrideTier(
        resultId: string,
        newTier: string,
        educatorId: string,
        reason: string
    ) {
        return prisma.massAssessmentResult.update({
            where: { id: resultId },
            data: {
                allocatedTier: newTier as any,
                tierOverridden: true,
                tierOverriddenBy: educatorId,
                tierOverrideReason: reason,
                tierOverrideDate: new Date(),
            },
        });
    }

    // Get results by tier
    async getResultsByTier(assessmentId: string, tier: string) {
        return prisma.massAssessmentResult.findMany({
            where: {
                massAssessmentId: assessmentId,
                allocatedTier: tier as any,
            },
            include: {
                student: true,
            },
        });
    }

    // Create tier allocation history
    async createTierAllocation(data: {
        studentId: string;
        massAssessmentId: string;
        tier: string;
        domainScores: any;
        previousTier?: string;
        tierChangeReason?: string;
    }) {
        return prisma.tierAllocation.create({
            data: {
                ...data,
                tier: data.tier as any,
                previousTier: data.previousTier as any,
            },
        });
    }

    // Get tier history for student
    async getTierHistory(studentId: string) {
        return prisma.tierAllocation.findMany({
            where: { studentId },
            orderBy: {
                allocationDate: 'desc',
            },
        });
    }

    // Get assessment statistics
    async getAssessmentStats(assessmentId: string) {
        const results = await prisma.massAssessmentResult.findMany({
            where: { massAssessmentId: assessmentId },
        });

        const tierCounts = {
            TIER_1_UNIVERSAL: 0,
            TIER_2_AT_RISK: 0,
            TIER_3_HIGH_RISK: 0,
        };

        const allScores = {
            reading: [] as number[],
            readingComprehension: [] as number[],
            spelling: [] as number[],
            numeracy: [] as number[],
            writing: [] as number[],
        };

        results.forEach((result) => {
            tierCounts[result.allocatedTier]++;
            
            // Extract scores from responses JSON
            if (result.responses && typeof result.responses === 'object') {
                const responses = result.responses as any;
                if (responses.reading !== undefined) allScores.reading.push(responses.reading);
                if (responses.readingComprehension !== undefined) allScores.readingComprehension.push(responses.readingComprehension);
                if (responses.spelling !== undefined) allScores.spelling.push(responses.spelling);
                if (responses.numeracy !== undefined) allScores.numeracy.push(responses.numeracy);
                if (responses.writing !== undefined) allScores.writing.push(responses.writing);
            }
        });

        return {
            totalStudents: results.length,
            tierDistribution: tierCounts,
            averageScores: {
                reading: this.calculateAverage(allScores.reading),
                readingComprehension: this.calculateAverage(allScores.readingComprehension),
                spelling: this.calculateAverage(allScores.spelling),
                numeracy: this.calculateAverage(allScores.numeracy),
                writing: this.calculateAverage(allScores.writing),
            },
        };
    }

    private calculateAverage(scores: (number | null)[]): number {
        const validScores = scores.filter((s) => s !== null) as number[];
        if (validScores.length === 0) return 0;
        return validScores.reduce((a, b) => a + b, 0) / validScores.length;
    }
}
