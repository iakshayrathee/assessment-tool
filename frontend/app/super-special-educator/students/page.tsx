'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users,
  MapPin,
  Calendar,
  Search,
  ArrowLeft,
  Eye,
  GraduationCap,
  Building2,
  Filter,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  FileText,
  Activity,
  Target,
  Clock,
  BookOpen,
  Heart,
  Brain,
  CheckCircle,
  XCircle,
  BarChart3,
  LineChart,
  PieChart,
  Award,
  Star,
  Mail,
  Phone,
  MoreHorizontal
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { GradeDisplay } from '@/components/ui/GradeDisplay';

interface Student {
  id: string;
  fullName: string;
  age: number;
  grade: string;
  centerName: string;
  centerId: string;
  educatorName: string;
  educatorId: string;
  learningDisabilities: string[];
  enrollmentDate: string;
  lastAssessmentDate?: string;
  nextAssessmentDue?: string;
  progressStatus: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  attendancePercentage: number;
  iepGoalsAchieved: number;
  totalIepGoals: number;
  hasActiveFlags: boolean;
  lastReportDate?: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [progressFilter, setProgressFilter] = useState<string>('all');
  const [centerFilter, setCenterFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);

  // Progress tracking form states
  const [progressNotes, setProgressNotes] = useState('');
  const [progressGoal, setProgressGoal] = useState('');
  const [progressCategory, setProgressCategory] = useState('');
  const [submittingProgress, setSubmittingProgress] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getStudentsUnderSupervision();
      // Extract data from paginated response
      const studentsData = response.data || [];
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch students",
        variant: "destructive",
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const studentsArray = Array.isArray(students) ? students : [];
  const uniqueCenters = Array.from(new Set(studentsArray.map(s => s.centerName).filter(Boolean)));
  const uniqueGrades = Array.from(new Set(studentsArray.map(s => s.grade).filter(Boolean))).sort();

  const filteredStudents = studentsArray.filter(student => {
    const matchesSearch =
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.centerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.educatorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.learningDisabilities || []).some(ld => ld?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProgress = progressFilter === 'all' || student.progressStatus === progressFilter;
    const matchesCenter = centerFilter === 'all' || student.centerName === centerFilter;
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;

    return matchesSearch && matchesProgress && matchesCenter && matchesGrade;
  });

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT':
        return 'bg-success/10 text-foreground';
      case 'GOOD':
        return 'bg-primary/10 text-primary';
      case 'SATISFACTORY':
        return 'bg-warning/10 text-foreground';
      case 'NEEDS_IMPROVEMENT':
        return 'bg-warning/10 text-foreground';
      case 'CRITICAL':
        return 'bg-destructive/10 text-foreground';
      default:
        return 'bg-muted text-foreground';
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success';
    if (percentage >= 75) return 'text-primary';
    if (percentage >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isAssessmentOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    return new Date(dueDateString) < new Date();
  };

