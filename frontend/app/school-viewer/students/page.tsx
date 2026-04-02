'use client';

import { useState } from 'react';
import { useSchoolViewerStudents } from '@/hooks/useSchoolViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users,
  Search,
  Filter,
  User,
  Calendar,
  Phone,
  Mail,
  FileText,
  Target,
  TrendingUp,
  AlertCircle,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { GradeDisplay } from '@/components/ui/GradeDisplay';
import { GradeSelect } from '@/components/ui/GradeSelect';
import { PageWrapper } from '@/components/layout/PageWrapper';

interface Student {
  id: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  grade: string;
  motherTongue?: string;
  status: string;
  registrationDate: string;
  parent?: {
    id: string;
    fullName: string;
    phone?: string;
    user: {
      email: string;
    };
  };
  assignments: Array<{
    specialEducator: {
      id: string;
      fullName: string;
      phone?: string;
    };
  }>;
  latestAssessment?: {
    id: string;
    status: string;
    assessmentType: string;
    completedAt?: string;
  };
  latestReport?: {
    id: string;
    type: string;
    status: string;
    submittedAt?: string;
  };
  iepProgress: number;
  activeGoalsCount: number;
}

export default function SchoolViewerStudents() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [grade, setGrade] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const {
    students,
    pagination,
    isLoading,
    error,
    refetch
  } = useSchoolViewerStudents({
    page,
    limit: 12,
    search: search || undefined,
    status: status || undefined,
    grade: grade || undefined
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const handleStatusChange = (value: string) => {
    setStatus(value === 'all' ? '' : value);
    setPage(1);
  };

  const handleGradeChange = (value: string) => {
    setGrade(value === 'all' ? '' : value);
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-success/10 text-foreground';
      case 'inactive':
        return 'bg-muted text-foreground';
      case 'graduated':
        return 'bg-primary/10 text-primary';
      case 'transferred':
        return 'bg-warning/10 text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'text-success';
    if (progress >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Students</h3>
        <p className="text-muted-foreground mb-4">Unable to load student data. Please try again.</p>
        <Button onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <PageWrapper
      title="Students"
      description="View and monitor students from your school"
      breadcrumbs={[{ label: 'School Viewer', href: '/school-viewer' }, { label: 'Students' }]}
      actions={
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </Button>
      }
    >

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search students by name..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            {showFilters && (
              <>
                <Select value={status || 'all'} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="GRADUATED">Graduated</SelectItem>
                    <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={grade || 'all'} onValueChange={handleGradeChange}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="Pre-K">Pre-K</SelectItem>
                    <SelectItem value="K">Kindergarten</SelectItem>
                    <SelectItem value="1">Grade 1</SelectItem>
                    <SelectItem value="2">Grade 2</SelectItem>
                    <SelectItem value="3">Grade 3</SelectItem>
                    <SelectItem value="4">Grade 4</SelectItem>
                    <SelectItem value="5">Grade 5</SelectItem>
                    <SelectItem value="6">Grade 6</SelectItem>
                    <SelectItem value="7">Grade 7</SelectItem>
                    <SelectItem value="8">Grade 8</SelectItem>
                    <SelectItem value="9">Grade 9</SelectItem>
                    <SelectItem value="10">Grade 10</SelectItem>
                    <SelectItem value="11">Grade 11</SelectItem>
                    <SelectItem value="12">Grade 12</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading students...</span>
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No Students Found</h3>
            <p className="text-muted-foreground">
              {search || status || grade
                ? 'No students match your current filters. Try adjusting your search criteria.'
                : 'No students are currently enrolled at your school.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Details</TableHead>
                  <TableHead>Parent Contact</TableHead>
                  <TableHead>Assigned Educator</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Latest Activity</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: Student) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    {/* Student Details */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{student.fullName}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <GradeDisplay grade={student.grade} />
                            <span>•</span>
                            <span>Age {student.age}</span>
                          </div>
                          <Badge className={`mt-1 ${getStatusColor(student.status)}`}>
                            {formatStatus(student.status)}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>

                    {/* Parent Contact */}
                    <TableCell>
                      {student.parent ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{student.parent.fullName}</p>
                          {student.parent.phone && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{student.parent.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 mr-1" />
                            <span>{student.parent.user.email}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No parent info</span>
                      )}
                    </TableCell>

                    {/* Assigned Educator */}
                    <TableCell>
                      {student.assignments.length > 0 ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {student.assignments[0].specialEducator.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">Special Educator</p>
                          {student.assignments[0].specialEducator.phone && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 mr-1" />
                              <span>{student.assignments[0].specialEducator.phone}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>

                    {/* Progress */}
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-2 text-primary" />
                          <span className={`text-sm font-medium ${getProgressColor(student.iepProgress)}`}>
                            {student.iepProgress}% IEP Progress
                          </span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-2 text-success" />
                          <span className="text-sm text-foreground">
                            {student.activeGoalsCount} Active Goals
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Latest Activity */}
                    <TableCell>
                      <div className="space-y-1">
                        {student.latestAssessment && (
                          <div className="flex items-center text-xs">
                            <FileText className="h-3 w-3 mr-1 text-primary" />
                            <Badge variant="outline" className="text-xs">
                              {formatStatus(student.latestAssessment.status)}
                            </Badge>
                          </div>
                        )}
                        {student.latestReport && (
                          <div className="flex items-center text-xs">
                            <FileText className="h-3 w-3 mr-1 text-info" />
                            <Badge variant="outline" className="text-xs">
                              {formatStatus(student.latestReport.status)}
                            </Badge>
                          </div>
                        )}
                        {!student.latestAssessment && !student.latestReport && (
                          <span className="text-xs text-muted-foreground">No recent activity</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Enrollment */}
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{format(new Date(student.registrationDate), 'MMM dd, yyyy')}</span>
                      </div>
                      {student.motherTongue && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <span className="w-4 h-4 mr-1 text-center">🗣️</span>
                          <span>{student.motherTongue}</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Link href={`/school-viewer/students/${student.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} students
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
}
