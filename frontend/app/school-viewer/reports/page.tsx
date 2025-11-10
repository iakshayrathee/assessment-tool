'use client';

import { useState } from 'react';
import { useSchoolViewerReports } from '@/hooks/useSchoolViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Target,
  TrendingUp,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Report {
  id: string;
  type: string;
  status: string;
  title: string;
  content: string;
  summary?: string;
  recommendations?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    grade: string;
  };
  specialEducator: {
    id: string;
    fullName: string;
  };
  superSpecialEducator?: {
    id: string;
    fullName: string;
  };
}

export default function SchoolViewerReports() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { 
    reports, 
    pagination, 
    isLoading, 
    error, 
    refetch 
  } = useSchoolViewerReports({
    page,
    limit: 10,
    type: type || undefined,
    status: status || undefined,
    studentId: studentId || undefined
  });

  const handleTypeChange = (value: string) => {
    setType(value === 'all' ? '' : value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value === 'all' ? '' : value);
    setPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'intake':
        return ClipboardList;
      case 'assessment':
        return BookOpen;
      case 'iep':
        return Target;
      case 'progress':
        return TrendingUp;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'intake':
        return 'text-blue-600 bg-blue-50';
      case 'assessment':
        return 'text-purple-600 bg-purple-50';
      case 'iep':
        return 'text-green-600 bg-green-50';
      case 'progress':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Reports</h3>
        <p className="text-gray-600 mb-4">Unable to load report data. Please try again.</p>
        <Button onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">View and download reports for students from your school</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Type Filter */}
            <Select value={type || 'all'} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INTAKE">Intake Reports</SelectItem>
                <SelectItem value="ASSESSMENT">Assessment Reports</SelectItem>
                <SelectItem value="IEP">IEP Reports</SelectItem>
                <SelectItem value="PROGRESS">Progress Reports</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            {showFilters && (
              <Select value={status || 'all'} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="REVIEWED">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
            <p className="text-gray-600">
              {type || status 
                ? 'No reports match your current filters. Try adjusting your search criteria.'
                : 'No reports are currently available for students from your school.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {reports.map((report: Report) => {
              const TypeIcon = getTypeIcon(report.type);
              return (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`p-2 rounded-lg ${getTypeColor(report.type)}`}>
                            <TypeIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                            <p className="text-sm text-gray-600">
                              {formatType(report.type)} Report
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {report.student.fullName}
                              </p>
                              <p className="text-xs text-gray-600">Grade {report.student.grade}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Created by</p>
                              <p className="text-sm font-medium text-gray-900">
                                {report.specialEducator.fullName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-600">Created</p>
                              <p className="text-sm font-medium text-gray-900">
                                {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {report.summary && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 line-clamp-2">{report.summary}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Badge className={getStatusColor(report.status)}>
                              {formatStatus(report.status)}
                            </Badge>
                            
                            {report.submittedAt && (
                              <div className="text-xs text-gray-500">
                                Submitted: {format(new Date(report.submittedAt), 'MMM dd, yyyy')}
                              </div>
                            )}
                            
                            {report.reviewedAt && (
                              <div className="text-xs text-gray-500">
                                Reviewed: {format(new Date(report.reviewedAt), 'MMM dd, yyyy')}
                              </div>
                            )}

                            {report.superSpecialEducator && (
                              <div className="text-xs text-gray-500">
                                Reviewed by: {report.superSpecialEducator.fullName}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <Link href={`/school-viewer/reports/${report.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                            {(report.status === 'COMPLETED' || report.status === 'REVIEWED') && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} reports
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
                <span className="text-sm text-gray-600">
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
    </div>
  );
}
