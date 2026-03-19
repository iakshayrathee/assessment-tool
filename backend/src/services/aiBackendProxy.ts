/**
 * AI Backend Proxy Service
 * 
 * HTTP client for the Node.js backend to communicate with the Python AI backend.
 * All AI agent calls go through this service for consistent error handling,
 * timeout management, and authentication.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

interface AIBackendConfig {
  baseURL: string;
  timeout: number;
  apiKey?: string;
}

class AIBackendProxyService {
  private client: AxiosInstance;

  constructor() {
    const config: AIBackendConfig = {
      baseURL: process.env.AI_BACKEND_URL || 'http://localhost:8000',
      timeout: 120000, // 2 minutes — agent pipelines can take time
      apiKey: process.env.AI_BACKEND_API_KEY,
    };

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {}),
      },
    });
  }

  /**
   * Health check — verify the AI backend is running.
   */
  async healthCheck(): Promise<any> {
    try {
      const { data } = await this.client.get('/health');
      return data;
    } catch (error) {
      throw this.handleError(error, 'Health check failed');
    }
  }

  // ── Assessment Intelligence Agent ──────────────────────────────────────────

  /**
   * Analyze a student's assessments using the AI Assessment Intelligence Agent.
   * Returns symptom analysis, severity scores, domain profile, risk classification,
   * differential indicators, and recommended next steps.
   * 
   * All returned data has status: 'AI_DRAFT' and is editable by the educator.
   */
  async analyzeAssessment(studentId: string, assessmentType: string = 'ALL'): Promise<any> {
    try {
      const { data } = await this.client.post('/api/assessment/analyze', {
        student_id: studentId,
        assessment_type: assessmentType,
      });
      return data;
    } catch (error) {
      throw this.handleError(error, 'Assessment analysis failed');
    }
  }

  // ── IEP & Goal Planning Agent ──────────────────────────────────────────────

  /**
   * Generate IEP goals, Long-Term Plan, Short-Term Plans, and Weekly Lesson Plans
   * using the IEP & Goal Planning Agent.
   * 
   * @param assessmentAnalysis Optional — pass the assessment agent output for better results
   */
  async generateIEP(studentId: string, assessmentAnalysis?: any): Promise<any> {
    try {
      const { data } = await this.client.post('/api/iep/generate', {
        student_id: studentId,
        assessment_analysis: assessmentAnalysis || {},
      });
      return data;
    } catch (error) {
      throw this.handleError(error, 'IEP generation failed');
    }
  }

  // ── Lesson Plan Agent ──────────────────────────────────────────────────────

  /**
   * Generate a weekly lesson plan suggestion.
   */
  async suggestLessonPlan(studentId: string, weekNumber: number = 1): Promise<any> {
    try {
      const { data } = await this.client.post('/api/lesson-plan/suggest', {
        student_id: studentId,
        week_number: weekNumber,
      });
      return data;
    } catch (error) {
      throw this.handleError(error, 'Lesson plan suggestion failed');
    }
  }

  // ── Report Generation Agent ────────────────────────────────────────────────

  /**
   * Generate an AI-powered report.
   * @param reportType ASSESSMENT | LESSON_PLAN | PARENT | SCHOOL | CENTER
   * @param targetId student ID, school ID, or center ID
   */
  async generateReport(
    reportType: string,
    targetId: string,
    educatorId?: string
  ): Promise<any> {
    try {
      const { data } = await this.client.post('/api/report/generate', {
        report_type: reportType,
        target_id: targetId,
        educator_id: educatorId || '',
      });
      return data;
    } catch (error) {
      throw this.handleError(error, 'Report generation failed');
    }
  }

  // ── Risk & Progress Agent ──────────────────────────────────────────────────

  /**
   * Analyze risk and progress for a student or school.
   * @param scope STUDENT | SCHOOL | CENTER
   */
  async analyzeRisk(scope: string, targetId: string): Promise<any> {
    try {
      const { data } = await this.client.post('/api/risk/analyze', {
        scope,
        target_id: targetId,
      });
      return data;
    } catch (error) {
      throw this.handleError(error, 'Risk analysis failed');
    }
  }

  // ── Educator Intelligence Agent ────────────────────────────────────────────

  /**
   * Get AI-powered insights for an educator.
   */
  async getEducatorInsights(educatorId: string): Promise<any> {
    try {
      const { data } = await this.client.post('/api/educator/insights', {
        educator_id: educatorId,
      });
      return data;
    } catch (error) {
      throw this.handleError(error, 'Educator insights failed');
    }
  }

  // ── Full Pipeline ──────────────────────────────────────────────────────────

  /**
   * Run the full AI pipeline for a student:
   * 1. Assessment Analysis → 2. IEP Generation → 3. Report Generation
   * 
   * Returns combined results from all three agents. All content is AI_DRAFT.
   */
  async runFullPipeline(studentId: string, educatorId?: string): Promise<{
    assessment: any;
    iep: any;
    report: any;
  }> {
    // Step 1: Assessment Analysis
    const assessment = await this.analyzeAssessment(studentId);

    // Step 2: IEP Generation (uses assessment results)
    const iep = await this.generateIEP(studentId, assessment);

    // Step 3: Report Generation
    const report = await this.generateReport('ASSESSMENT', studentId, educatorId);

    return { assessment, iep, report };
  }

  // ── Error Handling ─────────────────────────────────────────────────────────

  private handleError(error: any, context: string): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const status = axiosError.response.status;
        const detail = (axiosError.response.data as any)?.detail || 'Unknown error';
        return new Error(`[AI Backend] ${context}: ${status} - ${detail}`);
      }
      if (axiosError.code === 'ECONNREFUSED') {
        return new Error(
          `[AI Backend] ${context}: Connection refused. Is the AI backend running at ${this.client.defaults.baseURL}?`
        );
      }
      if (axiosError.code === 'ECONNABORTED') {
        return new Error(
          `[AI Backend] ${context}: Request timed out. The agent pipeline may be taking too long.`
        );
      }
    }
    return new Error(`[AI Backend] ${context}: ${(error as Error).message}`);
  }
}

// Singleton export
export const aiBackendProxy = new AIBackendProxyService();
export default aiBackendProxy;
