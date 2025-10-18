'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Plus,
  UserCheck,
  School,
  Search,
  Filter,
  Eye,
  GraduationCap,
  Calendar,
  BookOpen,
  Building2,
  Mail,
  Phone,
  MoreHorizontal,
  UserX,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { useCenterStudents, useCenterSchools, useCenterEducators } from '@/hooks/useCenter';
import AssignEducatorModal from '@/components/modals/AssignEducatorModal';
import StudentDetailsModal from '@/components/modals/StudentDetailsModal';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  fullName: string;
  grade: string;
  status: string;
  registrationDate: string;
  hasAssignment: boolean;
  school?: {
    id: string;
    name: string;
  };
  assignedEducator?: {
    id: string;
    fullName: string;
  };
  age?: number;
  motherTongue?: string;
  syllabus?: string;
  dateOfBirth?: string;
  gender?: string;
}

export default function CenterStudents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const centerId = user?.profile?.id;

  // State for modals
  const [isAssignEducatorModalOpen, setIsAssignEducatorModalOpen] = useState(false);
  const [isStudentDetailsModalOpen, setIsStudentDetailsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [educatorFilter, setEducatorFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  // Data fetching
  const { 
    students, 
    pagination, 
    isLoading, 
    refetch: refetchStudents
  } = useCenterStudents(centerId, {
    page: 1,
    limit: 100,
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : statusFilter,
    schoolId: schoolFilter === 'all' ? undefined : schoolFilter,
    hasAssignment: assignmentFilter === 'assigned' ? true : (assignmentFilter === 'unassigned' ? false : undefined)
  });

  const { schools } = useCenterSchools(centerId);
  const { educators } = useCenterEducators(centerId);

  // Filter students based on educator filter
  const filteredStudents = useMemo(() => {
    let filtered = students || [];

    if (educatorFilter !== 'all') {
      filtered = filtered.filter(student => 
        student.assignedEducator?.id === educatorFilter
      );
    }

    return filtered;
  }, [students, educatorFilter]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Students Management</h1>
            <p className="text-muted-foreground">Loading students...</p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <PageHeader
        title="Students Management"
        description="Manage all students assigned to your center"
        badge={{
          text: `${filteredStudents.length} Students`,
          variant: 'secondary'
        }}
        actions={[
          {
            label: 'Student Onboarding',
            onClick: () => window.location.href = '/center/students/onboarding',
            icon: Plus
          }
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="GRADUATED">Graduated</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                </SelectContent>
              </Select>

              {/* School Filter */}
              <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="School" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schools</SelectItem>
                  {schools?.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Educator Filter */}
              <Select value={educatorFilter} onValueChange={setEducatorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Educator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Educators</SelectItem>
                  {educators?.map((educator) => (
                    <SelectItem key={educator.id} value={educator.id}>
                      {educator.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Assignment Filter */}
              <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students List
              </div>
              <Badge variant="secondary">
                {filteredStudents.length} Students
              </Badge>
            </CardTitle>
            <CardDescription>
              Manage all students assigned to your center
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' || schoolFilter !== 'all' || educatorFilter !== 'all' || assignmentFilter !== 'all'
                    ? 'No students match your current filters.'
                    : 'No students have been assigned to your center yet.'}
                </p>
                <Button asChild>
                  <Link href="/center/students/onboarding">
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Student
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{student.fullName}</span>
                            {student.age && (
                              <span className="text-sm text-muted-foreground">
                                Age: {student.age}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.grade}</Badge>
                        </TableCell>
                        <TableCell>
                          {student.school ? (
                            <div className="flex items-center gap-2">
                              <School className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{student.school.name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No school</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className={
                              student.status === 'ACTIVE' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : student.status === 'INACTIVE'
                                ? 'bg-gray-100 text-gray-800'
                                : student.status === 'GRADUATED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-800'
                            }
                          >
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {student.hasAssignment && student.assignedEducator ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">
                                  {student.assignedEducator.fullName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Assigned
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              <span className="text-sm text-orange-600">Unassigned</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(student.registrationDate).toLocaleDateString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setIsStudentDetailsModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedStudentId(student.id);
                                  setSelectedStudent(student);
                                  setIsAssignEducatorModalOpen(true);
                                }}
                              >
                                <UserCheck className="h-4 w-4 mr-2" />
                                {student.hasAssignment ? 'Reassign Educator' : 'Assign Educator'}
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/center/students/${student.id}/reports`}>
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  View Reports
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modals */}
        {isAssignEducatorModalOpen && selectedStudentId && selectedStudent && centerId && (
          <AssignEducatorModal
            isOpen={isAssignEducatorModalOpen}
            onClose={() => {
              setIsAssignEducatorModalOpen(false);
              setSelectedStudentId(null);
              setSelectedStudent(null);
            }}
            studentId={selectedStudentId}
            studentName={selectedStudent.fullName}
            centerId={centerId}
            onAssignmentComplete={() => {
              refetchStudents();
              setIsAssignEducatorModalOpen(false);
              setSelectedStudentId(null);
              setSelectedStudent(null);
            }}
          />
        )}

        {isStudentDetailsModalOpen && selectedStudent && (
          <StudentDetailsModal
            isOpen={isStudentDetailsModalOpen}
            onClose={() => {
              setIsStudentDetailsModalOpen(false);
              setSelectedStudent(null);
            }}
            studentId={selectedStudent.id}
          />
        )}
      </div>
    </div>
  );
}
