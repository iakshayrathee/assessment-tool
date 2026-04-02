'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Calendar,
  GraduationCap,
  Building,
  School,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import CenterSchoolSelectionModal from '@/components/modals/CenterSchoolSelectionModal';
import { PageWrapper } from '@/components/layout/PageWrapper';

interface StudentFormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  grade: string;
  motherTongue: string;
  syllabus: string;
  schoolId?: string;
  parentFullName: string;
  parentPhone: string;
  parentEmail: string; // Changed from optional to required
  parentAddress?: string;
  parentPassword: string;
  relationship: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    grade: '',
    motherTongue: '',
    syllabus: '',
    schoolId: '',
    parentFullName: '',
    parentPhone: '',
    parentEmail: '',
    parentAddress: '',
    parentPassword: '',
    relationship: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [selectedSchoolName, setSelectedSchoolName] = useState('');

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 2 || age > 20) {
        newErrors.dateOfBirth = 'Age must be between 2 and 20 years';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade/Standard is required';
    }

    // Parent/Guardian validation - phone is required for parent user creation
    if (!formData.parentFullName.trim()) {
      newErrors.parentFullName = 'Parent/Guardian name is required';
    }

    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = 'Phone number is required for parent account creation';
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.parentPhone.replace(/\D/g, ''))) {
      newErrors.parentPhone = 'Please enter a valid phone number';
    }

    if (!formData.relationship) {
      newErrors.relationship = 'Relationship is required';
    }

    // School validation - now required
    if (!formData.schoolId) {
      newErrors.schoolId = 'School selection is required';
    }

    // Parent email validation - now required
    if (!formData.parentEmail.trim()) {
      newErrors.parentEmail = 'Email address is required for parent account';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid email address';
    }

    // Parent password validation - required
    if (!formData.parentPassword.trim()) {
      newErrors.parentPassword = 'Password is required for parent account';
    } else if (formData.parentPassword.length < 6) {
      newErrors.parentPassword = 'Password must be at least 6 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create student data with parent information for automatic parent user creation
      const studentData = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        grade: formData.grade,
        motherTongue: formData.motherTongue || '',
        syllabus: formData.syllabus || '',
        schoolId: formData.schoolId || null,
        centerId: user?.profile?.id || '', // Auto-filled from educator's center
        // Parent information for automatic parent user creation
        parentName: formData.parentFullName,
        parentPhone: formData.parentPhone,
        parentEmail: formData.parentEmail || '',
        parentPassword: formData.parentPassword, // Include parent password for account creation
        address: formData.parentAddress || '',
        relationship: formData.relationship, // Relationship for parent profile
      };

      const response = await apiClient.createStudent(studentData);
      
      toast({
        title: "Success",
        description: "Student registered successfully!",
      });

      // Redirect to student profile or list
      router.push(`/educator/students/${response.id}`);
      
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to register student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSchoolSelect = (schoolId: string, schoolName: string) => {
    setFormData(prev => ({ ...prev, schoolId }));
    setSelectedSchoolName(schoolName);
    // Clear any existing school-related errors
    if (errors.schoolId) {
      setErrors(prev => ({ ...prev, schoolId: '' }));
    }
  };

  return (
    <PageWrapper
      title="Register New Student"
      description="Add a new student with basic details"
      breadcrumbs={[{ label: 'Educator', href: '/educator' }, { label: 'Students', href: '/educator/students' }, { label: 'New Student' }]}
      className="max-w-4xl mx-auto"
      actions={
        <Link href="/educator/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </Link>
      }
    >

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Student Information
                </CardTitle>
                <CardDescription>
                  Basic details about the student
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter student's full name"
                      className={errors.fullName ? 'border-red-500' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <ProfessionalDatePicker
                      label="Date of Birth"
                      value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                      onChange={(date) => handleInputChange('dateOfBirth', date ? date.toISOString().split('T')[0] : '')}
                      error={errors.dateOfBirth}
                      required={true}
                      placeholder="Select date of birth"
                      toYear={new Date().getFullYear()}
                    />
                    {formData.dateOfBirth && (
                      <p className="text-sm text-muted-foreground">
                        Age: {calculateAge(formData.dateOfBirth)} years
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.gender}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade/Standard *</Label>
                    <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                      <SelectTrigger className={errors.grade ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nursery">Nursery</SelectItem>
                        <SelectItem value="LKG">LKG</SelectItem>
                        <SelectItem value="UKG">UKG</SelectItem>
                        <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                        <SelectItem value="Grade 1">Grade 1</SelectItem>
                        <SelectItem value="Grade 2">Grade 2</SelectItem>
                        <SelectItem value="Grade 3">Grade 3</SelectItem>
                        <SelectItem value="Grade 4">Grade 4</SelectItem>
                        <SelectItem value="Grade 5">Grade 5</SelectItem>
                        <SelectItem value="Grade 6">Grade 6</SelectItem>
                        <SelectItem value="Grade 7">Grade 7</SelectItem>
                        <SelectItem value="Grade 8">Grade 8</SelectItem>
                        <SelectItem value="Grade 9">Grade 9</SelectItem>
                        <SelectItem value="Grade 10">Grade 10</SelectItem>
                        <SelectItem value="Grade 11">Grade 11</SelectItem>
                        <SelectItem value="Grade 12">Grade 12</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.grade && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.grade}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherTongue">Mother Tongue</Label>
                    <Input
                      id="motherTongue"
                      value={formData.motherTongue}
                      onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                      placeholder="e.g., Hindi, English, Tamil"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="syllabus">Syllabus *</Label>
                    <Select value={formData.syllabus} onValueChange={(value) => handleInputChange('syllabus', value)}>
                      <SelectTrigger className={errors.syllabus ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select syllabus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CBSE">CBSE</SelectItem>
                        <SelectItem value="ICSE">ICSE</SelectItem>
                        <SelectItem value="STATE_BOARD">State Board</SelectItem>
                        <SelectItem value="OTHERS">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.syllabus && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.syllabus}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Parent/Guardian Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Parent/Guardian Information
                </CardTitle>
                <CardDescription>
                  Contact details for the student's parent or guardian
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentFullName">Full Name *</Label>
                    <Input
                      id="parentFullName"
                      value={formData.parentFullName}
                      onChange={(e) => handleInputChange('parentFullName', e.target.value)}
                      placeholder="Enter parent/guardian name"
                      className={errors.parentFullName ? 'border-red-500' : ''}
                    />
                    {errors.parentFullName && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.parentFullName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship *</Label>
                    <Select value={formData.relationship} onValueChange={(value) => handleInputChange('relationship', value)}>
                      <SelectTrigger className={errors.relationship ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Father">Father</SelectItem>
                        <SelectItem value="Mother">Mother</SelectItem>
                        <SelectItem value="Guardian">Guardian</SelectItem>
                        <SelectItem value="Grandparent">Grandparent</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.relationship && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.relationship}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Phone Number *</Label>
                    <Input
                      id="parentPhone"
                      value={formData.parentPhone}
                      onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                      placeholder="Enter 10-digit phone number"
                      className={errors.parentPhone ? 'border-red-500' : ''}
                    />
                    {errors.parentPhone && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.parentPhone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">Email Address *</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                      placeholder="Enter email address for parent account"
                      className={errors.parentEmail ? 'border-red-500' : ''}
                    />
                    {errors.parentEmail && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.parentEmail}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPassword">Password *</Label>
                    <Input
                      id="parentPassword"
                      type="password"
                      value={formData.parentPassword}
                      onChange={(e) => handleInputChange('parentPassword', e.target.value)}
                      placeholder="Enter password for parent account"
                      className={errors.parentPassword ? 'border-red-500' : ''}
                    />
                    {errors.parentPassword && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.parentPassword}
                      </p>
                    )}
                  </div>



                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="parentAddress">Address</Label>
                    <Textarea
                      id="parentAddress"
                      value={formData.parentAddress}
                      onChange={(e) => handleInputChange('parentAddress', e.target.value)}
                      placeholder="Enter complete address (optional)"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Center Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Assignment Information
                </CardTitle>
                <CardDescription>
                  Center and school assignment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assigned Educator</Label>
                    <div className="p-3 bg-muted/40 rounded-md">
                      <p className="font-medium">{user?.profile?.fullName || 'You'}</p>
                      <p className="text-sm text-muted-foreground">Auto-assigned to you</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolId">School Name *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="schoolId"
                      value={selectedSchoolName}
                      placeholder="Select a school from your assigned centers"
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSchoolModalOpen(true)}
                    >
                      <School className="h-4 w-4 mr-2" />
                      Select School
                    </Button>
                  </div>
                  {errors.schoolId && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.schoolId}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    School selection is now required. Choose from your assigned centers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-end gap-4 pt-6"
          >
            <Link href="/educator/students">
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Register Student
                </>
              )}
            </Button>
          </motion.div>
        </form>

        {/* School Selection Modal */}
      <CenterSchoolSelectionModal
        isOpen={isSchoolModalOpen}
        onClose={() => setIsSchoolModalOpen(false)}
        onSchoolSelected={handleSchoolSelect}
      />
    </PageWrapper>
  );
}