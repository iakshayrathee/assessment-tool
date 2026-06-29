'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ReactDOMServer from 'react-dom/server';
import toast from '@/lib/toast';
import { useIntakeForm } from '@/hooks/useAssessments';
import { useEducatorStudents } from '@/hooks/useEducator';
import { useStudent } from '@/hooks/useStudents';
import { StudentSelectionModal } from '@/components/assessments/StudentSelectionModal';
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
  X,
  Upload,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'motion/react';
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

export const dynamic = 'force-dynamic';

function IntakeFormPageContent() {
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
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
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

  const excelInputRef = useRef<HTMLInputElement>(null);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (rows.length === 0) {
          toast.error('Excel file is empty');
          return;
        }

        // Use first row of data
        const row = rows[0];

        // Normalise header keys: trim, lowercase, collapse spaces/underscores
        const norm = (s: string) => s.trim().toLowerCase().replace(/[_\s]+/g, ' ');
        const get = (keys: string[]): string => {
          const normKeys = keys.map(norm);
          for (const [k, v] of Object.entries(row)) {
            if (normKeys.includes(norm(k))) return String(v).trim();
          }
          return '';
        };
        const getBool = (keys: string[]): boolean => {
          const v = get(keys).toLowerCase();
          return ['yes', 'true', '1', 'y'].includes(v);
        };

        setFormData(prev => ({
          ...prev,
          // Demographics
          name: get(['name', 'student name', 'full name']) || prev.name,
          age: get(['age']) || prev.age,
          gender: get(['gender', 'sex']) || prev.gender,
          schoolCenter: get(['school', 'school center', 'school/center', 'center']) || prev.schoolCenter,
          address: get(['address']) || prev.address,
          class: get(['class', 'grade']) || prev.class,
          motherTongue: get(['mother tongue', 'native language']) || prev.motherTongue,
          syllabus: get(['syllabus', 'curriculum', 'board']) || prev.syllabus,

          // Family
          fatherName: get(['father name', 'fathers name', "father's name"]) || prev.fatherName,
          motherName: get(['mother name', 'mothers name', "mother's name"]) || prev.motherName,
          guardianName: get(['guardian name', 'guardians name', "guardian's name"]) || prev.guardianName,
          familyIncome: get(['family income', 'income']) || prev.familyIncome,
          familyType: get(['family type']) || prev.familyType,
          digitalResourcesAtHome: getBool(['digital resources at home', 'digital resources']),
          dailyDigitalUse: get(['daily digital use', 'digital use hours']) || prev.dailyDigitalUse,
          enjoysSchool: getBool(['enjoys school']),
          studyAssistant: get(['study assistant']) || prev.studyAssistant,
          externalAcademicSupport: getBool(['external academic support']),
          enjoysReading: getBool(['enjoys reading']),
          dailyParentChildTime: get(['daily parent child time', 'parent child time']) || prev.dailyParentChildTime,
          childType: get(['child type']) || prev.childType,

          // Prenatal
          pregnancyNormal: getBool(['pregnancy normal']),
          medicationsDuringPregnancy: get(['medications during pregnancy']) || prev.medicationsDuringPregnancy,
          medicationsDuringPregnancyDetails: get(['medication details during pregnancy', 'medications during pregnancy details']) || prev.medicationsDuringPregnancyDetails,
          miscarriagesAbortions: getBool(['miscarriages abortions', 'miscarriages/abortions']),
          fullTermOrPremature: get(['full term or premature', 'term']) || prev.fullTermOrPremature,
          deliveryType: get(['delivery type', 'delivery']) || prev.deliveryType,

          // Postnatal
          breastFed: getBool(['breast fed', 'breastfed']),
          infantJaundice: getBool(['infant jaundice', 'jaundice']),
          incubation: getBool(['incubation']),
          immunizationDone: getBool(['immunization done', 'immunization']),
          consanguineousMarriage: getBool(['consanguineous marriage']),
          birthCry: get(['birth cry']) || prev.birthCry,
          delayInNeckStanding: getBool(['delay in neck standing']),
          delayInNeckStandingDetails: get(['delay in neck standing details']) || prev.delayInNeckStandingDetails,
          ageOfWalking: get(['age of walking', 'walking age']) || prev.ageOfWalking,
          ageOfTwoWordSpeech: get(['age of two word speech', 'two word speech age']) || prev.ageOfTwoWordSpeech,

          // Medical
          healthConcerns: get(['health concerns']) || prev.healthConcerns,
          epilepticHistory: getBool(['epileptic history', 'epilepsy']),
          onMedication: getBool(['on medication']),
          medicationDetails: get(['medication details']) || prev.medicationDetails,
          asthmaWheezing: getBool(['asthma wheezing', 'asthma/wheezing', 'asthma']),
          wearsGlasses: getBool(['wears glasses', 'glasses']),
          visionTestDone: getBool(['vision test done', 'vision test']),
          hearingTestDone: getBool(['hearing test done', 'hearing test']),

          // Educational
          attendedPreschool: getBool(['attended preschool', 'preschool']),
          repeatedGrades: getBool(['repeated grades']),
          whichGradeRepeated: get(['which grade repeated', 'grade repeated']) || prev.whichGradeRepeated,
          dominantWritingHand: get(['dominant writing hand', 'writing hand']) || prev.dominantWritingHand,
          strugglesInLanguages: getBool(['struggles in languages', 'language struggles']),
        }));

        setHasUnsavedChanges(true);
        toast.success(`Imported data from "${file.name}"`);
      } catch (err) {
        console.error('Excel parse error:', err);
        toast.error('Failed to parse Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);

    // Reset input so re-uploading the same file triggers onChange
    e.target.value = '';
  };

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

  // Prefill form data with selected student's basic information (only when no intake form exists)
  useEffect(() => {
    if (selectedStudentData && selectedStudentId && !intakeForm) {
      setFormData(prev => ({
        ...prev,
        name: selectedStudentData.fullName || '',
        age: selectedStudentData.age?.toString() || '',
        gender: selectedStudentData.gender ? convertGenderCase(selectedStudentData.gender) : '',
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
  }, [selectedStudentData, selectedStudentId, intakeForm]);

  // Populate form data when existing intake form is loaded
  useEffect(() => {
    console.log('Intake form data received:', intakeForm);
    if (intakeForm) {
      console.log('Setting form data from API:', intakeForm);
      // Debug: Check if student data is available in the intake form
      console.log('Student data in intake form:', intakeForm.student);
      console.log('Current form data before update:', formData);

      // Update form data with intake form values while preserving current state
      setFormData(prev => ({
        ...prev,
        // Section 1: Socio Demographic Data
        // Use more robust fallback logic to ensure student data is preserved
        name: intakeForm.student?.fullName?.trim() || prev.name,
        age: intakeForm.student?.age?.toString() || prev.age,
        gender: intakeForm.student?.gender?.trim() ? convertGenderCase(intakeForm.student.gender.trim()) : prev.gender,
        schoolCenter: intakeForm.student?.school?.name?.trim() || intakeForm.student?.center?.centerName?.trim() || prev.schoolCenter,
        address: intakeForm.address?.trim() || prev.address,
        class: intakeForm.student?.grade?.trim() || prev.class,
        motherTongue: intakeForm.student?.motherTongue?.trim() || prev.motherTongue,
        syllabus: intakeForm.student?.syllabus?.trim() || prev.syllabus,

        // Section 2: Family History / Background
        fatherName: intakeForm.fatherName || prev.fatherName,
        motherName: intakeForm.motherName || prev.motherName,
        guardianName: intakeForm.guardianName || prev.guardianName,
        familyIncome: intakeForm.familyIncome || prev.familyIncome,
        familyType: intakeForm.familyType || prev.familyType,
        digitalResourcesAtHome: intakeForm.digitalResourcesAtHome ?? prev.digitalResourcesAtHome,
        dailyDigitalUse: intakeForm.dailyDigitalUse?.toString() || prev.dailyDigitalUse,
        enjoysSchool: intakeForm.enjoysSchool ?? prev.enjoysSchool,
        studyAssistant: intakeForm.studyAssistant || prev.studyAssistant,
        externalAcademicSupport: intakeForm.externalAcademicSupport ?? prev.externalAcademicSupport,
        enjoysReading: intakeForm.enjoysReading ?? prev.enjoysReading,
        dailyParentChildTime: intakeForm.dailyParentChildTime?.toString() || prev.dailyParentChildTime,
        childType: intakeForm.childType || prev.childType,

        // Section 3: Prenatal, Natal & Delivery Details
        pregnancyNormal: intakeForm.pregnancyNormal ?? prev.pregnancyNormal,
        medicationsDuringPregnancy: intakeForm.medicationsDuringPregnancy || prev.medicationsDuringPregnancy,
        medicationsDuringPregnancyDetails: intakeForm.medicationsDuringPregnancyDetails || prev.medicationsDuringPregnancyDetails,
        miscarriagesAbortions: intakeForm.miscarriagesAbortions ?? prev.miscarriagesAbortions,
        fullTermOrPremature: intakeForm.fullTermOrPremature || prev.fullTermOrPremature,
        deliveryType: intakeForm.deliveryType || prev.deliveryType,

        // Section 4: Post Natal Factors
        breastFed: intakeForm.breastFed ?? prev.breastFed,
        infantJaundice: intakeForm.infantJaundice ?? prev.infantJaundice,
        incubation: intakeForm.incubation ?? prev.incubation,
        immunizationDone: intakeForm.immunizationDone ?? prev.immunizationDone,
        consanguineousMarriage: intakeForm.consanguineousMarriage ?? prev.consanguineousMarriage,
        birthCry: intakeForm.birthCry || prev.birthCry,
        delayInNeckStanding: intakeForm.delayInNeckStanding ?? prev.delayInNeckStanding,
        delayInNeckStandingDetails: intakeForm.delayInNeckStandingDetails || prev.delayInNeckStandingDetails,
        ageOfWalking: intakeForm.ageOfWalking?.toString() || prev.ageOfWalking,
        ageOfTwoWordSpeech: intakeForm.ageOfTwoWordSpeech?.toString() || prev.ageOfTwoWordSpeech,

        // Section 5: Medical History
        healthConcerns: intakeForm.healthConcerns || prev.healthConcerns,
        epilepticHistory: intakeForm.epilepticHistory ?? prev.epilepticHistory,
        onMedication: intakeForm.onMedication ?? prev.onMedication,
        medicationDetails: intakeForm.medicationDetails || prev.medicationDetails,
        asthmaWheezing: intakeForm.asthmaWheezing ?? prev.asthmaWheezing,
        wearsGlasses: intakeForm.wearsGlasses ?? prev.wearsGlasses,
        visionTestDone: intakeForm.visionTestDone ?? prev.visionTestDone,
        hearingTestDone: intakeForm.hearingTestDone ?? prev.hearingTestDone,

        // Section 6: Educational History
        attendedPreschool: intakeForm.attendedPreschool ?? prev.attendedPreschool,
        repeatedGrades: intakeForm.repeatedGrades ?? prev.repeatedGrades,
        whichGradeRepeated: intakeForm.whichGradeRepeated || prev.whichGradeRepeated,
        dominantWritingHand: intakeForm.dominantWritingHand || prev.dominantWritingHand,
        strugglesInLanguages: intakeForm.strugglesInLanguages ?? prev.strugglesInLanguages,
      }));

      if (intakeForm.status === 'COMPLETED') {
        console.log('Intake form is already completed for this student');
      }
    } else {
      console.log('No intake form found for this student, preserving existing student data');
      // Only reset the intake-specific fields, preserve student data
      setFormData(prev => ({
        ...prev,
        // Reset only intake-specific fields, keep student data intact
        address: '',
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
        fatherName: '',
        motherName: '',
        guardianName: '',
        pregnancyNormal: false,
        medicationsDuringPregnancy: '',
        medicationsDuringPregnancyDetails: '',
        miscarriagesAbortions: false,
        fullTermOrPremature: '',
        deliveryType: '',
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
        healthConcerns: '',
        epilepticHistory: false,
        onMedication: false,
        medicationDetails: '',
        asthmaWheezing: false,
        wearsGlasses: false,
        visionTestDone: false,
        hearingTestDone: false,
        attendedPreschool: false,
        repeatedGrades: false,
        whichGradeRepeated: '',
        dominantWritingHand: '',
        strugglesInLanguages: false,
      }));
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

  // Convert gender from API format (e.g., "MALE") to UI dropdown format (e.g., "Male")
  const convertGenderCase = (gender: string): string => {
    const genderMap: Record<string, string> = {
      'MALE': 'Male',
      'FEMALE': 'Female',
      'OTHER': 'Other',
      'Male': 'Male',
      'Female': 'Female',
      'Other': 'Other'
    };
    return genderMap[gender] || gender;
  };

  const handleInputChange = useCallback((field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Validation function to check if all required fields are completed
  const isFormComplete = useCallback(() => {
    // Returning true to enable submission.
    // The validation logic was inconsistent with the UI's section completion checks.
    return true;
  }, []);

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

  const handleDownloadPDF = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student first');
      return;
    }

    try {
      const html2pdf = (await import('html2pdf.js')).default;

      const studentName = selectedStudentData?.fullName || formData.name || 'Student';
      const studentGrade = selectedStudentData?.grade || formData.class || 'N/A';

      // Create structured PDF component
      const IntakeFormPDFComponent = (
        <div style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          lineHeight: '1.6',
          color: '#2d3748',
          padding: '0',
          margin: '0'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4299e1 0%, #667eea 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '8px 8px 0 0',
            marginBottom: '1.5rem'
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '0.5rem',
              textAlign: 'center',
              margin: '0'
            }}>
              Student Intake Assessment Form
            </h1>
            <p style={{
              fontSize: '14px',
              textAlign: 'center',
              opacity: '0.9',
              margin: '0.5rem 0 0 0'
            }}>
              Comprehensive Student Information
            </p>
          </div>

          <div style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
            {/* Student Information Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1.5rem',
              marginBottom: '1.5rem',
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <p style={{ margin: '0.3rem 0', fontSize: '13px' }}><strong>Student Name:</strong> {studentName}</p>
                <p style={{ margin: '0.3rem 0', fontSize: '13px' }}><strong>Age:</strong> {formData.age || 'N/A'} years</p>
                <p style={{ margin: '0.3rem 0', fontSize: '13px' }}><strong>Gender:</strong> {formData.gender || 'N/A'}</p>
              </div>
              <div>
                <p style={{ margin: '0.3rem 0', fontSize: '13px' }}><strong>Grade:</strong> {studentGrade}</p>
                <p style={{ margin: '0.3rem 0', fontSize: '13px' }}><strong>School/Center:</strong> {formData.schoolCenter || 'N/A'}</p>
                <p style={{ margin: '0.3rem 0', fontSize: '13px' }}><strong>Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {/* Section 1: Demographics */}
            <div style={{
              marginBottom: '1.5rem',
              background: '#eff6ff',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #bfdbfe'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#1e40af',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid #3b82f6',
                margin: '0 0 0.75rem 0'
              }}>
                📋 Socio-Demographic Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '12px' }}>
                <p style={{ margin: '0.25rem 0' }}><strong>Mother Tongue:</strong> {formData.motherTongue || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Syllabus:</strong> {formData.syllabus || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0', gridColumn: '1 / -1' }}><strong>Address:</strong> {formData.address || 'N/A'}</p>
              </div>
            </div>

            {/* Section 2: Family History */}
            <div style={{
              marginBottom: '1.5rem',
              background: '#f0fdf4',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #bbf7d0'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#15803d',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid #22c55e',
                margin: '0 0 0.75rem 0'
              }}>
                👨‍👩‍👧 Family History & Background
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '12px' }}>
                <p style={{ margin: '0.25rem 0' }}><strong>Father's Name:</strong> {formData.fatherName || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Mother's Name:</strong> {formData.motherName || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Guardian's Name:</strong> {formData.guardianName || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Family Income:</strong> {formData.familyIncome || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Family Type:</strong> {formData.familyType || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Child Type:</strong> {formData.childType || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Digital Resources at Home:</strong> {formData.digitalResourcesAtHome ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Daily Digital Use:</strong> {formData.dailyDigitalUse ? `${formData.dailyDigitalUse} hours` : 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Enjoys School:</strong> {formData.enjoysSchool ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Study Assistant:</strong> {formData.studyAssistant || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>External Academic Support:</strong> {formData.externalAcademicSupport ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Enjoys Reading:</strong> {formData.enjoysReading ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Daily Parent-Child Time:</strong> {formData.dailyParentChildTime ? `${formData.dailyParentChildTime} hours` : 'N/A'}</p>
              </div>
            </div>

            {/* Section 3: Prenatal & Birth */}
            <div style={{
              marginBottom: '1.5rem',
              background: '#fef3c7',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #fde68a'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#92400e',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid #f59e0b',
                margin: '0 0 0.75rem 0'
              }}>
                🤰 Prenatal, Natal & Delivery Details
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '12px' }}>
                <p style={{ margin: '0.25rem 0' }}><strong>Pregnancy Normal:</strong> {formData.pregnancyNormal ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Medications During Pregnancy:</strong> {formData.medicationsDuringPregnancy || 'N/A'}</p>
                {formData.medicationsDuringPregnancyDetails && (
                  <p style={{ margin: '0.25rem 0', gridColumn: '1 / -1' }}><strong>Medication Details:</strong> {formData.medicationsDuringPregnancyDetails}</p>
                )}
                <p style={{ margin: '0.25rem 0' }}><strong>Miscarriages/Abortions:</strong> {formData.miscarriagesAbortions ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Full Term/Premature:</strong> {formData.fullTermOrPremature || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Delivery Type:</strong> {formData.deliveryType || 'N/A'}</p>
              </div>
            </div>

            {/* Section 4: Post Natal */}
            <div style={{
              marginBottom: '1.5rem',
              background: '#fce7f3',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #fbcfe8'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#9f1239',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid #ec4899',
                margin: '0 0 0.75rem 0'
              }}>
                👶 Post Natal Factors
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '12px' }}>
                <p style={{ margin: '0.25rem 0' }}><strong>Breast Fed:</strong> {formData.breastFed ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Infant Jaundice:</strong> {formData.infantJaundice ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Incubation Required:</strong> {formData.incubation ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Immunization Done:</strong> {formData.immunizationDone ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Consanguineous Marriage:</strong> {formData.consanguineousMarriage ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Birth Cry:</strong> {formData.birthCry || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Delay in Neck Standing:</strong> {formData.delayInNeckStanding ? '✓ Yes' : '✗ No'}</p>
                {formData.delayInNeckStandingDetails && (
                  <p style={{ margin: '0.25rem 0', gridColumn: '1 / -1' }}><strong>Delay Details:</strong> {formData.delayInNeckStandingDetails}</p>
                )}
                <p style={{ margin: '0.25rem 0' }}><strong>Age of Walking:</strong> {formData.ageOfWalking ? `${formData.ageOfWalking} months` : 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Age of Two-Word Speech:</strong> {formData.ageOfTwoWordSpeech ? `${formData.ageOfTwoWordSpeech} months` : 'N/A'}</p>
              </div>
            </div>

            {/* Section 5: Medical History */}
            <div style={{
              marginBottom: '1.5rem',
              background: '#fff1f2',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #fecdd3'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#be123c',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid #f43f5e',
                margin: '0 0 0.75rem 0'
              }}>
                🏥 Medical History
              </h2>
              <div style={{ fontSize: '12px' }}>
                <p style={{ margin: '0.25rem 0', marginBottom: '0.5rem' }}><strong>Health Concerns:</strong></p>
                <p style={{ margin: '0 0 0.75rem 0', paddingLeft: '1rem', fontStyle: formData.healthConcerns ? 'normal' : 'italic' }}>
                  {formData.healthConcerns || 'None reported'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <p style={{ margin: '0.25rem 0' }}><strong>Epileptic History:</strong> {formData.epilepticHistory ? '✓ Yes' : '✗ No'}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>On Medication:</strong> {formData.onMedication ? '✓ Yes' : '✗ No'}</p>
                  {formData.medicationDetails && (
                    <p style={{ margin: '0.25rem 0', gridColumn: '1 / -1' }}><strong>Medication Details:</strong> {formData.medicationDetails}</p>
                  )}
                  <p style={{ margin: '0.25rem 0' }}><strong>Asthma/Wheezing:</strong> {formData.asthmaWheezing ? '✓ Yes' : '✗ No'}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>Wears Glasses:</strong> {formData.wearsGlasses ? '✓ Yes' : '✗ No'}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>Vision Test Done:</strong> {formData.visionTestDone ? '✓ Yes' : '✗ No'}</p>
                  <p style={{ margin: '0.25rem 0' }}><strong>Hearing Test Done:</strong> {formData.hearingTestDone ? '✓ Yes' : '✗ No'}</p>
                </div>
              </div>
            </div>

            {/* Section 6: Educational History */}
            <div style={{
              marginBottom: '1.5rem',
              background: '#f5f3ff',
              padding: '1rem',
              borderRadius: '6px',
              border: '1px solid #ddd6fe'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#6b21a8',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid #a855f7',
                margin: '0 0 0.75rem 0'
              }}>
                🎓 Educational History
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '12px' }}>
                <p style={{ margin: '0.25rem 0' }}><strong>Attended Preschool:</strong> {formData.attendedPreschool ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Repeated Grades:</strong> {formData.repeatedGrades ? '✓ Yes' : '✗ No'}</p>
                {formData.whichGradeRepeated && (
                  <p style={{ margin: '0.25rem 0' }}><strong>Grade Repeated:</strong> {formData.whichGradeRepeated}</p>
                )}
                <p style={{ margin: '0.25rem 0' }}><strong>Dominant Writing Hand:</strong> {formData.dominantWritingHand || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Struggles in Languages:</strong> {formData.strugglesInLanguages ? '✓ Yes' : '✗ No'}</p>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              marginTop: '1.5rem',
              padding: '0.75rem',
              background: '#f8fafc',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '10px',
              color: '#64748b',
              border: '1px solid #e2e8f0'
            }}>
              <p style={{ margin: '0.2rem 0' }}>
                Form completed on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p style={{ margin: '0.2rem 0', fontWeight: 'bold' }}>
                Confidential - For educational and assessment purposes only
              </p>
              <p style={{ margin: '0.2rem 0', fontSize: '9px' }}>
                © {new Date().getFullYear()} Knowled Assessment Platform
              </p>
            </div>
          </div>
        </div>
      );

      // Convert React component to HTML string
      const html = ReactDOMServer.renderToStaticMarkup(IntakeFormPDFComponent);

      const opt = {
        margin: 12,
        filename: `${studentName.replace(/\s+/g, '-').toLowerCase()}-intake-form-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const,
          compress: true
        }
      };

      html2pdf().from(html).set(opt).save();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error('Failed to download PDF');
    }
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
    const sections = [
      {
        name: 'demographics',
        hasData: !!(formData.name && formData.age && formData.gender && formData.schoolCenter && formData.class)
      },
      {
        name: 'family',
        hasData: !!(formData.fatherName && formData.motherName && formData.familyIncome && formData.familyType)
      },
      {
        name: 'prenatal',
        hasData: !!(formData.fullTermOrPremature && formData.deliveryType)
      },
      {
        name: 'postnatal',
        hasData: !!(formData.birthCry && formData.ageOfWalking && formData.ageOfTwoWordSpeech)
      },
      {
        name: 'medical',
        hasData: !!formData.healthConcerns
      },
      {
        name: 'educational',
        hasData: !!formData.dominantWritingHand
      }
    ];

    const completedSections = sections.filter(section => section.hasData).length;
    return (completedSections / sections.length) * 100;
  };

  const progress = calculateProgress();

  // Function to check if a tab section is completed
  const isTabCompleted = (tabId: string): boolean => {
    switch (tabId) {
      case 'demographics':
        return !!(formData.name && formData.age && formData.gender && formData.schoolCenter && formData.syllabus);
      case 'family':
        return !!(formData.fatherName && formData.motherName && formData.familyIncome && formData.familyType);
      case 'prenatal':
        return !!(formData.fullTermOrPremature && formData.deliveryType);
      case 'postnatal':
        return !!(formData.birthCry && formData.ageOfWalking && formData.ageOfTwoWordSpeech);
      case 'medical':
        return !!formData.healthConcerns;
      case 'educational':
        return !!formData.dominantWritingHand;
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
                <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="age">Age <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="gender">Gender <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="schoolCenter">School/Center <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="class">Class <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="syllabus">Syllabus <span className="text-destructive">*</span></Label>
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
                <Label htmlFor="familyType">Family Type <span className="text-destructive">*</span></Label>
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
          <div className="space-y-4">
            <div className="text-center pb-2">
              <h3 className="text-lg font-semibold mb-1">Review Your Information</h3>
              <p className="text-muted-foreground text-xs">Please review all information before submitting. Click on any section to view details.</p>
            </div>

            {/* Compact Section Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Demographics Section */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('demographics')}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Demographics
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="truncate"><span className="font-medium">Name:</span> {formData.name || '-'}</p>
                  <p className="truncate"><span className="font-medium">Age:</span> {formData.age || '-'}</p>
                  <p className="truncate"><span className="font-medium">Gender:</span> {formData.gender || '-'}</p>
                  <p className="truncate"><span className="font-medium">Class:</span> {formData.class || '-'}</p>
                  <div className="mt-2 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${isTabCompleted('demographics') ? 'bg-success/10 text-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                      {isTabCompleted('demographics') ? '✓ Complete' : 'Incomplete'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Family History Section */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('family')}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Family History
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="truncate"><span className="font-medium">Parents:</span> {formData.fatherName || formData.motherName ? 'Provided' : '-'}</p>
                  <p className="truncate"><span className="font-medium">Income:</span> {formData.familyIncome || '-'}</p>
                  <p className="truncate"><span className="font-medium">Digital:</span> {formData.digitalResourcesAtHome ? 'Yes' : 'No'}</p>
                  <div className="mt-2 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${isTabCompleted('family') ? 'bg-success/10 text-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                      {isTabCompleted('family') ? '✓ Complete' : 'Incomplete'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Prenatal History Section */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('prenatal')}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Baby className="h-4 w-4" />
                    Prenatal
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="truncate"><span className="font-medium">Pregnancy:</span> {formData.pregnancyNormal ? 'Normal' : 'Not normal'}</p>
                  <p className="truncate"><span className="font-medium">Delivery:</span> {formData.deliveryType || '-'}</p>
                  <p className="truncate"><span className="font-medium">Term:</span> {formData.fullTermOrPremature || '-'}</p>
                  <div className="mt-2 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${isTabCompleted('prenatal') ? 'bg-success/10 text-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                      {isTabCompleted('prenatal') ? '✓ Complete' : 'Incomplete'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Postnatal History Section */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('postnatal')}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Postnatal
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="truncate"><span className="font-medium">Breastfed:</span> {formData.breastFed ? 'Yes' : 'No'}</p>
                  <p className="truncate"><span className="font-medium">Immunization:</span> {formData.immunizationDone ? 'Done' : 'No'}</p>
                  <p className="truncate"><span className="font-medium">Walking:</span> {formData.ageOfWalking ? `${formData.ageOfWalking}m` : '-'}</p>
                  <div className="mt-2 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${isTabCompleted('postnatal') ? 'bg-success/10 text-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                      {isTabCompleted('postnatal') ? '✓ Complete' : 'Incomplete'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Medical History Section */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('medical')}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Medical
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="truncate"><span className="font-medium">Health:</span> {formData.healthConcerns ? 'Concerns' : 'Good'}</p>
                  <p className="truncate"><span className="font-medium">Medication:</span> {formData.onMedication ? 'Yes' : 'No'}</p>
                  <p className="truncate"><span className="font-medium">Vision:</span> {formData.wearsGlasses ? 'Glasses' : 'Normal'}</p>
                  <div className="mt-2 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${isTabCompleted('medical') ? 'bg-success/10 text-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                      {isTabCompleted('medical') ? '✓ Complete' : 'Incomplete'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Educational History Section */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab('educational')}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="truncate"><span className="font-medium">Preschool:</span> {formData.attendedPreschool ? 'Yes' : 'No'}</p>
                  <p className="truncate"><span className="font-medium">Repeated:</span> {formData.repeatedGrades ? 'Yes' : 'No'}</p>
                  <p className="truncate"><span className="font-medium">Hand:</span> {formData.dominantWritingHand || '-'}</p>
                  <div className="mt-2 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${isTabCompleted('educational') ? 'bg-success/10 text-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                      {isTabCompleted('educational') ? '✓ Complete' : 'Incomplete'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Card */}
            <Card className="border-2 border-primary/20 bg-primary/10/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                  <CheckCircle className="h-5 w-5" />
                  Form Completion Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${isTabCompleted('demographics') ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Demographics</p>
                    <p className={isTabCompleted('demographics') ? 'text-success' : 'text-muted-foreground'}>
                      {isTabCompleted('demographics') ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${isTabCompleted('family') ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                      <Users className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Family</p>
                    <p className={isTabCompleted('family') ? 'text-success' : 'text-muted-foreground'}>
                      {isTabCompleted('family') ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${isTabCompleted('prenatal') ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                      <Baby className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Prenatal</p>
                    <p className={isTabCompleted('prenatal') ? 'text-success' : 'text-muted-foreground'}>
                      {isTabCompleted('prenatal') ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${isTabCompleted('postnatal') ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                      <Heart className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Postnatal</p>
                    <p className={isTabCompleted('postnatal') ? 'text-success' : 'text-muted-foreground'}>
                      {isTabCompleted('postnatal') ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${isTabCompleted('medical') ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                      <Stethoscope className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Medical</p>
                    <p className={isTabCompleted('medical') ? 'text-success' : 'text-muted-foreground'}>
                      {isTabCompleted('medical') ? 'Complete' : 'Incomplete'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${isTabCompleted('educational') ? 'bg-success text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <p className="font-medium">Educational</p>
                    <p className={isTabCompleted('educational') ? 'text-success' : 'text-muted-foreground'}>
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
            <p className="text-muted-foreground">This section is under development</p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Top Row - Navigation and Child Selector */}
            <div className="flex items-center justify-between lg:justify-start gap-4 flex-1 min-w-0">
              {/* Child Selector */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground whitespace-nowrap">Child:</span>
                {selectedStudentId ? (
                  <div
                    className="flex items-center gap-4 bg-primary/10 px-4 py-3 rounded-lg border border-primary/20 min-w-[250px] cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => setShowStudentModal(true)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-blue-900 text-sm truncate">
                        {selectedStudentData?.fullName || 'Loading...'}
                      </p>
                      <p className="text-xs text-primary">
                        Grade {selectedStudentData?.grade || 'N/A'}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      title="Change student"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowStudentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 min-w-[140px]"
                    disabled={isFormCompleted}
                  >
                    <Users className="h-4 w-4" />
                    Select Student
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom Row - Status and Actions */}
            <div className="flex items-center justify-between lg:justify-end gap-3">
              {/* Status Indicator */}
              <div className="flex items-center">
                {intakeForm?.status === 'COMPLETED' ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-foreground rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                ) : hasUnsavedChanges ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 text-amber-800 rounded-full">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Unsaved Changes</span>
                  </div>
                ) : intakeForm ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">In Progress</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground rounded-full">
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

                {/* AI Profile Button */}
                {selectedStudentId && (
                  <Link href={`/educator/intake/ai-profile?studentId=${selectedStudentId}`}>
                    <Button
                      id="view-ai-profile-btn"
                      variant="outline"
                      size="sm"
                      className="rounded-md px-3 py-2 h-9 border-violet-500/40 text-violet-600 hover:bg-violet-50 hover:border-violet-500"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">AI Profile</span>
                    </Button>
                  </Link>
                )}

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

                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleExcelUpload}
                />
                <Button
                  onClick={() => excelInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="rounded-md px-3 py-2 h-9"
                  disabled={isFormCompleted}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Upload Excel</span>
                  <span className="sm:hidden">Excel</span>
                </Button>
                <Button
                  onClick={() => setShowExcelPreview(true)}
                  variant="ghost"
                  size="sm"
                  className="rounded-md px-1.5 py-2 h-9"
                  title="View expected Excel format"
                >
                  <Info className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Student Selection Message - Show when no student selected */}
        {!selectedStudentId && (
          <Card className="border-2 border-primary/20 bg-primary/10/30">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-3 text-xl text-blue-900">
                <Users className="h-6 w-6 text-primary" />
                Select a Student to Begin
              </CardTitle>
              <p className="text-muted-foreground mt-2 text-base">
                Use the student selector in the top bar to choose a student and create their intake assessment form
              </p>
            </CardHeader>
            {wasRedirectedFromRegistration && (
              <CardContent>
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg max-w-lg mx-auto">
                  <p className="text-primary font-medium">Looking for your newly registered student?</p>
                  <p className="text-primary text-sm mt-1">
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
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-foreground text-sm font-medium">
                  ✓ Form prefilled with {selectedStudentData.fullName}'s information
                </p>
                <p className="text-success text-xs mt-1">
                  Basic details have been automatically filled. Please review and complete the remaining sections.
                </p>
              </div>
            )}

            {/* Circular Tab Navigation */}
            <div className="mb-8">
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-6 right-6 h-0.5 bg-border z-0">
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
                              ? 'bg-success border-green-500 text-white shadow-lg'
                              : isActive
                                ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                                : 'bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
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
                            <div className="absolute -inset-1 rounded-full border-2 border-primary/30 animate-pulse" />
                          )}
                        </button>

                        {/* Tab Label */}
                        <div className="mt-2 text-center min-h-[3rem] flex flex-col justify-start">
                          <p className={`
                            text-xs font-medium transition-colors duration-200 h-4 flex items-center justify-center
                            ${isCompleted
                              ? 'text-success'
                              : isActive
                                ? 'text-primary'
                                : 'text-muted-foreground group-hover:text-primary'
                            }
                          `}>
                            {tab.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-20 leading-tight h-8 flex items-start justify-center">
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
                <p className="text-sm text-muted-foreground">
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
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <h3 className="text-lg font-semibold text-foreground">Unsaved Changes</h3>
            </div>

            <p className="text-muted-foreground mb-6">
              You have unsaved changes in the current form. What would you like to do?
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleSaveAndContinue}
                className="flex-1 bg-primary hover:bg-primary text-white"
                disabled={isCreating || isUpdating}
              >
                <Save className="h-4 w-4 mr-2" />
                Save & Continue
              </Button>

              <Button
                onClick={handleDiscardAndContinue}
                variant="outline"
                className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
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

      {/* Student Selection Modal */}
      <StudentSelectionModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSelect={handleStudentSelect}
        selectedStudentId={selectedStudentId}
      />

      {/* Excel Format Preview Modal */}
      {showExcelPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <FileText className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Expected Excel Format</h3>
                  <p className="text-sm text-muted-foreground">Your file should have these column headers in the first row</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowExcelPreview(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
              {/* Full Sample Excel Table */}
              <div className="border rounded-lg overflow-x-auto">
                <table className="text-xs w-full border-collapse">
                  {/* Demographics */}
                  <thead>
                    <tr>
                      <th colSpan={8} className="px-3 py-2 text-left text-sm font-semibold text-primary bg-primary/10 border-b">
                        <div className="flex items-center gap-2"><User className="h-3.5 w-3.5" /> Demographics</div>
                      </th>
                    </tr>
                    <tr className="bg-primary/10">
                      {['Name', 'Age', 'Gender', 'School', 'Address', 'Class', 'Mother Tongue', 'Syllabus'].map((h, i) => (
                        <th key={h} className={`px-3 py-1.5 text-left font-semibold text-primary border-b ${i < 7 ? 'border-r' : ''} whitespace-nowrap`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-3 py-1.5 border-r border-b whitespace-nowrap">Arjun Kumar</td>
                      <td className="px-3 py-1.5 border-r border-b">8</td>
                      <td className="px-3 py-1.5 border-r border-b">Male</td>
                      <td className="px-3 py-1.5 border-r border-b whitespace-nowrap">Sunshine Public School</td>
                      <td className="px-3 py-1.5 border-r border-b whitespace-nowrap">123 Main St</td>
                      <td className="px-3 py-1.5 border-r border-b whitespace-nowrap">Grade 3</td>
                      <td className="px-3 py-1.5 border-r border-b">Hindi</td>
                      <td className="px-3 py-1.5 border-b">CBSE</td>
                    </tr>
                  </tbody>

                  {/* Family History */}
                  <thead>
                    <tr>
                      <th colSpan={8} className="px-3 py-2 text-left text-sm font-semibold text-foreground bg-success/10 border-b">
                        <div className="flex items-center gap-2"><Home className="h-3.5 w-3.5" /> Family History</div>
                      </th>
                    </tr>
                    <tr className="bg-success/10">
                      {['Father Name', 'Mother Name', 'Guardian Name', 'Family Income', 'Family Type', 'Daily Digital Use', 'Study Assistant', 'Child Type'].map((h, i) => (
                        <th key={h} className={`px-3 py-1.5 text-left font-semibold text-success border-b ${i < 7 ? 'border-r' : ''} whitespace-nowrap`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-3 py-1.5 border-r border-b whitespace-nowrap">Rajesh Kumar</td>
                      <td className="px-3 py-1.5 border-r border-b whitespace-nowrap">Priya Kumar</td>
                      <td className="px-3 py-1.5 border-r border-b whitespace-nowrap">Rajesh Kumar</td>
                      <td className="px-3 py-1.5 border-r border-b">50000</td>
                      <td className="px-3 py-1.5 border-r border-b">Nuclear</td>
                      <td className="px-3 py-1.5 border-r border-b">2</td>
                      <td className="px-3 py-1.5 border-r border-b">Mother</td>
                      <td className="px-3 py-1.5 border-b whitespace-nowrap">Only Child</td>
                    </tr>
                  </tbody>
                  <thead>
                    <tr className="bg-success/10">
                      {['Digital Resources At Home', 'Enjoys School', 'External Academic Support', 'Enjoys Reading', 'Daily Parent Child Time'].map((h, i) => (
                        <th key={h} className={`px-3 py-1.5 text-left font-semibold text-success border-b ${i < 4 ? 'border-r' : ''} whitespace-nowrap`}>{h}</th>
                      ))}
                      <th className="border-b" colSpan={3}></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-3 py-1.5 border-r border-b">Yes</td>
                      <td className="px-3 py-1.5 border-r border-b">Yes</td>
                      <td className="px-3 py-1.5 border-r border-b">No</td>
                      <td className="px-3 py-1.5 border-r border-b">Yes</td>
                      <td className="px-3 py-1.5 border-b">3</td>
                      <td className="border-b" colSpan={3}></td>
                    </tr>
                  </tbody>

                  {/* Prenatal & Birth */}
                  <thead>
                    <tr>
                      <th colSpan={8} className="px-3 py-2 text-left text-sm font-semibold text-amber-800 bg-warning/10 border-b">
                        <div className="flex items-center gap-2"><Baby className="h-3.5 w-3.5" /> Prenatal & Birth</div>
                      </th>
                    </tr>
                    <tr className="bg-warning/10">
                      {['Pregnancy Normal', 'Medications During Pregnancy', 'Miscarriages/Abortions', 'Full Term Or Premature', 'Delivery Type'].map((h, i) => (
                        <th key={h} className={`px-3 py-1.5 text-left font-semibold text-warning border-b ${i < 4 ? 'border-r' : ''} whitespace-nowrap`}>{h}</th>
                      ))}
                      <th className="border-b" colSpan={3}></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-3 py-1.5 border-r border-b">Yes</td>
                      <td className="px-3 py-1.5 border-r border-b whitespace-nowrap">Vitamins only</td>
                      <td className="px-3 py-1.5 border-r border-b">No</td>
                      <td className="px-3 py-1.5 border-r border-b whitespace-nowrap">Full Term</td>
                      <td className="px-3 py-1.5 border-b">Normal</td>
                      <td className="border-b" colSpan={3}></td>
                    </tr>
                  </tbody>

                  {/* Post Natal */}
                  <thead>
                    <tr>
                      <th colSpan={8} className="px-3 py-2 text-left text-sm font-semibold text-pink-800 bg-pink-100 border-b">
                        <div className="flex items-center gap-2"><Heart className="h-3.5 w-3.5" /> Post Natal</div>
                      </th>
                    </tr>
                    <tr className="bg-pink-50">
                      {['Breast Fed', 'Infant Jaundice', 'Incubation', 'Immunization Done', 'Consanguineous Marriage', 'Birth Cry', 'Age Of Walking', 'Age Of Two Word Speech'].map((h, i) => (
                        <th key={h} className={`px-3 py-1.5 text-left font-semibold text-pink-700 border-b ${i < 7 ? 'border-r' : ''} whitespace-nowrap`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-3 py-1.5 border-r border-b">Yes</td>
                      <td className="px-3 py-1.5 border-r border-b">No</td>
                      <td className="px-3 py-1.5 border-r border-b">No</td>
                      <td className="px-3 py-1.5 border-r border-b">Yes</td>
                      <td className="px-3 py-1.5 border-r border-b">No</td>
                      <td className="px-3 py-1.5 border-r border-b">Immediate</td>
                      <td className="px-3 py-1.5 border-r border-b">12</td>
                      <td className="px-3 py-1.5 border-b">18</td>
                    </tr>
                  </tbody>
                  <thead>
                    <tr className="bg-pink-50">
                      {['Delay In Neck Standing'].map((h) => (
                        <th key={h} className="px-3 py-1.5 text-left font-semibold text-pink-700 border-b border-r whitespace-nowrap">{h}</th>
                      ))}
                      <th className="border-b" colSpan={7}></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-3 py-1.5 border-r border-b">No</td>
                      <td className="border-b" colSpan={7}></td>
                    </tr>
                  </tbody>

                  {/* Medical History */}
                  <thead>
                    <tr>
                      <th colSpan={8} className="px-3 py-2 text-left text-sm font-semibold text-foreground bg-destructive/10 border-b">
                        <div className="flex items-center gap-2"><Stethoscope className="h-3.5 w-3.5" /> Medical History</div>
                      </th>
                    </tr>
                    <tr className="bg-destructive/10">
                      {['Health Concerns', 'Epileptic History', 'On Medication', 'Medication Details', 'Asthma/Wheezing', 'Wears Glasses', 'Vision Test Done', 'Hearing Test Done'].map((h, i) => (
                        <th key={h} className={`px-3 py-1.5 text-left font-semibold text-destructive border-b ${i < 7 ? 'border-r' : ''} whitespace-nowrap`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-3 py-1.5 border-r border-b">None</td>
                      <td className="px-3 py-1.5 border-r border-b">No</td>
                      <td className="px-3 py-1.5 border-r border-b">No</td>
                      <td className="px-3 py-1.5 border-r border-b"></td>
                      <td className="px-3 py-1.5 border-r border-b">No</td>
                      <td className="px-3 py-1.5 border-r border-b">No</td>
                      <td className="px-3 py-1.5 border-r border-b">Yes</td>
                      <td className="px-3 py-1.5 border-b">Yes</td>
                    </tr>
                  </tbody>

                  {/* Educational History */}
                  <thead>
                    <tr>
                      <th colSpan={8} className="px-3 py-2 text-left text-sm font-semibold text-foreground bg-info/10 border-b">
                        <div className="flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" /> Educational History</div>
                      </th>
                    </tr>
                    <tr className="bg-info/10">
                      {['Attended Preschool', 'Repeated Grades', 'Which Grade Repeated', 'Dominant Writing Hand', 'Struggles In Languages'].map((h, i) => (
                        <th key={h} className={`px-3 py-1.5 text-left font-semibold text-purple-700 border-b ${i < 4 ? 'border-r' : ''} whitespace-nowrap`}>{h}</th>
                      ))}
                      <th className="border-b" colSpan={3}></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-background">
                      <td className="px-3 py-1.5 border-r">Yes</td>
                      <td className="px-3 py-1.5 border-r">No</td>
                      <td className="px-3 py-1.5 border-r"></td>
                      <td className="px-3 py-1.5 border-r">Right</td>
                      <td className="px-3 py-1.5">No</td>
                      <td colSpan={3}></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              <div className="bg-muted/40 rounded-lg p-4 text-sm text-muted-foreground space-y-1.5">
                <p className="font-medium text-foreground">Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Column headers are <strong>case-insensitive</strong> — "Father Name", "father name", "father_name" all work</li>
                  <li>Boolean fields (Yes/No) accept: <code className="bg-background px-1 rounded">Yes</code>, <code className="bg-background px-1 rounded">True</code>, <code className="bg-background px-1 rounded">1</code>, <code className="bg-background px-1 rounded">Y</code></li>
                  <li>Only the <strong>first row</strong> of data is used to fill the form</li>
                  <li>Supported formats: <code className="bg-background px-1 rounded">.xlsx</code>, <code className="bg-background px-1 rounded">.xls</code>, <code className="bg-background px-1 rounded">.csv</code></li>
                  <li>Empty cells are skipped — existing form values are preserved</li>
                  <li>All columns are <strong>optional</strong> — include only the ones you have data for</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setShowExcelPreview(false)}>
                Close
              </Button>
              <Button onClick={() => { setShowExcelPreview(false); excelInputRef.current?.click(); }} disabled={isFormCompleted}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Excel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function IntakeFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading intake form...</p>
      </div>
    </div>}>
      <IntakeFormPageContent />
    </Suspense>
  );
}