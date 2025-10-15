'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';

interface StudentOnboardingData {
  // Student basic info
  fullName: string;
  dateOfBirth: string;
  gender: string;
  grade: string;
  motherTongue: string;
  syllabus: string;
  schoolId: string;
  
  // Parent info
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentAddress: string;
  emergencyContact: string;
  relationship: string;
  
  // Additional onboarding info
  previousSchool: string;
  medicalConditions: string;
  specialNeeds: string;
  learningConcerns: string;
  parentExpectations: string;
}

interface School {
  id: string;
  name: string;
}

interface SpecialEducator {
  id: string;
  fullName: string;
  specializationAreas: string[];
}

export default function StudentOnboarding() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [educators, setEducators] = useState<SpecialEducator[]>([]);
  const [activeTab, setActiveTab] = useState('student');
  const [selectedEducatorId, setSelectedEducatorId] = useState<string>('');
  
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
        
        // Get current user's center ID from auth store
        const user = useAuthStore.getState().user;
        console.log('Current user:', user);
        const centerId = user?.centerId;
        console.log('Center ID:', centerId);
        
        if (!centerId) {
          console.error('Center ID not found in user data');
          toast({
            title: "Error",
            description: "Center ID not found. Please ensure you're logged in properly.",
            variant: "destructive",
          });
          return;
        }
        
        console.log('Fetching schools for center:', centerId);
        // Fetch schools using apiClient method
        const schoolsData = await apiClient.getCenterSchools(centerId);
        console.log('Schools data received:', schoolsData);
        setSchools(schoolsData || []);
        
        console.log('Fetching educators for center:', centerId);
        // Fetch educators using apiClient method
        const educatorsData = await apiClient.getCenterEducators(centerId);
        console.log('Educators data received:', educatorsData);
        setEducators(educatorsData || []);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: `Failed to load schools and educators: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field: keyof StudentOnboardingData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    const requiredFields = [
      'fullName', 'dateOfBirth', 'gender', 'grade', 
      'parentName', 'parentPhone', 'parentAddress'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof StudentOnboardingData]) {
        toast({
          title: "Validation Error",
          description: `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    if (!selectedEducatorId) {
      toast({
        title: "Validation Error",
        description: "Please assign a Special Educator",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const age = calculateAge(formData.dateOfBirth);
      
      // Get current user's center ID
      const user = useAuthStore.getState().user;
      const centerId = user?.centerId;

      if (!centerId) {
        toast({
          title: "Error",
          description: "Center ID not found",
          variant: "destructive",
        });
        return;
      }
      
      const studentData = {
        // Required fields based on backend validation
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        age,
        gender: formData.gender,
        grade: formData.grade,
        centerId: centerId,
        
        // Parent info - will be created as part of student creation
        parentProfile: {
          fullName: formData.parentName,
          phone: formData.parentPhone,
          email: formData.parentEmail,
          address: formData.parentAddress,
          emergencyContact: formData.emergencyContact,
          relationship: formData.relationship
        },
        
        // Optional fields
        motherTongue: formData.motherTongue,
        syllabus: formData.syllabus,
        schoolId: formData.schoolId || null,
        specialEducatorId: selectedEducatorId || null,
        
        // Additional onboarding info
        previousSchool: formData.previousSchool,
        medicalConditions: formData.medicalConditions,
        specialNeeds: formData.specialNeeds,
        learningConcerns: formData.learningConcerns,
        parentExpectations: formData.parentExpectations,
        
        status: 'ACTIVE'
      };

      const response = await apiClient.createStudent(studentData);
      
      toast({
        title: "Success",
        description: "Student onboarded successfully!",
      });
      router.push(`/center/students/${response.data.id}`);
    } catch (error: any) {
      console.error('Error onboarding student:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || 'Failed to onboard student',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/center/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Student Onboarding</h1>
          <p className="text-muted-foreground">
            Complete student registration and assignment process
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="student" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Student Info
          </TabsTrigger>
          <TabsTrigger value="parent" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Parent Info
          </TabsTrigger>
          <TabsTrigger value="additional" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Additional Info
          </TabsTrigger>
          <TabsTrigger value="assignment" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Assignment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
              <CardDescription>
                Basic information about the student
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
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
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
                  <Label htmlFor="grade">Grade *</Label>
                  <Input
                    id="grade"
                    value={formData.grade}
                    onChange={(e) => handleInputChange('grade', e.target.value)}
                    placeholder="e.g., Grade 5, Class X"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="motherTongue">Mother Tongue</Label>
                  <Input
                    id="motherTongue"
                    value={formData.motherTongue}
                    onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                    placeholder="Primary language"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="syllabus">Syllabus</Label>
                  <Input
                    id="syllabus"
                    value={formData.syllabus}
                    onChange={(e) => handleInputChange('syllabus', e.target.value)}
                    placeholder="e.g., CBSE, ICSE, State Board"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="schoolId">School</Label>
                  <Select value={formData.schoolId} onValueChange={(value) => handleInputChange('schoolId', value)} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder={loading ? "Loading schools..." : "Select school (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <SelectItem value="loading" disabled>Loading schools...</SelectItem>
                      ) : schools.length === 0 ? (
                        <SelectItem value="no-schools" disabled>No schools available</SelectItem>
                      ) : (
                        schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>
                            {school.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Parent/Guardian Information
              </CardTitle>
              <CardDescription>
                Contact and emergency information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                  <Input
                    id="parentName"
                    value={formData.parentName}
                    onChange={(e) => handleInputChange('parentName', e.target.value)}
                    placeholder="Full name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select value={formData.relationship} onValueChange={(value) => handleInputChange('relationship', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                      <SelectItem value="Grandparent">Grandparent</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parentPhone">Phone Number *</Label>
                  <Input
                    id="parentPhone"
                    value={formData.parentPhone}
                    onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                    placeholder="Primary contact number"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Email Address</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                    placeholder="Email address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Alternative contact number"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="parentAddress">Address *</Label>
                  <Textarea
                    id="parentAddress"
                    value={formData.parentAddress}
                    onChange={(e) => handleInputChange('parentAddress', e.target.value)}
                    placeholder="Complete address"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="additional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Additional Information
              </CardTitle>
              <CardDescription>
                Background and special considerations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="previousSchool">Previous School</Label>
                  <Input
                    id="previousSchool"
                    value={formData.previousSchool}
                    onChange={(e) => handleInputChange('previousSchool', e.target.value)}
                    placeholder="Name of previous school (if any)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="medicalConditions">Medical Conditions</Label>
                  <Textarea
                    id="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                    placeholder="Any medical conditions or medications"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialNeeds">Special Needs</Label>
                  <Textarea
                    id="specialNeeds"
                    value={formData.specialNeeds}
                    onChange={(e) => handleInputChange('specialNeeds', e.target.value)}
                    placeholder="Any special accommodations needed"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="learningConcerns">Learning Concerns</Label>
                  <Textarea
                    id="learningConcerns"
                    value={formData.learningConcerns}
                    onChange={(e) => handleInputChange('learningConcerns', e.target.value)}
                    placeholder="Any specific learning difficulties or concerns"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parentExpectations">Parent Expectations</Label>
                  <Textarea
                    id="parentExpectations"
                    value={formData.parentExpectations}
                    onChange={(e) => handleInputChange('parentExpectations', e.target.value)}
                    placeholder="What do you hope to achieve through this program?"
                    rows={3}
                  />
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
                Educator Assignment
              </CardTitle>
              <CardDescription>
                Assign a Special Educator to the student
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="educator">Special Educator *</Label>
                <Select value={selectedEducatorId} onValueChange={setSelectedEducatorId} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading educators..." : "Select a Special Educator"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loading ? (
                      <SelectItem value="loading" disabled>Loading educators...</SelectItem>
                    ) : educators.length === 0 ? (
                      <SelectItem value="no-educators" disabled>No educators available</SelectItem>
                    ) : (
                      educators.map((educator) => (
                        <SelectItem key={educator.id} value={educator.id}>
                          <div className="flex flex-col">
                            <span>{educator.fullName}</span>
                            {educator.specializationAreas.length > 0 && (
                              <span className="text-sm text-muted-foreground">
                                {educator.specializationAreas.join(', ')}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedEducatorId && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Educator Selected</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    The student will be assigned to the selected Special Educator upon completion.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <div className="flex gap-2">
          {activeTab !== 'student' && (
            <Button 
              variant="outline" 
              onClick={() => {
                const tabs = ['student', 'parent', 'additional', 'assignment'];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex > 0) {
                  setActiveTab(tabs[currentIndex - 1]);
                }
              }}
            >
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {activeTab !== 'assignment' ? (
            <Button 
              onClick={() => {
                const tabs = ['student', 'parent', 'additional', 'assignment'];
                const currentIndex = tabs.indexOf(activeTab);
                if (currentIndex < tabs.length - 1) {
                  setActiveTab(tabs[currentIndex + 1]);
                }
              }}
            >
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
    </div>
  );
}