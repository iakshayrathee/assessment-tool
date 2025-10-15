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
  School,
  Search,
  Filter,
  ArrowLeft,
  Eye,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Calendar,
  BookOpen,
  FileText,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface SchoolStudent {
  id: string;
  fullName: string;
  grade: string;
  status: string;
  age: number;
  registrationDate: string;
  assignments: Array<{
    id: string;
    specialEducator: {
      id: string;
      fullName: string;
    };
    isActive: boolean;
  }>;
  reports: Array<{
    id: string;
    type: string;
    status: string;
  }>;
  assessments: Array<{
    id: string;
    status: string;
  }>;
}

interface School {
  id: string;
  name: string;
  address?: string;
  studentCount: number;
  activeStudentCount: number;
}

export default function SchoolStudentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [school, setSchool] = useState<School | null>(null);
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<SchoolStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('');

  const schoolId = params.id as string;

  useEffect(() => {
    loadData();
  }, [schoolId]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter, gradeFilter, assignmentFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const centerId = user?.profile?.id;
      if (!centerId) {
        setError('Center ID not found');
        return;
      }

      // Get school details and all center students
      const [schools, allStudents] = await Promise.all([
        apiClient.getCenterSchools(centerId),
        apiClient.getCenterStudents(centerId, { limit: 1000 }) // Get all students
      ]);

      const schoolDetail = schools.find(s => s.id === schoolId);
      if (!schoolDetail) {
        setError('School not found');
        return;
      }

      // Filter students by school
      const schoolStudents = allStudents.data.filter((student: any) => 
        student.schoolId === schoolId
      );

      setSchool(schoolDetail);
      setStudents(schoolStudents);
    } catch (error) {
      console.error('Failed to load school students:', error);
      setError('Failed to load school students. Please try again.');
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
        student.grade.toLowerCase().includes(searchTerm.toLowerCase())
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

    // Assignment filter
    if (assignmentFilter) {
      if (assignmentFilter === 'assigned') {
        filtered = filtered.filter(student => 
          student.assignments.some(a => a.isActive)
        );
      } else if (assignmentFilter === 'unassigned') {
        filtered = filtered.filter(student => 
          !student.assignments.some(a => a.isActive)
        );
      }
    }

    setFilteredStudents(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssignmentStatus = (student: SchoolStudent) => {
    const activeAssignment = student.assignments.find(a => a.isActive);
    return activeAssignment ? {
      status: 'Assigned',
      educator: activeAssignment.specialEducator.fullName,
      educatorId: activeAssignment.specialEducator.id
    } : {
      status: 'Unassigned',
      educator: null,
      educatorId: null
    };
  };

  const getUniqueGrades = () => {
    const grades = [...new Set(students.map(s => s.grade))];
    return grades.sort();
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

  if (error || !school) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'School not found'}</p>
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

  return (
    <div className="space-y-8 p-6">
      <PageHeader
        title={`Students from ${school.name}`}
        description={`${filteredStudents.length} of ${students.length} students • Manage student assignments and progress`}
        badge={{
          text: `${students.filter(s => s.assignments.some(a => a.isActive)).length} Assigned`,
          variant: 'secondary'
        }}
        actions={[
          {
            label: 'Back to School',
            href: `/center/schools/${schoolId}`,
            icon: ArrowLeft,
            variant: 'outline'
          },
          {
            label: 'Add Student',
            href: '/center/students/new',
            icon: UserPlus
          }
        ]}
      />

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Students
            </CardTitle>
            <CardDescription>
              Filter and search students from this school
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <Input
                  placeholder="Search by name or grade..."
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
                <label className="text-sm font-medium mb-2 block">Assignment</label>
                <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All students</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
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
              Students enrolled from {school.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <div className="space-y-4">
                {filteredStudents.map((student, index) => {
                  const assignmentInfo = getAssignmentStatus(student);
                  
                  return (
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
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Enrolled: {new Date(student.registrationDate).toLocaleDateString()}
                            </div>
                            
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
                          <p className="text-sm font-medium">Assignment</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={assignmentInfo.status === 'Assigned' ? 'default' : 'secondary'}>
                              {assignmentInfo.status}
                            </Badge>
                            {assignmentInfo.educator && (
                              <span className="text-xs text-muted-foreground">
                                to {assignmentInfo.educator}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/center/students/${student.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                          
                          {assignmentInfo.status === 'Unassigned' ? (
                            <Link href={`/center/students/${student.id}/assign`}>
                              <Button size="sm">
                                <UserPlus className="h-3 w-3 mr-1" />
                                Assign
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/center/educators/${assignmentInfo.educatorId}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                Educator
                              </Button>
                            </Link>
                          )}
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
                    ? 'No students from this school yet'
                    : 'No students match your filters'
                  }
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {students.length === 0 
                    ? 'Add students to get started'
                    : 'Try adjusting your search criteria'
                  }
                </p>
                {students.length === 0 && (
                  <Link href="/center/students/new">
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats */}
      {students.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Assigned</p>
                  <p className="text-lg font-semibold">
                    {students.filter(s => s.assignments.some(a => a.isActive)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                  <p className="text-lg font-semibold">
                    {students.filter(s => !s.assignments.some(a => a.isActive)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-lg font-semibold">
                    {students.filter(s => s.status === 'ACTIVE').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
