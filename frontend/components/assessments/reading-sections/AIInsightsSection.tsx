'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ReadingAssessmentFormData } from '../ReadingAssessmentWizard';

interface Props {
  data: ReadingAssessmentFormData;
  onChange: (updates: Partial<ReadingAssessmentFormData>) => void;
  disabled?: boolean;
  assessmentId?: string;
  studentName?: string;
  studentGrade?: string;
}

interface AIInsightsData {
  diagnosisSummary?: string;
  recommendations?: string;
  instructionalStrategies?: string;
  interventions?: { programType?: string; frequency?: string };
  supportPlan?: { classroom?: string; home?: string };
  learningPath?: { fourWeekGoals?: string; threeMonthGoals?: string };
}

export function AIInsightsSection({ data, onChange, disabled, assessmentId, studentName, studentGrade }: Props) {
  const { t } = useTranslation('assessments');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insights: AIInsightsData = data.aiInsights || {};

  const updateInsight = (field: string, value: any) => {
    const updated = { ...insights, [field]: value };
    onChange({ aiInsights: updated });
  };

  const updateNested = (parent: string, field: string, value: any) => {
    const updated = { ...insights };
    (updated as any)[parent] = { ...((updated as any)[parent] || {}), [field]: value };
    onChange({ aiInsights: updated });
  };

  const generateInsights = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const aiBackendUrl = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${aiBackendUrl}/api/reading-insights/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: assessmentId || 'draft',
          student_name: studentName || 'Student',
          student_grade: studentGrade || '',
          assessment_data: data,
          skip_cache: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI generation failed (${response.status})`);
      }

      const result = await response.json();
      const learningPath = result.learningPath || {};

      onChange({
        aiInsights: {
          diagnosisSummary: result.diagnosisSummary || '',
          recommendations: result.recommendations || '',
          instructionalStrategies: result.instructionalStrategies || '',
          interventions: result.interventions || {},
          supportPlan: {
            classroom: result.supportPlan?.classroomSupport || result.supportPlan?.classroom || '',
            home: result.supportPlan?.homePlan || result.supportPlan?.home || '',
          },
          learningPath: {
            fourWeekGoals: Array.isArray(learningPath.fourWeekGoals)
              ? learningPath.fourWeekGoals.join('\n• ')
              : (learningPath.fourWeekGoals || ''),
            threeMonthGoals: Array.isArray(learningPath.threeMonthGoals)
              ? learningPath.threeMonthGoals.join('\n• ')
              : (learningPath.threeMonthGoals || ''),
          },
        },
        aiInsightsStatus: 'AI_DRAFT',
      });
    } catch (err: any) {
      setError(err.message || t('failedToGenerateInsights', { defaultValue: 'Failed to generate insights' }));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{t('aiPoweredInsightsTitle', { defaultValue: 'AI-Powered Insights' })}</h4>
              <p className="text-sm text-muted-foreground">
                {t('aiPoweredInsightsDesc', { defaultValue: 'Generate diagnosis, recommendations, and intervention plan using AI. All fields are editable after generation.' })}
              </p>
            </div>
            {!disabled && (
              <Button onClick={generateInsights} disabled={isGenerating} variant="outline">
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('generating', { defaultValue: 'Generating...' })}</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> {t('generateWithAI', { defaultValue: 'Generate with AI' })}</>
                )}
              </Button>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          {data.aiInsightsStatus && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                data.aiInsightsStatus === 'AI_DRAFT' ? 'bg-blue-100 text-blue-800' :
                data.aiInsightsStatus === 'EDUCATOR_REVIEWED' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {data.aiInsightsStatus === 'AI_DRAFT' ? t('aiDraftBadge', { defaultValue: '🤖 AI Draft' }) :
                 data.aiInsightsStatus === 'EDUCATOR_REVIEWED' ? t('educatorReviewedBadge', { defaultValue: '✅ Educator Reviewed' }) :
                 data.aiInsightsStatus}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* A. Diagnosis Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('diagnosisSummaryTitle', { defaultValue: 'A. Diagnosis Summary' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={insights.diagnosisSummary || ''}
            onChange={(e) => updateInsight('diagnosisSummary', e.target.value)}
            placeholder={t('diagnosisSummaryPlaceholder', { defaultValue: 'Key issue (e.g., decoding deficit with fluency impact)...' })}
            disabled={disabled}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* B. Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('recommendationsTitle', { defaultValue: 'B. Recommendations' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={insights.recommendations || ''}
            onChange={(e) => updateInsight('recommendations', e.target.value)}
            placeholder={t('recommendationsPlaceholder', { defaultValue: 'What to focus on (e.g., phonological awareness drills, repeated reading)...' })}
            disabled={disabled}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* C. Instructional Strategies */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('instructionalStrategiesTitle', { defaultValue: 'C. Instructional Strategies' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={insights.instructionalStrategies || ''}
            onChange={(e) => updateInsight('instructionalStrategies', e.target.value)}
            placeholder={t('instructionalStrategiesPlaceholder', { defaultValue: 'Phonics-based / repetition / guided reading / multisensory approach...' })}
            disabled={disabled}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* D. Interventions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('interventionsTitle', { defaultValue: 'D. Interventions' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('programTypeLabel', { defaultValue: 'Program Type' })}</Label>
              <Input
                value={insights.interventions?.programType || ''}
                onChange={(e) => updateNested('interventions', 'programType', e.target.value)}
                placeholder="e.g., Orton-Gillingham, Wilson Reading"
                disabled={disabled}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t('frequencyLabel', { defaultValue: 'Frequency' })}</Label>
              <Input
                value={insights.interventions?.frequency || ''}
                onChange={(e) => updateNested('interventions', 'frequency', e.target.value)}
                placeholder="e.g., 3x/week, 30 min sessions"
                disabled={disabled}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* E. Support Plan */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('supportPlanTitle', { defaultValue: 'E. Support Plan' })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>{t('classroomSupportLabel', { defaultValue: 'Classroom Support' })}</Label>
            <Textarea
              value={insights.supportPlan?.classroom || ''}
              onChange={(e) => updateNested('supportPlan', 'classroom', e.target.value)}
              placeholder={t('classroomSupportPlaceholder', { defaultValue: 'Classroom accommodations and support strategies...' })}
              disabled={disabled}
              className="mt-1"
              rows={2}
            />
          </div>
          <div>
            <Label>{t('homePlanLabel', { defaultValue: 'Home Plan' })}</Label>
            <Textarea
              value={insights.supportPlan?.home || ''}
              onChange={(e) => updateNested('supportPlan', 'home', e.target.value)}
              placeholder={t('homePlanPlaceholder', { defaultValue: 'Parent-friendly activities and home reading strategies...' })}
              disabled={disabled}
              className="mt-1"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* F. Learning Path */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('learningPathTitle', { defaultValue: 'F. Learning Path' })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>{t('fourWeekGoalsLabel', { defaultValue: '4-Week Goals' })}</Label>
            <Textarea
              value={insights.learningPath?.fourWeekGoals || ''}
              onChange={(e) => updateNested('learningPath', 'fourWeekGoals', e.target.value)}
              placeholder={t('fourWeekGoalsPlaceholder', { defaultValue: 'Short-term goals for the next 4 weeks...' })}
              disabled={disabled}
              className="mt-1"
              rows={2}
            />
          </div>
          <div>
            <Label>{t('threeMonthGoalsLabel', { defaultValue: '3-Month Goals' })}</Label>
            <Textarea
              value={insights.learningPath?.threeMonthGoals || ''}
              onChange={(e) => updateNested('learningPath', 'threeMonthGoals', e.target.value)}
              placeholder={t('threeMonthGoalsPlaceholder', { defaultValue: 'Medium-term goals for the next 3 months...' })}
              disabled={disabled}
              className="mt-1"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