  const calculateIepProgress = (achieved: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((achieved / total) * 100);
  };

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setDetailsModalOpen(true);
  };

  const handleTrackProgress = (student: Student) => {
    setSelectedStudent(student);
    setProgressModalOpen(true);
    // Reset form
    setProgressNotes('');
    setProgressGoal('');
    setProgressCategory('');
  };

  const submitProgressUpdate = async () => {
    if (!selectedStudent || !progressCategory || !progressNotes) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingProgress(true);

      // TODO: Replace with actual API call
      // await apiClient.updateStudentProgress(selectedStudent.id, {
      //   category: progressCategory,
      //   notes: progressNotes,
      //   goal: progressGoal
      // });

      toast({
        title: "Success",
        description: "Progress update submitted successfully",
      });

      setProgressModalOpen(false);
      // Optionally refresh data
      // fetchStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit progress update",
        variant: "destructive",
      });
    } finally {
      setSubmittingProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <PageWrapper
      title="Students Under Supervision"
      description="Monitor student progress and outcomes"
      breadcrumbs={[{ label: 'Super Special Educator', href: '/super-special-educator' }, { label: 'Students' }]}
    >

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={progressFilter} onValueChange={setProgressFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Progress</SelectItem>
                <SelectItem value="EXCELLENT">Excellent</SelectItem>
                <SelectItem value="GOOD">Good</SelectItem>
                <SelectItem value="SATISFACTORY">Satisfactory</SelectItem>
                <SelectItem value="NEEDS_IMPROVEMENT">Needs Improvement</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={centerFilter} onValueChange={setCenterFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Centers</SelectItem>
              {uniqueCenters.map(center => (
                <SelectItem key={center} value={center}>{center}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {uniqueGrades.map(grade => (
                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Excellent Progress</p>
                <p className="text-2xl font-bold text-success">
                  {students.filter(s => s.progressStatus === 'EXCELLENT').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Need Attention</p>
                <p className="text-2xl font-bold text-warning">
                  {students.filter(s => s.progressStatus === 'NEEDS_IMPROVEMENT' || s.progressStatus === 'CRITICAL').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flagged Cases</p>
                <p className="text-2xl font-bold text-destructive">
                  {students.filter(s => s.hasActiveFlags).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assessments Due</p>
                <p className="text-2xl font-bold text-info">
                  {students.filter(s => isAssessmentOverdue(s.nextAssessmentDue)).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm || progressFilter !== 'all' || centerFilter !== 'all' || gradeFilter !== 'all'
                ? 'No students found'
                : 'No students under supervision'
              }
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchTerm || progressFilter !== 'all' || centerFilter !== 'all' || gradeFilter !== 'all'
                ? 'Try adjusting your search terms or filters to find the students you\'re looking for.'
                : 'You don\'t have any students under supervision yet.'
              }
            </p>
            {(searchTerm || progressFilter !== 'all' || centerFilter !== 'all' || gradeFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setProgressFilter('all');
                  setCenterFilter('all');
                  setGradeFilter('all');
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-foreground">Student</th>
                    <th className="text-left p-4 font-medium text-foreground">Grade & Age</th>
                    <th className="text-left p-4 font-medium text-foreground">Center & Educator</th>
                    <th className="text-left p-4 font-medium text-foreground">Progress Status</th>
                    <th className="text-left p-4 font-medium text-foreground">Attendance</th>
                    <th className="text-left p-4 font-medium text-foreground">IEP Progress</th>
                    <th className="text-left p-4 font-medium text-foreground">Learning Disabilities</th>
                    <th className="text-left p-4 font-medium text-foreground">Next Assessment</th>
                    <th className="text-right p-4 font-medium text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-muted/40">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-foreground flex items-center">
                              {student.fullName}
                              {student.hasActiveFlags && (
                                <AlertTriangle className="h-4 w-4 ml-2 text-destructive" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">ID: {student.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium text-foreground"><GradeDisplay grade={student.grade} /></div>
                          <div className="text-muted-foreground">{student.age} years old</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">{student.centerName}</div>
                          <div className="text-muted-foreground">{student.educatorName}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getProgressColor(student.progressStatus)}>
                          {student.progressStatus ? student.progressStatus.replace('_', ' ') : 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className={`text-sm font-medium ${getAttendanceColor(student.attendancePercentage)}`}>
                          {student.attendancePercentage}%
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium text-primary">
                            {calculateIepProgress(student.iepGoalsAchieved, student.totalIepGoals)}%
                          </div>
                          <div className="text-muted-foreground">
                            {student.iepGoalsAchieved}/{student.totalIepGoals} goals
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(student.learningDisabilities || []).slice(0, 2).map((ld, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {ld}
                            </Badge>
                          ))}
                          {(student.learningDisabilities || []).length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{(student.learningDisabilities || []).length - 2} more
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {student.nextAssessmentDue ? (
                          <div className="text-sm">
                            <div className={`font-medium ${isAssessmentOverdue(student.nextAssessmentDue)
                              ? 'text-destructive'
                              : 'text-foreground'
                              }`}>
                              {formatDate(student.nextAssessmentDue)}
                            </div>
                            {isAssessmentOverdue(student.nextAssessmentDue) && (
                              <div className="text-destructive text-xs">Overdue</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not scheduled</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTrackProgress(student)}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedStudent?.fullName}
            </DialogTitle>
            <DialogDescription>
              Comprehensive student profile and academic information
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="iep">IEP Goals</TabsTrigger>
                <TabsTrigger value="assessments">Assessments</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Name:</span>
                        <span>{selectedStudent.fullName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Age:</span>
                        <span>{selectedStudent.age} years old</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Grade:</span>
                        <span>{selectedStudent.grade}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Center:</span>
                        <span>{selectedStudent.centerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Educator:</span>
                        <span>{selectedStudent.educatorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Enrolled:</span>
                        <span>{formatDate(selectedStudent.enrollmentDate)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Learning Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="font-medium text-sm">Learning Disabilities:</span>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedStudent.learningDisabilities.map((ld, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {ld}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Progress Status:</span>
                        <Badge className={getProgressColor(selectedStudent.progressStatus)}>
                          {selectedStudent.progressStatus.replace('_', ' ')}
                        </Badge>
                      </div>
                      {selectedStudent.hasActiveFlags && (
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Has Active Flags</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 border rounded-lg">
                          <div className={`text-2xl font-bold ${getAttendanceColor(selectedStudent.attendancePercentage)}`}>
                            {selectedStudent.attendancePercentage}%
                          </div>
                          <div className="text-sm text-muted-foreground">Attendance</div>
                        </div>
                        <div className="text-center p-3 border rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {calculateIepProgress(selectedStudent.iepGoalsAchieved, selectedStudent.totalIepGoals)}%
                          </div>
                          <div className="text-sm text-muted-foreground">IEP Progress</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>IEP Goals Achieved:</span>
                          <span className="font-medium">{selectedStudent.iepGoalsAchieved}/{selectedStudent.totalIepGoals}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Important Dates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedStudent.lastAssessmentDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Last Assessment:</span>
                          <span className="font-medium text-sm">{formatDate(selectedStudent.lastAssessmentDate)}</span>
                        </div>
                      )}
                      {selectedStudent.nextAssessmentDue && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Next Assessment:</span>
                          <span className={`font-medium text-sm ${isAssessmentOverdue(selectedStudent.nextAssessmentDue)
                            ? 'text-destructive'
                            : 'text-primary'
                            }`}>
                            {formatDate(selectedStudent.nextAssessmentDue)}
                            {isAssessmentOverdue(selectedStudent.nextAssessmentDue) && ' (Overdue)'}
                          </span>
                        </div>
                      )}
                      {selectedStudent.lastReportDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Last Report:</span>
                          <span className="font-medium text-sm">{formatDate(selectedStudent.lastReportDate)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Academic Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 border rounded-lg">
                            <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
                            <div className="text-lg font-bold text-primary">B+</div>
                            <div className="text-xs text-muted-foreground">Reading</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <Brain className="h-6 w-6 text-success mx-auto mb-2" />
                            <div className="text-lg font-bold text-success">A-</div>
                            <div className="text-xs text-muted-foreground">Math</div>
                          </div>
                          <div className="p-3 border rounded-lg">
                            <FileText className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                            <div className="text-lg font-bold text-info">B</div>
                            <div className="text-xs text-muted-foreground">Writing</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Learning Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm">Visual Learning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm">Problem Solving</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm">Creative Expression</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm">Collaborative Work</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="iep" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">IEP Goals Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Target className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">Reading Comprehension</p>
                            <p className="text-sm text-muted-foreground">Improve reading level by 2 grades</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                          <span className="text-sm font-medium">75%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Target className="h-4 w-4 text-success" />
                          <div>
                            <p className="font-medium">Math Problem Solving</p>
                            <p className="text-sm text-muted-foreground">Solve multi-step word problems</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                          </div>
                          <span className="text-sm font-medium">90%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Target className="h-4 w-4 text-warning" />
                          <div>
                            <p className="font-medium">Social Communication</p>
                            <p className="text-sm text-muted-foreground">Improve peer interaction skills</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                          </div>
                          <span className="text-sm font-medium">60%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assessments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assessment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">Quarterly Academic Assessment</p>
                            <p className="text-sm text-muted-foreground">December 2024</p>
                          </div>
                        </div>
                        <Badge variant="default">Completed</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Brain className="h-4 w-4 text-success" />
                          <div>
                            <p className="font-medium">Cognitive Skills Evaluation</p>
                            <p className="text-sm text-muted-foreground">November 2024</p>
                          </div>
                        </div>
                        <Badge variant="default">Completed</Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Heart className="h-4 w-4 text-destructive" />
                          <div>
                            <p className="font-medium">Social-Emotional Assessment</p>
                            <p className="text-sm text-muted-foreground">January 2025 (Upcoming)</p>
                          </div>
                        </div>
                        <Badge variant="outline">Scheduled</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progress Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">Monthly Progress Report</p>
                            <p className="text-sm text-muted-foreground">December 2024</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <PieChart className="h-4 w-4 text-success" />
                          <div>
                            <p className="font-medium">IEP Progress Summary</p>
                            <p className="text-sm text-muted-foreground">November 2024</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <LineChart className="h-4 w-4 text-purple-500" />
                          <div>
                            <p className="font-medium">Behavioral Analysis Report</p>
                            <p className="text-sm text-muted-foreground">October 2024</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Tracking Modal */}
      <Dialog open={progressModalOpen} onOpenChange={setProgressModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Track Progress
            </DialogTitle>
            <DialogDescription>
              Update progress for {selectedStudent?.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Progress Category *</label>
              <Select value={progressCategory} onValueChange={setProgressCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select progress category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic_performance">Academic Performance</SelectItem>
                  <SelectItem value="iep_goals">IEP Goals</SelectItem>
                  <SelectItem value="behavioral_progress">Behavioral Progress</SelectItem>
                  <SelectItem value="social_skills">Social Skills</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="motor_skills">Motor Skills</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Specific Goal (Optional)</label>
              <Input
                placeholder="e.g., Reading comprehension improvement"
                value={progressGoal}
                onChange={(e) => setProgressGoal(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Progress Notes *</label>
              <Textarea
                placeholder="Describe the student's progress, achievements, challenges, and next steps..."
                value={progressNotes}
                onChange={(e) => setProgressNotes(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setProgressModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitProgressUpdate}
                disabled={submittingProgress || !progressCategory || !progressNotes}
                className="flex-1"
              >
                {submittingProgress ? 'Submitting...' : 'Submit Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}