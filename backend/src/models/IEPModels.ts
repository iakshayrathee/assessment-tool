import { IEPSubject, BehavioralAttentionLevel, BehavioralSittingTolerance, BehavioralTaskCompletion } from '@prisma/client';

export interface IEPDocumentData {
  title: string;
  studentId: string;
  durationMonths: number;
  startDate: Date;
  endDate: Date;
  areasOfRemediation?: string[];
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  subjectSections?: IEPSubjectSectionData[];
}

export interface IEPSubjectSectionData {
  subject: IEPSubject;
  presentLevelReceptive?: string;
  presentLevelExpressive?: string;
  longTermGoals?: IEPLongTermGoalData[];
  shortTermGoals?: IEPShortTermGoalData[];
}

export interface IEPLongTermGoalData {
  goalNumber: number;
  description: string;
  durationMonths: number;
}

export interface IEPShortTermGoalData {
  goalNumber: number;
  description: string;
  teacherAssistance?: string | null;
  targetDate: Date;
}

export interface IEPWeeklyEvaluationData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  strategies?: string | null;
  observations?: string | null;
  activities?: IEPWeeklyActivityData[];
}

export interface IEPWeeklyActivityData {
  subject: IEPSubject;
  activity: string;
  analysis?: string | null;
  assessment?: string | null;
  attentionLevel?: BehavioralAttentionLevel | null;
  sittingTolerance?: BehavioralSittingTolerance | null;
  taskCompletion?: BehavioralTaskCompletion | null;
}

export interface IEPDocumentWithRelations {
  id: string;
  title: string;
  studentId: string;
  specialEducatorId: string;
  durationMonths: number;
  startDate: Date;
  endDate: Date;
  areasOfRemediation: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  subjectSections: IEPSubjectSectionWithRelations[];
  weeklyEvaluations: IEPWeeklyEvaluationWithRelations[];
  student: {
    id: string;
    fullName: string;
    dateOfBirth: Date;
    age: number;
    grade: string;
  };
  specialEducator: {
    id: string;
    fullName: string;
  };
}

export interface IEPSubjectSectionWithRelations {
  id: string;
  subject: IEPSubject;
  presentLevelReceptive?: string | null;
  presentLevelExpressive?: string | null;
  longTermGoals: IEPLongTermGoal[];
  shortTermGoals: IEPShortTermGoal[];
}

export interface IEPWeeklyEvaluationWithRelations {
  id: string;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  strategies?: string | null;
  observations?: string | null;
  activities: IEPWeeklyActivity[];
}

export interface IEPLongTermGoal {
  id: string;
  goalNumber: number;
  description: string;
  durationMonths: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEPShortTermGoal {
  id: string;
  goalNumber: number;
  description: string;
  teacherAssistance?: string | null;
  targetDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEPWeeklyActivity {
  id: string;
  subject: IEPSubject;
  activity: string;
  analysis?: string | null;
  assessment?: string | null;
  attentionLevel?: BehavioralAttentionLevel | null;
  sittingTolerance?: BehavioralSittingTolerance | null;
  taskCompletion?: BehavioralTaskCompletion | null;
  createdAt: Date;
  updatedAt: Date;
}