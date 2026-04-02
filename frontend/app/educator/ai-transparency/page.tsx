'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { StudentSelectionModal } from '@/components/assessments/StudentSelectionModal';
import { Users, User, Search, Play, RefreshCw, AlertCircle, Database, Bot, ClipboardList, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/lib/toast';
import { PageWrapper } from '@/components/layout/PageWrapper';

/* ──────────────────────────────────────────────────────────────────────────────
   Agent metadata — determines what each tab shows and which inputs to request
──────────────────────────────────────────────────────────────────────────────*/
const AGENTS = [
  {
    key: 'assessment',
    label: 'Assessment Intelligence',
    description: 'Analyzes student assessments — symptom patterns, severity, domain strengths and weaknesses, risk classification, and recommended next steps.',
    icon: '🔬',
    fields: ['student_id'],
    stateCategories: {
      'Input Data': ['student_id', 'assessment_type'],
      'Student Context (Fetched from Database)': ['student_profile', 'intake_data', 'reading_assessments', 'writing_assessments', 'math_assessments', 'informal_assessments', 'formal_assessments'],
      'AI Analysis Results': ['symptom_analysis', 'severity_scores', 'domain_profile', 'risk_classification', 'differential_indicators', 'recommended_next_steps'],
      'Status': ['error'],
    },
  },
  {
    key: 'iep',
    label: 'IEP & Goal Planning',
    description: 'Generates SMART goals, Long-Term Plans (LTP), Short-Term Plans (STP), and Weekly Lesson Plans (WLP) based on student assessment data.',
    icon: '🎯',
    fields: ['student_id'],
    stateCategories: {
      'Input Data': ['student_id', 'assessment_analysis'],
      'Student Context (Fetched from Database)': ['student_profile', 'existing_iep_goals', 'existing_ltps', 'existing_stps'],
      'AI Generated Plans': ['gap_analysis', 'generated_goals', 'generated_ltp', 'generated_stps', 'generated_wlps'],
      'Status': ['error'],
    },
  },
  {
    key: 'lesson_plan',
    label: 'Lesson Plan',
    description: 'Analyzes recent student progress and recommends weekly lesson activities, resources, and remediation strategies.',
    icon: '📚',
    fields: ['student_id', 'week_number'],
    stateCategories: {
      'Input Data': ['student_id', 'week_number'],
      'Student Context (Fetched from Database)': ['student_profile', 'current_stp', 'recent_sessions', 'recent_evaluations', 'assessment_summary'],
      'AI Generated Lesson Plan': ['progress_analysis', 'suggested_activities', 'suggested_resources', 'motivation_strategy', 'estimated_time', 'areas_of_remediation', 'lesson_plan'],
      'Status': ['error'],
    },
  },
  {
    key: 'report',
    label: 'Report Generation',
    description: 'Generates detailed reports — Assessment Reports, Lesson Plan Reports, Parent-Friendly Reports, and School-Wide Reports.',
    icon: '📄',
    fields: ['student_id', 'report_type', 'educator_id'],
    stateCategories: {
      'Input Data': ['report_type', 'target_id', 'educator_id'],
      'Data Gathered from Database': ['raw_data'],
      'AI Generated Report': ['structured_sections', 'final_report', 'metadata'],
      'Status': ['error'],
    },
  },
  {
    key: 'risk',
    label: 'Risk & Progress',
    description: 'Classifies student risk levels using rule-based analysis and AI-powered trend detection, with early warning flags.',
    icon: '⚠️',
    fields: ['student_id', 'scope'],
    stateCategories: {
      'Input Data': ['scope', 'target_id'],
      'Data Gathered from Database': ['student_profiles', 'assessment_data'],
      'AI Risk Analysis': ['risk_classifications', 'progress_trends', 'early_warnings', 'recommendations'],
      'Status': ['error'],
    },
  },
  {
    key: 'educator',
    label: 'Educator Intelligence',
    description: 'Evaluates educator effectiveness, caseload management, and provides personalized mentoring and training recommendations.',
    icon: '👩‍🏫',
    fields: ['educator_id'],
    stateCategories: {
      'Input Data': ['educator_id'],
      'Educator Context (Fetched from Database)': ['educator_profile', 'assigned_students', 'student_outcomes'],
      'AI Performance Analysis': ['performance_summary', 'mentoring_insights', 'training_recommendations', 'student_priority_list'],
      'Status': ['error'],
    },
  },
];

const REPORT_TYPES = ['ASSESSMENT', 'LESSON_PLAN', 'PARENT', 'SCHOOL'];

/* ──────────────────────────────────────────────────────────────────────────────
   Human-readable field names
──────────────────────────────────────────────────────────────────────────────*/
const FIELD_LABELS: Record<string, string> = {
  student_id: 'Student ID',
  assessment_type: 'Assessment Type',
  student_profile: 'Student Profile',
  intake_data: 'Intake Form Data',
  reading_assessments: 'Reading Assessments',
  writing_assessments: 'Writing Assessments',
  math_assessments: 'Math Assessments',
  informal_assessments: 'Informal Assessments',
  formal_assessments: 'Formal Assessments',
  symptom_analysis: 'Symptom Analysis',
  severity_scores: 'Severity Scores',
  domain_profile: 'Domain Profile',
  risk_classification: 'Risk Classification',
  differential_indicators: 'Differential Indicators (Dyslexia, Dyscalculia, etc.)',
  recommended_next_steps: 'Recommended Next Steps',
  error: 'Error Messages',
  assessment_analysis: 'Assessment Analysis Input',
  existing_iep_goals: 'Existing IEP Goals',
  existing_ltps: 'Existing Long-Term Plans',
  existing_stps: 'Existing Short-Term Plans',
  gap_analysis: 'Gap Analysis',
  generated_goals: 'Generated SMART Goals',
  generated_ltp: 'Generated Long-Term Plan',
  generated_stps: 'Generated Short-Term Plans',
  generated_wlps: 'Generated Weekly Lesson Plans',
  week_number: 'Week Number',
  current_stp: 'Current Short-Term Plan',
  recent_sessions: 'Recent Session Notes',
  recent_evaluations: 'Recent Evaluations',
  assessment_summary: 'Assessment Summary',
  progress_analysis: 'Progress Analysis',
  suggested_activities: 'Suggested Activities',
  suggested_resources: 'Suggested Resources',
  motivation_strategy: 'Motivation Strategy',
  estimated_time: 'Estimated Time (minutes)',
  areas_of_remediation: 'Areas of Remediation',
  lesson_plan: 'Complete Lesson Plan',
  report_type: 'Report Type',
  target_id: 'Target ID',
  educator_id: 'Educator ID',
  raw_data: 'Raw Data from Database',
  structured_sections: 'Report Sections',
  final_report: 'Final Report',
  metadata: 'Report Metadata',
  scope: 'Analysis Scope',
  student_profiles: 'Student Profiles',
  assessment_data: 'Assessment Data',
  risk_classifications: 'Risk Classifications',
  progress_trends: 'Progress Trends',
  early_warnings: 'Early Warnings',
  recommendations: 'Recommendations',
  educator_profile: 'Educator Profile',
  assigned_students: 'Assigned Students',
  student_outcomes: 'Student Outcomes',
  performance_summary: 'Performance Summary',
  mentoring_insights: 'Mentoring Insights',
  training_recommendations: 'Training Recommendations',
  student_priority_list: 'Student Priority List',
};

/* ──────────────────────────────────────────────────────────────────────────────
   Helper: recursively render any JSON value as human-readable cards/tables
──────────────────────────────────────────────────────────────────────────────*/
function HumanValue({ value, depth = 0 }: { value: any; depth?: number }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">No data available</span>;
  }

  if (typeof value === 'boolean') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${value ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
        {value ? '✓ Yes' : '✗ No'}
      </span>
    );
  }

  if (typeof value === 'number') {
    return <span className="font-semibold text-primary">{value.toLocaleString()}</span>;
  }

  if (typeof value === 'string') {
    if (value.length === 0) return <span className="text-muted-foreground italic">Empty</span>;
    // Long text: render as paragraph
    if (value.length > 120) {
      return <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{value}</p>;
    }
    return <span className="text-foreground">{value}</span>;
  }

  // Array of strings
  if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string')) {
    return (
      <ul className="list-disc list-inside space-y-1">
        {value.map((item, i) => (
          <li key={i} className="text-foreground text-sm">{item}</li>
        ))}
      </ul>
    );
  }

  // Array of objects → render as cards
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground italic">No records found</span>;
    return (
      <div className="space-y-3">
        {value.map((item, i) => (
          <div key={i} className="bg-muted/40 border border-border rounded-lg p-4">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Record {i + 1} of {value.length}</div>
            {typeof item === 'object' && item !== null ? (
              <DataTable data={item} depth={depth + 1} />
            ) : (
              <HumanValue value={item} depth={depth + 1} />
            )}
          </div>
        ))}
      </div>
    );
  }

  // Object → render as labeled table
  if (typeof value === 'object') {
    return <DataTable data={value} depth={depth + 1} />;
  }

  return <span className="text-foreground">{String(value)}</span>;
}

