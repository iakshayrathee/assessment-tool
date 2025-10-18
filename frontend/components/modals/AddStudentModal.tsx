'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Save,
  Calendar,
  School,
  GraduationCap
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { GRADE_LIST, SYLLABUS_LIST } from '@/lib/staticData';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';

interface StudentFormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  grade: string;
  motherTongue: string;
  syllabus: string;
  schoolId: string;
}

interface School {
  id: string;
  name: string;
}

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded: () => void;
}

export default function AddStudentModal({ isOpen, onClose, onStudentAdded }: AddStudentModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [formData, setFormData] = useState<StudentFormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    grade: '',
    motherTongue: '',
    syllabus: '',
    schoolId: ''
  });
  const [errors, setErrors] = useState<Partial<StudentFormData>>({});

  useEffect(() => {
    if (isOpen) {
      loadSchools();
    }
  }, [isOpen]);

  const loadSchools = async () => {
    try {
      const centerId = user?.profile?.id;
      if (!centerId) return;

      const schoolsData = await apiClient.getCenterSchools(centerId);
      setSchools(schoolsData);
    } catch (error) {
      console.error('Failed to load schools:', error);
      toast({
        title: "Error",
        description: "Failed to load schools. Please try again.",
        variant: "destructive",
      });
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

    if (!formData.grade) {
      newErrors.grade = 'Grade is required';
    }

    if (!formData.schoolId) {
      newErrors.schoolId = 'School selection is required';
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
        grade: formData.grade,
        motherTongue: formData.motherTongue.trim() || undefined,
        syllabus: formData.syllabus || undefined,
        centerId,
        schoolId: formData.schoolId
      };

      await apiClient.createStudent(studentData);
      
      toast({
        title: "Success",
        description: "Student added successfully!",
      });

      // Reset form
      setFormData({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        grade: '',
        motherTongue: '',
        syllabus: '',
        schoolId: ''
      });
      setErrors({});
      
      onStudentAdded();
      onClose();
    } catch (error: any) {
      console.error('Failed to create student:', error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        fullName: '',
        dateOfBirth: '',
        gender: '',
        grade: '',
        motherTongue: '',
        syllabus: '',
        schoolId: ''
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Student
          </DialogTitle>
          <DialogDescription>
            Enroll a new student to your center
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Student Information
            </h3>
            
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grade" className="text-sm font-medium flex items-center">
                  <GraduationCap className="h-4 w-4 mr-1" />
                  Grade/Class *
                </Label>
                <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                  <SelectTrigger className={errors.grade ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LIST.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Syllabus
                </Label>
                <Select value={formData.syllabus} onValueChange={(value) => handleInputChange('syllabus', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select syllabus" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYLLABUS_LIST.map((syllabus) => (
                      <SelectItem key={syllabus} value={syllabus}>
                        {syllabus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>



          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Student...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Add Student
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}