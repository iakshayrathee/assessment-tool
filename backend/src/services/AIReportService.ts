import { GoogleGenerativeAI } from '@google/generative-ai';
import { AssessmentRepository } from '../repositories/AssessmentRepository';
import { IEPRepository } from '../repositories/IepRepository';
import { SkillAssessmentRepository } from '../repositories/SkillAssessmentRepository';
import { WeeklyLessonPlanRepository } from '../repositories/WeeklyLessonPlanRepository';

export class AIReportService {
  private genAI: GoogleGenerativeAI;
  private assessmentRepo: AssessmentRepository;
  private iepRepo: IEPRepository;
  private skillAssessmentRepo: SkillAssessmentRepository;
  private weeklyLessonPlanRepo: WeeklyLessonPlanRepository;

  constructor(
    assessmentRepo: AssessmentRepository,
    iepRepo: IEPRepository,
    skillAssessmentRepo: SkillAssessmentRepository,
    weeklyLessonPlanRepo: WeeklyLessonPlanRepository
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyCiXuKWE7iRtkKNrBu7XqS1a1R7h9lH3zc');
    this.assessmentRepo = assessmentRepo;
    this.iepRepo = iepRepo;
    this.skillAssessmentRepo = skillAssessmentRepo;
    this.weeklyLessonPlanRepo = weeklyLessonPlanRepo;
  }