/* Render an object as a labeled field table */
function DataTable({ data, depth = 0 }: { data: Record<string, any>; depth?: number }) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return <span className="text-muted-foreground italic">No data</span>;

  return (
    <div className={`${depth > 0 ? '' : ''}`}>
      <table className="w-full text-sm">
        <tbody>
          {entries.map(([key, val]) => {
            const label = FIELD_LABELS[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            const isComplex = typeof val === 'object' && val !== null;
            return (
              <tr key={key} className="border-b border-border last:border-0">
                <td className={`py-2 pr-4 font-medium text-muted-foreground align-top whitespace-nowrap ${isComplex ? 'pt-3' : ''}`} style={{ minWidth: 160 }}>
                  {label}
                </td>
                <td className={`py-2 text-foreground ${isComplex ? 'pt-3' : ''}`}>
                  <HumanValue value={val} depth={depth} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Collapsible section component
──────────────────────────────────────────────────────────────────────────────*/
function CollapsibleSection({
  title,
  badge,
  children,
  defaultOpen = false,
  variant = 'default',
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'database' | 'ai';
}) {
  const [open, setOpen] = useState(defaultOpen);
  const variantStyles = {
    default: 'border-border',
    database: 'border-primary/20',
    ai: 'border-success/20',
  };
  const headerStyles = {
    default: 'bg-muted/40 hover:bg-muted',
    database: 'bg-primary/10 hover:bg-primary/10',
    ai: 'bg-success/10 hover:bg-success/10',
  };
  const badgeStyles = {
    default: 'bg-muted text-muted-foreground',
    database: 'bg-primary/10 text-primary',
    ai: 'bg-success/10 text-success',
  };

  return (
    <div className={`border rounded-xl overflow-hidden mb-4 ${variantStyles[variant]}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full px-5 py-3.5 flex items-center justify-between text-left transition-colors ${headerStyles[variant]}`}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground text-sm">{title}</span>
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeStyles[variant]}`}>
              {badge}
            </span>
          )}
        </div>
        <svg className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="px-5 py-4 border-t border-border bg-background">
          {children}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Main page component
──────────────────────────────────────────────────────────────────────────────*/
export default function AITransparencyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('assessment');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  // Input fields
  const [studentId, setStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [educatorId, setEducatorId] = useState('');
  const [weekNumber, setWeekNumber] = useState(1);
  const [reportType, setReportType] = useState('ASSESSMENT');
  const [scope, setScope] = useState('STUDENT');

  // Modal state
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Set default educator ID from current user
  useEffect(() => {
    const isEducator = user?.role === 'SPECIAL_EDUCATOR' || user?.role === 'SUPER_SPECIAL_EDUCATOR';
    const eid = user?.specialEducatorProfile?.id || user?.superSpecialEducatorProfile?.id || (isEducator ? user?.profile?.id : '') || '';
    if (eid && !educatorId) {
      setEducatorId(eid);
    }
  }, [user, educatorId]);

  const activeAgent = AGENTS.find((a) => a.key === activeTab)!;

  const handleStudentSelect = (id: string, student: any) => {
    setStudentId(id);
    setSelectedStudent(student);
  };

  const triggerAgent = useCallback(async () => {
    if ((activeAgent.fields.includes('student_id') || activeAgent.fields.includes('target_id')) && !studentId) {
      toast.error('Please select a student first');
      return;
    }

    if (activeAgent.fields.includes('educator_id') && !educatorId) {
      toast.error('Educator ID is missing. Please ensure you are logged in.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
      
      const resp = await fetch(`${apiUrl}/ai/transparency/trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          agent: activeTab,
          student_id: studentId,
          educator_id: educatorId,
          target_id: studentId,
          week_number: weekNumber,
          report_type: reportType,
          scope,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(errData.detail || errData.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      setResult(data.data || data);
      toast.success(`${activeAgent.label} agent completed successfully`);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger agent');
      toast.error(err.message || 'Agent execution failed');
    } finally {
      setLoading(false);
    }
  }, [activeTab, studentId, educatorId, weekNumber, reportType, scope, activeAgent]);

  // Extract state (the full LangGraph agent output)
  const agentState = result?.state || {};

  return (
    <PageWrapper
      title="AI Transparency Dashboard"
      description="Inspect what data each AI agent reads and generates — full pipeline visibility for teacher review"
      breadcrumbs={[{ label: 'Educator' }, { label: 'AI Transparency' }]}
    >
        {/* Agent Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {AGENTS.map((agent) => (
            <button
              key={agent.key}
              onClick={() => { setActiveTab(agent.key); setResult(null); setError(''); }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === agent.key
                  ? 'bg-primary text-white shadow-lg scale-105'
                  : 'bg-background text-muted-foreground border border-border hover:border-primary/30 hover:bg-primary/10/50 hover:text-primary'
              }`}
            >
              <span>{agent.icon}</span>
              <span>{agent.label}</span>
            </button>
          ))}
        </div>

        {/* Agent Info + Inputs */}
        <div className="bg-background rounded-2xl border border-border p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl">
                {activeAgent.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{activeAgent.label}</h2>
                <p className="text-muted-foreground mt-1 max-w-2xl">{activeAgent.description}</p>
              </div>
            </div>
            
            <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 self-start md:self-center">
              Target: {activeAgent.key.toUpperCase()}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-6 items-end p-6 bg-muted/40/50 rounded-2xl border border-border">
            {(activeAgent.fields.includes('student_id') || activeAgent.fields.includes('target_id')) && (
              <div className="flex-1" style={{ minWidth: 280 }}>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Selected Student
                </label>
                <div className="flex gap-2">
                  <div className={`flex-1 flex items-center gap-3 px-4 py-2.5 border rounded-xl bg-background text-sm ${selectedStudent ? 'border-primary/20' : 'border-border italic text-muted-foreground'}`}>
                    <User className={`w-4 h-4 ${selectedStudent ? 'text-primary' : 'text-muted-foreground'}`} />
                    {selectedStudent ? (
                      <span className="font-medium text-foreground">{selectedStudent.fullName || selectedStudent.name}</span>
                    ) : (
                      'No student selected'
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsStudentModalOpen(true)}
                    className="rounded-xl border-border hover:bg-background hover:border-blue-500 hover:text-primary transition-all font-semibold"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    {selectedStudent ? 'Change' : 'Select'}
                  </Button>
                </div>
              </div>
            )}
            
            {activeAgent.fields.includes('educator_id') && (
              <div style={{ minWidth: 200 }}>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Educator Profile
                </label>
                {user?.role === 'ADMIN' ? (
                  <input
                    type="text" value={educatorId}
                    onChange={(e) => setEducatorId(e.target.value)}
                    placeholder="Enter Educator ID..."
                    className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-background font-medium"
                  />
                ) : (
                  <div className="px-4 py-2.5 border border-border rounded-xl bg-muted text-sm font-medium text-foreground truncate max-w-[200px]">
                    {user?.profile?.fullName || user?.specialEducatorProfile?.fullName || 'Current Educator'}
                  </div>
                )}
              </div>
            )}

            {activeAgent.fields.includes('week_number') && (
              <div style={{ width: 120 }}>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Week #</label>
                <input
                  type="number" value={weekNumber} min={1}
                  onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-background font-medium"
                />
              </div>
            )}

            {activeAgent.fields.includes('report_type') && (
              <div style={{ width: 200 }}>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5" /> Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-background font-medium"
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            )}

            {activeAgent.fields.includes('scope') && (
              <div style={{ width: 160 }}>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Scope</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-background font-medium"
                >
                  <option value="STUDENT">STUDENT</option>
                  <option value="SCHOOL">SCHOOL</option>
                </select>
              </div>
            )}

            <Button
              onClick={triggerAgent}
              disabled={loading}
              className={`h-[42px] px-8 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg active:scale-95 ${
                loading ? 'opacity-50' : 'bg-primary hover:bg-primary'
              }`}
            >
              {loading ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running...</>
              ) : (
                <><Play className="w-4 h-4 mr-2 fill-current" /> Run Agent</>
              )}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-background rounded-2xl border border-border p-16 text-center shadow-sm">
            <div className="w-12 h-12 border-4 border-border border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-bold text-foreground leading-tight">Executing {activeAgent.label}...</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">This process runs the full AI agent cycle including database queries, prompt construction, and LLM reasoning. This typically takes 30-90 seconds.</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-red-900 font-bold">Execution Error</p>
              <p className="text-destructive text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-background rounded-2xl border border-border p-5 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5" /> Agent Identity
                </p>
                <p className="text-lg font-bold text-foreground truncate">{activeAgent.label}</p>
              </div>
              <div className="bg-background rounded-2xl border border-border p-5 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5" /> Runtime
                </p>
                <p className="text-lg font-bold text-primary">{result.elapsed_seconds}s <span className="text-sm font-medium text-muted-foreground ml-1">seconds</span></p>
              </div>
              <div className="bg-background rounded-2xl border border-border p-5 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Last Triggered</p>
                <p className="text-lg font-bold text-foreground">{new Date(result.timestamp).toLocaleTimeString()}</p>
              </div>
              <div className="bg-background rounded-2xl border border-border p-5 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5" /> Logical Nodes
                </p>
                <p className="text-lg font-bold text-foreground">{Object.keys(agentState).length} fields captured</p>
              </div>
            </div>

            {/* Categorized State Sections */}
            {Object.entries(activeAgent.stateCategories).map(([category, fields]) => {
              const categoryData: Record<string, any> = {};
              let hasData = false;
              for (const field of fields) {
                if (field in agentState) {
                  categoryData[field] = agentState[field];
                  if (agentState[field] !== null && agentState[field] !== undefined && agentState[field] !== '') {
                    hasData = true;
                  }
                }
              }
              if (!hasData && Object.keys(categoryData).length === 0) return null;

              const isDatabase = category.toLowerCase().includes('database') || category.toLowerCase().includes('context') || category.toLowerCase().includes('fetched');
              const isAI = category.toLowerCase().includes('ai') || category.toLowerCase().includes('generated');
              const variant = isDatabase ? 'database' as const : isAI ? 'ai' as const : 'default' as const;

              return (
                <CollapsibleSection
                  key={category}
                  title={category}
                  badge={`${Object.keys(categoryData).length} fields detected`}
                  defaultOpen={true}
                  variant={variant}
                >
                  {fields.map((field) => {
                    if (!(field in agentState)) return null;
                    const val = agentState[field];
                    const label = FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

                    return (
                      <div key={field} className="mb-8 last:mb-0">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <h4 className="text-base font-bold text-foreground">
                            {label}
                          </h4>
                          {Array.isArray(val) && (
                            <Badge variant="secondary" className="font-medium bg-primary/10 text-primary border-none">
                              {val.length} {val.length === 1 ? 'entry' : 'entries'}
                            </Badge>
                          )}
                        </div>
                        <div className="pl-5 border-l-2 border-border ml-1">
                          <HumanValue value={val} />
                        </div>
                      </div>
                    );
                  })}
                </CollapsibleSection>
              );
            })}

            {/* Any extra state fields not in categories */}
            {(() => {
              const allCategorizedFields = Object.values(activeAgent.stateCategories).flat();
              const extraFields = Object.keys(agentState).filter((k) => !allCategorizedFields.includes(k));
              if (extraFields.length === 0) return null;
              return (
                <CollapsibleSection
                  title="Raw Metadata & State Logs"
                  badge={`${extraFields.length} hidden fields`}
                  defaultOpen={false}
                >
                  <div className="bg-muted/40 rounded-xl p-6 border border-border shadow-inner">
                    {extraFields.map((field: string) => (
                      <div key={field} className="mb-6 last:mb-0">
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Info className="w-3.5 h-3.5" />
                          {FIELD_LABELS[field] || field.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </h4>
                        <div className="pl-4 border-l-2 border-border ml-1">
                          <HumanValue value={agentState[field]} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              );
            })()}
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && !error && (
          <div className="bg-background rounded-2xl border border-border p-24 text-center shadow-sm">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Bot className="w-12 h-12 text-primary" strokeWidth={1.5} />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Initialize Agent Inspection</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Please select a student and an agent tab above, then click 
              <span className="font-bold text-primary mx-1.5">Run Agent</span> 
              to execute the system and view human-readable analysis.
            </p>
          </div>
        )}

      {/* Modals */}
      <StudentSelectionModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSelect={handleStudentSelect}
        selectedStudentId={studentId}
      />
    </PageWrapper>
  );
}
