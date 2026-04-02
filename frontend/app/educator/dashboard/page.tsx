'use client';

/**
 * Educator Dashboard — Redesigned
 *
 * Design philosophy (Linear/Stripe-inspired command center):
 * - Dashboard = "what should I do right now?" NOT an analytics dump
 * - Removed the full student grid (it lives on /students page)
 * - Top: 4 key metrics → AI insights → 2-column: charts | watchlist+actions
 * - "Priority Watchlist" surfaces up to 5 students that need attention (AI-driven)
 * - Skeleton loading replaces the jarring full-screen spinner
 * - Quick Actions panel makes navigation obvious for new users
 */

import { useAuth } from '@/hooks/useAuth';
import {
  useEducatorDashboardAnalytics,
  useStudentsWithAnalytics,
  useProgressTrends,
} from '@/hooks/useEducatorAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageWrapper } from '@/components/layout/PageWrapper';
import {
  PerformanceDistributionChart,
  DomainPerformanceChart,
  ProgressTrendsChart,
} from '@/components/educator/AnalyticsCharts';
import { AIEducatorInsightsCard } from '@/components/ai/AIInsightPanels';
import {
  TrendingUp,
  Calendar,
  ClipboardList,
  Plus,
  Eye,
  FileText,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Award,
  Download,
  AlertTriangle,
  ShieldCheck,
  Users,
  Target,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useState, useMemo } from 'react';
