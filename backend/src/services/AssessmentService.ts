import { PrismaClient, Assessment, AssessmentStatus, IntakeForm, IEPGoal, IEPGoalStatus, SessionNote, Report, ReportType } from '@prisma/client';
import { AssessmentRepository } from '../repositories/AssessmentRepository';
import { AssessmentData, IntakeFormData, IEPGoalData, SessionNoteData, ReportData } from '../models';

export class AssessmentService {
  private assessmentRepository: AssessmentRepository;

  constructor(prisma: PrismaClient) {
    this.assessmentRepository = new AssessmentRepository(prisma);
  }

  // Intake Form Services
  async createIntakeForm(specialEducatorId: string, intakeData: any): Promise<IntakeForm> {
    // Validate required fields
    if (!intakeData.studentId) {
      throw new Error('Student ID is required');
    }

    // Check if intake form already exists for this student
    const existingIntake = await this.assessmentRepository.findIntakeFormByStudent(intakeData.studentId);
    if (existingIntake && existingIntake.status === AssessmentStatus.COMPLETED) {
      throw new Error('Completed intake form already exists for this student');
    }

    // Extract student data and update student record if provided
    const studentData = this.extractStudentData(intakeData);
    if (Object.keys(studentData).length > 0) {
      // If center name is provided instead of center ID, look up the actual center ID
      if (studentData.centerId && typeof studentData.centerId === 'string' && !studentData.centerId.startsWith('c')) {
        const center = await this.assessmentRepository.findCenterByName(studentData.centerId);
        if (center) {
          studentData.centerId = center.id;
        } else {
          // If center not found, remove centerId to avoid foreign key constraint violation
          delete studentData.centerId;
        }
      }
      
      await this.assessmentRepository.updateStudent(intakeData.studentId, studentData);
    }

    // Extract only the intake form data that matches the IntakeFormData interface
    const intakeFormData = this.extractIntakeFormData(intakeData);

    return await this.assessmentRepository.createIntakeForm(specialEducatorId, intakeFormData);
  }

  async updateIntakeForm(id: string, intakeData: any): Promise<IntakeForm> {
    const existingIntake = await this.assessmentRepository.findIntakeFormById(id);
    if (!existingIntake) {
      throw new Error('Intake form not found');
    }

    if (existingIntake.status === AssessmentStatus.COMPLETED) {
      throw new Error('Cannot update completed intake form');
    }

    // Extract student data and update student record if provided
    const studentData = this.extractStudentData(intakeData);
    if (Object.keys(studentData).length > 0) {
      // If center name is provided instead of center ID, look up the actual center ID
      if (studentData.centerId && typeof studentData.centerId === 'string' && !studentData.centerId.startsWith('c')) {
        const center = await this.assessmentRepository.findCenterByName(studentData.centerId);
        if (center) {
          studentData.centerId = center.id;
        } else {
          // If center not found, remove centerId to avoid foreign key constraint violation
          delete studentData.centerId;
        }
      }
      
      await this.assessmentRepository.updateStudent(existingIntake.studentId, studentData);
    }

    // Extract only the intake form data that matches the IntakeFormData interface
    const intakeFormData = this.extractIntakeFormData(intakeData);

    return await this.assessmentRepository.updateIntakeForm(id, intakeFormData);
  }

  async completeIntakeForm(id: string): Promise<IntakeForm> {
    const existingIntake = await this.assessmentRepository.findIntakeFormById(id);
    if (!existingIntake) {
      throw new Error('Intake form not found');
    }

    if (existingIntake.status === AssessmentStatus.COMPLETED) {
      throw new Error('Intake form is already completed');
    }

    return await this.assessmentRepository.completeIntakeForm(id);
  }

  async getIntakeFormByStudent(studentId: string): Promise<IntakeForm | null> {
    return await this.assessmentRepository.findIntakeFormByStudent(studentId);
  }

  async getIntakeFormById(id: string): Promise<IntakeForm> {
    const intakeForm = await this.assessmentRepository.findIntakeFormById(id);
    if (!intakeForm) {
      throw new Error('Intake form not found');
    }
    return intakeForm;
  }

