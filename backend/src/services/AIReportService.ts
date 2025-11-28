import { GoogleGenerativeAI } from '@google/generative-ai';
import { AssessmentRepository } from '../repositories/AssessmentRepository';
import { LessonPlanRepository } from '../repositories/LessonPlanRepository';
import { IEPRepository } from '../repositories/IepRepository';
import { SkillAssessmentRepository } from '../repositories/SkillAssessmentRepository';

export class AIReportService {
  private genAI: GoogleGenerativeAI;
  private assessmentRepo: AssessmentRepository;
  private lessonPlanRepo: LessonPlanRepository;
  private iepRepo: IEPRepository;
  private skillAssessmentRepo: SkillAssessmentRepository;

  constructor(
    assessmentRepo: AssessmentRepository,
    lessonPlanRepo: LessonPlanRepository,
    iepRepo: IEPRepository,
    skillAssessmentRepo: SkillAssessmentRepository
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyA00PCGauAVyqWnhbYeyY1yEFjQaRsFFQ0');
    this.assessmentRepo = assessmentRepo;
    this.lessonPlanRepo = lessonPlanRepo;
    this.iepRepo = iepRepo;
    this.skillAssessmentRepo = skillAssessmentRepo;
  }

  async generateComprehensiveReport(studentId: string, educatorId: string) {
    try {
      console.log(`Starting AI report generation for student: ${studentId}, educator: ${educatorId}`);
      
      // Fetch all student data including detailed skill assessments
      const [assessments, lessonPlans, iepGoalsResult, iepDocuments, readingAssessments, writingAssessments, mathAssessments] = await Promise.all([
        this.assessmentRepo.findAssessmentsByStudent(studentId),
        this.lessonPlanRepo.findByStudent(studentId).then(result => result.lessonPlans),
        this.assessmentRepo.findIEPGoalsByStudent(studentId),
        this.iepRepo.findIEPDocumentsByStudent(studentId),
        this.skillAssessmentRepo.findReadingAssessmentsByStudent(studentId),
        this.skillAssessmentRepo.findWritingAssessmentsByStudent(studentId),
        this.skillAssessmentRepo.findMathAssessmentsByStudent(studentId)
      ]);
      
      console.log(`Fetched data: ${assessments.length} assessments, ${lessonPlans.length} lesson plans, ${iepGoalsResult.iepGoals.length} IEP goals, ${iepDocuments.length} IEP documents, ${readingAssessments.length} reading assessments, ${writingAssessments.length} writing assessments, ${mathAssessments.length} math assessments`);
      
      const iepGoals = iepGoalsResult.iepGoals;

      // Prepare data for AI analysis
      const studentData = {
        assessments: assessments.slice(0, 10), // Limit to recent assessments
        lessonPlans: lessonPlans.slice(0, 10), // Limit to recent lesson plans
        iepGoals: iepGoals.filter(goal => goal.status !== 'ACHIEVED'), // Only active goals
        iepDocuments: iepDocuments.slice(0, 5), // Recent documents
        skillAssessments: {
          reading: readingAssessments.slice(0, 5), // Recent reading assessments
          writing: writingAssessments.slice(0, 5), // Recent writing assessments
          math: mathAssessments.slice(0, 5) // Recent math assessments
        }
      };

      // Generate AI prompt
      const prompt = this.buildAIPrompt(studentData);

      // Call Gemini API
      console.log('Calling Gemini AI API with prompt...');
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Combine system prompt with user prompt for Gemini
      const fullPrompt = `You are an expert special education analyst. Generate comprehensive, professional reports that analyze student progress, identify patterns, and provide actionable recommendations. Use clear educational terminology and maintain a supportive, constructive tone.

${prompt}`;
      
      console.log('AI Prompt length:', fullPrompt.length);
      
      const result = await model.generateContent(fullPrompt);
      const aiResponse = result.response.text();
      
      if (!aiResponse) {
        console.error('AI response was empty');
        throw new Error('AI response was empty');
      }

      console.log('AI response received, length:', aiResponse.length);
      
      // Parse AI response into structured report
      return this.parseAIResponse(aiResponse, studentId, educatorId);

    } catch (error) {
      console.error('AI Report Generation Error:', error);
      throw new Error(`Failed to generate AI report: ${(error as Error).message}`);
    }
  }

