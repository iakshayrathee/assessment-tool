'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  GraduationCap,
  Search,
  Filter,
  Eye,
  Edit,
  UserPlus,
  School,
  Calendar,
  User,
  Save,
  X,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { School as SchoolType } from '../../../app/admin/centers-schools/[id]/page';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

// Extended Student interface to include additional fields
interface Student {
  id: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  grade: string;
  status: string;
  registrationDate: string;
  schoolId?: string;
  school?: {
    id: string;
    name: string;
  };
  motherTongue?: string;
  syllabus?: string;
}

interface StudentsListingProps {
  centerId: string;
  students: Student[];
  schools: SchoolType[];
  onUpdate: () => void;
}

interface StudentFormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  grade: string;
  schoolId: string;
  status: string;
  motherTongue?: string;
  syllabus?: string;
}

export default function StudentsListing({ centerId, students, schools, onUpdate }: StudentsListingProps) {
  // Function declarations moved to the top to avoid TypeScript errors
  const resetForm = () => {
    setStudentFormData({
      fullName: '',
      dateOfBirth: '',
      gender: 'MALE',
      grade: '',
      schoolId: '',
      status: 'ACTIVE',
      motherTongue: '',
      syllabus: ''
    });
  };

  const validateForm = () => {
    return (
      studentFormData.fullName.trim() !== '' &&
      studentFormData.dateOfBirth.trim() !== '' &&
      studentFormData.grade.trim() !== ''
    );
  };

  const calculateAge = (dateOfBirth: string): number => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleAddStudent = async () => {
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Process the schoolId - convert empty or 'unassigned' to null
      const processedSchoolId = studentFormData.schoolId && studentFormData.schoolId !== 'unassigned' ? 
        studentFormData.schoolId : null;
      
      const studentData = {
        ...studentFormData,
        schoolId: processedSchoolId,
        centerId,
        age: calculateAge(studentFormData.dateOfBirth),
      };
      
      await apiClient.createStudent(studentData);
      toast({
        title: "Success",
        description: "Student added successfully.",
      });
      setShowAddStudent(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Failed to add student:', error);
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    setStudentFormData({
      fullName: student.fullName,
      dateOfBirth: new Date(student.dateOfBirth).toISOString().split('T')[0],
      gender: student.gender,
      grade: student.grade,
      schoolId: student.schoolId || 'unassigned',
      status: student.status,
      motherTongue: student.motherTongue || '',
      syllabus: student.syllabus || ''
    });
    setEditingStudent(student.id);
  };

  const handleViewStudent = (student: Student) => {
    setViewingStudent(student.id);
  };

  const handleUpdateStudent = async (studentId: string) => {
    if (!validateForm()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Process the schoolId - convert empty or 'unassigned' to null
      const processedSchoolId = studentFormData.schoolId && studentFormData.schoolId !== 'unassigned' ? 
        studentFormData.schoolId : null;
      
      const studentData = {
        ...studentFormData,
        schoolId: processedSchoolId,
        age: calculateAge(studentFormData.dateOfBirth),
      };
      
      await apiClient.updateStudent(studentId, studentData);
      toast({
        title: "Success",
        description: "Student updated successfully.",
      });
      setEditingStudent(null);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Failed to update student:', error);
      toast({
        title: "Error",
        description: "Failed to update student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      setLoading(true);
      await apiClient.deleteStudent(studentId);
      toast({
        title: "Success",
        description: "Student deleted successfully.",
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to delete student:', error);
      toast({
        title: "Error",
        description: "Failed to delete student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStudentForm = () => {
    return (
      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={studentFormData.fullName}
            onChange={(e) => setStudentFormData({...studentFormData, fullName: e.target.value})}
            placeholder="Enter student's full name"
            required
          />
        </div>
        
        <div>
          <ProfessionalDatePicker
            label="Date of Birth"
            value={studentFormData.dateOfBirth ? new Date(studentFormData.dateOfBirth) : null}
            onChange={(date) => setStudentFormData({...studentFormData, dateOfBirth: date ? date.toISOString().split('T')[0] : ''})}
            required={true}
            placeholder="Select date of birth"
            toYear={new Date().getFullYear()}
          />
        </div>
        
        <div>
          <Label>Gender *</Label>
          <RadioGroup 
            value={studentFormData.gender} 
            onValueChange={(value: string) => setStudentFormData({...studentFormData, gender: value})}
            className="flex space-x-4 pt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MALE" id="gender-male" />
              <Label htmlFor="gender-male">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="FEMALE" id="gender-female" />
              <Label htmlFor="gender-female">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="OTHER" id="gender-other" />
              <Label htmlFor="gender-other">Other</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div>
          <Label htmlFor="grade">Grade *</Label>
          <Input
            id="grade"
            value={studentFormData.grade}
            onChange={(e) => setStudentFormData({...studentFormData, grade: e.target.value})}
            placeholder="Enter grade (e.g., 5, 6, 7)"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="school">School</Label>
          <Select 
            value={studentFormData.schoolId} 
            onValueChange={(value) => setStudentFormData({...studentFormData, schoolId: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a school" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">No School (Unassigned)</SelectItem>
              {schools.map(school => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="status">Status *</Label>
          <Select 
            value={studentFormData.status} 
            onValueChange={(value) => setStudentFormData({...studentFormData, status: value})}
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
        
        <div>
          <Label htmlFor="motherTongue">Mother Tongue</Label>
          <Input
            id="motherTongue"
            value={studentFormData.motherTongue || ''}
            onChange={(e) => setStudentFormData({...studentFormData, motherTongue: e.target.value})}
            placeholder="Enter mother tongue"
          />
        </div>
        
        <div>
          <Label htmlFor="syllabus">Syllabus</Label>
          <Input
            id="syllabus"
            value={studentFormData.syllabus || ''}
            onChange={(e) => setStudentFormData({...studentFormData, syllabus: e.target.value})}
            placeholder="Enter syllabus"
          />
        </div>
      </div>
    );
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [studentFormData, setStudentFormData] = useState<StudentFormData>({
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    grade: '',
    schoolId: '',
    status: 'ACTIVE',
    motherTongue: '',
    syllabus: ''
  });

  const filteredStudents = students.filter(student => {
    const matchesSearch = !searchQuery || 
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.grade.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSchool = schoolFilter === 'all' || 
      (schoolFilter === 'unassigned' && !student.schoolId) ||
      student.schoolId === schoolFilter;
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter;
    
    return matchesSearch && matchesSchool && matchesStatus && matchesGrade;
  });

  const getUniqueGrades = () => {
    const grades = Array.from(new Set(students.map(s => s.grade)));
    return grades.sort();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'GRADUATED':
        return 'outline';
      case 'TRANSFERRED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'INACTIVE':
        return 'Inactive';
      case 'GRADUATED':
        return 'Graduated';
      case 'TRANSFERRED':
        return 'Transferred';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              Students ({filteredStudents.length} of {students.length})
            </CardTitle>
            <CardDescription>
              All students enrolled in this center across all schools
            </CardDescription>
          </div>
          <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Add a new student to this center
                </DialogDescription>
              </DialogHeader>
              {renderStudentForm()}
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddStudent(false);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddStudent}
                  disabled={loading || !validateForm()}
                >
                  {loading ? 'Adding...' : 'Add Student'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name or grade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {schools.map(school => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="GRADUATED">Graduated</SelectItem>
                <SelectItem value="TRANSFERRED">Transferred</SelectItem>
              </SelectContent>
            </Select>

            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {getUniqueGrades().length > 0 ? (
                  getUniqueGrades().map(grade => (
                    <SelectItem key={grade} value={grade}>
                      Grade {grade}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-grades" disabled>
                    No grades available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {(searchQuery || schoolFilter !== 'all' || statusFilter !== 'all' || gradeFilter !== 'all') && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Search: {searchQuery}
                </Badge>
              )}
              {schoolFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  School: {schoolFilter === 'unassigned' ? 'Unassigned' : 
                    schools.find(s => s.id === schoolFilter)?.name || schoolFilter}
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Status: {getStatusText(statusFilter)}
                </Badge>
              )}
              {gradeFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  Grade: {gradeFilter}
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery('');
                  setSchoolFilter('all');
                  setStatusFilter('all');
                  setGradeFilter('all');
                }}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {students.length === 0 ? 'No students found' : 'No students match your filters'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {students.length === 0 
                  ? "This center doesn't have any students enrolled yet."
                  : "Try adjusting your search criteria or filters."
                }
              </p>
              {students.length === 0 && (
                <Button onClick={() => setShowAddStudent(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Student
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Details</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Age & Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">{student.fullName}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {student.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {student.school?.name ? student.school.name : (
                            <span className="text-muted-foreground italic">
                              No school assigned
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {student.grade}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        <div>{student.age} years old</div>
                        <div className="text-muted-foreground">{student.gender}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant={getStatusColor(student.status)}>
                        {getStatusText(student.status)}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(student.registrationDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewStudent(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Student</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {student?.fullName}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => {
                                  if (student) {
                                    handleDeleteStudent(student.id);
                                  }
                                }}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Student
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {students.filter(s => s.status === 'ACTIVE').length}
              </div>
              <div className="text-sm text-muted-foreground">Active Students</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {students.filter(s => s.schoolId).length}
              </div>
              <div className="text-sm text-muted-foreground">Assigned to Schools</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {getUniqueGrades().length}
              </div>
              <div className="text-sm text-muted-foreground">Grade Levels</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(students.reduce((sum, s) => sum + s.age, 0) / students.length) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Average Age</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  // Student CRUD functions are now defined at the top of the component
  
  // Student View/Edit Modals
  if (editingStudent) {
    const student = students.find(s => s.id === editingStudent);
    if (student) {
      return (
        <div className="space-y-6">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Edit Student
                </CardTitle>
                <CardDescription>
                  Update student information
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setEditingStudent(null);
                  resetForm();
                }}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </CardHeader>
            <CardContent>
              {renderStudentForm()}
              <div className="flex justify-end mt-6 space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingStudent(null);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (student) {
                      handleUpdateStudent(student.id);
                    }
                  }}
                  disabled={loading || !validateForm()}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
  }
  
  if (viewingStudent) {
    const student = students.find(s => s.id === viewingStudent);
    if (!student) {
      return null;
    }
    // TypeScript assertion: student is guaranteed to exist after the null check above
    const studentData = student!;
    return (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-purple-600" />
                  Student Details
                </CardTitle>
                <CardDescription>
                  Viewing detailed information for {studentData.fullName}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setViewingStudent(null)}
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Personal Information</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Full Name:</span>
                        <span>{studentData.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Date of Birth:</span>
                        <span>{studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Age:</span>
                        <span>{studentData.age} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Gender:</span>
                        <span>{studentData.gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Mother Tongue:</span>
                        <span>{studentData.motherTongue || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status Information</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Status:</span>
                        {studentData.status && (
                          <Badge variant={getStatusColor(studentData.status)}>
                            {getStatusText(studentData.status)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Registration Date:</span>
                        <span>{studentData.registrationDate ? new Date(studentData.registrationDate).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Educational Information</h3>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Grade:</span>
                        <span>{studentData.grade}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Syllabus:</span>
                        <span>{studentData.syllabus || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">School:</span>
                        <span>{studentData.school?.name || 'Not assigned to any school'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
                    <div className="mt-2 flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setViewingStudent(null);
                          handleEditStudent(studentData);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Student
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Student
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Student</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {studentData.fullName}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => {
                                handleDeleteStudent(studentData.id);
                                setViewingStudent(null);
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Student
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }
}
