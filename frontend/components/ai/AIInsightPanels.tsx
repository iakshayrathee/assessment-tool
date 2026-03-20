'use client';

/**
 * AI Insight Components
 *
 * Shared, reusable components for displaying AI-generated insights.
 * Follows the app-wide design system: Tailwind CSS + shadcn/ui + Lucide icons.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  BookOpen,
  Target,
  Users,
  TrendingUp,
  WifiOff,
  Save,
  Plus,
  Clock,
  Lightbulb,
  Star,
  ArrowUpRight,
  MessageSquare,
} from 'lucide-react';

// ── Risk Badge ────────────────────────────────────────────────────────────────

const RISK_CONFIG: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  HIGH_SUPPORT:      { label: 'High Support',    className: 'bg-red-100 text-red-800 border-red-200',     Icon: AlertTriangle },
  AT_RISK:           { label: 'At Risk',          className: 'bg-red-100 text-red-800 border-red-200',     Icon: AlertTriangle },
  MODERATE_SUPPORT:  { label: 'Moderate',         className: 'bg-amber-100 text-amber-800 border-amber-200', Icon: AlertCircle },
  NEEDS_ATTENTION:   { label: 'Needs Attention',  className: 'bg-amber-100 text-amber-800 border-amber-200', Icon: AlertCircle },
  ON_TRACK:          { label: 'On Track',         className: 'bg-green-100 text-green-800 border-green-200', Icon: ShieldCheck },
};

export function AIRiskBadge({ riskLevel, size = 'sm' }: { riskLevel: string; size?: 'sm' | 'md' }) {
  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.ON_TRACK;
  const { Icon } = config;
  return (
    <Badge
      variant="outline"
      className={`${config.className} ${size === 'md' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'} flex items-center gap-1 w-fit`}
    >
      <Icon className={size === 'md' ? 'h-3.5 w-3.5' : 'h-3 w-3'} />
      {config.label}
    </Badge>
  );
}

// ── AI Loading Skeleton ───────────────────────────────────────────────────────

export function AILoadingSkeleton({ lines = 3 }: { lines?: number }) {
  const widths = ['w-3/4', 'w-5/6', 'w-2/3', 'w-4/5', 'w-1/2'];
  return (
    <div className="space-y-2 pt-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}

// ── AI Unavailable Notice ─────────────────────────────────────────────────────

export function AIUnavailable({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mt-2">
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>{message || 'AI insights are currently unavailable. Existing data is still shown above.'}</span>
    </div>
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function AISectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
      <Sparkles className="h-4 w-4 text-indigo-500" />
      {title}
    </div>
  );
}

function AISection({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 p-4">
      {children}
    </div>
  );
}

function DomainTag({ domain }: { domain: string }) {
  const d = domain?.toUpperCase();
  const cls =
    d === 'READING'   ? 'bg-blue-100 text-blue-700' :
    d === 'WRITING'   ? 'bg-green-100 text-green-700' :
    d === 'MATH'      ? 'bg-amber-100 text-amber-700' :
    d === 'COGNITIVE' ? 'bg-purple-100 text-purple-700' :
    (d === 'BEHAVIOURAL' || d === 'ATTENTION_BEHAVIOR') ? 'bg-pink-100 text-pink-700' :
    'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${cls}`}>
      {domain}
    </span>
  );
}

function getSeverityTextClass(score: number): string {
  if (score >= 60) return 'text-red-600';
  if (score >= 30) return 'text-amber-600';
  return 'text-green-600';
}

// ── AI Assessment Analysis Panel ──────────────────────────────────────────────

export function AIAssessmentPanel({
  data,
  isLoading,
  error,
  onLoad,
  onSaveRisk,
}: {
  data: any;
  isLoading: boolean;
  error: any;
  onLoad: () => void;
  onSaveRisk?: (riskLevel: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSavingRisk, setIsSavingRisk] = useState(false);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !data && !isLoading) onLoad();
  };

  return (
    <AISection>
      <button onClick={handleToggle} className="flex items-center justify-between w-full text-left">
        <AISectionHeader title="AI Assessment Analysis" />
        {isOpen
          ? <ChevronUp className="h-4 w-4 text-gray-400" />
          : <ChevronDown className="h-4 w-4 text-gray-400" />
        }
      </button>

      {isOpen && (
        <div className="mt-3 space-y-4">
          {isLoading && <AILoadingSkeleton lines={5} />}
          {error && <AIUnavailable message="Could not load AI assessment analysis. Try again later." />}
          {data && !isLoading && (
            <>
              {/* Risk Classification */}
              {data.risk_classification && (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Risk Classification</p>
                    <AIRiskBadge riskLevel={data.risk_classification} size="md" />
                  </div>
                  {onSaveRisk && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isSavingRisk}
                      className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                      onClick={async () => {
                        setIsSavingRisk(true);
                        try { await onSaveRisk(data.risk_classification); }
                        finally { setIsSavingRisk(false); }
                      }}
                    >
                      {isSavingRisk
                        ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Saving...</>
                        : <><Save className="h-3 w-3 mr-1" />Confirm & Save Risk</>
                      }
                    </Button>
                  )}
                </div>
              )}

              {/* Severity Scores */}
              {data.severity_scores && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Severity Scores</p>
                  <div className="flex gap-3 flex-wrap mb-2">
                    {(['reading', 'writing', 'math'] as const).map((domain) => {
                      const score = data.severity_scores[domain];
                      if (score === undefined) return null;
                      return (
                        <Card key={domain} className="flex-1 min-w-[80px]">
                          <CardContent className="pt-3 pb-3 text-center">
                            <DomainTag domain={domain} />
                            <p className={`text-2xl font-bold mt-1 ${getSeverityTextClass(score as number)}`}>{score}%</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['reading_symptom_count', 'writing_symptom_count', 'math_symptom_count'].map((key) => {
                      const domain = key.replace('_symptom_count', '');
                      const count = data.severity_scores[key];
                      if (count === undefined) return null;
                      return (
                        <span key={key} className="text-xs text-gray-500 bg-gray-100 rounded px-2 py-0.5">
                          {domain}: {count} symptoms
                        </span>
                      );
                    })}
                    {data.severity_scores.total_symptom_count !== undefined && (
                      <span className="text-xs font-semibold text-gray-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">
                        Total: {data.severity_scores.total_symptom_count} symptoms
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Domain Profile */}
              {data.domain_profile && typeof data.domain_profile === 'object' && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Domain Profile</p>
                  <div className="space-y-2">
                    {Object.entries(data.domain_profile).map(([domain, profile]: [string, any]) => {
                      if (domain === 'overall_summary') {
                        return (
                          <Card key={domain} className="border-l-4 border-l-indigo-400">
                            <CardContent className="pt-3 pb-3">
                              <p className="text-xs font-semibold mb-1">Overall Summary</p>
                              <p className="text-sm text-gray-600">{profile}</p>
                            </CardContent>
                          </Card>
                        );
                      }
                      if (typeof profile !== 'object') return null;
                      return (
                        <Card key={domain}>
                          <CardContent className="pt-3 pb-3 space-y-1">
                            <DomainTag domain={domain} />
                            {profile.strengths?.length > 0 && (
                              <p className="text-xs">
                                <span className="font-semibold text-green-700">Strengths: </span>
                                <span className="text-gray-600">{profile.strengths.join(' • ')}</span>
                              </p>
                            )}
                            {profile.weaknesses?.length > 0 && (
                              <p className="text-xs">
                                <span className="font-semibold text-red-600">Weaknesses: </span>
                                <span className="text-gray-600">{profile.weaknesses.join(' • ')}</span>
                              </p>
                            )}
                            {profile.functional_level && (
                              <p className="text-xs">
                                <span className="font-semibold text-indigo-600">Level: </span>
                                <span className="text-gray-600">{profile.functional_level}</span>
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Differential Indicators */}
              {data.differential_indicators?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Differential Indicators</p>
                  <div className="space-y-2">
                    {data.differential_indicators.map((indicator: any, i: number) => {
                      const isHigh = indicator.confidence === 'HIGH';
                      const isMod = indicator.confidence === 'MODERATE';
                      return (
                        <Card key={i} className={`border-l-4 ${isHigh ? 'border-l-red-400' : isMod ? 'border-l-amber-400' : 'border-l-gray-300'}`}>
                          <CardContent className="pt-3 pb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold">{indicator.condition}</span>
                              <Badge
                                variant="outline"
                                className={isHigh ? 'text-red-700 border-red-200 bg-red-50' : isMod ? 'text-amber-700 border-amber-200 bg-amber-50' : 'text-gray-600 border-gray-200 bg-gray-50'}
                              >
                                {indicator.confidence}
                              </Badge>
                            </div>
                            {indicator.supporting_evidence?.length > 0 && (
                              <p className="text-xs text-gray-500">Evidence: {indicator.supporting_evidence.join(', ')}</p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recommended Next Steps */}
              {data.recommended_next_steps?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Recommended Next Steps</p>
                  <div className="space-y-2">
                    {data.recommended_next_steps.map((step: any, i: number) => (
                      <div key={i} className="flex gap-2 bg-white border border-gray-100 rounded-lg p-3">
                        <Target className="h-4 w-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">
                          {typeof step === 'string' ? step : JSON.stringify(step)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </AISection>
  );
}

// ── AI IEP Suggestions Panel ──────────────────────────────────────────────────

export function AIIEPSuggestionsPanel({
  data,
  isLoading,
  error,
  onLoad,
  onAddGoal,
  onSave,
}: {
  data: any;
  isLoading: boolean;
  error: any;
  onLoad: () => void;
  onAddGoal?: (goal: any) => void;
  onSave?: (data: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !data && !isLoading) onLoad();
  };

  const goals = data?.generated_goals || data?.gap_analysis?.generated_goals || [];
  const gapAnalysis = data?.gap_analysis;

  return (
    <AISection>
      <button onClick={handleToggle} className="flex items-center justify-between w-full text-left">
        <AISectionHeader title="AI-Suggested IEP Goals" />
        {isOpen
          ? <ChevronUp className="h-4 w-4 text-gray-400" />
          : <ChevronDown className="h-4 w-4 text-gray-400" />
        }
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {isLoading && <AILoadingSkeleton lines={4} />}
          {error && <AIUnavailable message="Could not generate IEP suggestions. Try again later." />}
          {data && !isLoading && (
            <>
              {/* Gap Analysis */}
              {gapAnalysis && (
                <Card className="border-l-4 border-l-indigo-400">
                  <CardContent className="pt-3 pb-3">
                    <p className="text-xs font-semibold mb-1">Gap Analysis</p>
                    {gapAnalysis.uncovered_domains?.length > 0 ? (
                      <p className="text-sm text-gray-600">Uncovered areas: {gapAnalysis.uncovered_domains.join(', ')}</p>
                    ) : (
                      <p className="text-sm text-green-700">All domains are covered by existing goals</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Generated Goals */}
              {goals.map((goal: any, i: number) => (
                <Card key={i}>
                  <CardContent className="pt-3 pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <DomainTag domain={goal.domain} />
                      {goal.priority && (
                        <span className="text-xs text-gray-500">Priority {goal.priority}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{goal.goal_statement}</p>
                    {goal.strategy && (
                      <p className="text-xs text-gray-500">Strategy: {goal.strategy}</p>
                    )}
                    {goal.rationale && (
                      <p className="text-xs text-gray-500">Rationale: {goal.rationale}</p>
                    )}
                    {onAddGoal && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                        onClick={() => onAddGoal(goal)}
                      >
                        <Plus className="h-3 w-3 mr-1" />Add to IEP
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Generated LTP Summary */}
              {data.generated_ltp && Object.keys(data.generated_ltp).length > 0 && (
                <Card className="border-l-4 border-l-purple-400">
                  <CardContent className="pt-3 pb-3">
                    <p className="text-xs font-semibold mb-1">Suggested Long-Term Plan</p>
                    <p className="text-xs text-gray-500">
                      Duration: {data.generated_ltp.duration_months || 6} months •{' '}
                      Domains: {(data.generated_ltp.domains || []).join(', ')} •{' '}
                      <span className="text-amber-600 font-semibold">AI Draft</span>
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Save Plan */}
              {onSave && data?.generated_ltp && (
                <div className="pt-2 border-t border-gray-100">
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={isSaving}
                    onClick={async () => {
                      setIsSaving(true);
                      try { await onSave(data); }
                      finally { setIsSaving(false); }
                    }}
                  >
                    {isSaving
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                      : <><Save className="h-4 w-4 mr-2" />Save to Lesson Plans (as Draft)</>
                    }
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-1">Creates LTP + STPs + WLPs as editable DRAFT records</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </AISection>
  );
}

// ── AI Lesson Plan Suggestion Panel ──────────────────────────────────────────

export function AILessonPlanPanel({
  data,
  isLoading,
  error,
  onLoad,
  onSave,
}: {
  data: any;
  isLoading: boolean;
  error: any;
  onLoad: () => void;
  onSave?: (data: any) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !data && !isLoading) onLoad();
  };

  const plan = data?.lesson_plan || data;

  return (
    <AISection>
      <button onClick={handleToggle} className="flex items-center justify-between w-full text-left">
        <AISectionHeader title="AI Lesson Plan Suggestion" />
        {isOpen
          ? <ChevronUp className="h-4 w-4 text-gray-400" />
          : <ChevronDown className="h-4 w-4 text-gray-400" />
        }
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {isLoading && <AILoadingSkeleton lines={4} />}
          {error && <AIUnavailable message="Could not generate lesson plan suggestion." />}
          {plan && !isLoading && (
            <>
              {/* Progress Analysis */}
              {data?.progress_analysis && (
                <Card className="border-l-4 border-l-indigo-400">
                  <CardContent className="pt-3 pb-3">
                    <p className="text-xs font-semibold mb-1">Progress Analysis</p>
                    <p className="text-sm text-gray-600">
                      {typeof data.progress_analysis === 'string' ? data.progress_analysis : JSON.stringify(data.progress_analysis)}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Suggested Activities */}
              {data?.suggested_activities?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Suggested Activities</p>
                  <div className="space-y-2">
                    {data.suggested_activities.map((activity: any, i: number) => (
                      <Card key={i}>
                        <CardContent className="pt-3 pb-3">
                          <p className="text-sm font-medium text-gray-900">{activity.name || activity}</p>
                          {activity.description && (
                            <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                          )}
                          {activity.duration_minutes && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{activity.duration_minutes} min</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Resources & Motivation Strategy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data?.suggested_resources?.length > 0 && (
                  <Card>
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Resources</p>
                      {data.suggested_resources.map((r: string, i: number) => (
                        <div key={i} className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <BookOpen className="h-3 w-3 text-indigo-400 flex-shrink-0" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
                {data?.motivation_strategy && (
                  <Card>
                    <CardContent className="pt-3 pb-3">
                      <p className="text-xs font-semibold text-gray-500 mb-2">Motivation Strategy</p>
                      <div className="flex items-start gap-1 text-xs text-gray-600">
                        <Target className="h-3 w-3 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>{data.motivation_strategy}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Save Plan */}
              {onSave && plan && (
                <div className="pt-2 border-t border-gray-100">
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={isSaving}
                    onClick={async () => {
                      setIsSaving(true);
                      try { await onSave(data); }
                      finally { setIsSaving(false); }
                    }}
                  >
                    {isSaving
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                      : <><Save className="h-4 w-4 mr-2" />Save to Lesson Plans (as Draft)</>
                    }
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </AISection>
  );
}

// ── AI Educator Insights Card ─────────────────────────────────────────────────

export function AIEducatorInsightsCard({
  data,
  isLoading,
  error,
  onLoad,
}: {
  data: any;
  isLoading: boolean;
  error: any;
  onLoad: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  React.useEffect(() => {
    if (!data && !isLoading && !error) onLoad();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return null; // silently hide on error — don't break the dashboard

  return (
    <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-indigo-700">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          AI Educator Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <AILoadingSkeleton lines={3} />}

        {data && !isLoading && (
          <div className="space-y-4">
            {/* Performance Summary */}
            {data.performance_summary && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Students', value: data.performance_summary.total_students,  Icon: Users,          color: 'text-gray-700' },
                  { label: 'Improving',       value: data.performance_summary.students_improving, Icon: TrendingUp,  color: 'text-green-700' },
                  { label: 'At Risk',         value: data.performance_summary.students_at_risk,   Icon: AlertTriangle, color: 'text-red-600' },
                ].map((stat, i) => {
                  const { Icon } = stat;
                  return (
                    <Card key={i} className="text-center">
                      <CardContent className="pt-3 pb-3">
                        <Icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                        <p className={`text-xl font-bold ${stat.color}`}>{stat.value ?? '—'}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Priority Students */}
            {data.student_priority_list?.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-2">
                  <Target className="h-3.5 w-3.5" />
                  Priority Students
                </div>
                <div className="space-y-2">
                  {data.student_priority_list.slice(0, isExpanded ? undefined : 3).map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{s.student_name || s.student_id}</p>
                        <p className="text-xs text-gray-500">{s.total_symptoms} symptoms • {s.avg_iep_progress}% progress</p>
                      </div>
                      <AIRiskBadge riskLevel={s.status || 'AT_RISK'} size="sm" />
                    </div>
                  ))}
                </div>
                {data.student_priority_list.length > 3 && (
                  <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? 'Show Less' : `Show ${data.student_priority_list.length - 3} More`}
                  </Button>
                )}
              </div>
            )}

            {/* Training Recommendations */}
            {data.training_recommendations?.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 mb-2">
                  <BookOpen className="h-3.5 w-3.5" />
                  Recommended Training
                </div>
                <div className="space-y-1">
                  {data.training_recommendations.slice(0, 3).map((t: any, i: number) => (
                    <p key={i} className="text-xs text-gray-600 pl-2 border-l-2 border-indigo-200">
                      {typeof t === 'string' ? t : t.topic || JSON.stringify(t)}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
