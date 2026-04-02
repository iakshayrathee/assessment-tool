'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  User,
  ArrowLeft,
  Save,
  Calendar,
  School,
  Users,
  GraduationCap,
  UserPlus,
  FileText,
  CheckCircle,
  Award,
  Search
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { GRADE_LIST, SYLLABUS_LIST } from '@/lib/staticData';

interface StudentOnboardingData {
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
  previousSchool: string;
  medicalConditions: string;
  specialNeeds: string;
  learningConcerns: string;
  parentExpectations: string;
}

interface School {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface SpecialEducator {
  educatorId: string;
  fullName: string;
  email?: string;
  phone?: string;
  yearsOfExperience?: number;
  specializationAreas: string[];
  assignedStudentCount?: number;
}

interface ApiError {
  message: string;
}

export default function StudentOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [educators, setEducators] = useState<SpecialEducator[]>([]);
  const [activeTab, setActiveTab] = useState<'student' | 'assignment'>('student');
  const [selectedEducatorId, setSelectedEducatorId] = useState<string>('');
  const [showEducatorModal, setShowEducatorModal] = useState(false);
  const [educatorSearchTerm, setEducatorSearchTerm] = useState('');
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [schoolSearchTerm, setSchoolSearchTerm] = useState('');

  const [formData, setFormData] = useState<StudentOnboardingData>({
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
    relationship: 'Parent',
    previousSchool: '',
    medicalConditions: '',
    specialNeeds: '',
    learningConcerns: '',
    parentExpectations: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = useAuthStore.getState().user;
        const centerId = user?.profile?.id;

        if (!centerId) {
          toast({
            title: 'Error',
            description: 'Center ID not found. Please ensure you are logged in.',
            variant: 'destructive',
          });
          return;
        }

        const [schoolsResponse, educatorsData] = await Promise.all([
          apiClient.getCenterSchools(centerId) as Promise<{ data: School[] }>,
          apiClient.getCenterEducators(centerId) as Promise<{ data: SpecialEducator[] }>,
        ]);

        setSchools(schoolsResponse?.data || []);
        setEducators(educatorsData?.data || []);
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to load data: ${(error as ApiError).message || 'Unknown error'}`,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field: keyof StudentOnboardingData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
    const requiredFields: (keyof StudentOnboardingData)[] = [
      'fullName',
      'dateOfBirth',
      'gender',
      'grade',
      'schoolId',
    ];

    for (const field of requiredFields) {
      if (!formData[field]) {
        toast({
          title: 'Validation Error',
          description: `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: 'destructive',
        });
        return false;
      }
    }

    if (!selectedEducatorId) {
      toast({
        title: 'Validation Error',
        description: 'Please assign a Special Educator',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const filteredEducators = educators.filter(
    (educator) =>
      educator.fullName.toLowerCase().includes(educatorSearchTerm.toLowerCase()) ||
      (educator.email?.toLowerCase().includes(educatorSearchTerm.toLowerCase()) ?? false) ||
      educator.specializationAreas.some((area) =>
        area.toLowerCase().includes(educatorSearchTerm.toLowerCase())
      )
  );

  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ||
      (school.address?.toLowerCase().includes(schoolSearchTerm.toLowerCase()) ?? false)
  );

  const handleEducatorSelect = (educatorId: string) => {
    if (!educatorId || !educators.some((educator) => educator.educatorId === educatorId)) {
      toast({
        title: 'Error',
        description: 'Invalid educator selected. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedEducatorId(educatorId);
    setShowEducatorModal(false);
    setEducatorSearchTerm('');
  };

  const handleSchoolSelect = (schoolId: string) => {
    if (!schoolId || !schools.some((school) => school.id === schoolId)) {
      toast({
        title: 'Error',
        description: 'Invalid school selected. Please try again.',
        variant: 'destructive',
      });
      return;
    }
    handleInputChange('schoolId', schoolId);
    setShowSchoolModal(false);
    setSchoolSearchTerm('');
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const user = useAuthStore.getState().user;
      const centerId = user?.profile?.id;

      if (!centerId) {
        toast({
          title: 'Error',
          description: 'Center ID not found',
          variant: 'destructive',
        });
        return;
      }

      const studentData = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        age: calculateAge(formData.dateOfBirth),
        gender: formData.gender,
        grade: formData.grade,
        centerId,
        motherTongue: formData.motherTongue,
        syllabus: formData.syllabus,
        schoolId: formData.schoolId || null,
        previousSchool: formData.previousSchool,
        medicalConditions: formData.medicalConditions,
        specialNeeds: formData.specialNeeds,
        learningConcerns: formData.learningConcerns,
        parentExpectations: formData.parentExpectations,
        status: 'ACTIVE',
      };

      // Create the student first
      const createdStudent = await apiClient.createStudent(studentData);

      // Assign educator to the student if one is selected
      if (selectedEducatorId) {
        try {
          await apiClient.assignStudentToEducator(createdStudent.id, selectedEducatorId);
        } catch (assignmentError: any) {
          // Log the assignment error but don't fail the entire onboarding
          console.warn('Failed to assign educator to student:', assignmentError);
          toast({
            title: 'Warning',
            description: 'Student created successfully but educator assignment failed. You can assign an educator later.',
            variant: 'default',
          });
        }
      }

      toast({
        title: 'Success',
        description: 'Student onboarded successfully!' + (selectedEducatorId ? ' Educator assigned.' : ''),
      });
      router.push('/center/students');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to onboard student',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderEducatorDisplay = () => {
    if (loading) {
      return 'Loading educators...';
    }

    if (selectedEducatorId) {
      const selectedEducator = educators.find((educator) => educator.educatorId === selectedEducatorId);
      if (selectedEducator) {
        const primarySpecialization = selectedEducator.specializationAreas?.[0] || '';
        const additionalCount = (selectedEducator.specializationAreas?.length || 0) - 1;
        return (
          <div className="flex flex-col gap-1 w-full text-left">
            <span className="font-medium">{selectedEducator.fullName}</span>
            <span className="text-sm text-muted-foreground">
              {primarySpecialization}
              {additionalCount > 0 && ` +${additionalCount} more`}
              {selectedEducator.yearsOfExperience && ` • ${selectedEducator.yearsOfExperience} yrs exp`}
            </span>
          </div>
        );
      }
      return 'Educator not found';
    }

    return 'Select a Special Educator';
  };

  const renderSchoolDisplay = () => {
    if (loading) {
      return 'Loading schools...';
    }

    if (formData.schoolId) {
      const selectedSchool = schools.find((school) => school.id === formData.schoolId);
      if (selectedSchool) {
        return (
          <div className="flex flex-col gap-1 w-full text-left">
            <span className="font-medium">{selectedSchool.name}</span>
            {selectedSchool.address && (
              <span className="text-sm text-muted-foreground">{selectedSchool.address}</span>
            )}
          </div>
        );
      }
      return 'School not found';
    }

    return 'Select a School';
  };

  return (
    <PageWrapper
      title="Student Onboarding"
      description="Complete student registration and assignment process"
      breadcrumbs={[{ label: 'Center', href: '/center' }, { label: 'Students', href: '/center/students' }, { label: 'Onboarding' }]}
      actions={
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Button>
      }
    >
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'student' | 'assignment')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Student Info
            </TabsTrigger>
            <TabsTrigger value="assignment" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Assign Educators
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Student Information
                </CardTitle>
                <CardDescription>Basic information about the student</CardDescription>
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
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <ProfessionalDatePicker
                      label="Date of Birth"
                      value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : null}
                      onChange={(date) => handleInputChange('dateOfBirth', date ? date.toISOString().split('T')[0] : '')}
                      required
                      placeholder="Select date of birth"
                      toYear={new Date().getFullYear()}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)} required>
                      <SelectTrigger id="gender">
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
                    <Label htmlFor="grade">Grade *</Label>
                    <Select value={formData.grade} onValueChange={(value) => handleInputChange('grade', value)} required>
                      <SelectTrigger id="grade">
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherTongue">Primary Language</Label>
                    <Input
                      id="motherTongue"
                      value={formData.motherTongue}
                      onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                      placeholder="e.g., Hindi, English, Tamil"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="syllabus">Syllabus</Label>
                    <Select value={formData.syllabus} onValueChange={(value) => handleInputChange('syllabus', value)}>
                      <SelectTrigger id="syllabus">
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

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="schoolId">School *</Label>
                    <Dialog open={showSchoolModal} onOpenChange={setShowSchoolModal}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-auto py-3" disabled={loading}>
                          <School className="h-4 w-4 mr-2" />
                          {renderSchoolDisplay()}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <School className="h-5 w-5" />
                            Select School
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="schoolSearch"
                              placeholder="Search schools by name or address..."
                              value={schoolSearchTerm}
                              onChange={(e) => setSchoolSearchTerm(e.target.value)}
                              className="pl-10"
                            />
                          </div>

                          <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>School Name</TableHead>
                                  <TableHead>Address</TableHead>
                                  <TableHead>Contact</TableHead>
                                  <TableHead>Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {loading ? (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                      Loading schools...
                                    </TableCell>
                                  </TableRow>
                                ) : filteredSchools.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                      {schoolSearchTerm ? 'No schools found matching your search' : 'No schools available'}
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  filteredSchools.map((school) => (
                                    <TableRow key={school.id} className="hover:bg-muted/40">
                                      <TableCell>
                                        <div className="font-medium">{school.name}</div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm text-muted-foreground">
                                          {school.address || 'Not specified'}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="text-sm text-muted-foreground">
                                          {school.phone && <div>{school.phone}</div>}
                                          {school.email && <div>{school.email}</div>}
                                          {!school.phone && !school.email && 'No contact info'}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          size="sm"
                                          onClick={() => handleSchoolSelect(school.id)}
                                          variant={formData.schoolId === school.id ? 'default' : 'outline'}
                                        >
                                          {formData.schoolId === school.id ? 'Selected' : 'Select'}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Assign Educators
                </CardTitle>
                <CardDescription>Assign a Special Educator to the student</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="educator">Special Educator *</Label>
                  <Dialog open={showEducatorModal} onOpenChange={setShowEducatorModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full justify-start h-auto py-3" disabled={loading}>
                        <Users className="h-4 w-4 mr-2" />
                        {renderEducatorDisplay()}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5" />
                          Select Special Educator
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="educatorSearch"
                            placeholder="Search educators by name, email, or specialization..."
                            value={educatorSearchTerm}
                            onChange={(e) => setEducatorSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>

                        <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Experience</TableHead>
                                <TableHead>Specializations</TableHead>
                                <TableHead>Students</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {loading ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-8">
                                    Loading educators...
                                  </TableCell>
                                </TableRow>
                              ) : filteredEducators.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    {educatorSearchTerm ? 'No educators found matching your search' : 'No educators available'}
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredEducators.map((educator) => (
                                  <TableRow key={educator.educatorId} className="hover:bg-muted/40">
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{educator.fullName}</span>
                                        {educator.email && (
                                          <span className="text-sm text-muted-foreground">{educator.email}</span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <Award className="h-4 w-4 mr-1 text-primary" />
                                        <span>{educator.yearsOfExperience || 0} years</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {educator.specializationAreas.slice(0, 2).map((area, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs">
                                            {area}
                                          </Badge>
                                        ))}
                                        {educator.specializationAreas.length > 2 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{educator.specializationAreas.length - 2} more
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center">
                                        <Users className="h-4 w-4 mr-1 text-success" />
                                        <span>{educator.assignedStudentCount || 0}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        onClick={() => handleEducatorSelect(educator.educatorId)}
                                        variant={selectedEducatorId === educator.educatorId ? 'default' : 'outline'}
                                      >
                                        {selectedEducatorId === educator.educatorId ? 'Selected' : 'Select'}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {selectedEducatorId && (
                  <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Educator Selected</span>
                    </div>
                    <p className="text-sm text-success mt-1">
                      {educators.find((educator) => educator.educatorId === selectedEducatorId)?.fullName || 'Educator'} will be assigned to this student upon completion.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between">
          <div className="flex gap-2">
            {activeTab === 'assignment' && (
              <Button variant="outline" onClick={() => setActiveTab('student')}>
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {activeTab === 'student' ? (
              <Button onClick={() => setActiveTab('assignment')}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || submitting}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Onboarding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Complete Onboarding
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
    </PageWrapper>
  );
}