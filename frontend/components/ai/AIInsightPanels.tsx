'use client';

/**
 * AI Insight Components
 *
 * Shared, reusable components for displaying AI-generated insights
 * across the application. These follow the "inline enhancement" pattern —
 * they augment existing pages rather than replacing them.
 */

import React, { useState } from 'react';

// ── Shared Styles ────────────────────────────────────────────────────────────

const styles = {
  // AI section wrapper
  aiSection: {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
    border: '1px solid rgba(99, 102, 241, 0.15)',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '16px',
  } as React.CSSProperties,

  // AI header with sparkle icon
  aiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#4f46e5',
  } as React.CSSProperties,

  // Loading skeleton
  skeleton: {
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px',
    height: '16px',
    marginBottom: '8px',
  } as React.CSSProperties,

  // Risk badge styles
  riskBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.02em',
  } as React.CSSProperties,

  // Collapsible toggle
  toggle: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    background: 'none',
    border: 'none',
    padding: 0,
    textAlign: 'left' as const,
  } as React.CSSProperties,

  // Card for individual insights
  insightCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '14px',
    marginBottom: '8px',
  } as React.CSSProperties,

  // Domain tag
  domainTag: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  } as React.CSSProperties,

  // Action button
  actionBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    border: '1px solid #d1d5db',
    background: 'white',
    color: '#374151',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,

  aiActionBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,

  errorBox: {
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#dc2626',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,
};

// ── Risk Badge Component ─────────────────────────────────────────────────────

const RISK_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  HIGH_SUPPORT: { color: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)', icon: '🔴', label: 'High Support' },
  AT_RISK: { color: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)', icon: '🔴', label: 'At Risk' },
  MODERATE_SUPPORT: { color: '#d97706', bg: 'rgba(245, 158, 11, 0.1)', icon: '🟡', label: 'Moderate' },
  NEEDS_ATTENTION: { color: '#d97706', bg: 'rgba(245, 158, 11, 0.1)', icon: '🟡', label: 'Needs Attention' },
  ON_TRACK: { color: '#059669', bg: 'rgba(16, 185, 129, 0.1)', icon: '🟢', label: 'On Track' },
};

export function AIRiskBadge({ riskLevel, size = 'sm' }: { riskLevel: string; size?: 'sm' | 'md' }) {
  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.ON_TRACK;
  return (
    <span
      style={{
        ...styles.riskBadge,
        color: config.color,
        background: config.bg,
        fontSize: size === 'md' ? '13px' : '11px',
        padding: size === 'md' ? '4px 12px' : '2px 8px',
      }}
      title={`AI Risk Classification: ${config.label}`}
    >
      {config.icon} {config.label}
    </span>
  );
}

// ── AI Loading Skeleton ──────────────────────────────────────────────────────

export function AILoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div style={styles.aiSection}>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      <div style={{ ...styles.aiHeader, opacity: 0.5 }}>✨ Loading AI insights...</div>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            ...styles.skeleton,
            width: `${70 + Math.random() * 30}%`,
          }}
        />
      ))}
    </div>
  );
}

// ── AI Error/Unavailable Message ─────────────────────────────────────────────

export function AIUnavailable({ message }: { message?: string }) {
  return (
    <div style={styles.errorBox}>
      <span>⚠️</span>
      <span>{message || 'AI insights are currently unavailable. Existing data is still shown above.'}</span>
    </div>
  );
}

