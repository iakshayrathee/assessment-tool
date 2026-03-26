/**
 * AI Backend Proxy Service
 * 
 * HTTP client for the Node.js backend to communicate with the Python AI backend.
 * All AI agent calls go through this service for consistent error handling,
 * timeout management, and authentication.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export class AIBackendError extends Error {
  isAiUnavailable: boolean;
  statusCode?: number;

  constructor(message: string, isAiUnavailable = false, statusCode?: number) {
    super(message);
    this.name = 'AIBackendError';
    this.isAiUnavailable = isAiUnavailable;
    this.statusCode = statusCode;
  }
}

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
    return this.withRetry(async () => {
      try {
        const { data } = await this.client.post('/api/assessment/analyze', {
          student_id: studentId,
          assessment_type: assessmentType,
        });
        return data;
      } catch (error) {
        throw this.handleError(error, 'Assessment analysis failed');
      }
    });
  }

  // ── IEP & Goal Planning Agent ──────────────────────────────────────────────

  /**
   * Generate IEP goals, Long-Term Plan, Short-Term Plans, and Weekly Lesson Plans
   * using the IEP & Goal Planning Agent.
   * 
   * @param assessmentAnalysis Optional — pass the assessment agent output for better results
   */
  async generateIEP(studentId: string, assessmentAnalysis?: any): Promise<any> {
    return this.withRetry(async () => {
      try {
        const { data } = await this.client.post('/api/iep/generate', {
          student_id: studentId,
          assessment_analysis: assessmentAnalysis || {},
        });
        return data;
      } catch (error) {
        throw this.handleError(error, 'IEP generation failed');
      }
    });
  }

  // ── Lesson Plan Agent ──────────────────────────────────────────────────────

  /**
   * Generate a weekly lesson plan suggestion.
   */
  async suggestLessonPlan(studentId: string, weekNumber: number = 1): Promise<any> {
    return this.withRetry(async () => {
      try {
        const { data } = await this.client.post('/api/lesson-plan/suggest', {
          student_id: studentId,
          week_number: weekNumber,
        });
        return data;
      } catch (error) {
        throw this.handleError(error, 'Lesson plan suggestion failed');
      }
    });
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
    return this.withRetry(async () => {
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
    });
  }

  // ── Risk & Progress Agent ──────────────────────────────────────────────────

  /**
   * Analyze risk and progress for a student or school.
   * @param scope STUDENT | SCHOOL | CENTER
   */
  async analyzeRisk(scope: string, targetId: string): Promise<any> {
    return this.withRetry(async () => {
      try {
        const { data } = await this.client.post('/api/risk/analyze', {
          scope,
          target_id: targetId,
        });
        return data;
      } catch (error) {
        throw this.handleError(error, 'Risk analysis failed');
      }
    });
  }

  // ── Educator Intelligence Agent ────────────────────────────────────────────

  /**
   * Get AI-powered insights for an educator.
   */
  async getEducatorInsights(educatorId: string): Promise<any> {
    return this.withRetry(async () => {
      try {
        const { data } = await this.client.post('/api/educator/insights', {
          educator_id: educatorId,
        });
        return data;
      } catch (error) {
        throw this.handleError(error, 'Educator insights failed');
      }
    });
  }

  // ── Transparency (Debug) ───────────────────────────────────────────────────

  /**
   * Trigger an AI agent and return full transparency data:
   * raw DB data, constructed prompts, and AI response.
   */
  async triggerTransparency(params: {
    agent: string;
    student_id?: string;
    educator_id?: string;
    target_id?: string;
    report_type?: string;
    week_number?: number;
    scope?: string;
  }): Promise<any> {
    try {
      const { data } = await this.client.post('/api/transparency/trigger', params, {
        timeout: 180000, // 3 minutes — transparency calls run the full pipeline
      });
      return data;
    } catch (error) {
      throw this.handleError(error, 'Transparency trigger failed');
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

  // ── Retry Helper ───────────────────────────────────────────────────────────

  /**
   * Retries fn once when the AI backend returns a gateway error (502/503),
   * which covers Render free-tier cold starts that resolve within a few seconds.
   */
  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      if (
        err instanceof AIBackendError &&
        err.isAiUnavailable &&
        (err.statusCode === 502 || err.statusCode === 503)
      ) {
        console.warn('[AI Backend] Gateway error — retrying once in 3s…');
        await new Promise(r => setTimeout(r, 3000));
        return await fn();
      }
      throw err;
    }
  }

  // ── Error Handling ─────────────────────────────────────────────────────────

  private handleError(error: any, context: string): AIBackendError {
    const baseURL = this.client.defaults.baseURL;
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const status = axiosError.response.status;
        const rawData = axiosError.response.data;
        const isHtml = typeof rawData === 'string' && rawData.trimStart().startsWith('<');
        const detail = isHtml
          ? 'Service returned HTML (likely a gateway error)'
          : (rawData as any)?.detail
          || (typeof rawData === 'string' ? rawData.slice(0, 300) : JSON.stringify(rawData).slice(0, 300));
        const isUnavailable = status === 502 || status === 503 || status === 504;
        const msg = `[AI Backend] ${context}: HTTP ${status} from ${baseURL} — ${detail}`;
        console.error(msg, { status, url: axiosError.config?.url });
        return new AIBackendError(msg, isUnavailable, status);
      }
      const UNAVAILABLE_CODES = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ERR_NETWORK'];
      const code = axiosError.code || 'UNKNOWN';
      const isUnavailable = UNAVAILABLE_CODES.includes(code);
      const msg = `[AI Backend] ${context}: ${code} — could not reach AI backend at ${baseURL}`;
      console.error(msg, { code, url: axiosError.config?.url, message: axiosError.message });
      return new AIBackendError(msg, isUnavailable);
    }
    const msg = `[AI Backend] ${context}: ${(error as Error).message}`;
    console.error(msg, error);
    return new AIBackendError(msg, false);
  }
}

// Singleton export
export const aiBackendProxy = new AIBackendProxyService();
export default aiBackendProxy;