  async generateComprehensiveReport(studentId: string, educatorId: string, reportType: 'ASSESSMENT' | 'LESSON_PLAN' = 'ASSESSMENT') {
    try {
      console.log(`Starting AI report generation for student: ${studentId}, educator: ${educatorId}, type: ${reportType}`);

      // Fetch all student data including detailed skill assessments
      const [assessments, weeklyLessonPlans, iepGoalsResult, iepDocuments, readingAssessments, writingAssessments, mathAssessments, intakeForms] = await Promise.all([
        this.assessmentRepo.findAssessmentsByStudent(studentId),
        this.weeklyLessonPlanRepo.findByStudent(studentId).then(result => result.plans),
        this.assessmentRepo.findIEPGoalsByStudent(studentId),
        this.iepRepo.findIEPDocumentsByStudent(studentId),
        this.skillAssessmentRepo.findReadingAssessmentsByStudent(studentId),
        this.skillAssessmentRepo.findWritingAssessmentsByStudent(studentId),
        this.skillAssessmentRepo.findMathAssessmentsByStudent(studentId),
        this.assessmentRepo.findIntakeFormsByStudent(studentId)
      ]);

      console.log(`Fetched data: ${assessments.length} assessments, ${weeklyLessonPlans.length} weekly lesson plans, ${iepGoalsResult.iepGoals.length} IEP goals, ${iepDocuments.length} IEP documents, ${readingAssessments.length} reading assessments, ${writingAssessments.length} writing assessments, ${mathAssessments.length} math assessments, ${intakeForms.length} intake forms`);

      const iepGoals = iepGoalsResult.iepGoals;

      // Prepare data for AI analysis
      const studentData = {
        assessments: assessments.slice(0, 10), // Limit to recent assessments
        weeklyLessonPlans: weeklyLessonPlans.slice(0, 10), // Limit to recent weekly lesson plans
        iepGoals: iepGoals.filter(goal => goal.status !== 'ACHIEVED'), // Only active goals
        iepDocuments: iepDocuments.slice(0, 5), // Recent documents
        intakeForms: intakeForms.slice(0, 1), // Most recent intake form
        skillAssessments: {
          reading: readingAssessments.slice(0, 5), // Recent reading assessments
          writing: writingAssessments.slice(0, 5), // Recent writing assessments
          math: mathAssessments.slice(0, 5) // Recent math assessments
        }
      };

      // Generate AI prompt based on report type
      const prompt = reportType === 'ASSESSMENT'
        ? this.buildAssessmentReportPrompt(studentData)
        : this.buildLessonPlanReportPrompt(studentData);

      // Call Gemini API
      console.log('Calling Gemini AI API with prompt...');
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Combine system prompt with user prompt for Gemini
      const systemPrompt = reportType === 'ASSESSMENT'
        ? 'You are an expert special education analyst. Generate comprehensive, professional assessment reports that analyze student progress, identify patterns from assessment data and intake forms, and provide actionable recommendations. Use clear educational terminology and maintain a supportive, constructive tone.'
        : 'You are an expert special education analyst. Generate comprehensive, professional lesson plan reports that analyze teaching effectiveness, student responses, and learning outcomes. Include symptom observations in natural sentences and teacher comments. Use clear educational terminology and maintain a supportive, constructive tone.';

      const fullPrompt = `${systemPrompt}

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
      return this.parseAIResponse(aiResponse, studentId, educatorId, reportType);

    } catch (error) {
      console.error('AI Report Generation Error:', error);
      throw new Error(`Failed to generate AI report: ${(error as Error).message}`);
    }
  }

  private buildAssessmentReportPrompt(studentData: any): string {
    // Extract detailed symptom information from skill assessments
    const readingSymptoms = this.extractSymptomData(studentData.skillAssessments.reading, 'reading');
    const writingSymptoms = this.extractSymptomData(studentData.skillAssessments.writing, 'writing');
    const mathSymptoms = this.extractSymptomData(studentData.skillAssessments.math, 'math');

    // Extract intake form data
    const intakeData = studentData.intakeForms.length > 0 ? this.extractIntakeData(studentData.intakeForms[0]) : 'No intake form available';

    // Optimize data for minimal token usage
    const optimizedAssessments = studentData.assessments.slice(0, 3).map((assessment: any) => ({
      type: assessment.assessmentType,
      date: assessment.createdAt,
      readingLevel: assessment.readingLevel,
      writingLevel: assessment.writingLevel,
      mathLevel: assessment.mathLevel,
      status: assessment.status
    }));

    return `
Generate a comprehensive ASSESSMENT REPORT using detailed assessment data and intake form information. Analyze symptom patterns, developmental history, and provide specific recommendations.

STUDENT DATA SUMMARY:
- Formal Assessments: ${studentData.assessments.length} total
- Skill Assessments: ${studentData.skillAssessments.reading.length + studentData.skillAssessments.writing.length + studentData.skillAssessments.math.length} total
- Intake Forms: ${studentData.intakeForms.length}

INTAKE FORM DATA:
${intakeData}

DETAILED SYMPTOM ANALYSIS:
Reading Symptoms (${readingSymptoms.total} observed):
${readingSymptoms.summary}

Writing Symptoms (${writingSymptoms.total} observed):
${writingSymptoms.summary}

Math Symptoms (${mathSymptoms.total} observed):
${mathSymptoms.summary}

RECENT ASSESSMENTS:
${JSON.stringify(optimizedAssessments, null, 2)}

Please generate a detailed ASSESSMENT REPORT with these sections:
1. Executive Summary - Overall assessment findings and current status
2. Developmental & Background Information - Key findings from intake form
3. Symptom Pattern Analysis - Detailed analysis of reading, writing, and math symptoms with specific examples
4. Assessment Results - Comprehensive analysis of formal and skill assessments
5. Strengths and Challenges - Specific areas of strength and concern
6. Evidence-Based Recommendations - 5-7 specific, actionable recommendations with rationale
7. Next Steps - Detailed plan for intervention and follow-up assessments

Use professional educational terminology, cite specific symptom observations from assessments, and provide data-driven recommendations. Focus on patterns across multiple assessments and be specific about symptom severity and frequency.
    `;
  }

  private buildLessonPlanReportPrompt(studentData: any): string {
    // Extract weekly lesson plan data with observations
    const weeklyLessonPlanDetails = studentData.weeklyLessonPlans.slice(0, 10).map((plan: any) => ({
      sessionDate: plan.sessionDate,
      weekNumber: plan.weekNumber,
      topics: plan.topics,
      areasOfRemediation: plan.areasOfRemediation,
      averageTime: plan.averageTime,
      actualTime: plan.actualTime,
      motivationStrategy: plan.motivationStrategy,
      resourcesUsed: plan.resourcesUsed,
      outcome: plan.outcome,
      status: plan.status,
      shortTermPlan: plan.shortTermPlan ? {
        stpGoal: plan.shortTermPlan.stpGoal,
        longTermPlanId: plan.shortTermPlan.longTermPlanId
      } : null
    }));

    // Extract symptom data for context
    const readingSymptoms = this.extractSymptomData(studentData.skillAssessments.reading, 'reading');
    const writingSymptoms = this.extractSymptomData(studentData.skillAssessments.writing, 'writing');
    const mathSymptoms = this.extractSymptomData(studentData.skillAssessments.math, 'math');

    return `
Generate a comprehensive LESSON PLAN REPORT analyzing teaching effectiveness, student responses, and learning outcomes based on weekly lesson plans and assessment data.

STUDENT DATA SUMMARY:
- Weekly Lesson Plans: ${studentData.weeklyLessonPlans.length}
- IEP Documents: ${studentData.iepDocuments.length}
- Reading Skill Assessments: ${studentData.skillAssessments.reading.length}
- Writing Skill Assessments: ${studentData.skillAssessments.writing.length}
- Math Skill Assessments: ${studentData.skillAssessments.math.length}

SYMPTOM CONTEXT (for natural language integration):
Reading: ${readingSymptoms.total} symptoms observed
Writing: ${writingSymptoms.total} symptoms observed
Math: ${mathSymptoms.total} symptoms observed

WEEKLY LESSON PLAN DATA:
${JSON.stringify(weeklyLessonPlanDetails, null, 2)}

Please generate a detailed LESSON PLAN REPORT with these sections:
1. Executive Summary - Overview of teaching sessions and overall student progress
2. Weekly Lesson Plan Analysis - Detailed analysis of each weekly lesson plan with:
   - Symptom observations written in natural, flowing sentences
   - Teacher's observations and outcomes from each session
   - Student motivation and engagement levels
   - Time management and pacing effectiveness
   - Connection to short-term and long-term goals
3. Teaching Strategies Effectiveness - What worked well and what needs adjustment
4. Student Progress Patterns - Trends in student responses across multiple sessions
5. Areas of Remediation - Specific skills targeted and progress made
6. Recommendations - Specific suggestions for future lesson planning
7. Next Steps - Detailed plan for upcoming sessions

IMPORTANT: 
- Write symptom observations in complete, natural sentences within the narrative
- Include specific teacher observations and outcomes from lesson plans
- Use a narrative style that flows naturally, not bullet points for symptoms
- Connect symptoms to specific lesson activities and student responses
- Reference the three-tier planning system (Long-term → Short-term → Weekly plans)
- Maintain professional educational terminology while being descriptive and specific
    `;
  }

  private parseAIResponse(aiResponse: string, studentId: string, educatorId: string, reportType: 'ASSESSMENT' | 'LESSON_PLAN'): any {
    // Extract sections from AI response
    const sections = {
      summary: this.extractSection(aiResponse, 'Executive Summary', reportType === 'ASSESSMENT' ? 'Developmental' : 'Weekly Lesson Plan Analysis'),
      recommendations: this.extractSection(aiResponse, 'Recommendations', 'Next Steps'),
      nextSteps: this.extractSection(aiResponse, 'Next Steps')
    };

    const title = reportType === 'ASSESSMENT'
      ? `Assessment Report - ${new Date().toLocaleDateString()}`
      : `Lesson Plan Report - ${new Date().toLocaleDateString()}`;

    return {
      studentId,
      specialEducatorId: educatorId,
      type: reportType === 'ASSESSMENT' ? 'ASSESSMENT' : 'LESSON_PLAN',
      title,
      content: aiResponse,
      summary: sections.summary,
      recommendations: sections.recommendations,
      status: 'COMPLETED',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private extractIntakeData(intakeForm: any): string {
    if (!intakeForm) return 'No intake data available';

    const relevantFields = [];

    // Family and background
    if (intakeForm.familyType) relevantFields.push(`Family Type: ${intakeForm.familyType}`);
    if (intakeForm.familyIncome) relevantFields.push(`Family Income: ${intakeForm.familyIncome}`);

    // Developmental history
    if (intakeForm.pregnancyNormal !== null) relevantFields.push(`Pregnancy: ${intakeForm.pregnancyNormal ? 'Normal' : 'Complications noted'}`);
    if (intakeForm.deliveryType) relevantFields.push(`Delivery: ${intakeForm.deliveryType}`);
    if (intakeForm.ageOfWalking) relevantFields.push(`Age of Walking: ${intakeForm.ageOfWalking} months`);
    if (intakeForm.ageOfTwoWordSpeech) relevantFields.push(`Age of Two-Word Speech: ${intakeForm.ageOfTwoWordSpeech} months`);

    // Medical history
    if (intakeForm.healthConcerns) relevantFields.push(`Health Concerns: ${intakeForm.healthConcerns}`);
    if (intakeForm.epilepticHistory) relevantFields.push(`Epileptic History: Yes`);
    if (intakeForm.onMedication && intakeForm.medicationDetails) relevantFields.push(`Medication: ${intakeForm.medicationDetails}`);
    if (intakeForm.wearsGlasses) relevantFields.push(`Vision: Wears glasses`);

    // Educational history
    if (intakeForm.attendedPreschool !== null) relevantFields.push(`Preschool: ${intakeForm.attendedPreschool ? 'Yes' : 'No'}`);
    if (intakeForm.repeatedGrades && intakeForm.whichGradeRepeated) relevantFields.push(`Repeated Grade: ${intakeForm.whichGradeRepeated}`);
    if (intakeForm.strugglesInLanguages) relevantFields.push(`Language Struggles: Yes`);
    if (intakeForm.dominantWritingHand) relevantFields.push(`Dominant Hand: ${intakeForm.dominantWritingHand}`);

    // Social and behavioral
    if (intakeForm.enjoysSchool !== null) relevantFields.push(`Enjoys School: ${intakeForm.enjoysSchool ? 'Yes' : 'No'}`);
    if (intakeForm.enjoysReading !== null) relevantFields.push(`Enjoys Reading: ${intakeForm.enjoysReading ? 'Yes' : 'No'}`);
    if (intakeForm.childType) relevantFields.push(`Child Type: ${intakeForm.childType}`);

    return relevantFields.join('\n');
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