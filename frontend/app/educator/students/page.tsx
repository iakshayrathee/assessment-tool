'use client';

import { useState } from 'react';
import { useEducatorStudents } from '@/hooks/useEducator';
import { useSpecialEducatorProfile } from '@/hooks/useSpecialEducator';
import { useStudents } from '@/hooks/useStudents';
// Use route-level UnifiedLayout; remove page-level EducatorLayout
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  Users, 
  Filter,
  Eye,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';

// Student Registration Modal Component
function StudentRegistrationModal({ onStudentRegistered }: { onStudentRegistered: (studentId: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { profile: educatorProfile } = useSpecialEducatorProfile();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    grade: '',
    motherTongue: '',
    syllabus: '',
    schoolName: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setFieldErrors({});
    setIsCreating(true);
    
    try {
      // Get centerId from educator's centerAssignments
      const centerId = educatorProfile?.centerAssignments?.[0]?.centerId;
      
      if (!centerId) {
        toast.error('No center assignment found for educator. Please contact administrator.');
        return;
      }
      
      // Calculate age from date of birth
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      // Convert date to ISO-8601 DateTime format for Prisma
      const dateOfBirthISO = new Date(formData.dateOfBirth + 'T00:00:00.000Z').toISOString();
      
      // Prepare student data for API
      const studentData = {
        fullName: formData.fullName,
        dateOfBirth: dateOfBirthISO,
        age,
        gender: formData.gender,
        grade: formData.grade,
        motherTongue: formData.motherTongue || '',
        syllabus: formData.syllabus || '',
        // Note: schoolName is just a text field, not a proper school ID
        // We'll skip schoolId for now until proper school selection is implemented
        schoolId: null,
        centerId,
      };

      // Call the API to create student
      const newStudent = await apiClient.createStudent(studentData);
      
      // Invalidate all relevant caches to refresh the lists
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['specialEducator', 'students']
        }),
        queryClient.invalidateQueries({
          queryKey: ['students']
        })
      ]);
      
      // Show success message
      toast.success('Student registered successfully!');
      
      // Close modal
      setIsOpen(false);
      
      // Longer delay to ensure cache invalidation completes and data is available
      setTimeout(() => {
        onStudentRegistered(newStudent.id);
      }, 500);
      
    } catch (error: any) {
      console.error('Failed to register student:', error);
      
      // Handle validation errors
      if (error.response?.status === 400 && error.response?.data?.error === 'Validation failed') {
        // If there are field-specific errors, display them
        if (error.response?.data?.details) {
          const errors: Record<string, string> = {};
          error.response.data.details.forEach((detail: any) => {
            if (detail.field) {
              errors[detail.field] = detail.message;
            }
          });
          setFieldErrors(errors);
        } else {
          // Generic validation error
          toast.error('Please check your input and try again');
        }
      } else {
        // Other errors
        toast.error(error.response?.data?.message || 'Failed to register student');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Register New Student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Student</DialogTitle>
          <DialogDescription>
            Add a new student with essential information. The student will be automatically assigned to you and your center.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Student Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter student's full name"
                  required
                  className={fieldErrors.fullName ? 'border-red-500' : ''}
                />
                {fieldErrors.fullName && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.fullName}</p>
                )}
                {!fieldErrors.fullName && (
                  <p className="text-xs text-gray-500 mt-1">Enter the student's complete first and last name (2-100 characters)</p>
                )}
              </div>
              <div>
                <ProfessionalDatePicker
                  label="Date of Birth"
                  value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                  onChange={(date) => handleInputChange('dateOfBirth', date ? date.toISOString().split('T')[0] : '')}
                  required={true}
                  placeholder="Select date of birth"
                  error={fieldErrors.dateOfBirth}
                  toYear={new Date().getFullYear()}
                />
                {!fieldErrors.dateOfBirth && (
                  <p className="text-xs text-gray-500 mt-1">Select the student's birth date (used to calculate age automatically)</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Gender *</label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger className={fieldErrors.gender ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.gender && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.gender}</p>
                )}
                {!fieldErrors.gender && (
                  <p className="text-xs text-gray-500 mt-1">Choose from Male, Female, or Other</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Grade *</label>
                <Input
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  placeholder="e.g., Grade 2"
                  required
                  className={fieldErrors.grade ? 'border-red-500' : ''}
                />
                {fieldErrors.grade && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.grade}</p>
                )}
                {!fieldErrors.grade && (
                  <p className="text-xs text-gray-500 mt-1">Enter grade level (e.g., "Grade 1", "Kindergarten", "Pre-K")</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Mother Tongue</label>
                <Input
                  value={formData.motherTongue}
                  onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                  placeholder="e.g., Hindi, English, Tamil"
                  className={fieldErrors.motherTongue ? 'border-red-500' : ''}
                />
                {fieldErrors.motherTongue && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.motherTongue}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Syllabus</label>
                <Select value={formData.syllabus} onValueChange={(value) => handleInputChange('syllabus', value)}>
                  <SelectTrigger className={fieldErrors.syllabus ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select syllabus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBSE">CBSE</SelectItem>
                    <SelectItem value="ICSE">ICSE</SelectItem>
                    <SelectItem value="STATE_BOARD">State Board</SelectItem>
                    <SelectItem value="OTHERS">Others</SelectItem>
                  </SelectContent>
                </Select>
                {fieldErrors.syllabus && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.syllabus}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">School Name (Optional)</label>
                <Input
                  value={formData.schoolName}
                  onChange={(e) => handleInputChange('schoolName', e.target.value)}
                  placeholder="Enter school name (optional)"
                  className={fieldErrors.schoolName ? 'border-red-500' : ''}
                />
                {fieldErrors.schoolName && (
                  <p className="text-sm text-red-500 mt-1">{fieldErrors.schoolName}</p>
                )}
                {!fieldErrors.schoolName && (
                  <p className="text-xs text-gray-500 mt-1">Enter the school name if applicable</p>
                )}
              </div>
            </div>
          </div>

          {/* Assignment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Assignment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned Center</label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">Current Center</p>
                  <p className="text-sm text-gray-600">Auto-assigned based on your login</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned Educator</label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">You</p>
                  <p className="text-sm text-gray-600">Auto-assigned to you</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating} className="flex-1">
              {isCreating ? 'Registering...' : 'Register Student'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const router = useRouter();

  const { students, pagination, isLoading } = useEducatorStudents({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    status: statusFilter
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'GRADUATED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'TRANSFERRED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleStudentRegistered = (studentId: string) => {
    // Redirect to student profile page for the newly registered student
    router.push(`/educator/students/${studentId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
            <p className="text-gray-600">Manage and track progress of your assigned students</p>
          </div>
          <Link href="/educator/students/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Register New Student
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagination?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Assigned to you</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {students.filter((s: any) => s.status === 'ACTIVE').length}
                </div>
                <p className="text-xs text-muted-foreground">Currently enrolled</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Assessments</CardTitle>
                <Users className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {students.filter((s: any) => !s.progressSummary || s.progressSummary.totalGoals === 0).length}
                </div>
                <p className="text-xs text-muted-foreground">Need assessment</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {students.length > 0 
                    ? Math.round(
                        students.reduce((sum: number, s: any) => 
                          sum + (s.progressSummary?.averageProgress || 0), 0
                        ) / students.length
                      )
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Across all goals</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              View and manage all students assigned to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search students by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="GRADUATED">Graduated</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Students Grid */}
            <div className="space-y-4">
              {students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || statusFilter 
                      ? "Try adjusting your search or filter criteria"
                      : "You don't have any students assigned yet"
                    }
                  </p>
                  <StudentRegistrationModal onStudentRegistered={handleStudentRegistered} />
                </div>
              ) : (
                students.map((student: any, index: number) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {getInitials(student.fullName)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">{student.fullName}</h3>
                            <Badge className={getStatusColor(student.status)}>
                              {student.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{student.age} years old</span>
                            <span>•</span>
                            <span>{student.grade}</span>
                            <span>•</span>
                            <span>{student.center?.centerName}</span>
                            {student.school && (
                              <>
                                <span>•</span>
                                <span>{student.school.name}</span>
                              </>
                            )}
                          </div>
                          {student.lastSession && (
                            <p className="text-xs text-gray-500 mt-1">
                              Last session: {new Date(student.lastSession).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        {/* Progress Summary */}
                        {student.progressSummary && (
                          <div className="text-right min-w-32">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-medium">{student.progressSummary.averageProgress}%</span>
                            </div>
                            <Progress 
                              value={student.progressSummary.averageProgress} 
                              className="h-2 w-24"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {student.progressSummary.completedGoals}/{student.progressSummary.totalGoals} goals
                            </p>
                          </div>
                        )}

                        {/* Action Button - Only View Profile */}
                        <div className="flex items-center gap-2">
                          <Link href={`/educator/students/${student.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} students
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage >= pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