// ── AI Assessment Analysis Panel ─────────────────────────────────────────────

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
    if (next && !data && !isLoading) {
      onLoad();
    }
  };

  return (
    <div style={styles.aiSection}>
      <button style={styles.toggle} onClick={handleToggle}>
        <span style={styles.aiHeader as any}>
          ✨ AI Assessment Analysis
        </span>
        <span style={{ fontSize: '18px', color: '#6b7280', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div style={{ marginTop: '8px' }}>
          {isLoading && <AILoadingSkeleton lines={5} />}
          {error && <AIUnavailable message="Could not load AI assessment analysis. Try again later." />}
          {data && !isLoading && (
            <div>
              {/* Risk Classification */}
              {data.risk_classification && (
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>Risk Classification</div>
                    <AIRiskBadge riskLevel={data.risk_classification} size="md" />
                  </div>
                  
                  {onSaveRisk && (
                    <button
                      style={{
                        ...styles.aiActionBtn,
                        fontSize: '11px',
                        padding: '6px 10px',
                        opacity: isSavingRisk ? 0.7 : 1,
                        cursor: isSavingRisk ? 'not-allowed' : 'pointer',
                      }}
                      disabled={isSavingRisk}
                      onClick={async () => {
                        setIsSavingRisk(true);
                        try {
                          await onSaveRisk(data.risk_classification);
                        } finally {
                          setIsSavingRisk(false);
                        }
                      }}
                    >
                      {isSavingRisk ? '⏳ Saving...' : '💾 Confirm & Save Risk'}
                    </button>
                  )}
                </div>
              )}

              {/* Severity Scores */}
              {data.severity_scores && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Severity Scores</div>
                  {/* Domain score percentages */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    {(['reading', 'writing', 'math'] as const).map((domain) => {
                      const score = data.severity_scores[domain];
                      if (score === undefined) return null;
                      return (
                        <div key={domain} style={styles.insightCard}>
                          <div style={{ ...styles.domainTag, ...getDomainColors(domain) }}>{domain}</div>
                          <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '4px', color: getSeverityColor(score as number) }}>
                            {score}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Symptom counts — shown as counts, not percentages */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['reading_symptom_count', 'writing_symptom_count', 'math_symptom_count'].map((key) => {
                      const domain = key.replace('_symptom_count', '') as string;
                      const count = data.severity_scores[key];
                      if (count === undefined) return null;
                      return (
                        <span key={key} style={{ fontSize: '11px', color: '#6b7280',
                          background: 'rgba(107,114,128,0.08)', borderRadius: '4px',
                          padding: '2px 8px' }}>
                          {domain}: {count} symptoms
                        </span>
                      );
                    })}
                    {data.severity_scores.total_symptom_count !== undefined && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#374151',
                        background: 'rgba(99,102,241,0.08)', borderRadius: '4px',
                        padding: '2px 8px' }}>
                        Total: {data.severity_scores.total_symptom_count} symptoms
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Domain Profile */}
              {data.domain_profile && typeof data.domain_profile === 'object' && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Domain Profile</div>
                  {Object.entries(data.domain_profile).map(([domain, profile]: [string, any]) => {
                    if (domain === 'overall_summary') {
                      return (
                        <div key={domain} style={{ ...styles.insightCard, borderLeft: '3px solid #6366f1' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Overall Summary</div>
                          <div style={{ fontSize: '13px', color: '#4b5563' }}>{profile}</div>
                        </div>
                      );
                    }
                    if (typeof profile !== 'object') return null;
                    return (
                      <div key={domain} style={{ ...styles.insightCard, marginBottom: '8px' }}>
                        <div style={{ ...styles.domainTag, ...getDomainColors(domain), marginBottom: '8px' }}>{domain}</div>
                        {profile.strengths?.length > 0 && (
                          <div style={{ marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#059669' }}>Strengths: </span>
                            <span style={{ fontSize: '12px', color: '#4b5563' }}>{profile.strengths.join(' • ')}</span>
                          </div>
                        )}
                        {profile.weaknesses?.length > 0 && (
                          <div style={{ marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626' }}>Weaknesses: </span>
                            <span style={{ fontSize: '12px', color: '#4b5563' }}>{profile.weaknesses.join(' • ')}</span>
                          </div>
                        )}
                        {profile.functional_level && (
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1' }}>Level: </span>
                            <span style={{ fontSize: '12px', color: '#4b5563' }}>{profile.functional_level}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Differential Indicators */}
              {data.differential_indicators?.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Differential Indicators</div>
                  {data.differential_indicators.map((indicator: any, i: number) => (
                    <div key={i} style={{ ...styles.insightCard, borderLeft: `3px solid ${indicator.confidence === 'HIGH' ? '#dc2626' : indicator.confidence === 'MODERATE' ? '#d97706' : '#6b7280'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{indicator.condition}</span>
                        <span style={{
                          ...styles.riskBadge,
                          fontSize: '10px',
                          color: indicator.confidence === 'HIGH' ? '#dc2626' : indicator.confidence === 'MODERATE' ? '#d97706' : '#6b7280',
                          background: indicator.confidence === 'HIGH' ? 'rgba(239,68,68,0.1)' : indicator.confidence === 'MODERATE' ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)',
                        }}>
                          {indicator.confidence}
                        </span>
                      </div>
                      {indicator.supporting_evidence?.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                          Evidence: {indicator.supporting_evidence.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendations */}
              {data.recommended_next_steps?.length > 0 && (
                <div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Recommended Next Steps</div>
                  {data.recommended_next_steps.map((step: any, i: number) => (
                    <div key={i} style={{ ...styles.insightCard, display: 'flex', gap: '8px' }}>
                      <span style={{ fontSize: '14px', minWidth: '20px' }}>📋</span>
                      <span style={{ fontSize: '13px', color: '#374151' }}>
                        {typeof step === 'string' ? step : JSON.stringify(step)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI IEP Suggestions Panel ─────────────────────────────────────────────────

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
    if (next && !data && !isLoading) {
      onLoad();
    }
  };

  const goals = data?.generated_goals || data?.gap_analysis?.generated_goals || [];
  const gapAnalysis = data?.gap_analysis;

  return (
    <div style={styles.aiSection}>
      <button style={styles.toggle} onClick={handleToggle}>
        <span style={styles.aiHeader as any}>
          ✨ AI-Suggested IEP Goals
        </span>
        <span style={{ fontSize: '18px', color: '#6b7280', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div style={{ marginTop: '8px' }}>
          {isLoading && <AILoadingSkeleton lines={4} />}
          {error && <AIUnavailable message="Could not generate IEP suggestions. Try again later." />}
          {data && !isLoading && (
            <div>
              {/* Gap Analysis Summary */}
              {gapAnalysis && (
                <div style={{ ...styles.insightCard, marginBottom: '12px', borderLeft: '3px solid #6366f1' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Gap Analysis</div>
                  {gapAnalysis.uncovered_domains?.length > 0 ? (
                    <div style={{ fontSize: '13px', color: '#4b5563' }}>
                      Uncovered areas: {gapAnalysis.uncovered_domains.join(', ')}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#059669' }}>All domains are covered by existing goals</div>
                  )}
                </div>
              )}

              {/* Generated Goals */}
              {goals.length > 0 && goals.map((goal: any, i: number) => (
                <div key={i} style={{ ...styles.insightCard, marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <span style={{ ...styles.domainTag, ...getDomainColors(goal.domain) }}>{goal.domain}</span>
                    {goal.priority && (
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>Priority {goal.priority}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#1f2937' }}>
                    {goal.goal_statement}
                  </div>
                  {goal.strategy && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Strategy: {goal.strategy}
                    </div>
                  )}
                  {goal.rationale && (
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                      Rationale: {goal.rationale}
                    </div>
                  )}
                  {onAddGoal && (
                    <button
                      style={styles.aiActionBtn}
                      onClick={() => onAddGoal(goal)}
                    >
                      + Add to IEP
                    </button>
                  )}
                </div>
              ))}

              {/* Generated LTP Summary */}
              {data.generated_ltp && Object.keys(data.generated_ltp).length > 0 && (
                <div style={{ ...styles.insightCard, borderLeft: '3px solid #8b5cf6', marginTop: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Suggested Long-Term Plan</div>
                  <div style={{ fontSize: '12px', color: '#4b5563' }}>
                    Duration: {data.generated_ltp.duration_months || 6} months •
                    Domains: {(data.generated_ltp.domains || []).join(', ')} •
                    Status: <span style={{ color: '#d97706', fontWeight: 600 }}>AI Draft</span>
                  </div>
                </div>
              )}

              {/* Save entire AI plan to DB */}
              {onSave && data?.generated_ltp && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    style={{
                      ...styles.aiActionBtn,
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13px',
                      opacity: isSaving ? 0.7 : 1,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                    }}
                    disabled={isSaving}
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        await onSave(data);
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  >
                    {isSaving ? '⏳ Saving...' : '💾 Save to Lesson Plans (as Draft)'}
                  </button>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', textAlign: 'center' }}>
                    Creates LTP + STPs + WLPs as editable DRAFT records
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
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
    if (next && !data && !isLoading) {
      onLoad();
    }
  };

  const plan = data?.lesson_plan || data;

  return (
    <div style={styles.aiSection}>
      <button style={styles.toggle} onClick={handleToggle}>
        <span style={styles.aiHeader as any}>
          ✨ AI Lesson Plan Suggestion
        </span>
        <span style={{ fontSize: '18px', color: '#6b7280', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▾
        </span>
      </button>

      {isOpen && (
        <div style={{ marginTop: '8px' }}>
          {isLoading && <AILoadingSkeleton lines={4} />}
          {error && <AIUnavailable message="Could not generate lesson plan suggestion." />}
          {plan && !isLoading && (
            <div>
              {/* Progress Analysis */}
              {data?.progress_analysis && (
                <div style={{ ...styles.insightCard, borderLeft: '3px solid #6366f1', marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Progress Analysis</div>
                  <div style={{ fontSize: '13px', color: '#4b5563' }}>
                    {typeof data.progress_analysis === 'string' ? data.progress_analysis : JSON.stringify(data.progress_analysis)}
                  </div>
                </div>
              )}

              {/* Suggested Activities */}
              {data?.suggested_activities?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Suggested Activities</div>
                  {data.suggested_activities.map((activity: any, i: number) => (
                    <div key={i} style={styles.insightCard}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#1f2937' }}>{activity.name || activity}</div>
                      {activity.description && (
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{activity.description}</div>
                      )}
                      {activity.duration_minutes && (
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>⏱ {activity.duration_minutes} min</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Resources & Motivation */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {data?.suggested_resources?.length > 0 && (
                  <div style={{ ...styles.insightCard, flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Resources</div>
                    {data.suggested_resources.map((r: string, i: number) => (
                      <div key={i} style={{ fontSize: '12px', color: '#4b5563' }}>📚 {r}</div>
                    ))}
                  </div>
                )}
                {data?.motivation_strategy && (
                  <div style={{ ...styles.insightCard, flex: 1, minWidth: '200px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', marginBottom: '4px' }}>Motivation Strategy</div>
                    <div style={{ fontSize: '12px', color: '#4b5563' }}>🎯 {data.motivation_strategy}</div>
                  </div>
                )}
              </div>

              {/* Save Plan Button */}
              {onSave && plan && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                  <button
                    style={{
                      ...styles.aiActionBtn,
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '13px',
                      opacity: isSaving ? 0.7 : 1,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                    }}
                    disabled={isSaving}
                    onClick={async () => {
                      setIsSaving(true);
                      try {
                        await onSave(data);
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  >
                    {isSaving ? '⏳ Saving...' : '💾 Save to Lesson Plans (as Draft)'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI Educator Insights Card ────────────────────────────────────────────────

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

  // Auto-load on first render
  React.useEffect(() => {
    if (!data && !isLoading && !error) {
      onLoad();
    }
  }, []);

  if (error) return null; // silently hide on error — don't break the dashboard

  return (
    <div style={{
      ...styles.aiSection,
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
    }}>
      <div style={styles.aiHeader}>
        ✨ AI Educator Insights
      </div>

      {isLoading && <AILoadingSkeleton lines={3} />}

      {data && !isLoading && (
        <div>
          {/* Performance Summary */}
          {data.performance_summary && (
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {[
                { label: 'Total Students', value: data.performance_summary.total_students, icon: '👥' },
                { label: 'Improving', value: data.performance_summary.students_improving, icon: '📈', color: '#059669' },
                { label: 'At Risk', value: data.performance_summary.students_at_risk, icon: '⚠️', color: '#dc2626' },
              ].map((stat, i) => (
                <div key={i} style={{ ...styles.insightCard, flex: 1, minWidth: '100px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px' }}>{stat.icon}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: stat.color || '#1f2937' }}>{stat.value ?? '—'}</div>
                  <div style={{ fontSize: '11px', color: '#6b7280' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Priority Students */}
          {data.student_priority_list?.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                🎯 Priority Students
              </div>
              {data.student_priority_list.slice(0, isExpanded ? undefined : 3).map((s: any, i: number) => (
                <div key={i} style={{ ...styles.insightCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.student_name || s.student_id}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>
                      {s.total_symptoms} symptoms • {s.avg_iep_progress}% progress
                    </div>
                  </div>
                  <AIRiskBadge riskLevel={s.status || 'AT_RISK'} size="sm" />
                </div>
              ))}
              {data.student_priority_list.length > 3 && (
                <button
                  style={{ ...styles.actionBtn, width: '100%', marginTop: '4px', textAlign: 'center' }}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Show Less' : `Show ${data.student_priority_list.length - 3} More`}
                </button>
              )}
            </div>
          )}

          {/* Training Recommendations */}
          {data.training_recommendations?.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                📚 Recommended Training
              </div>
              {data.training_recommendations.slice(0, 3).map((t: any, i: number) => (
                <div key={i} style={{ fontSize: '12px', color: '#4b5563', marginBottom: '4px' }}>
                  • {typeof t === 'string' ? t : t.topic || JSON.stringify(t)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helper Functions ─────────────────────────────────────────────────────────

function getDomainColors(domain: string): React.CSSProperties {
  const d = domain?.toUpperCase();
  if (d === 'READING') return { background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' };
  if (d === 'WRITING') return { background: 'rgba(16, 185, 129, 0.1)', color: '#059669' };
  if (d === 'MATH') return { background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' };
  if (d === 'COGNITIVE') return { background: 'rgba(139, 92, 246, 0.1)', color: '#7c3aed' };
  if (d === 'BEHAVIOURAL' || d === 'ATTENTION_BEHAVIOR') return { background: 'rgba(236, 72, 153, 0.1)', color: '#db2777' };
  return { background: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' };
}

function getSeverityColor(score: number): string {
  if (score >= 60) return '#dc2626';
  if (score >= 30) return '#d97706';
  return '#059669';
}
