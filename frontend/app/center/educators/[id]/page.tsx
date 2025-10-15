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
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Users, 
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Star,
  BookOpen,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Eye,
  UserMinus,
  Award,
  Activity,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface EducatorDetail {
  assignmentId: string;
  educatorId: string;
  type: string;
  fullName: string;
  email: string;
  phone?: string;
  yearsOfExperience: number;
  specializationAreas: string[];
  isActive: boolean;
  lastLogin?: string;
  assignedDate: string;
  assignedStudentCount: number;
  assignedCenterCount?: number;
}

interface AssignedStudent {
  id: string;
  fullName: string;
  grade: string;
  status: string;
  age: number;
  school?: {
    id: string;
    name: string;
  };
  reports: Array<{
    id: string;
    type: string;
    status: string;
  }>;
  assessments: Array<{
    id: string;
    status: string;
  }>;
  iepGoals?: Array<{
    progressPercent: number;
  }>;
}

export default function EducatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [educator, setEducator] = useState<EducatorDetail | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const educatorId = params.id as string;

  useEffect(() => {
    loadEducatorDetail();
  }, [educatorId]);

  const loadEducatorDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const centerId = user?.profile?.id;
      if (!centerId) {
        setError('Center ID not found');
        return;
      }

      // Get educator details from center educators
      const educators = await apiClient.getCenterEducators(centerId);
      const educatorDetail = educators.find(e => e.educatorId === educatorId);
      
      if (!educatorDetail) {
        setError('Educator not found or not assigned to this center');
        return;
      }

      // Get assigned students for this educator
      const studentsData = await apiClient.getCenterStudents(centerId, { limit: 1000 });
      const educatorStudents = studentsData.data.filter((student: any) => 
        student.assignments?.some((assignment: any) => 
          assignment.specialEducator?.id === educatorId && assignment.isActive
        )
      );

      setEducator(educatorDetail);
      setAssignedStudents(educatorStudents);
    } catch (error) {
      console.error('Failed to load educator detail:', error);
      setError('Failed to load educator details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEducator = async () => {
    if (!educator || !window.confirm(`Are you sure you want to remove ${educator.fullName} from this center?`)) {
      return;
    }

    try {
      setRemoving(true);
      const centerId = user?.profile?.id;
      if (!centerId) return;

      await apiClient.removeEducatorFromCenter(centerId, educator.assignmentId);
      
      toast({
        title: "Success",
        description: "Educator removed from center successfully.",
      });
      
      router.push('/center/educators');
    } catch (error) {
      console.error('Failed to remove educator:', error);
      toast({
        title: "Error",
        description: "Failed to remove educator. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
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

  const getExperienceLevel = (years: number) => {
    if (years >= 10) return { label: 'Senior', color: 'text-purple-600 bg-purple-50' };
    if (years >= 5) return { label: 'Experienced', color: 'text-blue-600 bg-blue-50' };
    if (years >= 2) return { label: 'Mid-level', color: 'text-green-600 bg-green-50' };
    return { label: 'Junior', color: 'text-orange-600 bg-orange-50' };
  };

  const calculateAverageProgress = () => {
    if (assignedStudents.length === 0) return 0;
    
    const totalProgress = assignedStudents.reduce((sum, student) => {
      if (!student.iepGoals || student.iepGoals.length === 0) return sum;
      const studentProgress = student.iepGoals.reduce((goalSum, goal) => goalSum + goal.progressPercent, 0) / student.iepGoals.length;
      return sum + studentProgress;
    }, 0);
    
    return Math.round(totalProgress / assignedStudents.length);
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <LoadingSkeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
        </div>
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  if (error || !educator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'Educator not found'}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={loadEducatorDetail}>
              Try Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const experienceLevel = getExperienceLevel(educator.yearsOfExperience);

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title={educator.fullName}
        description={`${educator.type} • ${educator.yearsOfExperience} years experience • ${educator.assignedStudentCount} students assigned`}
        badge={{
          text: educator.isActive ? 'Active' : 'Inactive',
          variant: educator.isActive ? 'default' : 'secondary'
        }}
        actions={[
          {
            label: 'Back to Educators',
            href: '/center/educators',
            icon: ArrowLeft,
            variant: 'outline'
          },
          {
            label: 'View Students',
            href: `/center/educators/${educatorId}/students`,
            icon: Users
          },
          {
            label: 'Remove from Center',
            onClick: handleRemoveEducator,
            icon: UserMinus,
            variant: 'destructive',
            disabled: removing
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
          title="Assigned Students"
          value={educator.assignedStudentCount}
          description="Currently teaching"
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
          change={`${assignedStudents.filter(s => s.status === 'ACTIVE').length} active`}
          changeType="positive"
        />
        <EnhancedCard
          title="Average Progress"
          value={`${calculateAverageProgress()}%`}
          description="Student IEP progress"
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          change="Across all students"
          changeType="positive"
        />
        <EnhancedCard
          title="Total Reports"
          value={assignedStudents.reduce((sum, s) => sum + s.reports.length, 0)}
          description="Generated reports"
          icon={FileText}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
          change={`${assignedStudents.reduce((sum, s) => sum + s.reports.filter(r => r.status === 'PENDING').length, 0)} pending`}
          changeType="neutral"
        />
        <EnhancedCard
          title="Experience"
          value={`${educator.yearsOfExperience}y`}
          description={experienceLevel.label}
          icon={Award}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-50"
          change={`Since ${new Date(educator.assignedDate).getFullYear()}`}
          changeType="neutral"
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
            <TabsTrigger value="students">Students ({assignedStudents.length})</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Educator Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Educator Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="font-medium text-lg">{educator.fullName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{educator.email}</p>
                    </div>
                  </div>
                  
                  {educator.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{educator.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <div className="mt-1">
                      <Badge variant="outline" className="text-sm">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        {educator.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Experience Level</label>
                    <div className="mt-1">
                      <Badge className={experienceLevel.color}>
                        <Award className="h-3 w-3 mr-1" />
                        {experienceLevel.label} ({educator.yearsOfExperience} years)
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Assignment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Assigned Date</label>
                    <p className="font-medium">{new Date(educator.assignedDate).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={educator.isActive ? 'default' : 'secondary'}>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {educator.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  
                  {educator.lastLogin && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{new Date(educator.lastLogin).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Workload</label>
                    <div className="mt-1">
                      <Badge className={
                        educator.assignedStudentCount <= 5 ? 'text-green-600 bg-green-50' :
                        educator.assignedStudentCount <= 10 ? 'text-yellow-600 bg-yellow-50' : 
                        'text-red-600 bg-red-50'
                      }>
                        <Users className="h-3 w-3 mr-1" />
                        {educator.assignedStudentCount} students
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Specializations</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {educator.specializationAreas.length > 0 ? (
                        educator.specializationAreas.map((area, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {area}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No specializations listed</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assigned Students
                </CardTitle>
                <CardDescription>
                  Students currently assigned to {educator.fullName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignedStudents.length > 0 ? (
                  <div className="space-y-4">
                    {assignedStudents.map((student, index) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {student.fullName.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {student.fullName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Grade {student.grade}</span>
                              <span>•</span>
                              <span>Age {student.age}</span>
                              <span>•</span>
                              <Badge className={getStatusColor(student.status)}>
                                {student.status}
                              </Badge>
                            </div>
                            {student.school && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {student.school.name}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-3 w-3" />
                              <span>{student.reports.length} reports</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-3 w-3" />
                              <span>{student.assessments.length} assessments</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/center/students/${student.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No students assigned yet</p>
                    <Link href="/center/students">
                      <Button>
                        <Eye className="h-4 w-4 mr-2" />
                        View All Students
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Student Progress Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {assignedStudents.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-center p-6 bg-muted/30 rounded-lg">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {calculateAverageProgress()}%
                        </div>
                        <p className="text-muted-foreground">Average IEP Progress</p>
                      </div>
                      
                      <div className="space-y-3">
                        {assignedStudents.map((student) => {
                          const studentProgress = student.iepGoals && student.iepGoals.length > 0
                            ? Math.round(student.iepGoals.reduce((sum, goal) => sum + goal.progressPercent, 0) / student.iepGoals.length)
                            : 0;
                          
                          return (
                            <div key={student.id} className="flex items-center justify-between p-3 border rounded">
                              <span className="font-medium">{student.fullName}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${studentProgress}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium w-12 text-right">{studentProgress}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No performance data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activity Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Total Reports</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {assignedStudents.reduce((sum, s) => sum + s.reports.length, 0)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-green-600" />
                        <span className="font-medium">Total Assessments</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {assignedStudents.reduce((sum, s) => sum + s.assessments.length, 0)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">Pending Reports</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-600">
                        {assignedStudents.reduce((sum, s) => sum + s.reports.filter(r => r.status === 'PENDING').length, 0)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">Active Students</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        {assignedStudents.filter(s => s.status === 'ACTIVE').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