  // Helper methods for data extraction
  private extractStudentData(data: any): any {
    const studentFields = [
      'name', 'age', 'gender', 'schoolCenter', 'class', 'motherTongue', 'syllabus',
      'fullName', 'dateOfBirth', 'grade'
    ];
    
    const studentData: any = {};
    for (const key of studentFields) {
      if (data[key] !== undefined) {
        // Map frontend field names to backend field names
        if (key === 'name') studentData.fullName = data[key];
        else if (key === 'class') studentData.grade = data[key];
        else if (key === 'schoolCenter') studentData.centerId = data[key]; // This might need adjustment
        else studentData[key] = data[key];
      }
    }
    
    return studentData;
  }

  private extractIntakeFormData(data: any): IntakeFormData {
    // Extract only fields that belong to IntakeFormData interface
    const intakeFormData: any = { studentId: data.studentId };
    
    const intakeFormFields = [
      // ── Existing fields (backward compatible) ────────────────────────────────
      'address', 'familyIncome', 'familyType', 'digitalResourcesAtHome', 'dailyDigitalUse',
      'enjoysSchool', 'studyAssistant', 'externalAcademicSupport', 'enjoysReading', 'dailyParentChildTime',
      'childType', 'fatherName', 'motherName', 'guardianName', 'pregnancyNormal', 'medicationsDuringPregnancy',
      'miscarriagesAbortions', 'fullTermOrPremature', 'deliveryType', 'breastFed', 'infantJaundice',
      'incubation', 'immunizationDone', 'consanguineousMarriage', 'birthCry', 'delayInNeckStanding',
      'delayInNeckStandingDetails', 'ageOfWalking', 'ageOfTwoWordSpeech', 'healthConcerns', 'epilepticHistory',
      'onMedication', 'medicationDetails', 'asthmaWheezing', 'wearsGlasses', 'visionTestDone', 'hearingTestDone',
      'attendedPreschool', 'repeatedGrades', 'whichGradeRepeated', 'dominantWritingHand', 'strugglesInLanguages',

      // ── Block A: Referral ─────────────────────────────────────────────────────
      'referralSource',        // String[] — multi-select
      'referralAreas',         // String[] — multi-select
      'durationOfConcern',     // String?
      'severityOfConcern',     // String?

      // ── Block B: Extended Demographics ───────────────────────────────────────
      'mediumOfInstruction',          // String?
      'yearsExposedToInstruction',    // Int?
      'schoolType',                   // String?
      'numberOfLanguagesUnderstood',  // Int?
      'schoolAttendance',             // String?

      // ── Block C: Extended Family History ─────────────────────────────────────
      'primaryCaregiver',             // String?
      'childLivesWith',               // String[] — multi-select
      'numberOfSiblings',             // Int?
      'birthOrder',                   // String?
      'familyHistoryOfDifficulties',  // Boolean?
      'familyHistoryDetails',         // String?
      'digitalResourceTypes',         // String[] — multi-select
      'languagesSpokenAtHome',        // String[] — multi-select
      'parentHelpsWithHomework',      // String?
      'enjoySchoolRating',            // Int? (1–5)
      'enjoyReadingRating',           // Int? (1–5)
      'externalSupportTypes',         // String[] — multi-select

      // ── Block D: AI Intake Profile ────────────────────────────────────────────
      'intakeAIProfile',       // Json?
      'intakeAIGeneratedAt',   // DateTime?
      'intakeAIConfidence',    // String?
    ];
    
    for (const key of intakeFormFields) {
      if (data[key] !== undefined) {
        intakeFormData[key] = data[key];
      }
    }
    
    return intakeFormData as IntakeFormData;
  }

  // Assessment Services
  async createAssessment(specialEducatorId: string, assessmentData: AssessmentData): Promise<Assessment> {
    if (!assessmentData.studentId) {
      throw new Error('Student ID is required');
    }

    return await this.assessmentRepository.createAssessment(specialEducatorId, assessmentData);
  }

  async updateAssessment(id: string, assessmentData: Partial<AssessmentData>): Promise<Assessment> {
    const existingAssessment = await this.assessmentRepository.findAssessmentById(id);
    if (!existingAssessment) {
      throw new Error('Assessment not found');
    }

    if (existingAssessment.status === AssessmentStatus.COMPLETED) {
      throw new Error('Cannot update completed assessment');
    }

    return await this.assessmentRepository.updateAssessment(id, assessmentData);
  }