import { useAIEducatorInsights } from '@/hooks/useAI';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface RiskInfo {
  status: string;
  priority: string;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/**
 * Skeleton shown during the initial data load.
 * Using fixed-width skeletons (no Math.random) as required by design conventions.
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border p-5 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * A single row in the Priority Watchlist.
 * Shows avatar, name, grade + progress, and an AI risk badge.
 * The eye icon reveals on hover — keeps the row scannable.
 */
function WatchlistRow({
  student,
  riskInfo,
}: {
  student: any;
  riskInfo?: RiskInfo;
}) {
  const initials =
    student.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'ST';
  const progress = student.progressSummary?.averageProgress || 0;
  const statusLower = riskInfo?.status?.toLowerCase() || '';
  const isHigh =
    statusLower.includes('high') ||
    statusLower.includes('critical') ||
    statusLower.includes('at_risk') ||
    statusLower.includes('at-risk');
  const isMedium =
    statusLower.includes('medium') ||
    statusLower.includes('moderate') ||
    statusLower.includes('watch');

  const badgeCls = isHigh
    ? 'bg-destructive/10 text-destructive border-destructive/20'
    : isMedium
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  const RiskIcon = isHigh ? AlertTriangle : isMedium ? AlertCircle : ShieldCheck;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors group">
      {/* Avatar */}
      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-primary font-semibold text-xs">{initials}</span>
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{student.fullName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{student.grade || 'Grade N/A'}</span>
          <Progress value={progress} className="h-1.5 w-16 flex-shrink-0" />
          <span className="text-xs text-muted-foreground tabular-nums">{progress}%</span>
        </div>
      </div>

      {/* AI Risk badge */}
      {riskInfo && (
        <span
          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${badgeCls}`}
        >
          <RiskIcon className="h-3 w-3" />
          <span className="capitalize hidden sm:inline">
            {riskInfo.status.replace(/_/g, ' ')}
          </span>
          <Sparkles className="h-2.5 w-2.5 opacity-40" />
        </span>
      )}

      {/* Quick view — always subtly visible; becomes opaque on hover.
          opacity-0 was the original — on touch devices :hover never fires,
          making this permanently invisible for iPad/tablet users. */}
      <Link href={`/educator/students/${student.id}`}>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 opacity-40 group-hover:opacity-100 transition-opacity rounded-md flex-shrink-0"
          title="View student profile"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}

/**
 * Priority Watchlist — shows up to 5 students that need the most attention.
 * Sorted: high-risk first (AI-driven), then by lowest progress.
 * Zero extra API calls — consumes the already-fetched students + AI risk map.
 */
function PriorityWatchlist({
  students,
  riskMap,
  isLoading,
}: {
  students: any[];
  riskMap: Map<string, RiskInfo>;
  isLoading: boolean;
}) {
  const prioritized = useMemo(() => {
    return [...students]
      .sort((a, b) => {
        const aRisk = riskMap.get((a.fullName || '').toLowerCase());
        const bRisk = riskMap.get((b.fullName || '').toLowerCase());
        const getWeight = (r?: RiskInfo) => {
          const s = r?.status?.toLowerCase() || '';
          if (s.includes('high') || s.includes('critical') || s.includes('at_risk')) return 2;
          if (s.includes('medium') || s.includes('moderate') || s.includes('watch')) return 1;
          return 0;
        };
        const wDiff = getWeight(bRisk) - getWeight(aRisk);
        if (wDiff !== 0) return wDiff;
        // Tie-break: lowest progress first
        return (a.progressSummary?.averageProgress || 0) - (b.progressSummary?.averageProgress || 0);
      })
      .slice(0, 5);
  }, [students, riskMap]);

  const skeletonRows = [1, 2, 3, 4];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Student Watchlist</CardTitle>
            <CardDescription className="text-xs">Priority students needing attention</CardDescription>
          </div>
          <Link href="/educator/students">
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
              All students
              <Eye className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {skeletonRows.map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : prioritized.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students yet"
            description="Add your first student to get started."
            action={{
              label: 'Add Student',
              onClick: () => (window.location.href = '/educator/students/new'),
            }}
            className="py-6 border-0 bg-transparent"
          />
        ) : (
          <div className="space-y-2">
            {prioritized.map((student) => (
              <WatchlistRow
                key={student.id}
                student={student}
                riskInfo={riskMap.get((student.fullName || '').toLowerCase())}
              />
            ))}

            {/* "N more" overflow link */}
            {students.length > 5 && (
              <Link href="/educator/students" className="block mt-1">
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                  +{students.length - 5} more students
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * A compact monthly summary + quick action links.
 * Grouped together in the right sidebar to reduce visual weight.
 */
function SidebarSummary({ analytics }: { analytics: any }) {
  const summaryItems = [
    {
      label: 'Completed Reports',
      value: analytics?.completedReports ?? 0,
      icon: Award,
      color: 'text-emerald-600',
    },
    {
      label: 'Upcoming Sessions',
      value: analytics?.upcomingSessions ?? 0,
      icon: Calendar,
      color: 'text-blue-600',
    },
    {
      label: 'Pending Assessments',
      value: analytics?.pendingAssessments ?? 0,
      icon: BookOpen,
      color: 'text-amber-600',
    },
  ];

  const quickActions = [
    { href: '/educator/students', icon: Users, label: 'View All Students' },
    { href: '/educator/reports', icon: FileText, label: 'Generate Report' },
    { href: '/educator/assessments', icon: ClipboardList, label: 'Start Assessment' },
  ];

  return (
    <>
      {/* Monthly snapshot */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">This Month</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {summaryItems.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="flex items-center justify-between py-2.5 border-b last:border-0"
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
              <span className="font-semibold text-sm tabular-nums">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {quickActions.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="block">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 text-sm font-normal"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </Button>
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function EducatorDashboard() {
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [aiInsightsEnabled] = useState(true);

  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useEducatorDashboardAnalytics();

  const {
    data: students,
    isLoading: isStudentsLoading,
    error: studentsError,
    refetch: refetchStudents,
  } = useStudentsWithAnalytics();

  const { data: trends } = useProgressTrends(timePeriod);
  const aiInsights = useAIEducatorInsights(aiInsightsEnabled);

  // Build risk lookup from AI agent data — zero extra API calls
  const studentRiskMap = useMemo(() => {
    const map = new Map<string, RiskInfo>();
    const list =
      aiInsights?.data?.student_priority_list ||
      aiInsights?.data?.data?.student_priority_list ||
      [];
    list.forEach((item: any) => {
      const name = item.student_name || item.name || '';
      map.set(name.toLowerCase(), {
        status: item.status || item.risk_level || 'unknown',
        priority: item.priority || 'normal',
      });
    });
    return map;
  }, [aiInsights?.data]);

  const isLoading = isAnalyticsLoading || isStudentsLoading;
  const hasError = analyticsError || studentsError;

  const displayName =
    user?.profile?.fullName ||
    user?.specialEducatorProfile?.fullName ||
    'Special Educator';

  // CSV export — unchanged business logic, just scoped here
  const exportStudentsCSV = () => {
    if (!students) return;
    const headers = [
      'Name', 'Age', 'Grade', 'Status',
      'Progress', 'Goals (Done/Total)', 'Last Session',
    ];
    const rows = (students as any[]).map((s) => [
      s.fullName || '',
      s.age || '',
      s.grade || '',
      s.status || '',
      `${s.progressSummary?.averageProgress || 0}%`,
      `${s.progressSummary?.completedGoals || 0}/${s.progressSummary?.totalGoals || 0}`,
      s.lastSession ? format(new Date(s.lastSession), 'yyyy-MM-dd') : 'N/A',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), {
      href: url,
      download: `students-${format(new Date(), 'yyyy-MM-dd')}.csv`,
    }).click();
    URL.revokeObjectURL(url);
  };

  // ── Skeleton loading — much better UX than a full-screen spinner ──
  if (isLoading) {
    return (
      <PageWrapper
        title={`Welcome back, ${displayName}`}
        description="Here's what's happening with your students today"
        breadcrumbs={[{ label: 'Dashboard' }]}
      >
        <DashboardSkeleton />
      </PageWrapper>
    );
  }

  // ── Error state ──
  if (hasError) {
    return (
      <PageWrapper
        title="Dashboard"
        breadcrumbs={[{ label: 'Dashboard' }]}
      >
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold">Failed to load dashboard</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Please try refreshing or contact support if the issue persists.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  void refetchAnalytics();
                  void refetchStudents();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={`Welcome back, ${displayName}`}
      description="Here's what's happening with your students today"
      breadcrumbs={[{ label: 'Dashboard' }]}
      actions={
        <>
          <Button variant="outline" size="sm" onClick={exportStudentsCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Link href="/educator/students/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Student
            </Button>
          </Link>
        </>
      }
    >
      {/* ── Section 1: Key Metrics ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={analytics?.totalStudents ?? 0}
          description="Active students under your care"
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Average Progress"
          value={`${analytics?.averageStudentProgress ?? 0}%`}
          description="Across all remediation plans"
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Active Plans"
          value={analytics?.activeIEPGoals ?? 0}
          description="Goals currently in progress"
          icon={Target}
          variant="default"
        />
        <StatCard
          title="Pending Tasks"
          value={analytics?.pendingTasks ?? 0}
          description="Assessments & homework"
          icon={ClipboardList}
          variant="warning"
        />
      </div>

      {/* ── Section 2: AI Insights (auto-hides on error) ────────────────────── */}
      <AIEducatorInsightsCard
        data={aiInsights.data}
        isLoading={aiInsights.isLoading}
        error={aiInsights.error}
        onLoad={() => {}}
      />

      {/* ── Section 3: Charts (2/3) + Watchlist + Actions (1/3) ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column: chart stack */}
        <div className="lg:col-span-2 space-y-6">

          {/* Two compact distribution charts side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Performance Distribution</CardTitle>
                <CardDescription className="text-xs">Students by performance tier</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.performanceDistribution ? (
                  <PerformanceDistributionChart data={analytics.performanceDistribution} />
                ) : (
                  <EmptyState
                    icon={Target}
                    title="No data yet"
                    className="py-8 border-0 bg-transparent"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Domain Performance</CardTitle>
                <CardDescription className="text-xs">Average across learning domains</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.domainAverages ? (
                  <DomainPerformanceChart data={analytics.domainAverages} />
                ) : (
                  <EmptyState
                    icon={BookOpen}
                    title="No data yet"
                    className="py-8 border-0 bg-transparent"
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress Trends — full width, period selector in header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Progress Trends</CardTitle>
                  <CardDescription className="text-xs">Track improvement over time</CardDescription>
                </div>
                {/* Period selector is part of the chart header — belongs here, not below */}
                <Select value={timePeriod} onValueChange={(v: any) => setTimePeriod(v)}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {trends?.trendData && trends.trendData.length > 0 ? (
                <ProgressTrendsChart data={trends.trendData} />
              ) : (
                <EmptyState
                  icon={TrendingUp}
                  title="No trend data"
                  description="Trends appear after students have session history."
                  className="py-10 border-0 bg-transparent"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: watchlist + summary + quick actions */}
        <div className="space-y-4">
          {/* AI-driven student watchlist — replaces the old 220-line student grid */}
          <PriorityWatchlist
            students={students || []}
            riskMap={studentRiskMap}
            isLoading={isStudentsLoading}
          />

          {/* Monthly summary + quick links — consolidated from the old orphaned bottom cards */}
          <SidebarSummary analytics={analytics} />
        </div>
      </div>
    </PageWrapper>
  );
}
