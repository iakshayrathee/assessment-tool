'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { 
  User, 
  School, 
  UserCheck, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Edit,
  UserPlus,
  Eye,
  Download,
  Clock,
  Target,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface StudentDetail {
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
  school?: {
    id: string;
    name: string;
  };
  parent: {
    id: string;
    fullName: string;
    phone?: string;
  };
  assignments: Array<{
    id: string;
    specialEducator: {
      id: string;
      fullName: string;
    };
    assignedDate: string;
    isActive: boolean;
  }>;
  reports: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string;
  }>;
  assessments: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
  iepGoals?: Array<{
    id: string;
    goal: string;
    progressPercent: number;
    status: string;
  }>;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const studentId = params.id as string;

  useEffect(() => {
    loadStudentDetail();
  }, [studentId]);

  const loadStudentDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getStudent(studentId);
      setStudent(data);
    } catch (error) {
      console.error('Failed to load student detail:', error);
      setError('Failed to load student details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateOverallProgress = () => {
    if (!student?.iepGoals || student.iepGoals.length === 0) return 0;
    const totalProgress = student.iepGoals.reduce((sum, goal) => sum + goal.progressPercent, 0);
    return Math.round(totalProgress / student.iepGoals.length);
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <LoadingSkeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
        </div>
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'Student not found'}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={loadStudentDetail}>
              Try Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title={student.fullName}
        description={`Grade ${student.grade} • ${student.school?.name || 'No school assigned'}`}
        badge={{
          text: student.status,
          variant: student.status === 'ACTIVE' ? 'default' : 'secondary'
        }}
        actions={[
          {
            label: 'Back to Students',
            href: '/center/students',
            icon: ArrowLeft,
            variant: 'outline'
          },
          {
            label: 'Assign Educator',
            href: `/center/students/${studentId}/assign`,
            icon: UserPlus,
            disabled: student.assignments.some(a => a.isActive)
          },
          {
            label: 'Edit Profile',
            href: `/center/students/${studentId}/edit`,
            icon: Edit
          }
        ]}
      />

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <EnhancedCard
          title="Overall Progress"
          value={`${calculateOverallProgress()}%`}
          description="IEP Goals Achievement"
          icon={Target}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          change={`${student.iepGoals?.length || 0} goals`}
          changeType="neutral"
        />
        <EnhancedCard
          title="Total Reports"
          value={student.reports.length}
          description="Generated reports"
          icon={FileText}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
          change={`${student.reports.filter(r => r.status === 'PENDING').length} pending`}
          changeType="neutral"
        />
        <EnhancedCard
          title="Assessments"
          value={student.assessments.length}
          description="Completed assessments"
          icon={BookOpen}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
          change={`${student.assessments.filter(a => a.status === 'COMPLETED').length} completed`}
          changeType="positive"
        />
        <EnhancedCard
          title="Days Enrolled"
          value={Math.floor((new Date().getTime() - new Date(student.registrationDate).getTime()) / (1000 * 60 * 60 * 24))}
          description="Since registration"
          icon={Calendar}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-50"
          change="Active"
          changeType="positive"
        />
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="font-medium">{student.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Age</label>
                      <p className="font-medium">{student.age} years</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Gender</label>
                      <p className="font-medium capitalize">{student.gender.toLowerCase()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Grade</label>
                      <p className="font-medium">{student.grade}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Mother Tongue</label>
                      <p className="font-medium">{student.motherTongue || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Syllabus</label>
                      <p className="font-medium">{student.syllabus || 'Not specified'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                    <p className="font-medium">{new Date(student.registrationDate).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact & School Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5" />
                    Contact & School
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Parent/Guardian</label>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-medium">{student.parent.fullName}</p>
                      {student.parent.phone && (
                        <Badge variant="outline" className="text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          {student.parent.phone}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">School</label>
                    {student.school ? (
                      <div className="flex items-center justify-between mt-1">
                        <p className="font-medium">{student.school.name}</p>
                        <Link href={`/center/schools/${student.school.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View School
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No school assigned</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(student.status)}>
                        {student.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Educator Assignments
                </CardTitle>
                <CardDescription>
                  Special educators assigned to this student
                </CardDescription>
              </CardHeader>
              <CardContent>
                {student.assignments.length > 0 ? (
                  <div className="space-y-4">
                    {student.assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{assignment.specialEducator.fullName}</h3>
                            <p className="text-sm text-muted-foreground">
                              Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
                            {assignment.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Link href={`/center/educators/${assignment.specialEducator.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No educator assigned yet</p>
                    <Link href={`/center/students/${studentId}/assign`}>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Assign Educator
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reports
                </CardTitle>
                <CardDescription>
                  Generated reports and assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {student.reports.length > 0 ? (
                  <div className="space-y-4">
                    {student.reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold capitalize">{report.type.replace('_', ' ')}</h3>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(report.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          <Link href={`/center/reports/${report.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No reports generated yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Assessments
                </CardTitle>
                <CardDescription>
                  Completed and pending assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {student.assessments.length > 0 ? (
                  <div className="space-y-4">
                    {student.assessments.map((assessment) => (
                      <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Assessment #{assessment.id.slice(-6)}</h3>
                            <p className="text-sm text-muted-foreground">
                              Created: {new Date(assessment.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(assessment.status)}>
                            {assessment.status}
                          </Badge>
                          <Link href={`/center/assessments/${assessment.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No assessments completed yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  IEP Goals Progress
                </CardTitle>
                <CardDescription>
                  Individual Education Plan goals and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {student.iepGoals && student.iepGoals.length > 0 ? (
                  <div className="space-y-4">
                    {student.iepGoals.map((goal) => (
                      <div key={goal.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{goal.goal}</h3>
                          <Badge className={getStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{goal.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${goal.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No IEP goals set yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