  private buildAIPrompt(studentData: any): string {
    // Extract detailed symptom information from skill assessments
    const readingSymptoms = this.extractSymptomData(studentData.skillAssessments.reading, 'reading');
    const writingSymptoms = this.extractSymptomData(studentData.skillAssessments.writing, 'writing');
    const mathSymptoms = this.extractSymptomData(studentData.skillAssessments.math, 'math');

    // Optimize data for minimal token usage
    const optimizedAssessments = studentData.assessments.slice(0, 3).map((assessment: any) => ({
      type: assessment.type,
      date: assessment.createdAt,
      overallScore: assessment.overallScore,
      status: assessment.status
    }));

    const optimizedIEPGoals = studentData.iepGoals.slice(0, 3).map((goal: any) => ({
      objective: goal.objective,
      status: goal.status,
      progress: goal.progressPercent,
      targetDate: goal.targetDate
    }));

    // Extract lesson plan effectiveness data
    const lessonPlanEffectiveness = studentData.lessonPlans.slice(0, 3).map((plan: any) => ({
      skillArea: plan.skillArea,
      topic: plan.specificTopic,
      motivation: plan.motivationLevel,
      outcome: plan.outcome ? plan.outcome.substring(0, 100) + '...' : null
    }));

    return `
Generate a comprehensive special education progress report using detailed assessment data. Analyze symptom patterns, progress trends, and provide specific recommendations.

STUDENT DATA SUMMARY:
- Formal Assessments: ${studentData.assessments.length} total
- Skill Assessments: ${studentData.skillAssessments.reading.length + studentData.skillAssessments.writing.length + studentData.skillAssessments.math.length} total
- Lesson Plans: ${studentData.lessonPlans.length} total
- Active IEP Goals: ${studentData.iepGoals.length}
- IEP Documents: ${studentData.iepDocuments.length} total

DETAILED SYMPTOM ANALYSIS:
Reading Symptoms (${readingSymptoms.total} observed):
${readingSymptoms.summary}

Writing Symptoms (${writingSymptoms.total} observed):
${writingSymptoms.summary}

Math Symptoms (${mathSymptoms.total} observed):
${mathSymptoms.summary}

RECENT ASSESSMENTS:
${JSON.stringify(optimizedAssessments)}

ACTIVE IEP GOALS:
${JSON.stringify(optimizedIEPGoals)}

LESSON PLAN EFFECTIVENESS:
${JSON.stringify(lessonPlanEffectiveness)}

Please generate a detailed report with these sections:
1. Executive Summary - Overall progress and current status
2. Symptom Pattern Analysis - Detailed analysis of reading, writing, and math symptoms
3. Progress Tracking - Improvement trends and areas needing attention
4. IEP Goal Progress - Current status of active goals and achievements
5. Lesson Plan Effectiveness - What interventions are working best
6. Key Challenges - Specific difficulties and barriers to progress
7. Evidence-Based Recommendations - 5-7 specific, actionable recommendations with rationale
8. Next Steps - Detailed plan for next assessment period

Use professional educational terminology, cite specific symptom observations, and provide data-driven recommendations. Focus on patterns across multiple assessments and be specific about symptom severity and frequency.
    `;
  }

  private parseAIResponse(aiResponse: string, studentId: string, educatorId: string): any {
    // Extract sections from AI response
    const sections = {
      summary: this.extractSection(aiResponse, 'Executive Summary', 'Assessment Analysis'),
      assessmentAnalysis: this.extractSection(aiResponse, 'Assessment Analysis', 'IEP Goal Progress'),
      iepProgress: this.extractSection(aiResponse, 'IEP Goal Progress', 'Lesson Plan Effectiveness'),
      lessonAnalysis: this.extractSection(aiResponse, 'Lesson Plan Effectiveness', 'Strengths and Challenges'),
      strengthsChallenges: this.extractSection(aiResponse, 'Strengths and Challenges', 'Recommendations'),
      recommendations: this.extractSection(aiResponse, 'Recommendations', 'Next Steps'),
      nextSteps: this.extractSection(aiResponse, 'Next Steps')
    };

    return {
      studentId,
      specialEducatorId: educatorId,
      type: 'ASSESSMENT',
      title: `Comprehensive Progress Report - ${new Date().toLocaleDateString()}`,
      content: aiResponse,
      summary: sections.summary,
      recommendations: sections.recommendations,
      status: 'COMPLETED',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private extractSymptomData(assessments: any[], skillType: string): { total: number; summary: string } {
    if (!assessments || assessments.length === 0) {
      return { total: 0, summary: 'No assessments available' };
    }

    // Count total symptoms across all assessments
    let totalSymptoms = 0;
    const symptomSummary: string[] = [];

    assessments.forEach((assessment, index) => {
      const assessmentSymptoms: string[] = [];
      
      // Count boolean symptoms (true values)
      Object.entries(assessment).forEach(([key, value]) => {
        if (typeof value === 'boolean' && value === true) {
          totalSymptoms++;
          assessmentSymptoms.push(key);
        }
      });

      if (assessmentSymptoms.length > 0) {
        symptomSummary.push(`Assessment ${index + 1} (${new Date(assessment.createdAt).toLocaleDateString()}): ${assessmentSymptoms.length} symptoms - ${assessmentSymptoms.slice(0, 3).join(', ')}${assessmentSymptoms.length > 3 ? '...' : ''}`);
      }

      // Include additional notes if available
      if (assessment.additionalNotes) {
        symptomSummary.push(`Notes: ${assessment.additionalNotes.substring(0, 100)}${assessment.additionalNotes.length > 100 ? '...' : ''}`);
      }
    });

    return {
      total: totalSymptoms,
      summary: symptomSummary.join('\n') || 'No specific symptoms documented'
    };
  }

  private extractSection(text: string, startMarker: string, endMarker?: string): string {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return '';

    let endIndex;
    if (endMarker) {
      endIndex = text.indexOf(endMarker, startIndex);
    }

    if (endIndex === -1 || endIndex === -1) {
      return text.substring(startIndex + startMarker.length).trim();
    }

    return text.substring(startIndex + startMarker.length, endIndex).trim();
  }
}