  async completeAssessment(id: string): Promise<Assessment> {
    const existingAssessment = await this.assessmentRepository.findAssessmentById(id);
    if (!existingAssessment) {
      throw new Error('Assessment not found');
    }

    if (existingAssessment.status === AssessmentStatus.COMPLETED) {
      throw new Error('Assessment is already completed');
    }

    return await this.assessmentRepository.completeAssessment(id);
  }

  async getAssessmentById(id: string): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findAssessmentById(id);
    if (!assessment) {
      throw new Error('Assessment not found');
    }
    return assessment;
  }

  async getAssessmentsByStudent(studentId: string): Promise<Assessment[]> {
    return await this.assessmentRepository.findAssessmentsByStudent(studentId);
  }

  async getAssessmentsByEducator(specialEducatorId: string, page: number = 1, limit: number = 10): Promise<{ assessments: Assessment[], total: number }> {
    return await this.assessmentRepository.findAssessmentsByEducator(specialEducatorId, page, limit);
  }

  // IEP Goal Services
  async createIEPGoal(specialEducatorId: string, goalData: IEPGoalData): Promise<IEPGoal> {
    // Validate required fields
    if (!goalData.studentId || !goalData.domain || !goalData.goalStatement) {
      throw new Error('Student ID, domain, and goal statement are required');
    }

    // Validate dates
    if (new Date(goalData.targetDate) <= new Date(goalData.startDate)) {
      throw new Error('Target date must be after start date');
    }

    return await this.assessmentRepository.createIEPGoal(specialEducatorId, goalData);
  }

  async updateIEPGoal(id: string, goalData: Partial<IEPGoalData & { progressPercent?: number; status?: IEPGoalStatus; notes?: string }>): Promise<IEPGoal> {
    const existingGoal = await this.assessmentRepository.findIEPGoalById(id);
    if (!existingGoal) {
      throw new Error('IEP goal not found');
    }

    if (existingGoal.status === IEPGoalStatus.DISCONTINUED) {
      throw new Error('Cannot update discontinued goal');
    }

    // Validate dates if provided
    if (goalData.targetDate && goalData.startDate && new Date(goalData.targetDate) <= new Date(goalData.startDate)) {
      throw new Error('Target date must be after start date');
    }

    return await this.assessmentRepository.updateIEPGoal(id, goalData);
  }

  async updateIEPGoalProgress(goalId: string, progress: number, notes?: string, rating?: string): Promise<void> {
    const existingGoal = await this.assessmentRepository.findIEPGoalById(goalId);
    if (!existingGoal) {
      throw new Error('IEP goal not found');
    }

    if (existingGoal.status === IEPGoalStatus.DISCONTINUED) {
      throw new Error('Cannot update progress for discontinued goal');
    }

    // Validate progress percentage
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    await this.assessmentRepository.addIEPProgress(goalId, progress, notes, rating);
  }

  async getIEPGoalById(id: string): Promise<IEPGoal> {
    const goal = await this.assessmentRepository.findIEPGoalById(id);
    if (!goal) {
      throw new Error('IEP goal not found');
    }
    return goal;
  }

  async getIEPGoalsByStudent(studentId: string, page: number = 1, limit: number = 10, filters?: {
    domain?: string;
    status?: IEPGoalStatus;
    search?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    targetDateFrom?: Date;
    targetDateTo?: Date;
  }): Promise<{ iepGoals: IEPGoal[], total: number }> {
    return await this.assessmentRepository.findIEPGoalsByStudent(studentId, page, limit, filters);
  }

  async getIEPGoalsByEducator(specialEducatorId: string, page: number = 1, limit: number = 10, filters?: {
    studentId?: string;
    domain?: string;
    status?: IEPGoalStatus;
    search?: string;
    startDateFrom?: Date;
    startDateTo?: Date;
    targetDateFrom?: Date;
    targetDateTo?: Date;
  }): Promise<{ iepGoals: IEPGoal[], total: number }> {
    return await this.assessmentRepository.findIEPGoalsByEducator(specialEducatorId, page, limit, filters);
  }

  async discontinueIEPGoal(goalId: string, reason?: string): Promise<IEPGoal> {
    const existingGoal = await this.assessmentRepository.findIEPGoalById(goalId);
    if (!existingGoal) {
      throw new Error('IEP goal not found');
    }

    if (existingGoal.status === IEPGoalStatus.DISCONTINUED) {
      throw new Error('Goal is already discontinued');
    }

    return await this.assessmentRepository.updateIEPGoal(goalId, {
      status: IEPGoalStatus.DISCONTINUED,
      notes: reason || 'Goal discontinued'
    });
  }

  // Session Note Services
  async createSessionNote(specialEducatorId: string, sessionData: SessionNoteData): Promise<SessionNote> {
    // Validate required fields
    if (!sessionData.studentId || !sessionData.activities) {
      throw new Error('Student ID and activities are required');
    }

    // Validate session date is not in the future
    if (new Date(sessionData.sessionDate) > new Date()) {
      throw new Error('Session date cannot be in the future');
    }

    return await this.assessmentRepository.createSessionNote(specialEducatorId, sessionData);
  }

  async updateSessionNote(id: string, sessionData: Partial<SessionNoteData>): Promise<SessionNote> {
    const existingNote = await this.assessmentRepository.findSessionNoteById(id);
    if (!existingNote) {
      throw new Error('Session note not found');
    }

    // Validate session date if provided
    if (sessionData.sessionDate && new Date(sessionData.sessionDate) > new Date()) {
      throw new Error('Session date cannot be in the future');
    }

    return await this.assessmentRepository.updateSessionNote(id, sessionData);
  }

  async getSessionNoteById(id: string): Promise<SessionNote> {
    const sessionNote = await this.assessmentRepository.findSessionNoteById(id);
    if (!sessionNote) {
      throw new Error('Session note not found');
    }
    return sessionNote;
  }

  async getSessionNotesByStudent(studentId: string, page: number = 1, limit: number = 10): Promise<{ sessionNotes: SessionNote[], total: number }> {
    return await this.assessmentRepository.findSessionNotesByStudent(studentId, page, limit);
  }

  async getSessionNotesByEducator(specialEducatorId: string, page: number = 1, limit: number = 10): Promise<{ sessionNotes: SessionNote[], total: number }> {
    return await this.assessmentRepository.findSessionNotesByEducator(specialEducatorId, page, limit);
  }

  // Report Services
  async createReport(specialEducatorId: string, reportData: ReportData): Promise<Report> {
    // Validate required fields
    if (!reportData.studentId || !reportData.type || !reportData.title || !reportData.content) {
      throw new Error('Student ID, type, title, and content are required');
    }

    return await this.assessmentRepository.createReport(specialEducatorId, reportData);
  }

  async updateReport(id: string, reportData: Partial<ReportData>): Promise<Report> {
    const existingReport = await this.assessmentRepository.findReportById(id);
    if (!existingReport) {
      throw new Error('Report not found');
    }

    if (existingReport.status === AssessmentStatus.REVIEWED) {
      throw new Error('Cannot update reviewed report');
    }

    return await this.assessmentRepository.updateReport(id, reportData);
  }

  async submitReport(id: string, educatorSignature: string): Promise<Report> {
    const existingReport = await this.assessmentRepository.findReportById(id);
    if (!existingReport) {
      throw new Error('Report not found');
    }

    if (existingReport.status === AssessmentStatus.COMPLETED) {
      throw new Error('Report is already submitted');
    }

    if (!educatorSignature) {
      throw new Error('Educator signature is required');
    }

    return await this.assessmentRepository.submitReport(id, educatorSignature);
  }

  async reviewReport(id: string, superSpecialEducatorId: string): Promise<Report> {
    const existingReport = await this.assessmentRepository.findReportById(id);
    if (!existingReport) {
      throw new Error('Report not found');
    }

    if (existingReport.status === AssessmentStatus.REVIEWED) {
      throw new Error('Report is already reviewed');
    }

    if (existingReport.status !== AssessmentStatus.COMPLETED) {
      throw new Error('Only submitted reports can be reviewed');
    }

    return await this.assessmentRepository.reviewReport(id, superSpecialEducatorId);
  }

  async getReportById(id: string): Promise<Report> {
    const report = await this.assessmentRepository.findReportById(id);
    if (!report) {
      throw new Error('Report not found');
    }
    return report;
  }

  async getReportsByStudent(studentId: string): Promise<Report[]> {
    return await this.assessmentRepository.findReportsByStudent(studentId);
  }

  async getReportsByEducator(specialEducatorId: string, page: number = 1, limit: number = 10): Promise<{ reports: Report[], total: number }> {
    return await this.assessmentRepository.findReportsByEducator(specialEducatorId, page, limit);
  }

  async getPendingReports(superSpecialEducatorId?: string): Promise<Report[]> {
    return await this.assessmentRepository.findPendingReports(superSpecialEducatorId);
  }

  // Statistics and Analytics
  async getAssessmentStats(specialEducatorId?: string, centerId?: string): Promise<any> {
    return await this.assessmentRepository.getAssessmentStats(specialEducatorId, centerId);
  }

  async getStudentAssessmentSummary(studentId: string): Promise<{
    intakeForm: IntakeForm | null;
    assessments: Assessment[];
    activeIEPGoals: IEPGoal[];
    completedIEPGoals: IEPGoal[];
    recentSessionNotes: SessionNote[];
    reports: Report[];
    overallProgress: number;
  }> {
    const [
      intakeForm,
      assessments,
      iepGoals,
      sessionNotes,
      reports
    ] = await Promise.all([
      this.assessmentRepository.findIntakeFormByStudent(studentId),
      this.assessmentRepository.findAssessmentsByStudent(studentId),
      this.assessmentRepository.findIEPGoalsByStudent(studentId),
      this.assessmentRepository.findSessionNotesByStudent(studentId, 1, 5),
      this.assessmentRepository.findReportsByStudent(studentId)
    ]);

    const activeIEPGoals = iepGoals.iepGoals.filter(goal => 
      goal.status === IEPGoalStatus.IN_PROGRESS || goal.status === IEPGoalStatus.NOT_STARTED
    );

    const completedIEPGoals = iepGoals.iepGoals.filter(goal => 
      goal.status === IEPGoalStatus.ACHIEVED
    );

    // Calculate overall progress
    let overallProgress = 0;
    if (iepGoals.iepGoals.length > 0) {
      const totalProgress = iepGoals.iepGoals.reduce((sum, goal) => sum + goal.progressPercent, 0);
      overallProgress = Math.round(totalProgress / iepGoals.iepGoals.length);
    }

    return {
      intakeForm,
      assessments,
      activeIEPGoals,
      completedIEPGoals,
      recentSessionNotes: sessionNotes.sessionNotes,
      reports,
      overallProgress
    };
  }

  async generateAssessmentReport(studentId: string, reportType: ReportType): Promise<string> {
    const summary = await this.getStudentAssessmentSummary(studentId);
    
    // This would generate a comprehensive report based on all assessment data
    // For now, returning a simple JSON string - in production, this would generate PDF/HTML
    const reportContent = {
      studentId,
      reportType,
      generatedAt: new Date(),
      intakeCompleted: !!summary.intakeForm && summary.intakeForm.status === AssessmentStatus.COMPLETED,
      totalAssessments: summary.assessments.length,
      completedAssessments: summary.assessments.filter(a => a.status === AssessmentStatus.COMPLETED).length,
      activeGoals: summary.activeIEPGoals.length,
      completedGoals: summary.completedIEPGoals.length,
      overallProgress: summary.overallProgress,
      recentActivity: summary.recentSessionNotes.length,
      reports: summary.reports.length
    };

    return JSON.stringify(reportContent, null, 2);
  }

  async getAssessmentHistory(studentId: string): Promise<{
    hasSuccessfulAssessments: boolean;
    hasDrafts: boolean;
    totalAssessments: number;
    completedAssessments: number;
    inProgressAssessments: number;
    draftAssessments: number;
    assessments: Array<{
      id: string;
      assessmentType: string;
      status: string;
      createdAt: Date;
      completedAt?: Date;
    }>;
  }> {
    const assessments = await this.assessmentRepository.findAssessmentsByStudent(studentId);
    
    const completedAssessments = assessments.filter(a => a.status === 'COMPLETED');
    const inProgressAssessments = assessments.filter(a => a.status === 'IN_PROGRESS');
    const draftAssessments = assessments.filter(a => a.status === 'PENDING');
    
    return {
      hasSuccessfulAssessments: completedAssessments.length > 0,
      hasDrafts: draftAssessments.length > 0 || inProgressAssessments.length > 0,
      totalAssessments: assessments.length,
      completedAssessments: completedAssessments.length,
      inProgressAssessments: inProgressAssessments.length,
      draftAssessments: draftAssessments.length,
      assessments: assessments.map(assessment => ({
        id: assessment.id,
        assessmentType: assessment.assessmentType || 'Initial',
        status: assessment.status,
        createdAt: assessment.createdAt,
        completedAt: assessment.completedAt || undefined
      }))
    };
  }
}
