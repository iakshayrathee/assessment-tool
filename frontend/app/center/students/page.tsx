'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  CheckCircle,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { useCenterStudents, useCenterSchools, useCenterEducators } from '@/hooks/useCenter';
import AssignEducatorModal from '@/components/modals/AssignEducatorModal';
import StudentDetailsModal from '@/components/modals/StudentDetailsModal';
import { useToast } from '@/hooks/use-toast';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api';

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
  const queryClient = useQueryClient();
  const centerId = user?.profile?.id;

  // Mutation for updating student
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiClient.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centerStudents', centerId] });
      toast({
        title: 'Success',
        description: 'Student updated successfully',
        variant: 'default'
      });
      setIsEditStudentModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update student',
        variant: 'destructive'
      });
    }
  });

  // State for modals
  const [isAssignEducatorModalOpen, setIsAssignEducatorModalOpen] = useState(false);
  const [isStudentDetailsModalOpen, setIsStudentDetailsModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // State for edit form
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    age: 0,
    gender: '',
    grade: '',
    motherTongue: '',
    syllabus: '',
    status: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentPassword: '',
    address: '',
    parentEmergencyContact: ''
  });

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

  // Handler for opening edit modal
  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    console.log('Center student data:', student);
    console.log('Center parent data:', student.parent);
    
    setEditFormData({
      fullName: student.fullName || '',
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      age: calculateAge(student.dateOfBirth) || 0,
      gender: student.gender || '',
      grade: student.grade || '',
      motherTongue: student.motherTongue || '',
      syllabus: student.syllabus || '',
      status: student.status || '',
      parentName: student.parent?.fullName || '',
      parentPhone: student.parent?.phone || '',
      parentEmail: student.parent?.user?.email || '',
      parentPassword: '',
      address: student.parent?.address || '',
      parentEmergencyContact: student.parent?.emergencyContact || ''
    });
    setIsEditStudentModalOpen(true);
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Handler for form input changes
  const handleInputChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty parent fields to avoid validation errors
    const filteredData = { ...editFormData };
    
    // Remove empty parent fields
    if (!filteredData.parentName) delete filteredData.parentName;
    if (!filteredData.parentPhone) delete filteredData.parentPhone;
    if (!filteredData.parentEmail) delete filteredData.parentEmail;
    if (!filteredData.address) delete filteredData.address;
    if (!filteredData.parentEmergencyContact) delete filteredData.parentEmergencyContact;
    if (!filteredData.parentPassword) delete filteredData.parentPassword;
    
    if (selectedStudent) {
      updateStudentMutation.mutate({
        id: selectedStudent.id,
        data: filteredData
      });
    }
  };

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
    <PageWrapper
      title="Students Management"
      description="Manage all students assigned to your center"
      breadcrumbs={[{ label: 'Center' }, { label: 'Students' }]}
      actions={
        <Button onClick={() => window.location.href = '/center/students/onboarding'}>
          <Plus className="h-4 w-4 mr-2" />
          Student Onboarding
        </Button>
      }
    >
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
                                ? 'bg-success/10 text-foreground hover:bg-green-200' 
                                : student.status === 'INACTIVE'
                                ? 'bg-muted text-foreground'
                                : student.status === 'GRADUATED'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-warning/10 text-foreground'
                            }
                          >
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {student.hasAssignment && student.assignedEducator ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-success" />
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
                              <AlertCircle className="h-4 w-4 text-warning" />
                              <span className="text-sm text-warning">Unassigned</span>
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
                                onClick={() => handleEditStudent(student)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Profile
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

        {/* Edit Student Modal */}
        <Dialog open={isEditStudentModalOpen} onOpenChange={setIsEditStudentModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Student Profile</DialogTitle>
              <DialogDescription>
                Update student information and parent details.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Student Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={editFormData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={editFormData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={editFormData.age}
                      onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={editFormData.gender}
                      onValueChange={(value) => handleInputChange('gender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade</Label>
                    <Input
                      id="grade"
                      value={editFormData.grade}
                      onChange={(e) => handleInputChange('grade', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="motherTongue">Mother Tongue</Label>
                    <Input
                      id="motherTongue"
                      value={editFormData.motherTongue}
                      onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="syllabus">Syllabus</Label>
                    <Input
                      id="syllabus"
                      value={editFormData.syllabus}
                      onChange={(e) => handleInputChange('syllabus', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editFormData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="GRADUATED">Graduated</SelectItem>
                        <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Parent Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Parent Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">Parent Name</Label>
                    <Input
                      id="parentName"
                      value={editFormData.parentName}
                      onChange={(e) => handleInputChange('parentName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Parent Phone</Label>
                    <Input
                      id="parentPhone"
                      value={editFormData.parentPhone}
                      onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">Parent Email</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={editFormData.parentEmail}
                      onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parentPassword">Parent Password (for new accounts)</Label>
                    <Input
                      id="parentPassword"
                      type="password"
                      value={editFormData.parentPassword}
                      onChange={(e) => handleInputChange('parentPassword', e.target.value)}
                      placeholder="Required for new parent accounts"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentAddress">Parent Address</Label>
                    <Input
                      id="parentAddress"
                      value={editFormData.parentAddress}
                      onChange={(e) => handleInputChange('parentAddress', e.target.value)}
                      placeholder="Enter parent address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentEmergencyContact">Emergency Contact</Label>
                    <Input
                      id="parentEmergencyContact"
                      value={editFormData.parentEmergencyContact}
                      onChange={(e) => handleInputChange('parentEmergencyContact', e.target.value)}
                      placeholder="Emergency contact information"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditStudentModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateStudentMutation.isPending}
                >
                  {updateStudentMutation.isPending ? 'Updating...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Student
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </PageWrapper>
  );
}
