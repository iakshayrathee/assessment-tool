'use client';

import { useParams } from 'next/navigation';
import { useSchoolViewerStudent } from '@/hooks/useSchoolViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Target,
  BookOpen,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Users,
  Eye 
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface StudentDetails {
  id: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  grade: string;
  motherTongue?: string;
  syllabus?: string;
  status: string;
  registrationDate: string;
  parent?: {
    id: string;
    fullName: string;
    phone?: string;
    address?: string;
    emergencyContact?: string;
    user: {
      email: string;
    };
  };
  assignments: Array<{
    specialEducator: {
      id: string;
      fullName: string;
      phone?: string;
      specialEdQualification?: string;
      yearsOfExperience?: number;
    };
  }>;
  assessments: Array<{
    id: string;
    status: string;
    assessmentType: string;
    completedAt?: string;
    createdAt: string;
    specialEducator: {
      id: string;
      fullName: string;
    };
  }>;
  reports: Array<{
    id: string;
    type: string;
    status: string;
    title: string;
    submittedAt?: string;
    createdAt: string;
    specialEducator: {
      id: string;
      fullName: string;
    };
  }>;
  iepGoals: Array<{
    id: string;
    domain: string;
    goalStatement: string;
    status: string;
    progressPercent: number;
    startDate: string;
    targetDate: string;
    progressUpdates: Array<{
      id: string;
      updateDate: string;
      progress: number;
      notes?: string;
      rating?: string;
    }>;
  }>;
  sessionNotes: Array<{
    id: string;
    sessionDate: string;
    duration?: number;
    activities: string;
    observations?: string;
    progress?: string;
    specialEducator: {
      id: string;
      fullName: string;
    };
  }>;
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const { student, isLoading, error, refetch } = useSchoolViewerStudent(studentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 text-gray-600">Loading student details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Student</h3>
        <p className="text-gray-600 mb-4">Unable to load student details. Please try again.</p>
        <Button onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Student Not Found</h3>
        <p className="text-gray-600">The requested student could not be found.</p>
      </div>
    );
  }

  const studentData = student as StudentDetails;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
      case 'achieved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
      case 'discontinued':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'text-green-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/school-viewer/students">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{studentData.fullName}</h1>
            <p className="text-gray-600">Grade {studentData.grade} • Age {studentData.age}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/school-viewer/reports?studentId=${studentData.id}`}>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View All Reports
            </Button>
          </Link>
          <Badge className={getStatusColor(studentData.status)}>
            {formatStatus(studentData.status)}
          </Badge>
        </div>
      </div>

      {/* Student Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Date of Birth</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(studentData.dateOfBirth), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Gender</p>
                <p className="text-sm text-gray-600">{studentData.gender}</p>
              </div>
            </div>
            {studentData.motherTongue && (
              <div className="flex items-center space-x-3">
                <span className="text-gray-400">🗣️</span>
                <div>
                  <p className="text-sm font-medium">Mother Tongue</p>
                  <p className="text-sm text-gray-600">{studentData.motherTongue}</p>
                </div>
              </div>
            )}
            {studentData.syllabus && (
              <div className="flex items-center space-x-3">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Syllabus</p>
                  <p className="text-sm text-gray-600">{studentData.syllabus}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium">Enrollment Date</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(studentData.registrationDate), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parent Information */}
        {studentData.parent && (
          <Card>
            <CardHeader>
              <CardTitle>Parent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-gray-600">{studentData.parent.fullName}</p>
                </div>
              </div>
              {studentData.parent.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-gray-600">{studentData.parent.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-gray-600">{studentData.parent.user.email}</p>
                </div>
              </div>
              {studentData.parent.address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-gray-600">{studentData.parent.address}</p>
                  </div>
                </div>
              )}
              {studentData.parent.emergencyContact && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-red-400" />
                  <div>
                    <p className="text-sm font-medium">Emergency Contact</p>
                    <p className="text-sm text-gray-600">{studentData.parent.emergencyContact}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Assigned Educator */}
        {studentData.assignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Educator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {studentData.assignments.map((assignment, index) => (
                <div key={index} className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <div>
                      <p className="font-medium text-indigo-900">
                        {assignment.specialEducator.fullName}
                      </p>
                      <p className="text-sm text-indigo-700">Special Educator</p>
                    </div>
                  </div>
                  {assignment.specialEducator.phone && (
                    <div className="flex items-center space-x-3 mb-2">
                      <Phone className="h-4 w-4 text-indigo-400" />
                      <p className="text-sm text-indigo-600">{assignment.specialEducator.phone}</p>
                    </div>
                  )}
                  {assignment.specialEducator.specialEdQualification && (
                    <div className="flex items-center space-x-3 mb-2">
                      <BookOpen className="h-4 w-4 text-indigo-400" />
                      <p className="text-sm text-indigo-600">
                        {assignment.specialEducator.specialEdQualification}
                      </p>
                    </div>
                  )}
                  {assignment.specialEducator.yearsOfExperience && (
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-4 w-4 text-indigo-400" />
                      <p className="text-sm text-indigo-600">
                        {assignment.specialEducator.yearsOfExperience} years experience
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="assessments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="iep-goals">IEP Goals</TabsTrigger>
          <TabsTrigger value="sessions">Session Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="assessments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assessment History</CardTitle>
              <CardDescription>All assessments conducted for this student</CardDescription>
            </CardHeader>
            <CardContent>
              {studentData.assessments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No assessments available</p>
              ) : (
                <div className="space-y-4">
                  {studentData.assessments.map((assessment) => (
                    <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {assessment.assessmentType} Assessment
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Conducted by {assessment.specialEducator.fullName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {format(new Date(assessment.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(assessment.status)}>
                          {formatStatus(assessment.status)}
                        </Badge>
                        {assessment.completedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed: {format(new Date(assessment.completedAt), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>All reports generated for this student</CardDescription>
            </CardHeader>
            <CardContent>
              {studentData.reports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No reports available</p>
              ) : (
                <div className="space-y-4">
                  {studentData.reports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{report.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatStatus(report.type)} Report
                        </p>
                        <p className="text-sm text-gray-600">
                          By {report.specialEducator.fullName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getStatusColor(report.status)}>
                          {formatStatus(report.status)}
                        </Badge>
                        {report.submittedAt && (
                          <p className="text-xs text-gray-500">
                            Submitted: {format(new Date(report.submittedAt), 'MMM dd, yyyy')}
                          </p>
                        )}
                        <Link href={`/school-viewer/reports/${report.id}`}>
                          <Button variant="outline" size="sm" className="mt-2">
                            <Eye className="h-4 w-4 mr-1" />
                            View Report
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iep-goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IEP Goals</CardTitle>
              <CardDescription>Individual Education Program goals and progress</CardDescription>
            </CardHeader>
            <CardContent>
              {studentData.iepGoals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No IEP goals available</p>
              ) : (
                <div className="space-y-6">
                  {studentData.iepGoals.map((goal) => (
                    <div key={goal.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{goal.domain}</h4>
                          <p className="text-sm text-gray-600 mt-1">{goal.goalStatement}</p>
                        </div>
                        <Badge className={getStatusColor(goal.status)}>
                          {formatStatus(goal.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500">Start Date</p>
                          <p className="text-sm font-medium">
                            {format(new Date(goal.startDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Target Date</p>
                          <p className="text-sm font-medium">
                            {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Progress</p>
                          <p className={`text-sm font-medium ${getProgressColor(goal.progressPercent)}`}>
                            {goal.progressPercent}%
                          </p>
                        </div>
                      </div>

                      {goal.progressUpdates.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Recent Updates</h5>
                          <div className="space-y-2">
                            {goal.progressUpdates.slice(0, 3).map((update) => (
                              <div key={update.id} className="p-3 bg-gray-50 rounded">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(update.updateDate), 'MMM dd, yyyy')}
                                  </span>
                                  <span className={`text-sm font-medium ${getProgressColor(update.progress)}`}>
                                    {update.progress}%
                                  </span>
                                </div>
                                {update.notes && (
                                  <p className="text-sm text-gray-600">{update.notes}</p>
                                )}
                                {update.rating && (
                                  <p className="text-xs text-gray-500 mt-1">Rating: {update.rating}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Notes</CardTitle>
              <CardDescription>Recent therapy session notes and observations</CardDescription>
            </CardHeader>
            <CardContent>
              {studentData.sessionNotes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No session notes available</p>
              ) : (
                <div className="space-y-4">
                  {studentData.sessionNotes.map((session) => (
                    <div key={session.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Session on {format(new Date(session.sessionDate), 'MMMM dd, yyyy')}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Conducted by {session.specialEducator.fullName}
                          </p>
                          {session.duration && (
                            <p className="text-xs text-gray-500">
                              Duration: {session.duration} minutes
                            </p>
                          )}
                        </div>
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">Activities</h5>
                          <p className="text-sm text-gray-600">{session.activities}</p>
                        </div>
                        
                        {session.observations && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">Observations</h5>
                            <p className="text-sm text-gray-600">{session.observations}</p>
                          </div>
                        )}
                        
                        {session.progress && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">Progress Notes</h5>
                            <p className="text-sm text-gray-600">{session.progress}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
