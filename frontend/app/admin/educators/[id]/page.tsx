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
  Target,
  Building,
  Edit,
  UserCheck,
  UserX,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface EducatorDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'SPECIAL_EDUCATOR' | 'SUPER_SPECIAL_EDUCATOR';
  isActive: boolean;
  centerName?: string;
  centerId?: string;
  specializations: string[];
  experience: number;
  linkedStudents: number;
  workloadPercentage: number;
  lastLogin?: string;
  createdAt: string;
  performance: {
    rating: number;
    completedAssessments: number;
    activeIEPs: number;
  };
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
  center?: {
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

interface CenterAssignment {
  id: string;
  centerName: string;
  assignedDate: string;
  isActive: boolean;
  studentCount: number;
}

export default function AdminEducatorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [educator, setEducator] = useState<EducatorDetail | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [centerAssignments, setCenterAssignments] = useState<CenterAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const educatorId = params.id as string;

  useEffect(() => {
    loadEducatorDetail();
  }, [educatorId]);

  const loadEducatorDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all users and find the educator
      const usersResponse = await apiClient.getAllUsers({ 
        page: 1, 
        limit: 1000,
        role: undefined // Get all users to find this specific one
      });
      
      const allUsers = usersResponse.data || [];
      const userData = allUsers.find((u: any) => u.id === educatorId);
      
      if (!userData) {
        setError('Educator not found');
        return;
      }

      // Check if user is an educator
      const hasEducatorRole = userData.role === 'SPECIAL_EDUCATOR' || userData.role === 'SUPER_SPECIAL_EDUCATOR';
      const hasEducatorProfile = userData.specialEducatorProfile || userData.superSpecialEducatorProfile;
      
      if (!hasEducatorRole && !hasEducatorProfile) {
        setError('User is not an educator');
        return;
      }

      const profile = userData.specialEducatorProfile || userData.superSpecialEducatorProfile;
      const linkedStudents = profile?.linkedStudents || 0;
      
      // Transform to educator detail
      const educatorDetail: EducatorDetail = {
        id: userData.id,
        name: profile?.fullName || userData.email,
        email: userData.email,
        phone: profile?.phone || '',
        role: userData.role,
        isActive: userData.isActive,
        centerName: profile?.centerName || 'Not Assigned',
        centerId: profile?.centerId || '',
        specializations: profile?.specializations || [],
        experience: profile?.experience || 0,
        linkedStudents: linkedStudents,
        workloadPercentage: Math.min(100, (linkedStudents / 15) * 100),
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
        performance: {
          rating: 4.5,
          completedAssessments: 0,
          activeIEPs: linkedStudents
        }
      };

      setEducator(educatorDetail);

      // Load assigned students
      await loadAssignedStudents();
      
      // Load center assignments if super special educator
      if (userData.role === 'SUPER_SPECIAL_EDUCATOR') {
        await loadCenterAssignments();
      }
      
    } catch (error) {
      console.error('Failed to load educator detail:', error);
      setError('Failed to load educator details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedStudents = async () => {
    try {
      // Get all students and filter by educator
      const studentsResponse = await apiClient.getAllStudentsAsAdmin({ 
        page: 1, 
        limit: 1000 
      });
      
      const allStudents = studentsResponse.data || [];
      const educatorStudents = allStudents.filter((student: any) => 
        student.assignments?.some((assignment: any) => 
          (assignment.specialEducator?.id === educatorId || 
           assignment.superSpecialEducator?.id === educatorId) && 
          assignment.isActive
        )
      );

      setAssignedStudents(educatorStudents);
    } catch (error) {
      console.error('Failed to load assigned students:', error);
    }
  };

  const loadCenterAssignments = async () => {
    try {
      // Get all centers and check which ones this educator is assigned to
      const centersResponse = await apiClient.getAllCenters({ page: 1, limit: 1000 });
      const allCenters = centersResponse.data || [];
      
      // For now, we'll show the primary center assignment
      // In a full implementation, you'd fetch actual center assignments from backend
      const assignments: CenterAssignment[] = [];
      
      if (educator?.centerId && educator?.centerName) {
        assignments.push({
          id: educator.centerId,
          centerName: educator.centerName,
          assignedDate: educator.createdAt,
          isActive: educator.isActive,
          studentCount: educator.linkedStudents
        });
      }
      
      setCenterAssignments(assignments);
    } catch (error) {
      console.error('Failed to load center assignments:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!educator) return;

    try {
      setActionLoading(true);
      
      if (educator.isActive) {
        await apiClient.deactivateUser(educator.id);
        toast({
          title: "Success",
          description: "Educator deactivated successfully.",
        });
      } else {
        await apiClient.activateUser(educator.id);
        toast({
          title: "Success",
          description: "Educator activated successfully.",
        });
      }
      
      await loadEducatorDetail();
    } catch (error) {
      console.error('Failed to toggle educator status:', error);
      toast({
        title: "Error",
        description: "Failed to update educator status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEducator = async () => {
    if (!educator || !window.confirm(`Are you sure you want to delete ${educator.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      await apiClient.deleteUser(educator.id);
      
      toast({
        title: "Success",
        description: "Educator deleted successfully.",
      });
      
      router.push('/admin/educators');
    } catch (error) {
      console.error('Failed to delete educator:', error);
      toast({
        title: "Error",
        description: "Failed to delete educator. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
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

  const experienceLevel = getExperienceLevel(educator.experience);

  return (
    <div className="">
      <PageHeader
        title={educator.name}
        description={`${educator.role === 'SUPER_SPECIAL_EDUCATOR' ? 'Super Special Educator' : 'Special Educator'} • ${educator.experience} years experience • ${educator.linkedStudents} students assigned`}
        badge={{
          text: educator.isActive ? 'Active' : 'Inactive',
          variant: educator.isActive ? 'default' : 'secondary'
        }}
        actions={[
          {
            label: 'Back to Educators',
            href: '/admin/educators',
            icon: ArrowLeft,
            variant: 'outline'
          },
          {
            label: educator.isActive ? 'Deactivate' : 'Activate',
            onClick: handleToggleStatus,
            icon: educator.isActive ? UserX : UserCheck,
            variant: 'secondary',
            disabled: actionLoading
          },
          {
            label: 'Edit',
            href: `/admin/users/${educatorId}/edit`,
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
          title="Assigned Students"
          value={educator.linkedStudents}
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
          title="Workload"
          value={`${Math.round(educator.workloadPercentage)}%`}
          description={educator.workloadPercentage > 80 ? 'High capacity' : 'Available capacity'}
          icon={BarChart3}
          iconColor={educator.workloadPercentage > 80 ? "text-red-600" : "text-green-600"}
          iconBgColor={educator.workloadPercentage > 80 ? "bg-red-50" : "bg-green-50"}
          change={`${educator.linkedStudents}/15 students`}
          changeType={educator.workloadPercentage > 80 ? "negative" : "positive"}
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
            {educator.role === 'SUPER_SPECIAL_EDUCATOR' && (
              <TabsTrigger value="centers">Centers ({centerAssignments.length})</TabsTrigger>
            )}
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
                    <p className="font-medium text-lg">{educator.name}</p>
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
                        {educator.role === 'SUPER_SPECIAL_EDUCATOR' ? 'Super Special Educator' : 'Special Educator'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Experience Level</label>
                    <div className="mt-1">
                      <Badge className={experienceLevel.color}>
                        <Award className="h-3 w-3 mr-1" />
                        {experienceLevel.label} ({educator.experience} years)
                      </Badge>
                    </div>
                  </div>

                  {educator.centerName && educator.centerName !== 'Not Assigned' && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Assigned Center</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{educator.centerName}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                    <p className="font-medium">{new Date(educator.createdAt).toLocaleDateString()}</p>
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
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{educator.linkedStudents} / 15 students</span>
                        <span className="text-sm text-muted-foreground">{Math.round(educator.workloadPercentage)}%</span>
                      </div>
                      <Progress value={educator.workloadPercentage} className="h-2" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Specializations</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {educator.specializations.length > 0 ? (
                        educator.specializations.map((area, index) => (
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
                  Students currently assigned to {educator.name}
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
                            {student.center && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <Building className="h-3 w-3 inline mr-1" />
                                {student.center.name}
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
                            <Link href={`/admin/students/${student.id}`}>
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
                    <Link href="/admin/students">
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
                        {assignedStudents.slice(0, 10).map((student) => {
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

                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">Workload Capacity</span>
                      </div>
                      <span className="text-lg font-bold text-orange-600">
                        {Math.round(educator.workloadPercentage)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {educator.role === 'SUPER_SPECIAL_EDUCATOR' && (
            <TabsContent value="centers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Center Assignments
                  </CardTitle>
                  <CardDescription>
                    Centers where {educator.name} is assigned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {centerAssignments.length > 0 ? (
                    <div className="space-y-4">
                      {centerAssignments.map((assignment, index) => (
                        <motion.div
                          key={assignment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <h3 className="font-semibold">{assignment.centerName}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}</span>
                              <span>•</span>
                              <Users className="h-3 w-3" />
                              <span>{assignment.studentCount} students</span>
                            </div>
                          </div>
                          <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
                            {assignment.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No center assignments found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
}


