'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  ArrowLeft,
  Save,
  Calendar,
  School,
  Users,
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface StudentFormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  grade: string;
  motherTongue: string;
  syllabus: string;
  schoolId: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentAddress: string;
  emergencyContact: string;
  relationship: string;
}

interface School {
  id: string;
  name: string;
}

export default function NewStudent() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    grade: '',
    motherTongue: '',
    syllabus: '',
    schoolId: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentAddress: '',
    emergencyContact: '',
    relationship: 'Parent'
  });
  const [errors, setErrors] = useState<Partial<StudentFormData>>({});

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const centerId = user?.profile?.id;
      if (!centerId) return;

      const schoolsData = await apiClient.getCenterSchools(centerId);
      setSchools(schoolsData);
    } catch (error) {
      console.error('Failed to load schools:', error);
      // Mock data
      setSchools([
        { id: '1', name: 'St. Mary\'s School' },
        { id: '2', name: 'Delhi Public School' },
        { id: '3', name: 'Ryan International School' }
      ]);
    }
  };

  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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

  const validateForm = (): boolean => {
    const newErrors: Partial<StudentFormData> = {};

    // Student Information
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Student name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 3 || age > 25) {
        newErrors.dateOfBirth = 'Age must be between 3 and 25 years';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.grade.trim()) {
      newErrors.grade = 'Grade is required';
    }

    if (!formData.schoolId) {
      newErrors.schoolId = 'School selection is required';
    }

    // Parent Information
    if (!formData.parentName.trim()) {
      newErrors.parentName = 'Parent/Guardian name is required';
    }

    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = 'Parent phone number is required';
    } else if (!/^[\+]?[0-9\-\s\(\)]{10,}$/.test(formData.parentPhone)) {
      newErrors.parentPhone = 'Please enter a valid phone number';
    }

    if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid email address';
    }

    if (!formData.parentAddress.trim()) {
      newErrors.parentAddress = 'Address is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const centerId = user?.profile?.id;
      if (!centerId) {
        throw new Error('Center ID not found');
      }

      const age = calculateAge(formData.dateOfBirth);

      const studentData = {
        // Student data
        fullName: formData.fullName.trim(),
        dateOfBirth: formData.dateOfBirth,
        age,
        gender: formData.gender,
        grade: formData.grade.trim(),
        motherTongue: formData.motherTongue.trim() || undefined,
        syllabus: formData.syllabus.trim() || undefined,
        centerId,
        schoolId: formData.schoolId,
        
        // Parent data
        parent: {
          fullName: formData.parentName.trim(),
          phone: formData.parentPhone.trim(),
          email: formData.parentEmail.trim() || undefined,
          address: formData.parentAddress.trim(),
          emergencyContact: formData.emergencyContact.trim() || undefined,
          relationship: formData.relationship
        }
      };

      await apiClient.createStudent(studentData);
      router.push('/center/students');
    } catch (error: any) {
      console.error('Failed to create student:', error);
      setErrors({ fullName: 'Failed to create student. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/center/students">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Students
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
                <p className="text-gray-600">Enroll a new student to your center</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Student Information</CardTitle>
                  <CardDescription>
                    Basic details about the student
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter student's full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              {/* Date of Birth and Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Date of Birth *
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className={errors.dateOfBirth ? 'border-red-500' : ''}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-600">{errors.dateOfBirth}</p>
                  )}
                  {formData.dateOfBirth && (
                    <p className="text-sm text-gray-600">
                      Age: {calculateAge(formData.dateOfBirth)} years
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">
                    Gender *
                  </Label>
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
                    <p className="text-sm text-red-600">{errors.gender}</p>
                  )}
                </div>
              </div>

              {/* Grade and School */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="grade" className="text-sm font-medium flex items-center">
                    <GraduationCap className="h-4 w-4 mr-1" />
                    Grade/Class *
                  </Label>
                  <Input
                    id="grade"
                    type="text"
                    placeholder="e.g., 5th, Class 7, Pre-K"
                    value={formData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    className={errors.grade ? 'border-red-500' : ''}
                  />
                  {errors.grade && (
                    <p className="text-sm text-red-600">{errors.grade}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolId" className="text-sm font-medium flex items-center">
                    <School className="h-4 w-4 mr-1" />
                    School *
                  </Label>
                  <Select value={formData.schoolId} onValueChange={(value) => handleInputChange('schoolId', value)}>
                    <SelectTrigger className={errors.schoolId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id}>
                          {school.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.schoolId && (
                    <p className="text-sm text-red-600">{errors.schoolId}</p>
                  )}
                </div>
              </div>

              {/* Mother Tongue and Syllabus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="motherTongue" className="text-sm font-medium">
                    Mother Tongue
                  </Label>
                  <Input
                    id="motherTongue"
                    type="text"
                    placeholder="e.g., Hindi, English, Tamil"
                    value={formData.motherTongue}
                    onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="syllabus" className="text-sm font-medium">
                    Syllabus/Curriculum
                  </Label>
                  <Input
                    id="syllabus"
                    type="text"
                    placeholder="e.g., CBSE, ICSE, State Board"
                    value={formData.syllabus}
                    onChange={(e) => handleInputChange('syllabus', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent/Guardian Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Parent/Guardian Information</CardTitle>
                  <CardDescription>
                    Contact details of the student's parent or guardian
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Parent Name and Relationship */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="parentName" className="text-sm font-medium">
                    Parent/Guardian Name *
                  </Label>
                  <Input
                    id="parentName"
                    type="text"
                    placeholder="Enter parent's full name"
                    value={formData.parentName}
                    onChange={(e) => handleInputChange('parentName', e.target.value)}
                    className={errors.parentName ? 'border-red-500' : ''}
                  />
                  {errors.parentName && (
                    <p className="text-sm text-red-600">{errors.parentName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship" className="text-sm font-medium">
                    Relationship
                  </Label>
                  <Select value={formData.relationship} onValueChange={(value) => handleInputChange('relationship', value)}>
                    <SelectTrigger>
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
                </div>
              </div>

              {/* Phone and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="parentPhone" className="text-sm font-medium">
                    Phone Number *
                  </Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    placeholder="+91-9876543210"
                    value={formData.parentPhone}
                    onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                    className={errors.parentPhone ? 'border-red-500' : ''}
                  />
                  {errors.parentPhone && (
                    <p className="text-sm text-red-600">{errors.parentPhone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentEmail" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    placeholder="parent@example.com"
                    value={formData.parentEmail}
                    onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                    className={errors.parentEmail ? 'border-red-500' : ''}
                  />
                  {errors.parentEmail && (
                    <p className="text-sm text-red-600">{errors.parentEmail}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="parentAddress" className="text-sm font-medium">
                  Address *
                </Label>
                <Input
                  id="parentAddress"
                  type="text"
                  placeholder="Enter complete address"
                  value={formData.parentAddress}
                  onChange={(e) => handleInputChange('parentAddress', e.target.value)}
                  className={errors.parentAddress ? 'border-red-500' : ''}
                />
                {errors.parentAddress && (
                  <p className="text-sm text-red-600">{errors.parentAddress}</p>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2">
                <Label htmlFor="emergencyContact" className="text-sm font-medium">
                  Emergency Contact
                </Label>
                <Input
                  id="emergencyContact"
                  type="text"
                  placeholder="Alternative contact number"
                  value={formData.emergencyContact}
                  onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                />
                <p className="text-sm text-gray-600">
                  Optional: Alternative contact in case primary contact is unavailable
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  * Required fields
                </div>
                
                <div className="flex space-x-3">
                  <Link href="/center/students">
                    <Button type="button" variant="outline" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Student...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Add Student
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
