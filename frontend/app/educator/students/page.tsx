'use client';

/**
 * Students List Page — v2 (post-review fixes)
 *
 * Changes from v1:
 * - Removed unused `useRouter` / dead `router` declaration
 * - Removed misleading `avgProgress` stat that changed per pagination page
 * - Fixed `statusFilter` sending `''` to API — now sends `undefined` (truly "all")
 * - Added 300ms search debounce so each keystroke doesn't fire an API call
 * - Extracted shared `StudentAvatar` component (was duplicated in list + table view)
 * - Simplified `PaginationBar` — removed unnecessary `pageSize` prop
 * - `Calendar` icon removed from imports (was only used for the removed stat card)
 */

import { useState, useEffect, useCallback } from 'react';
import { useEducatorStudents } from '@/hooks/useEducator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Plus,
  Users,
  Eye,
  TrendingUp,
  List,
  LayoutGrid,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatCard } from '@/components/ui/stat-card';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:      'bg-success/10 text-foreground border-success/20',
  INACTIVE:    'bg-muted text-foreground border-border',
  GRADUATED:   'bg-primary/10 text-primary border-primary/20',
  TRANSFERRED: 'bg-amber-50 text-amber-700 border-amber-200',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Shared Components ─────────────────────────────────────────────────────────

/**
 * Shared avatar used by both list rows and table rows.
 * Extracted to avoid duplicating the initials + color logic in two places.
 */
function StudentAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = getInitials(name || '?');
  const dim = size === 'sm' ? 'w-7 h-7' : 'w-10 h-10';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <div className={`${dim} bg-primary rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className={`text-primary-foreground font-semibold ${textSize}`}>{initials}</span>
    </div>
  );
}

// ─── Loading Skeletons ─────────────────────────────────────────────────────────

function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border rounded-lg p-4">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <div className="hidden sm:block space-y-1.5 text-right">
        <Skeleton className="h-3 w-16 ml-auto" />
        <Skeleton className="h-2 w-24 ml-auto" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md flex-shrink-0" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {['Student', 'Grade', 'Status', 'Progress', 'Last Session', ''].map((h) => (
              <th key={h} className="text-left py-3 px-4 font-medium text-muted-foreground text-xs">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5].map((i) => (
            <tr key={i} className="border-b last:border-0">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </td>
              <td className="py-3 px-4"><Skeleton className="h-4 w-16" /></td>
              <td className="py-3 px-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
              <td className="py-3 px-4 w-40"><Skeleton className="h-2 w-full rounded-full" /></td>
              <td className="py-3 px-4"><Skeleton className="h-4 w-20" /></td>
              <td className="py-3 px-4"><Skeleton className="h-8 w-16 rounded-md" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Row Components ─────────────────────────────────────────────────────────────

/** Card-style list row — best for small rosters (< 15 students) */
function StudentListRow({ student }: { student: any }) {
  const progress = student.progressSummary?.averageProgress || 0;
  const statusCls = STATUS_STYLES[student.status] || STATUS_STYLES.INACTIVE;

  return (
    <div className="flex items-center gap-4 border rounded-lg p-4 hover:bg-muted/30 transition-colors">
      <StudentAvatar name={student.fullName || ''} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-sm truncate">{student.fullName}</h3>
          <Badge variant="outline" className={`text-xs ${statusCls}`}>
            {student.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {student.age ? `${student.age} yrs` : '—'}
          {student.grade ? ` · ${student.grade}` : ''}
          {student.center?.centerName ? ` · ${student.center.centerName}` : ''}
          {student.school?.name ? ` · ${student.school.name}` : ''}
        </p>
        {student.lastSession && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Last session: {new Date(student.lastSession).toLocaleDateString()}
          </p>
        )}
      </div>

      {student.progressSummary && (
        <div className="hidden sm:block text-right min-w-[100px]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5 w-24 ml-auto" />
          <p className="text-xs text-muted-foreground mt-1">
            {student.progressSummary.completedGoals}/{student.progressSummary.totalGoals} goals
          </p>
        </div>
      )}

      <Link href={`/educator/students/${student.id}`} className="flex-shrink-0">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">View</span>
        </Button>
      </Link>
    </div>
  );
}

/** Compact table row — better for scanning 15+ students */
function StudentTableRow({ student }: { student: any }) {
  const progress = student.progressSummary?.averageProgress || 0;
  const statusCls = STATUS_STYLES[student.status] || STATUS_STYLES.INACTIVE;

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {/* Reuses StudentAvatar — no duplication */}
          <StudentAvatar name={student.fullName || ''} size="sm" />
          <span className="font-medium text-sm">{student.fullName}</span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-muted-foreground">{student.grade || '—'}</td>
      <td className="py-3 px-4">
        <Badge variant="outline" className={`text-xs ${statusCls}`}>
          {student.status}
        </Badge>
      </td>
      <td className="py-3 px-4 w-44">
        {student.progressSummary ? (
          <div className="flex items-center gap-2">
            <Progress value={progress} className="h-1.5 flex-1" />
            <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
              {progress}%
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No data</span>
        )}
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground">
        {student.lastSession
          ? new Date(student.lastSession).toLocaleDateString()
          : '—'}
      </td>
      <td className="py-3 px-4">
        <Link href={`/educator/students/${student.id}`}>
          <Button variant="outline" size="sm" className="h-7 gap-1">
            <Eye className="h-3 w-3" />
            View
          </Button>
        </Link>
      </td>
    </tr>
  );
}

/**
 * Pagination bar.
 * `pageSize` prop removed — it was always PAGE_SIZE and made the API surface
 * unnecessarily wide for a purely local component.
 */
function PaginationBar({
  currentPage,
  totalPages,
  total,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, total);

  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {total} students
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground px-2">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function StudentsPage() {
  // ── UI state ──
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  const [currentPage, setCurrentPage] = useState(1);

  // ── Search with debounce ──
  // `searchInput` drives the input value immediately for responsive feedback.
  // `debouncedSearch` is what actually goes to the API — updates 300ms after typing stops.
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setCurrentPage(1); // Reset to page 1 when search changes
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Status filter ──
  // Raw filter value ('ACTIVE', 'INACTIVE', etc.) or '' for "all"
  const [rawStatusFilter, setRawStatusFilter] = useState('');

  const handleStatusChange = useCallback((value: string) => {
    setRawStatusFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  }, []);

  // Pass `undefined` (not `''`) when no filter is selected.
  // Sending `status=''` to the API behaves differently from omitting it —
  // Prisma will filter where status equals '' and return 0 results.
  const apiStatusFilter = rawStatusFilter || undefined;

  // ── Data ──
  const { students, pagination, isLoading, error, refetch } = useEducatorStudents({
    page: currentPage,
    limit: PAGE_SIZE,
    search: debouncedSearch,
    status: apiStatusFilter,
  });

  // Two lightweight count calls (limit: 1) — we only care about the total metadata.
  // The `avgProgress` stat that was computed from the current page was removed
  // because it changed per page, making it a misleading KPI.
  const { pagination: totalPagination } = useEducatorStudents({ page: 1, limit: 1 });
  const { pagination: activePagination } = useEducatorStudents({
    page: 1,
    limit: 1,
    status: 'ACTIVE',
  });

  const isFiltered = Boolean(searchInput || rawStatusFilter);

  return (
    <PageWrapper
      title="My Students"
      description="Manage and track progress of your assigned students"
      breadcrumbs={[{ label: 'Educator' }, { label: 'Students' }]}
      actions={
        <Link href="/educator/students/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Register Student
          </Button>
        </Link>
      }
    >
      {/* ── Section 1: Summary Stats ──────────────────────────────────────────── */}
      {/*
        Two stats only. The third "Average Progress" card was removed — it was
        computed only from the current page's students, so it changed every time
        you navigated between pages, which felt like a bug rather than a feature.
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Students"
          value={totalPagination?.total ?? 0}
          description="Assigned to you"
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Active Students"
          value={activePagination?.total ?? 0}
          description="Currently enrolled"
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* ── Section 2: Filter Toolbar + Student List ──────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Student List</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                View and manage all students assigned to you
              </CardDescription>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg self-start sm:self-auto">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0 rounded-md"
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 w-7 p-0 rounded-md"
                onClick={() => setViewMode('table')}
                title="Table view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Select
              value={rawStatusFilter || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full sm:w-44 h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="GRADUATED">Graduated</SelectItem>
                <SelectItem value="TRANSFERRED">Transferred</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {/* Loading */}
          {isLoading && (
            viewMode === 'list' ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <ListRowSkeleton key={i} />)}
              </div>
            ) : (
              <TableSkeleton />
            )
          )}

          {/* Error */}
          {!isLoading && error && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Failed to load students</p>
              <p className="text-sm text-muted-foreground">Something went wrong fetching student data.</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {/* Empty */}
          {!isLoading && !error && students?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">
                {isFiltered ? 'No students match your filters' : 'No students yet'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {isFiltered
                  ? 'Try clearing your search or adjusting the status filter.'
                  : "You don't have any students assigned yet. Register your first student to get started."}
              </p>
              {isFiltered ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchInput('');
                    handleStatusChange('all');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Link href="/educator/students/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Register First Student
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* List view */}
          {!isLoading && !error && students?.length > 0 && viewMode === 'list' && (
            <div className="space-y-3">
              {students.map((student: any) => (
                <StudentListRow key={student.id} student={student} />
              ))}
            </div>
          )}

          {/* Table view */}
          {!isLoading && !error && students?.length > 0 && viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {['Student', 'Grade', 'Status', 'Progress', 'Last Session', ''].map((h) => (
                      <th
                        key={h}
                        className="text-left py-3 px-4 font-medium text-muted-foreground text-xs"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student: any) => (
                    <StudentTableRow key={student.id} student={student} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <PaginationBar
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
