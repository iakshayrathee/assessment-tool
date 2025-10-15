'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useIntakeForm } from '@/hooks/useAssessments';
import { useEducatorStudents } from '@/hooks/useSpecialEducator';
import { useStudent } from '@/hooks/useStudents';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';

import {
  ArrowLeft,
  Save,
  FileText,
  User,
  Home,
  Baby,
  Heart,
  GraduationCap,
  CheckCircle,
  Users,
  RefreshCw,
  Download,
  AlertTriangle,
  Lock,
  Clock,
  School,
  Stethoscope,
  Brain,
  Eye,
  MessageSquare,
  Plus,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

// Define interfaces for type safety
interface FormData {
  // Section 1: Socio Demographic Data
  name: string;
  age: string;
  gender: string;
  schoolCenter: string;
  address: string;
  class: string;
  motherTongue: string;
  syllabus: string;

  // Section 2: Family History / Background
  fatherName: string;
  motherName: string;
  guardianName: string;
  familyIncome: string;
  familyType: string;
  digitalResourcesAtHome: boolean;
  dailyDigitalUse: string;
  enjoysSchool: boolean;
  studyAssistant: string;
  externalAcademicSupport: boolean;
  enjoysReading: boolean;
  dailyParentChildTime: string;
  childType: string;

  // Section 3: Prenatal, Natal & Delivery Details
  pregnancyNormal: boolean;
  medicationsDuringPregnancy: string;
  medicationsDuringPregnancyDetails: string;
  miscarriagesAbortions: boolean;
  fullTermOrPremature: string;
  deliveryType: string;

  // Section 4: Post Natal Factors
  breastFed: boolean;
  infantJaundice: boolean;
  incubation: boolean;
  immunizationDone: boolean;
  consanguineousMarriage: boolean;
  birthCry: string;
  delayInNeckStanding: boolean;
  delayInNeckStandingDetails: string;
  ageOfWalking: string;
  ageOfTwoWordSpeech: string;

  // Section 5: Medical History
  healthConcerns: string;
  epilepticHistory: boolean;
  onMedication: boolean;
  medicationDetails: string;
  asthmaWheezing: boolean;
  wearsGlasses: boolean;
  visionTestDone: boolean;
  hearingTestDone: boolean;

  // Section 6: Educational History
  attendedPreschool: boolean;
  repeatedGrades: boolean;
  whichGradeRepeated: string;
  dominantWritingHand: string;
  strugglesInLanguages: boolean;
}

interface Tab {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface Student {
  id: string;
  fullName: string;
  grade: string;
}

const TABS: Tab[] = [
  { id: 'demographics', title: 'Demographics', icon: User, description: 'Basic student information' },
  { id: 'family', title: 'Family History', icon: Home, description: 'Family background and structure' },
  { id: 'prenatal', title: 'Prenatal & Birth', icon: Baby, description: 'Birth and early development' },
  { id: 'postnatal', title: 'Post Natal', icon: Heart, description: 'Post-birth development factors' },
  { id: 'medical', title: 'Medical History', icon: Stethoscope, description: 'Health and medical information' },
  { id: 'educational', title: 'Educational History', icon: GraduationCap, description: 'Academic background' },
  { id: 'review', title: 'Review', icon: CheckCircle, description: 'Review and submit' }
];

export default function IntakeFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const urlStudentId = searchParams.get('studentId');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(urlStudentId);
  const [activeTab, setActiveTab] = useState('demographics');
  const [wasRedirectedFromRegistration, setWasRedirectedFromRegistration] = useState<boolean>(!!urlStudentId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [formData, setFormData] = useState<FormData>({
    // Section 1: Socio Demographic Data
    name: '',
    age: '',
    gender: '',
    schoolCenter: '',
    address: '',
    class: '',
    motherTongue: '',
    syllabus: '',

    // Section 2: Family History / Background
    fatherName: '',
    motherName: '',
    guardianName: '',
    familyIncome: '',
    familyType: '',
    digitalResourcesAtHome: false,
    dailyDigitalUse: '',
    enjoysSchool: false,
    studyAssistant: '',
    externalAcademicSupport: false,
    enjoysReading: false,
    dailyParentChildTime: '',
    childType: '',

    // Section 3: Prenatal, Natal & Delivery Details
    pregnancyNormal: false,
    medicationsDuringPregnancy: '',
    medicationsDuringPregnancyDetails: '',
    miscarriagesAbortions: false,
    fullTermOrPremature: '',
    deliveryType: '',

    // Section 4: Post Natal Factors
    breastFed: false,
    infantJaundice: false,
    incubation: false,
    immunizationDone: false,
    consanguineousMarriage: false,
    birthCry: '',
    delayInNeckStanding: false,
    delayInNeckStandingDetails: '',
    ageOfWalking: '',
    ageOfTwoWordSpeech: '',

    // Section 5: Medical History
    healthConcerns: '',
    epilepticHistory: false,
    onMedication: false,
    medicationDetails: '',
    asthmaWheezing: false,
    wearsGlasses: false,
    visionTestDone: false,
    hearingTestDone: false,

    // Section 6: Educational History
    attendedPreschool: false,
    repeatedGrades: false,
    whichGradeRepeated: '',
    dominantWritingHand: '',
    strugglesInLanguages: false
  });

  // Get students for selection dropdown
  const { students, isLoading: isLoadingStudents } = useEducatorStudents({ limit: 100 }) as { students: Student[] | undefined; isLoading: boolean };

  // Get selected student details for prefilling
  const { student: selectedStudentData, isLoading: isLoadingStudentData } = useStudent(selectedStudentId || '');

  // Validate that the selected student exists in the loaded students list
  useEffect(() => {
    if (!isLoadingStudents && students && urlStudentId) {
      const studentExists = students.some(student => student.id === urlStudentId);
      if (!studentExists && wasRedirectedFromRegistration) {
        console.log('Student not found in list but was redirected from registration. Student may need time to appear in cache.');
        setSelectedStudentId(urlStudentId);
      } else if (!studentExists) {
        console.log('Student not found in list, clearing selection.');
        setSelectedStudentId(null);
        router.replace('/educator/intake');
      } else {
        setSelectedStudentId(urlStudentId);
        setWasRedirectedFromRegistration(false);
      }
    }
  }, [students, isLoadingStudents, urlStudentId, router, wasRedirectedFromRegistration]);

  // Function to refresh students list
  const refreshStudents = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['specialEducator', 'students']
    });
  };

  const { intakeForm, createIntakeForm, updateIntakeForm, completeIntakeForm, isCreating, isUpdating } = useIntakeForm(selectedStudentId || undefined);

  // Prefill form data with selected student's basic information
  useEffect(() => {
    if (selectedStudentData && selectedStudentId) {
      setFormData(prev => ({
        ...prev,
        name: selectedStudentData.fullName || '',
        age: selectedStudentData.age?.toString() || '',
        gender: selectedStudentData.gender || '',
        class: selectedStudentData.grade || '',
        motherTongue: selectedStudentData.motherTongue || '',
        syllabus: selectedStudentData.syllabus || '',
        schoolCenter: selectedStudentData.school?.name || selectedStudentData.center?.centerName || '',
        fatherName: selectedStudentData.parent?.fullName || '',
        motherName: selectedStudentData.parent?.fullName || '',
        guardianName: selectedStudentData.parent?.fullName || '',
        address: selectedStudentData.parent?.address || '',
      }));
    }
  }, [selectedStudentData, selectedStudentId]);

  // Populate form data when existing intake form is loaded
  useEffect(() => {
    if (intakeForm && intakeForm.data) {
      setFormData(intakeForm.data as FormData);
      if (intakeForm.status === 'COMPLETED') {
        console.log('Intake form is already completed for this student');
      }
    }
  }, [intakeForm]);

  // Warn about unsaved changes before leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  // Validation function to check if all required fields are completed
  const isFormComplete = useCallback(() => {
    // Section 1: Basic Information
    if (!formData.address || !formData.familyIncome || !formData.familyType) return false;
    
    // Section 2: Digital & Academic Environment
    if (formData.dailyDigitalUse === '' || !formData.studyAssistant || !formData.childType) return false;
    
    // Section 3: Prenatal, Natal & Delivery Details
    if (!formData.fullTermOrPremature || !formData.deliveryType) return false;
    
    // Section 4: Post Natal Factors
    if (!formData.birthCry || formData.ageOfWalking === '' || formData.ageOfTwoWordSpeech === '') return false;
    
    // Section 5: Medical History
    if (!formData.healthConcerns || !formData.medicationDetails) return false;
    
    // Section 6: Educational History
    if (!formData.dominantWritingHand) return false;
    
    // Guardian Information
    if (!formData.fatherName || !formData.motherName || !formData.guardianName) return false;
    
    return true;
  }, [formData]);

  const handleSaveDraft = async () => {
    if (!selectedStudentId) return;
    if (intakeForm?.status === 'COMPLETED') return;

    try {
      // Convert string fields to integers where needed
      const submitData = {
        ...formData,
        studentId: selectedStudentId,
        dailyDigitalUse: formData.dailyDigitalUse ? parseInt(formData.dailyDigitalUse) : null,
        dailyParentChildTime: formData.dailyParentChildTime ? parseInt(formData.dailyParentChildTime) : null,
        ageOfWalking: formData.ageOfWalking ? parseInt(formData.ageOfWalking) : null,
        ageOfTwoWordSpeech: formData.ageOfTwoWordSpeech ? parseInt(formData.ageOfTwoWordSpeech) : null,
      };
      
      if (intakeForm) {
        await updateIntakeForm({ id: intakeForm.id, data: submitData });
      } else {
        await createIntakeForm(submitData);
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudentId) return;
    if (intakeForm?.status === 'COMPLETED') return;

    try {
      setIsSubmitting(true);
      // Convert string fields to integers where needed
      const submitData = {
        ...formData,
        studentId: selectedStudentId,
        dailyDigitalUse: formData.dailyDigitalUse ? parseInt(formData.dailyDigitalUse) : null,
        dailyParentChildTime: formData.dailyParentChildTime ? parseInt(formData.dailyParentChildTime) : null,
        ageOfWalking: formData.ageOfWalking ? parseInt(formData.ageOfWalking) : null,
        ageOfTwoWordSpeech: formData.ageOfTwoWordSpeech ? parseInt(formData.ageOfTwoWordSpeech) : null,
      };
      
      if (intakeForm) {
        await updateIntakeForm({ id: intakeForm.id, data: submitData });
        await completeIntakeForm(intakeForm.id);
      } else {
        await createIntakeForm(submitData);
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    console.log('Download PDF functionality to be implemented');
  };

  const handleStudentSelect = (studentId: string) => {
    if (studentId === 'new-child') {
      handleNewChildRequest();
      return;
    }
    
    if (hasUnsavedChanges) {
      setPendingAction(() => () => {
        setSelectedStudentId(studentId);
        router.push(`/educator/intake?studentId=${studentId}`);
      });
      setShowSaveModal(true);
    } else {
      setSelectedStudentId(studentId);
      router.push(`/educator/intake?studentId=${studentId}`);
    }
  };

  const handleNewChildRequest = () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => () => {
        // Navigate to student creation page or show student creation modal
        router.push('/educator/students/new');
      });
      setShowSaveModal(true);
    } else {
      router.push('/educator/students/new');
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await handleSaveDraft();
      setShowSaveModal(false);
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleDiscardAndContinue = () => {
    setHasUnsavedChanges(false);
    setShowSaveModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCancelModal = () => {
    setShowSaveModal(false);
    setPendingAction(null);
  };

  const isFormCompleted = intakeForm?.status === 'COMPLETED';

  // Calculate progress based on completed sections
  const calculateProgress = () => {
    if (!intakeForm) return 0;
    
    const sections = [
      {
        name: 'demographics',
        hasData: formData.name && formData.age && formData.gender && formData.schoolCenter
      },
      {
        name: 'familyHistory',
        hasData: formData.fatherName || formData.motherName || formData.familyType
      },
      {
        name: 'prenatalHistory',
        hasData: formData.pregnancyNormal !== undefined || formData.fullTermOrPremature || formData.deliveryType
      },
      {
        name: 'postnatalHistory',
        hasData: formData.breastFed !== undefined || formData.birthCry || formData.ageOfWalking
      },
      {
        name: 'medicalHistory',
        hasData: formData.healthConcerns || formData.onMedication !== undefined || formData.medicationDetails
      },
      {
        name: 'educationalHistory',
        hasData: formData.attendedPreschool !== undefined || formData.repeatedGrades !== undefined || formData.dominantWritingHand
      }
    ];
    
    const completedSections = sections.filter(section => section.hasData).length;
    return (completedSections / sections.length) * 100;
  };

  const progress = calculateProgress();

  // Function to check if a tab section is completed
  const isTabCompleted = (tabId: string) => {
    switch (tabId) {
      case 'demographics':
        return formData.name && formData.age && formData.gender && formData.schoolCenter && formData.class;
      case 'family':
        return formData.fatherName && formData.motherName && formData.familyIncome && formData.familyType;
      case 'prenatal':
        return formData.fullTermOrPremature && formData.deliveryType;
      case 'postnatal':
        return formData.birthCry && formData.ageOfWalking && formData.ageOfTwoWordSpeech;
      case 'medical':
        return formData.healthConcerns;
      case 'educational':
        return formData.dominantWritingHand;
      case 'review':
        return TABS.slice(0, -1).every(tab => isTabCompleted(tab.id));
      default:
        return false;
    }
  };

  // Function to get tab status (completed, active, pending)
  const getTabStatus = (tabId: string) => {
    if (isTabCompleted(tabId)) return 'completed';
    if (activeTab === tabId) return 'active';
    return 'pending';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'demographics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Student's full name"
                  required
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age <span className="text-red-500">*</span></Label>
                <Input
                  id="age"
                  type="number"
                  min="2"
                  max="20"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Age in years"
                  required
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolCenter">School/Center <span className="text-red-500">*</span></Label>
                <Input
                  id="schoolCenter"
                  value={formData.schoolCenter}
                  onChange={(e) => handleInputChange('schoolCenter', e.target.value)}
                  placeholder="School or center name"
                  required
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Student's address"
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class <span className="text-red-500">*</span></Label>
                <Input
                  id="class"
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                  placeholder="E.g., Grade 2"
                  required
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherTongue">Mother Tongue</Label>
                <Input
                  id="motherTongue"
                  value={formData.motherTongue}
                  onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                  placeholder="Native language"
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="syllabus">Syllabus <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.syllabus}
                  onValueChange={(value) => handleInputChange('syllabus', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select syllabus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBSE">CBSE</SelectItem>
                    <SelectItem value="ICSE">ICSE</SelectItem>
                    <SelectItem value="State Board">State Board</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'family':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fatherName">Father's Name</Label>
                <Input
                  id="fatherName"
                  value={formData.fatherName}
                  onChange={(e) => handleInputChange('fatherName', e.target.value)}
                  placeholder="Father's full name"
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motherName">Mother's Name</Label>
                <Input
                  id="motherName"
                  value={formData.motherName}
                  onChange={(e) => handleInputChange('motherName', e.target.value)}
                  placeholder="Mother's full name"
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardianName">Guardian's Name</Label>
                <Input
                  id="guardianName"
                  value={formData.guardianName}
                  onChange={(e) => handleInputChange('guardianName', e.target.value)}
                  placeholder="Guardian's full name"
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="familyIncome">Family Income</Label>
                <Input
                  id="familyIncome"
                  value={formData.familyIncome}
                  onChange={(e) => handleInputChange('familyIncome', e.target.value)}
                  placeholder="Monthly/Annual income"
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="familyType">Family Type <span className="text-red-500">*</span></Label>
                <Select
                  value={formData.familyType}
                  onValueChange={(value) => handleInputChange('familyType', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select family type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nuclear">Nuclear</SelectItem>
                    <SelectItem value="Joint">Joint</SelectItem>
                    <SelectItem value="Extended">Extended</SelectItem>
                    <SelectItem value="Single Parent">Single Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dailyDigitalUse">Daily Digital Use</Label>
                <Input
                  id="dailyDigitalUse"
                  value={formData.dailyDigitalUse}
                  onChange={(e) => handleInputChange('dailyDigitalUse', e.target.value)}
                  placeholder="Hours per day"
                  disabled={isFormCompleted}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="digitalResourcesAtHome"
                  checked={formData.digitalResourcesAtHome}
                  onCheckedChange={(checked) => handleInputChange('digitalResourcesAtHome', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="digitalResourcesAtHome">Digital Resources at Home</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enjoysSchool"
                  checked={formData.enjoysSchool}
                  onCheckedChange={(checked) => handleInputChange('enjoysSchool', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="enjoysSchool">Enjoys School</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="externalAcademicSupport"
                  checked={formData.externalAcademicSupport}
                  onCheckedChange={(checked) => handleInputChange('externalAcademicSupport', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="externalAcademicSupport">External Academic Support</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enjoysReading"
                  checked={formData.enjoysReading}
                  onCheckedChange={(checked) => handleInputChange('enjoysReading', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="enjoysReading">Enjoys Reading</Label>
              </div>
            </div>
          </div>
        );

      case 'prenatal':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullTermOrPremature">Full Term or Premature</Label>
                <Select
                  value={formData.fullTermOrPremature}
                  onValueChange={(value) => handleInputChange('fullTermOrPremature', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full Term">Full Term</SelectItem>
                    <SelectItem value="Premature">Premature</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryType">Delivery Type</Label>
                <Select
                  value={formData.deliveryType}
                  onValueChange={(value) => handleInputChange('deliveryType', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Cesarean">Cesarean</SelectItem>
                    <SelectItem value="Assisted">Assisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pregnancyNormal"
                  checked={formData.pregnancyNormal}
                  onCheckedChange={(checked) => handleInputChange('pregnancyNormal', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="pregnancyNormal">Pregnancy Normal</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicationsDuringPregnancy">Medications During Pregnancy</Label>
                <Select
                  value={formData.medicationsDuringPregnancy}
                  onValueChange={(value) => handleInputChange('medicationsDuringPregnancy', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Not specified</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Vitamins only">Vitamins only</SelectItem>
                    <SelectItem value="Prescribed medications">Prescribed medications</SelectItem>
                    <SelectItem value="Over-the-counter medications">Over-the-counter medications</SelectItem>
                    <SelectItem value="Multiple medications">Multiple medications</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.medicationsDuringPregnancy && formData.medicationsDuringPregnancy !== '' && formData.medicationsDuringPregnancy !== 'None' && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="medicationsDuringPregnancyDetails">Medication Details</Label>
                  <Textarea
                    id="medicationsDuringPregnancyDetails"
                    value={formData.medicationsDuringPregnancyDetails}
                    onChange={(e) => handleInputChange('medicationsDuringPregnancyDetails', e.target.value)}
                    placeholder="Details about medications"
                    disabled={isFormCompleted}
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="miscarriagesAbortions"
                  checked={formData.miscarriagesAbortions}
                  onCheckedChange={(checked) => handleInputChange('miscarriagesAbortions', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="miscarriagesAbortions">History of Miscarriages/Abortions</Label>
              </div>
            </div>
          </div>
        );

      case 'postnatal':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthCry">Birth Cry</Label>
                <Select
                  value={formData.birthCry}
                  onValueChange={(value) => handleInputChange('birthCry', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immediate">Immediate</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                    <SelectItem value="None">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageOfWalking">Age of Walking (months)</Label>
                <Input
                  id="ageOfWalking"
                  type="number"
                  value={formData.ageOfWalking}
                  onChange={(e) => handleInputChange('ageOfWalking', e.target.value)}
                  placeholder="Age in months"
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ageOfTwoWordSpeech">Age of Two Word Speech (months)</Label>
                <Input
                  id="ageOfTwoWordSpeech"
                  type="number"
                  value={formData.ageOfTwoWordSpeech}
                  onChange={(e) => handleInputChange('ageOfTwoWordSpeech', e.target.value)}
                  placeholder="Age in months"
                  disabled={isFormCompleted}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="breastFed"
                  checked={formData.breastFed}
                  onCheckedChange={(checked) => handleInputChange('breastFed', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="breastFed">Breast Fed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="infantJaundice"
                  checked={formData.infantJaundice}
                  onCheckedChange={(checked) => handleInputChange('infantJaundice', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="infantJaundice">Infant Jaundice</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="incubation"
                  checked={formData.incubation}
                  onCheckedChange={(checked) => handleInputChange('incubation', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="incubation">Incubation Required</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="immunizationDone"
                  checked={formData.immunizationDone}
                  onCheckedChange={(checked) => handleInputChange('immunizationDone', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="immunizationDone">Immunization Done</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="consanguineousMarriage"
                  checked={formData.consanguineousMarriage}
                  onCheckedChange={(checked) => handleInputChange('consanguineousMarriage', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="consanguineousMarriage">Consanguineous Marriage</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="delayInNeckStanding"
                  checked={formData.delayInNeckStanding}
                  onCheckedChange={(checked) => handleInputChange('delayInNeckStanding', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="delayInNeckStanding">Delay in Neck Standing</Label>
              </div>
              {formData.delayInNeckStanding && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="delayInNeckStandingDetails">Delay Details</Label>
                  <Textarea
                    id="delayInNeckStandingDetails"
                    value={formData.delayInNeckStandingDetails}
                    onChange={(e) => handleInputChange('delayInNeckStandingDetails', e.target.value)}
                    placeholder="Details about the delay"
                    disabled={isFormCompleted}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'medical':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="healthConcerns">Health Concerns</Label>
                <Textarea
                  id="healthConcerns"
                  value={formData.healthConcerns}
                  onChange={(e) => handleInputChange('healthConcerns', e.target.value)}
                  placeholder="Any health concerns or conditions"
                  disabled={isFormCompleted}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="epilepticHistory"
                  checked={formData.epilepticHistory}
                  onCheckedChange={(checked) => handleInputChange('epilepticHistory', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="epilepticHistory">Epileptic History</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="onMedication"
                  checked={formData.onMedication}
                  onCheckedChange={(checked) => handleInputChange('onMedication', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="onMedication">On Medication</Label>
              </div>
              {formData.onMedication && (
                <div className="space-y-2 ml-6">
                  <Label htmlFor="medicationDetails">Medication Details</Label>
                  <Textarea
                    id="medicationDetails"
                    value={formData.medicationDetails}
                    onChange={(e) => handleInputChange('medicationDetails', e.target.value)}
                    placeholder="Medication name and details"
                    disabled={isFormCompleted}
                  />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="asthmaWheezing"
                  checked={formData.asthmaWheezing}
                  onCheckedChange={(checked) => handleInputChange('asthmaWheezing', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="asthmaWheezing">Asthma/Wheezing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="wearsGlasses"
                  checked={formData.wearsGlasses}
                  onCheckedChange={(checked) => handleInputChange('wearsGlasses', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="wearsGlasses">Wears Glasses</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visionTestDone"
                  checked={formData.visionTestDone}
                  onCheckedChange={(checked) => handleInputChange('visionTestDone', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="visionTestDone">Vision Test Done</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hearingTestDone"
                  checked={formData.hearingTestDone}
                  onCheckedChange={(checked) => handleInputChange('hearingTestDone', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="hearingTestDone">Hearing Test Done</Label>
              </div>
            </div>
          </div>
        );

      case 'educational':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dominantWritingHand">Dominant Writing Hand</Label>
                <Select
                  value={formData.dominantWritingHand}
                  onValueChange={(value) => handleInputChange('dominantWritingHand', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Right">Right</SelectItem>
                    <SelectItem value="Left">Left</SelectItem>
                    <SelectItem value="Ambidextrous">Ambidextrous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.repeatedGrades && (
                <div className="space-y-2">
                  <Label htmlFor="whichGradeRepeated">Which Grade Repeated</Label>
                  <Input
                    id="whichGradeRepeated"
                    value={formData.whichGradeRepeated}
                    onChange={(e) => handleInputChange('whichGradeRepeated', e.target.value)}
                    placeholder="Grade that was repeated"
                    disabled={isFormCompleted}
                  />
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="attendedPreschool"
                  checked={formData.attendedPreschool}
                  onCheckedChange={(checked) => handleInputChange('attendedPreschool', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="attendedPreschool">Attended Preschool</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="repeatedGrades"
                  checked={formData.repeatedGrades}
                  onCheckedChange={(checked) => handleInputChange('repeatedGrades', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="repeatedGrades">Repeated Grades</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="strugglesInLanguages"
                  checked={formData.strugglesInLanguages}
                  onCheckedChange={(checked) => handleInputChange('strugglesInLanguages', checked as boolean)}
                  disabled={isFormCompleted}
                />
                <Label htmlFor="strugglesInLanguages">Struggles in Languages</Label>
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="text-center py-4">
              <h3 className="text-lg font-semibold mb-2">Review Your Information</h3>
              <p className="text-gray-600">Please review all the information before submitting the form.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demographics Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Name:</strong> {formData.name || 'Not specified'}</p>
                  <p><strong>Age:</strong> {formData.age || 'Not specified'}</p>
                  <p><strong>Gender:</strong> {formData.gender || 'Not specified'}</p>
                  <p><strong>Class:</strong> {formData.class || 'Not specified'}</p>
                  <p><strong>School/Center:</strong> {formData.schoolCenter || 'Not specified'}</p>
                  <p><strong>Address:</strong> {formData.address || 'Not specified'}</p>
                  <p><strong>Mother Tongue:</strong> {formData.motherTongue || 'Not specified'}</p>
                  <p><strong>Syllabus:</strong> {formData.syllabus || 'Not specified'}</p>
                </CardContent>
              </Card>

              {/* Family History Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Family History
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Father's Name:</strong> {formData.fatherName || 'Not specified'}</p>
                  <p><strong>Mother's Name:</strong> {formData.motherName || 'Not specified'}</p>
                  <p><strong>Guardian's Name:</strong> {formData.guardianName || 'Not specified'}</p>
                  <p><strong>Family Income:</strong> {formData.familyIncome || 'Not specified'}</p>
                  <p><strong>Family Type:</strong> {formData.familyType || 'Not specified'}</p>
                  <p><strong>Digital Resources at Home:</strong> {formData.digitalResourcesAtHome ? 'Yes' : 'No'}</p>
                  <p><strong>Daily Digital Use:</strong> {formData.dailyDigitalUse || 'Not specified'}</p>
                  <p><strong>Enjoys School:</strong> {formData.enjoysSchool ? 'Yes' : 'No'}</p>
                  <p><strong>Study Assistant:</strong> {formData.studyAssistant || 'Not specified'}</p>
                  <p><strong>External Academic Support:</strong> {formData.externalAcademicSupport ? 'Yes' : 'No'}</p>
                  <p><strong>Enjoys Reading:</strong> {formData.enjoysReading ? 'Yes' : 'No'}</p>
                  <p><strong>Daily Parent-Child Time:</strong> {formData.dailyParentChildTime || 'Not specified'}</p>
                  <p><strong>Child Type:</strong> {formData.childType || 'Not specified'}</p>
                </CardContent>
              </Card>

              {/* Prenatal History Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Baby className="h-4 w-4" />
                    Prenatal History
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Pregnancy Normal:</strong> {formData.pregnancyNormal ? 'Yes' : 'No'}</p>
                  <p><strong>Medications During Pregnancy:</strong> {formData.medicationsDuringPregnancy ? 'Yes' : 'No'}</p>
                  {formData.medicationsDuringPregnancyDetails && (
                    <p><strong>Medication Details:</strong> {formData.medicationsDuringPregnancyDetails}</p>
                  )}
                  <p><strong>Miscarriages/Abortions:</strong> {formData.miscarriagesAbortions ? 'Yes' : 'No'}</p>
                  <p><strong>Full Term or Premature:</strong> {formData.fullTermOrPremature || 'Not specified'}</p>
                  <p><strong>Delivery Type:</strong> {formData.deliveryType || 'Not specified'}</p>
                </CardContent>
              </Card>

              {/* Postnatal History Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Postnatal History
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Breast Fed:</strong> {formData.breastFed ? 'Yes' : 'No'}</p>
                  <p><strong>Infant Jaundice:</strong> {formData.infantJaundice ? 'Yes' : 'No'}</p>
                  <p><strong>Incubation:</strong> {formData.incubation ? 'Yes' : 'No'}</p>
                  <p><strong>Immunization Done:</strong> {formData.immunizationDone ? 'Yes' : 'No'}</p>
                  <p><strong>Consanguineous Marriage:</strong> {formData.consanguineousMarriage ? 'Yes' : 'No'}</p>
                  <p><strong>Birth Cry:</strong> {formData.birthCry || 'Not specified'}</p>
                  <p><strong>Delay in Neck Standing:</strong> {formData.delayInNeckStanding ? 'Yes' : 'No'}</p>
                  {formData.delayInNeckStandingDetails && (
                    <p><strong>Neck Standing Details:</strong> {formData.delayInNeckStandingDetails}</p>
                  )}
                  <p><strong>Age of Walking:</strong> {formData.ageOfWalking ? `${formData.ageOfWalking} months` : 'Not specified'}</p>
                  <p><strong>Age of Two Word Speech:</strong> {formData.ageOfTwoWordSpeech ? `${formData.ageOfTwoWordSpeech} months` : 'Not specified'}</p>
                </CardContent>
              </Card>

              {/* Medical History Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Medical History
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Health Concerns:</strong> {formData.healthConcerns || 'None specified'}</p>
                  <p><strong>Epileptic History:</strong> {formData.epilepticHistory ? 'Yes' : 'No'}</p>
                  <p><strong>On Medication:</strong> {formData.onMedication ? 'Yes' : 'No'}</p>
                  {formData.medicationDetails && (
                    <p><strong>Medication Details:</strong> {formData.medicationDetails}</p>
                  )}
                  <p><strong>Asthma/Wheezing:</strong> {formData.asthmaWheezing ? 'Yes' : 'No'}</p>
                  <p><strong>Wears Glasses:</strong> {formData.wearsGlasses ? 'Yes' : 'No'}</p>
                  <p><strong>Vision Test Done:</strong> {formData.visionTestDone ? 'Yes' : 'No'}</p>
                  <p><strong>Hearing Test Done:</strong> {formData.hearingTestDone ? 'Yes' : 'No'}</p>
                </CardContent>
              </Card>

              {/* Educational History Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Educational History
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Attended Preschool:</strong> {formData.attendedPreschool ? 'Yes' : 'No'}</p>
                  <p><strong>Repeated Grades:</strong> {formData.repeatedGrades ? 'Yes' : 'No'}</p>
                  {formData.whichGradeRepeated && (
                    <p><strong>Which Grade Repeated:</strong> {formData.whichGradeRepeated}</p>
                  )}
                  <p><strong>Dominant Writing Hand:</strong> {formData.dominantWritingHand || 'Not specified'}</p>
                  <p><strong>Struggles in Languages:</strong> {formData.strugglesInLanguages ? 'Yes' : 'No'}</p>
                </CardContent>
              </Card>
            </div>

            {/* Summary Card */}
            <Card className="border-2 border-blue-200 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                  <CheckCircle className="h-5 w-5" />
                  Form Completion Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                      isTabCompleted('demographics') ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Demographics</p>
                    <p className={isTabCompleted('demographics') ? 'text-green-600' : 'text-gray-500'}>
                      {isTabCompleted('demographics') ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                      isTabCompleted('family') ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      <Users className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Family</p>
                    <p className={isTabCompleted('family') ? 'text-green-600' : 'text-gray-500'}>
                      {isTabCompleted('family') ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                      isTabCompleted('prenatal') ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      <Baby className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Prenatal</p>
                    <p className={isTabCompleted('prenatal') ? 'text-green-600' : 'text-gray-500'}>
                      {isTabCompleted('prenatal') ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                      isTabCompleted('postnatal') ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      <Heart className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Postnatal</p>
                    <p className={isTabCompleted('postnatal') ? 'text-green-600' : 'text-gray-500'}>
                      {isTabCompleted('postnatal') ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                      isTabCompleted('medical') ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Medical</p>
                    <p className={isTabCompleted('medical') ? 'text-green-600' : 'text-gray-500'}>
                      {isTabCompleted('medical') ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                      isTabCompleted('educational') ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Educational</p>
                    <p className={isTabCompleted('educational') ? 'text-green-600' : 'text-gray-500'}>
                      {isTabCompleted('educational') ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500">This section is under development</p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Top Row - Navigation and Child Selector */}
            <div className="flex items-center justify-between lg:justify-start gap-4 flex-1 min-w-0">
              <Link href="/educator/students">
                <Button variant="ghost" size="sm" className="rounded-md px-3 py-2 h-9">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              
              {/* Child Selector */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Child:</span>
                {selectedStudentId ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md min-w-0 flex-1 max-w-xs">
                    <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-blue-900 truncate">
                      {selectedStudentData?.fullName || 'Loading...'} 
                      {selectedStudentData?.grade && ` (Grade ${selectedStudentData.grade})`}
                    </span>
                  </div>
                ) : (
                  <Select onValueChange={handleStudentSelect} disabled={isFormCompleted}>
                    <SelectTrigger className="w-full max-w-xs rounded-md h-9">
                      <SelectValue placeholder="Select Child" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.fullName} - Grade {student.grade}
                        </SelectItem>
                      ))}
                      <SelectItem value="new-child" className="border-t border-gray-200 mt-2 pt-2">
                        <div className="flex items-center gap-2 text-blue-600 font-medium">
                          <Plus className="h-4 w-4" />
                          Add New Child
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Bottom Row - Status and Actions */}
            <div className="flex items-center justify-between lg:justify-end gap-3">
              {/* Status Indicator */}
              <div className="flex items-center">
                {intakeForm?.status === 'COMPLETED' ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                ) : hasUnsavedChanges ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Unsaved Changes</span>
                  </div>
                ) : intakeForm ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">In Progress</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">New Form</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveDraft}
                  variant="outline"
                  size="sm"
                  className="rounded-md px-3 py-2 h-9"
                  disabled={!selectedStudentId || isCreating || isUpdating || isFormCompleted}
                >
                  <Save className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Save Draft</span>
                  <span className="sm:hidden">Save</span>
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  size="sm"
                  className="rounded-md px-3 py-2 h-9"
                  disabled={!selectedStudentId || isSubmitting || isFormCompleted || !isFormComplete()}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Submitting...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Submit & Lock</span>
                      <span className="sm:hidden">Submit</span>
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={handleDownloadPDF}
                  variant="outline"
                  size="sm"
                  className="rounded-md px-3 py-2 h-9"
                  disabled={!selectedStudentId}
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">PDF</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Progress - Only show when there's actual progress */}
        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Form Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Student Selection Message - Show when no student selected */}
        {!selectedStudentId && (
          <Card className="border-2 border-blue-200 bg-blue-50/30">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-3 text-xl text-blue-900">
                <Users className="h-6 w-6 text-blue-600" />
                Select a Student to Begin
              </CardTitle>
              <p className="text-gray-600 mt-2 text-base">
                Use the student selector in the top bar to choose a student and create their intake assessment form
              </p>
            </CardHeader>
            {wasRedirectedFromRegistration && (
              <CardContent>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-lg mx-auto">
                  <p className="text-blue-800 font-medium">Looking for your newly registered student?</p>
                  <p className="text-blue-600 text-sm mt-1">
                    The student may take a moment to appear in the list. Please try refreshing using the button below.
                  </p>
                  <Button 
                    onClick={refreshStudents} 
                    variant="outline" 
                    className="w-full mt-3 flex items-center gap-2"
                    disabled={isLoadingStudents}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingStudents ? 'animate-spin' : ''}`} />
                    {isLoadingStudents ? 'Refreshing...' : 'Refresh Student List'}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Form Content */}
        {selectedStudentId && !isLoadingStudentData && (
          <div className="space-y-6">
            {selectedStudentData && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm font-medium">
                  ✓ Form prefilled with {selectedStudentData.fullName}'s information
                </p>
                <p className="text-green-600 text-xs mt-1">
                  Basic details have been automatically filled. Please review and complete the remaining sections.
                </p>
              </div>
            )}

            {/* Circular Tab Navigation */}
            <div className="mb-8">
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 z-0">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500 ease-in-out"
                    style={{ 
                      width: `${(TABS.findIndex(tab => tab.id === activeTab) / (TABS.length - 1)) * 100}%` 
                    }}
                  />
                </div>
                
                {/* Tab Icons */}
                <div className="relative z-10 flex justify-between items-center">
                  {TABS.map((tab, index) => {
                    const Icon = tab.icon;
                    const status = getTabStatus(tab.id);
                    const isActive = activeTab === tab.id;
                    const isCompleted = status === 'completed';
                    
                    return (
                      <div key={tab.id} className="flex flex-col items-center group">
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          className={`
                            relative w-12 h-12 rounded-full border-2 flex items-center justify-center
                            transition-all duration-300 ease-in-out transform hover:scale-110
                            ${isCompleted 
                              ? 'bg-green-500 border-green-500 text-white shadow-lg' 
                              : isActive 
                                ? 'bg-blue-500 border-blue-500 text-white shadow-lg' 
                                : 'bg-white border-gray-300 text-gray-500 hover:border-blue-300 hover:text-blue-500'
                            }
                          `}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-6 w-6" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                          
                          {/* Active indicator */}
                          {isActive && (
                            <div className="absolute -inset-1 rounded-full border-2 border-blue-300 animate-pulse" />
                          )}
                        </button>
                        
                        {/* Tab Label */}
                        <div className="mt-2 text-center min-h-[3rem] flex flex-col justify-start">
                          <p className={`
                            text-xs font-medium transition-colors duration-200 h-4 flex items-center justify-center
                            ${isCompleted 
                              ? 'text-green-600' 
                              : isActive 
                                ? 'text-blue-600' 
                                : 'text-gray-500 group-hover:text-blue-500'
                            }
                          `}>
                            {tab.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 max-w-20 leading-tight h-8 flex items-start justify-center">
                            {tab.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(TABS.find(tab => tab.id === activeTab)?.icon || User, { className: "h-5 w-5" })}
                  {TABS.find(tab => tab.id === activeTab)?.title}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {TABS.find(tab => tab.id === activeTab)?.description}
                </p>
              </CardHeader>
              <CardContent>
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderTabContent()}
                </motion.div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Save Changes Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              You have unsaved changes in the current form. What would you like to do?
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSaveAndContinue}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isCreating || isUpdating}
              >
                <Save className="h-4 w-4 mr-2" />
                Save & Continue
              </Button>
              
              <Button
                onClick={handleDiscardAndContinue}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Discard Changes
              </Button>
              
              <Button
                onClick={handleCancelModal}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}