'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { 
  Users, 
  GraduationCap,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  Calendar,
  BookOpen,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  School,
  Target,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface EducatorInfo {
  fullName: string;
  type: string;
  yearsOfExperience: number;
  assignedStudentCount: number;
}

interface StudentWithProgress {
  id: string;
  fullName: string;
  grade: string;
  status: string;
  age: number;
  registrationDate: string;
  school?: {
    id: string;
    name: string;
  };
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
  assignments: Array<{
    id: string;
    assignedDate: string;
    isActive: boolean;
  }>;
}

export default function EducatorStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [educator, setEducator] = useState<EducatorInfo | null>(null);
  const [students, setStudents] = useState<StudentWithProgress[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [progressFilter, setProgressFilter] = useState<string>('');

  const educatorId = params.id as string;

  useEffect(() => {
    loadData();
  }, [educatorId]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter, gradeFilter, progressFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const centerId = user?.profile?.id;
      if (!centerId) {
        setError('Center ID not found');
        return;
      }

      // Get educator details and all center students
      const [educators, allStudents] = await Promise.all([
        apiClient.getCenterEducators(centerId),
        apiClient.getCenterStudents(centerId, { limit: 1000 })
      ]);

      const educatorDetail = educators.find(e => e.educatorId === educatorId);
      if (!educatorDetail) {
        setError('Educator not found or not assigned to this center');
        return;
      }

      // Filter students assigned to this educator - handle different data structures
      const educatorStudents = allStudents.data.filter((student: any) => {
        // Check if student has assignments array
        if (Array.isArray(student.assignments)) {
          return student.assignments.some((assignment: any) => {
            // Check for specialEducator object with id
            if (assignment.specialEducator && assignment.specialEducator.id) {
              return assignment.specialEducator.id === educatorId && assignment.isActive;
            }
            // Alternative structure: direct specialEducatorId property
            return assignment.specialEducatorId === educatorId && assignment.isActive;
          });
        }
        // Alternative structure: direct specialEducatorId property on student
        return student.specialEducatorId === educatorId;
      });

      setEducator(educatorDetail);
      setStudents(educatorStudents);
    } catch (error) {
      console.error('Failed to load educator students:', error);
      setError('Failed to load educator students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.school?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    // Grade filter
    if (gradeFilter) {
      filtered = filtered.filter(student => student.grade === gradeFilter);
    }

    // Progress filter
    if (progressFilter) {
      filtered = filtered.filter(student => {
        const progress = calculateStudentProgress(student);
        switch (progressFilter) {
          case 'excellent': return progress >= 80;
          case 'good': return progress >= 60 && progress < 80;
          case 'needs_improvement': return progress < 60;
          default: return true;
        }
      });
    }

    setFilteredStudents(filtered);
  };

  const calculateStudentProgress = (student: StudentWithProgress) => {
    if (!student.iepGoals || student.iepGoals.length === 0) return 0;
    const totalProgress = student.iepGoals.reduce((sum, goal) => sum + goal.progressPercent, 0);
    return Math.round(totalProgress / student.iepGoals.length);
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600 bg-green-50';
    if (progress >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getProgressLabel = (progress: number) => {
    if (progress >= 80) return 'Excellent';
    if (progress >= 60) return 'Good';
    return 'Needs Improvement';
  };

  const getUniqueGrades = () => {
    // Create an array of grades, filter out duplicates
    const gradesSet = new Set<string>();
    students.forEach(s => gradesSet.add(s.grade));
    return Array.from(gradesSet).sort();
  };

  const calculateOverallStats = () => {
    const totalReports = students.reduce((sum, s) => sum + s.reports.length, 0);
    const pendingReports = students.reduce((sum, s) => sum + s.reports.filter(r => r.status === 'PENDING').length, 0);
    const totalAssessments = students.reduce((sum, s) => sum + s.assessments.length, 0);
    const averageProgress = students.length > 0 
      ? Math.round(students.reduce((sum, s) => sum + calculateStudentProgress(s), 0) / students.length)
      : 0;

    return { totalReports, pendingReports, totalAssessments, averageProgress };
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <LoadingSkeleton className="h-32" />
        <LoadingSkeleton className="h-24" />
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
            <Button onClick={loadData}>
              Try Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const stats = calculateOverallStats();

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title={`${educator.fullName}'s Students`}
        description={`${filteredStudents.length} of ${students.length} students • ${educator.type} • ${educator.yearsOfExperience} years experience`}
        badge={{
          text: `${stats.averageProgress}% Avg Progress`,
          variant: 'secondary'
        }}
        actions={[
          {
            label: 'Back to Educator',
            href: `/center/educators/${educatorId}`,
            icon: ArrowLeft,
            variant: 'outline'
          },
          {
            label: 'View All Students',
            href: '/center/students',
            icon: Users
          }
        ]}
      />

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-lg font-semibold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Progress</p>
                <p className="text-lg font-semibold">{stats.averageProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-lg font-semibold">{stats.totalReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Reports</p>
                <p className="text-lg font-semibold">{stats.pendingReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Students
            </CardTitle>
            <CardDescription>
              Filter and search students assigned to this educator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search by name, grade, or school..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Grade</label>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All grades</SelectItem>
                    {getUniqueGrades().map(grade => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Progress</label>
                <Select value={progressFilter} onValueChange={setProgressFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All progress levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All progress levels</SelectItem>
                    <SelectItem value="excellent">Excellent (80%+)</SelectItem>
                    <SelectItem value="good">Good (60-79%)</SelectItem>
                    <SelectItem value="needs_improvement">Needs Improvement (&lt;60%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Students List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students ({filteredStudents.length})
            </CardTitle>
            <CardDescription>
              Students assigned to {educator.fullName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <div className="space-y-4">
                {filteredStudents.map((student, index) => {
                  const progress = calculateStudentProgress(student);
                  const assignment = student.assignments.find(a => a.isActive);
                  
                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {student.fullName.split(' ').map((n: string) => n[0]).join('')}
                          </span>
                        </div>
                        <div className="flex-1">
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
                          
                          <div className="flex items-center gap-4 mt-2">
                            {student.school && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <School className="h-3 w-3" />
                                {student.school.name}
                              </div>
                            )}
                            
                            {assignment && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              {student.reports.length} reports
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <BookOpen className="h-3 w-3" />
                              {student.assessments.length} assessments
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">IEP Progress</p>
                          <div className="flex items-center gap-2">
                            <Badge className={getProgressColor(progress)}>
                              <Target className="h-3 w-3 mr-1" />
                              {progress}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {getProgressLabel(progress)}
                            </span>
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
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {students.length === 0 
                    ? 'No students assigned to this educator yet'
                    : 'No students match your filters'
                  }
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {students.length === 0 
                    ? 'Students will appear here once assigned'
                    : 'Try adjusting your search criteria'
                  }
                </p>
                {students.length === 0 && (
                  <Link href="/center/students">
                    <Button>
                      <Users className="h-4 w-4 mr-2" />
                      View All Students
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Overview */}
      {students.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Overview
              </CardTitle>
              <CardDescription>
                IEP goal progress for all assigned students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {students.map((student) => {
                  const progress = calculateStudentProgress(student);
                  
                  return (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{student.fullName}</span>
                        <Badge variant="outline" className="text-xs">
                          Grade {student.grade}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress >= 80 ? 'bg-green-500' :
                              progress >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{progress}%</span>
                        <Badge className={getProgressColor(progress)} variant="outline">
                          {getProgressLabel(progress)}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
