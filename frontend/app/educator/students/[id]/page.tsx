'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('educator');
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
      newErrors.fullName = t('students.fullNameRequired');
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = t('students.dobRequired');
    } else {
      const age = calculateAge(formData.dateOfBirth);
      if (age < 2 || age > 20) {
        newErrors.dateOfBirth = t('students.ageError');
      }
    }

    if (!formData.gender) {
      newErrors.gender = t('students.genderRequired');
    }

    if (!formData.grade.trim()) {
      newErrors.grade = t('students.gradeRequired');
    }

    // Parent/Guardian validation - phone is required for parent user creation
    if (!formData.parentFullName.trim()) {
      newErrors.parentFullName = t('students.parentNameRequired');
    }

    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = t('students.phoneRequired');
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.parentPhone.replace(/\D/g, ''))) {
      newErrors.parentPhone = t('students.phoneInvalid');
    }

    if (!formData.relationship) {
      newErrors.relationship = t('students.relationshipRequired');
    }

    // School validation - now required
    if (!formData.schoolId) {
      newErrors.schoolId = t('students.schoolRequired');
    }

    // Parent email validation - now required
    if (!formData.parentEmail.trim()) {
      newErrors.parentEmail = t('students.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = t('students.emailInvalid');
    }

    // Parent password validation - required
    if (!formData.parentPassword.trim()) {
      newErrors.parentPassword = t('students.passwordRequired');
    } else if (formData.parentPassword.length < 6) {
      newErrors.parentPassword = t('students.passwordMin');
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
        title: t('students.validationError'),
        description: t('students.validationErrorDesc'),
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
        title: t('students.successMessage'),
        description: t('students.successMessage'),
      });

      // Redirect to student profile or list
      router.push(`/educator/students/${response.id}`);
      
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast({
        title: t('students.errorMessage'),
        description: error.response?.data?.error || t('students.errorMessage'),
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
      title={t('students.registerNewStudent')}
      description={t('students.registerDesc')}
      breadcrumbs={[{ label: t('students.breadcrumb'), href: '/educator/students' }, { label: t('students.registerNewStudent') }]}
      className="max-w-4xl mx-auto"
      actions={
        <Link href="/educator/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('students.backToStudents')}
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
                  {t('students.studentInformation')}
                </CardTitle>
                <CardDescription>
                  {t('students.basicDetails')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('students.fullName')} *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder={t('students.fullName')}
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
                      label={t('students.dateOfBirth')}
                      value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                      onChange={(date) => handleInputChange('dateOfBirth', date ? date.toISOString().split('T')[0] : '')}
                      error={errors.dateOfBirth}
                      required={true}
                      placeholder={t('students.dateOfBirth')}
                      toYear={new Date().getFullYear()}
                    />
                    {formData.dateOfBirth && (
                      <p className="text-sm text-muted-foreground">
                        {t('students.ageLabel', { age: calculateAge(formData.dateOfBirth) })}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">{t('students.gender')} *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('students.selectGender')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">{t('students.genderMale')}</SelectItem>
                        <SelectItem value="FEMALE">{t('students.genderFemale')}</SelectItem>
                        <SelectItem value="OTHER">{t('students.genderOther')}</SelectItem>
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
                    <Label htmlFor="grade">{t('students.grade')} *</Label>
                    <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)}>
                      <SelectTrigger className={errors.grade ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('students.selectGrade')} />
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
                    <Label htmlFor="motherTongue">{t('students.motherTongueLabel')}</Label>
                    <Input
                      id="motherTongue"
                      value={formData.motherTongue}
                      onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                      placeholder={t('students.motherTonguePlaceholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="syllabus">{t('students.syllabus')} *</Label>
                    <Select value={formData.syllabus} onValueChange={(value) => handleInputChange('syllabus', value)}>
                      <SelectTrigger className={errors.syllabus ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('students.selectSyllabus')} />
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
                  {t('students.parentInfo')}
                </CardTitle>
                <CardDescription>
                  {t('students.parentDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentFullName">{t('students.parentName')} *</Label>
                    <Input
                      id="parentFullName"
                      value={formData.parentFullName}
                      onChange={(e) => handleInputChange('parentFullName', e.target.value)}
                      placeholder={t('students.parentName')}
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
                    <Label htmlFor="relationship">{t('students.relationship')} *</Label>
                    <Select value={formData.relationship} onValueChange={(value) => handleInputChange('relationship', value)}>
                      <SelectTrigger className={errors.relationship ? 'border-red-500' : ''}>
                        <SelectValue placeholder={t('students.selectRelationship')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Parent">{t('students.relParent')}</SelectItem>
                        <SelectItem value="Father">{t('students.relFather')}</SelectItem>
                        <SelectItem value="Mother">{t('students.relMother')}</SelectItem>
                        <SelectItem value="Guardian">{t('students.relGuardian')}</SelectItem>
                        <SelectItem value="Grandparent">{t('students.relGrandparent')}</SelectItem>
                        <SelectItem value="Other">{t('students.relOther')}</SelectItem>
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
                    <Label htmlFor="parentPhone">{t('students.phone')} *</Label>
                    <Input
                      id="parentPhone"
                      value={formData.parentPhone}
                      onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                      placeholder={t('students.phonePlaceholder')}
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
                    <Label htmlFor="parentEmail">{t('students.email')} *</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                      placeholder={t('students.emailPlaceholder')}
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
                    <Label htmlFor="parentPassword">{t('students.password')} *</Label>
                    <Input
                      id="parentPassword"
                      type="password"
                      value={formData.parentPassword}
                      onChange={(e) => handleInputChange('parentPassword', e.target.value)}
                      placeholder={t('students.passwordPlaceholder')}
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
                    <Label htmlFor="parentAddress">{t('students.address')}</Label>
                    <Textarea
                      id="parentAddress"
                      value={formData.parentAddress}
                      onChange={(e) => handleInputChange('parentAddress', e.target.value)}
                      placeholder={t('students.addressPlaceholder')}
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
                  {t('students.assignmentInfo')}
                </CardTitle>
                <CardDescription>
                  {t('students.assignmentDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('students.assignedEducator')}</Label>
                    <div className="p-3 bg-muted/40 rounded-md">
                      <p className="font-medium">{user?.profile?.fullName || 'You'}</p>
                      <p className="text-sm text-muted-foreground">{t('students.autoAssigned')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolId">{t('students.schoolName')} *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="schoolId"
                      value={selectedSchoolName}
                      placeholder={t('students.schoolPlaceholder')}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsSchoolModalOpen(true)}
                    >
                      <School className="h-4 w-4 mr-2" />
                      {t('students.selectSchoolBtn')}
                    </Button>
                  </div>
                  {errors.schoolId && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.schoolId}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {t('students.schoolDesc')}
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
                {t('students.cancel')}
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('students.registering')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('students.registerStudentBtn')}
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