'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
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
  age: string; // auto-calculated from dateOfBirth (kept for API compatibility)
  dateOfBirth: string;
  chronologicalAge: string; // display string: "11 years 3 months"
  gender: string;
  schoolCenter: string;
  schoolType: string;
  address: string;
  city: string;
  state: string;
  urbanOrRural: string;
  class: string;
  motherTongue: string;
  languageSpokenAtHome: string;
  mediumOfInstruction: string;
  yearsExposedToInstructionLanguage: string;
  numberOfLanguagesUnderstood: string;
  syllabus: string;
  childLivesWith: string;
  previousGradeRetention: string;
  schoolAttendance: string;

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
  primaryCaregiver: string;
  numberOfSiblings: string;
  birthOrder: string;
  familyHistoryOfDifficulties: boolean;
  familyHistoryDetails: string;
  digitalResourceTypes: string[];
  languagesSpokenAtHome: string[];
  parentHelpsWithHomework: string;
  enjoySchoolRating: string;
  enjoyReadingRating: string;
  externalSupportTypes: string[];

  // Section 3: Prenatal, Natal & Delivery Details
  pregnancyNormal: boolean;
  medicationsDuringPregnancy: string;
  medicationsDuringPregnancyDetails: string;
  miscarriagesAbortions: boolean;
  fullTermOrPremature: string;
  deliveryType: string;
  gestationalAge: string;
  nicuStay: string;
  birthWeight: string;
  pregnancyComplications: string[];
  feedingDifficulties: boolean;
  significantIllness: boolean;
  significantIllnessDetails: string;

  // Section 4: Post Natal Factors
  breastFed: string;
  breastFedDuration: string;
  infantJaundice: boolean;
  infantJaundiceTreatment: string;
  incubation: boolean;
  incubationDays: string;
  incubationReason: string[];
  immunizationDone: string;
  consanguineousMarriage: string;
  birthCry: string;
  birthCryDelayDuration: string;
  resuscitationRequired: boolean;
  delayInNeckStanding: boolean;
  delayInNeckStandingDetails: string;
  ageOfWalking: string;
  ageOfTwoWordSpeech: string;
  seizuresInfancy: boolean;
  seizuresInfancyDetails: string;
  visionProblemsEarly: boolean;
  hearingProblemsEarly: boolean;
  hospitalizationFirstTwoYears: boolean;
  hospitalizationFirstTwoYearsReason: string;

  // Section 5: Medical History
  healthConcerns: string;
  epilepticHistory: boolean;
  epilepsyType: string;
  epilepsyLastEpisode: string;
  epilepsyFrequency: string;
  epilepsyUnderMedicalCare: boolean;
  onMedication: boolean;
  medicationDetails: string;
  medicationName: string;
  medicationDosage: string;
  medicationFrequency: string;
  medicationPurpose: string[];
  asthmaWheezing: boolean;
  asthmaUsesInhaler: boolean;
  asthmaFrequency: string;
  asthmaEmergencyPlan: boolean;
  wearsGlasses: boolean;
  glassesUsage: string;
  visionTestDone: boolean;
  visionTestResult: string;
  visionTestDate: string;
  hearingTestDone: boolean;
  hearingTestResult: string;
  hearingTestDate: string;
  sleepDifficulties: boolean;
  sleepDifficultiesDetails: string[];
  hospitalizationHistory: boolean;
  hospitalizationHistoryReason: string;
  hospitalizationHistoryDate: string;

  // Section 6: Educational History
  attendedPreschool: boolean;
  ageStartedPreschool: string;
  yearsPreschool: string;
  repeatedGrades: boolean;
  whichGradeRepeated: string;
  reasonForRepeating: string;
  dominantWritingHand: string;
  overallPerformance: string;
  overallPercentage: string;
  subjectPerformance: Record<string, string>;
  subjectMarks: Record<string, { marks: string; grade: string }>;
  academicTrend: string;
  teacherComments: string;
  languageStruggles: string[];
  mathStruggles: string[];
  homeworkCompletion: string;
  classroomParticipation: string;
  attendancePercentage: string;
  learningStrengths: string[];
  areasSupport: string[];
  previousSupport: string[];
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

// TABS are defined inside the component so they can use t()
const TABS_IDS = ['demographics', 'family', 'prenatal', 'postnatal', 'medical', 'educational', 'review'] as const;
type TabId = typeof TABS_IDS[number];
const TAB_ICONS: Record<TabId, React.ComponentType<{ className?: string }>> = {
  demographics: User,
  family: Home,
  prenatal: Baby,
  postnatal: Heart,
  medical: Stethoscope,
  educational: GraduationCap,
  review: CheckCircle,
};

export const dynamic = 'force-dynamic';

function IntakeFormPageContent() {
  const { t } = useTranslation('educator');
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
    dateOfBirth: '',
    chronologicalAge: '',
    gender: '',
    schoolCenter: '',
    schoolType: '',
    address: '',
    city: '',
    state: '',
    urbanOrRural: '',
    class: '',
    motherTongue: '',
    languageSpokenAtHome: '',
    mediumOfInstruction: '',
    yearsExposedToInstructionLanguage: '',
    numberOfLanguagesUnderstood: '',
    syllabus: '',
    childLivesWith: '',
    previousGradeRetention: '',
    schoolAttendance: '',

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
    primaryCaregiver: '',
    numberOfSiblings: '',
    birthOrder: '',
    familyHistoryOfDifficulties: false,
    familyHistoryDetails: '',
    digitalResourceTypes: [],
    languagesSpokenAtHome: [],
    parentHelpsWithHomework: '',
    enjoySchoolRating: '',
    enjoyReadingRating: '',
    externalSupportTypes: [],

    // Section 3: Prenatal, Natal & Delivery Details
    pregnancyNormal: false,
    medicationsDuringPregnancy: '',
    medicationsDuringPregnancyDetails: '',
    miscarriagesAbortions: false,
    fullTermOrPremature: '',
    deliveryType: '',
    gestationalAge: '',
    nicuStay: '',
    birthWeight: '',
    pregnancyComplications: [],
    feedingDifficulties: false,
    significantIllness: false,
    significantIllnessDetails: '',

    // Section 4: Post Natal Factors
    breastFed: '',
    breastFedDuration: '',
    infantJaundice: false,
    infantJaundiceTreatment: '',
    incubation: false,
    incubationDays: '',
    incubationReason: [],
    immunizationDone: '',
    consanguineousMarriage: '',
    birthCry: '',
    birthCryDelayDuration: '',
    resuscitationRequired: false,
    delayInNeckStanding: false,
    delayInNeckStandingDetails: '',
    ageOfWalking: '',
    ageOfTwoWordSpeech: '',
    seizuresInfancy: false,
    seizuresInfancyDetails: '',
    visionProblemsEarly: false,
    hearingProblemsEarly: false,
    hospitalizationFirstTwoYears: false,
    hospitalizationFirstTwoYearsReason: '',

    // Section 5: Medical History
    healthConcerns: '',
    epilepticHistory: false,
    epilepsyType: '',
    epilepsyLastEpisode: '',
    epilepsyFrequency: '',
    epilepsyUnderMedicalCare: false,
    onMedication: false,
    medicationDetails: '',
    medicationName: '',
    medicationDosage: '',
    medicationFrequency: '',
    medicationPurpose: [],
    asthmaWheezing: false,
    asthmaUsesInhaler: false,
    asthmaFrequency: '',
    asthmaEmergencyPlan: false,
    wearsGlasses: false,
    glassesUsage: '',
    visionTestDone: false,
    visionTestResult: '',
    visionTestDate: '',
    hearingTestDone: false,
    hearingTestResult: '',
    hearingTestDate: '',
    sleepDifficulties: false,
    sleepDifficultiesDetails: [],
    hospitalizationHistory: false,
    hospitalizationHistoryReason: '',
    hospitalizationHistoryDate: '',

    // Section 6: Educational History
    attendedPreschool: false,
    ageStartedPreschool: '',
    yearsPreschool: '',
    repeatedGrades: false,
    whichGradeRepeated: '',
    reasonForRepeating: '',
    dominantWritingHand: '',
    overallPerformance: '',
    overallPercentage: '',
    subjectPerformance: {},
    subjectMarks: {},
    academicTrend: '',
    teacherComments: '',
    languageStruggles: [],
    mathStruggles: [],
    homeworkCompletion: '',
    classroomParticipation: '',
    attendancePercentage: '',
    learningStrengths: [],
    areasSupport: [],
    previousSupport: [],
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
          dateOfBirth: get(['date of birth', 'dob', 'birth date']) || prev.dateOfBirth,
          gender: get(['gender', 'sex']) || prev.gender,
          schoolCenter: get(['school', 'school center', 'school/center', 'center']) || prev.schoolCenter,
          schoolType: get(['school type', 'type of school']) || prev.schoolType,
          address: get(['address']) || prev.address,
          city: get(['city']) || prev.city,
          state: get(['state']) || prev.state,
          urbanOrRural: get(['urban rural', 'urban or rural', 'area type']) || prev.urbanOrRural,
          class: get(['class', 'grade']) || prev.class,
          motherTongue: get(['mother tongue', 'native language']) || prev.motherTongue,
          languageSpokenAtHome: get(['language spoken at home', 'home language']) || prev.languageSpokenAtHome,
          mediumOfInstruction: get(['medium of instruction', 'instruction medium', 'medium']) || prev.mediumOfInstruction,
          yearsExposedToInstructionLanguage: get(['years exposed to instruction language', 'instruction language exposure', 'language exposure years']) || prev.yearsExposedToInstructionLanguage,
          numberOfLanguagesUnderstood: get(['number of languages', 'languages understood']) || prev.numberOfLanguagesUnderstood,
          syllabus: get(['syllabus', 'curriculum', 'board']) || prev.syllabus,
          childLivesWith: get(['child lives with', 'lives with']) || prev.childLivesWith,
          previousGradeRetention: get(['previous grade retention', 'grade retention', 'repeated grade']) || prev.previousGradeRetention,
          schoolAttendance: get(['school attendance', 'attendance']) || prev.schoolAttendance,

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
          primaryCaregiver: get(['primary caregiver', 'caregiver']) || prev.primaryCaregiver,
          numberOfSiblings: get(['number of siblings', 'siblings']) || prev.numberOfSiblings,
          birthOrder: get(['birth order', 'birthorder']) || prev.birthOrder,
          familyHistoryOfDifficulties: getBool(['family history of difficulties', 'family history of learning difficulties', 'family history of any difficulties', 'family difficulties']),
          familyHistoryDetails: get(['family history details', 'family history of difficulties details']) || prev.familyHistoryDetails,
          languagesSpokenAtHome: get(['languages spoken at home', 'home languages', 'languages spoken'])
            ? get(['languages spoken at home', 'home languages', 'languages spoken'])
                .split(',')
                .map(s => s.trim().toUpperCase())
                .filter(s => ['KANNADA', 'ENGLISH', 'HINDI', 'TAMIL', 'TELUGU', 'OTHER'].includes(s))
            : prev.languagesSpokenAtHome,
          digitalResourceTypes: get(['digital resources at home', 'digital resources', 'digital resource types'])
            ? get(['digital resources at home', 'digital resources', 'digital resource types'])
                .split(',')
                .map(s => s.trim().toUpperCase().replace(/\s+/g, '_'))
                .filter(s => ['SMARTPHONE', 'TABLET', 'LAPTOP', 'DESKTOP', 'INTERNET', 'EDUCATIONAL_APPS', 'NONE'].includes(s))
            : prev.digitalResourceTypes,
          parentHelpsWithHomework: get(['parent helps with homework', 'homework help', 'parent helps homework']) || prev.parentHelpsWithHomework,
          enjoySchoolRating: get(['enjoys school rating', 'enjoy school rating', 'school rating']) || prev.enjoySchoolRating,
          enjoyReadingRating: get(['enjoys reading rating', 'enjoy reading rating', 'reading rating']) || prev.enjoyReadingRating,
          externalSupportTypes: get(['external academic support', 'external support', 'external support types'])
            ? get(['external academic support', 'external support', 'external support types'])
                .split(',')
                .map(s => s.trim().toUpperCase().replace(/\s+/g, '_'))
                .filter(s => ['TUITION', 'SPECIAL_EDUCATION', 'NONE'].includes(s))
            : prev.externalSupportTypes,

          // Prenatal
          pregnancyNormal: getBool(['pregnancy normal']),
          medicationsDuringPregnancy: get(['medications during pregnancy']) || prev.medicationsDuringPregnancy,
          medicationsDuringPregnancyDetails: get(['medication details during pregnancy', 'medications during pregnancy details']) || prev.medicationsDuringPregnancyDetails,
          miscarriagesAbortions: getBool(['miscarriages abortions', 'miscarriages/abortions']),
          fullTermOrPremature: get(['full term or premature', 'term']) || prev.fullTermOrPremature,
          deliveryType: get(['delivery type', 'delivery']) || prev.deliveryType,
          gestationalAge: get(['gestational age', 'gestationalweeks', 'weeks']) || prev.gestationalAge,
          nicuStay: get(['nicu stay', 'nicu']) || prev.nicuStay,
          birthWeight: get(['birth weight', 'weight']) || prev.birthWeight,
          pregnancyComplications: get(['pregnancy complications'])
            ? get(['pregnancy complications']).split(',').map(s => s.trim())
            : prev.pregnancyComplications,
          feedingDifficulties: getBool(['feeding difficulties']),
          significantIllness: getBool(['significant illness']),
          significantIllnessDetails: get(['significant illness details']) || prev.significantIllnessDetails,

          // Postnatal
          breastFed: get(['breast fed', 'breastfed']) || (getBool(['breast fed', 'breastfed']) ? 'Yes' : 'No') || prev.breastFed,
          breastFedDuration: get(['breast fed duration', 'breastfed duration']) || prev.breastFedDuration,
          infantJaundice: getBool(['infant jaundice', 'jaundice']),
          infantJaundiceTreatment: get(['infant jaundice treatment', 'jaundice treatment']) || prev.infantJaundiceTreatment,
          incubation: getBool(['incubation']),
          incubationDays: get(['incubation days', 'incubation duration']) || prev.incubationDays,
          incubationReason: get(['incubation reason'])
            ? get(['incubation reason']).split(',').map(s => s.trim())
            : prev.incubationReason,
          immunizationDone: get(['immunization done', 'immunization']) || (getBool(['immunization done', 'immunization']) ? 'Complete' : 'Not Done') || prev.immunizationDone,
          consanguineousMarriage: get(['consanguineous marriage']) || (getBool(['consanguineous marriage']) ? 'Yes' : 'No') || prev.consanguineousMarriage,
          birthCry: get(['birth cry']) || prev.birthCry,
          birthCryDelayDuration: get(['birth cry delay duration', 'birth cry delay']) || prev.birthCryDelayDuration,
          resuscitationRequired: getBool(['resuscitation required']),
          delayInNeckStanding: getBool(['delay in neck standing']),
          delayInNeckStandingDetails: get(['delay in neck standing details']) || prev.delayInNeckStandingDetails,
          ageOfWalking: get(['age of walking', 'walking age']) || prev.ageOfWalking,
          ageOfTwoWordSpeech: get(['age of two word speech', 'two word speech age']) || prev.ageOfTwoWordSpeech,
          seizuresInfancy: getBool(['seizures infancy', 'seizures during infancy']),
          seizuresInfancyDetails: get(['seizures infancy details', 'seizures details']) || prev.seizuresInfancyDetails,
          visionProblemsEarly: getBool(['vision problems early', 'early vision problems']),
          hearingProblemsEarly: getBool(['hearing problems early', 'early hearing problems']),
          hospitalizationFirstTwoYears: getBool(['hospitalization first two years', 'hospitalization first 2 years']),
          hospitalizationFirstTwoYearsReason: get(['hospitalization reason', 'hospitalization first two years reason']) || prev.hospitalizationFirstTwoYearsReason,

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
      const dobStr: string = (selectedStudentData as any).dateOfBirth || '';
      const ageCalc = dobStr ? calculateChronologicalAge(dobStr) : null;
      setFormData(prev => ({
        ...prev,
        name: selectedStudentData.fullName || '',
        dateOfBirth: dobStr,
        age: ageCalc ? ageCalc.years.toString() : selectedStudentData.age?.toString() || '',
        chronologicalAge: ageCalc ? ageCalc.display : '',
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
        dateOfBirth: (intakeForm as any).dateOfBirth?.trim() || (intakeForm.student as any)?.dateOfBirth?.trim() || prev.dateOfBirth,
        age: intakeForm.student?.age?.toString() || prev.age,
        chronologicalAge: (intakeForm as any).chronologicalAge || prev.chronologicalAge,
        gender: intakeForm.student?.gender?.trim() ? convertGenderCase(intakeForm.student.gender.trim()) : prev.gender,
        schoolCenter: intakeForm.student?.school?.name?.trim() || intakeForm.student?.center?.centerName?.trim() || prev.schoolCenter,
        schoolType: (intakeForm as any).schoolType?.trim() || prev.schoolType,
        address: intakeForm.address?.trim() || prev.address,
        city: (intakeForm as any).city?.trim() || prev.city,
        state: (intakeForm as any).state?.trim() || prev.state,
        urbanOrRural: (intakeForm as any).urbanOrRural?.trim() || prev.urbanOrRural,
        class: intakeForm.student?.grade?.trim() || prev.class,
        motherTongue: intakeForm.student?.motherTongue?.trim() || prev.motherTongue,
        languageSpokenAtHome: (intakeForm as any).languageSpokenAtHome?.trim() || prev.languageSpokenAtHome,
        mediumOfInstruction: (intakeForm as any).mediumOfInstruction?.trim() || prev.mediumOfInstruction,
        yearsExposedToInstructionLanguage: (intakeForm as any).yearsExposedToInstructionLanguage?.toString() || prev.yearsExposedToInstructionLanguage,
        numberOfLanguagesUnderstood: (intakeForm as any).numberOfLanguagesUnderstood?.toString() || prev.numberOfLanguagesUnderstood,
        syllabus: intakeForm.student?.syllabus?.trim() || prev.syllabus,
        childLivesWith: Array.isArray((intakeForm as any).childLivesWith)
          ? ((intakeForm as any).childLivesWith[0] || '')
          : (intakeForm as any).childLivesWith?.trim() || prev.childLivesWith,
        previousGradeRetention: (intakeForm as any).previousGradeRetention?.trim() || prev.previousGradeRetention,
        schoolAttendance: (intakeForm as any).schoolAttendance?.trim() || prev.schoolAttendance,

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
        primaryCaregiver: intakeForm.primaryCaregiver || prev.primaryCaregiver,
        numberOfSiblings: intakeForm.numberOfSiblings?.toString() || prev.numberOfSiblings,
        birthOrder: intakeForm.birthOrder || prev.birthOrder,
        familyHistoryOfDifficulties: intakeForm.familyHistoryOfDifficulties ?? prev.familyHistoryOfDifficulties,
        familyHistoryDetails: intakeForm.familyHistoryDetails || prev.familyHistoryDetails,
        digitalResourceTypes: intakeForm.digitalResourceTypes || prev.digitalResourceTypes || [],
        languagesSpokenAtHome: intakeForm.languagesSpokenAtHome || prev.languagesSpokenAtHome || [],
        parentHelpsWithHomework: intakeForm.parentHelpsWithHomework || prev.parentHelpsWithHomework,
        enjoySchoolRating: intakeForm.enjoySchoolRating?.toString() || prev.enjoySchoolRating,
        enjoyReadingRating: intakeForm.enjoyReadingRating?.toString() || prev.enjoyReadingRating,
        externalSupportTypes: intakeForm.externalSupportTypes || prev.externalSupportTypes || [],

        // Section 3: Prenatal, Natal & Delivery Details
        pregnancyNormal: intakeForm.pregnancyNormal ?? prev.pregnancyNormal,
        medicationsDuringPregnancy: intakeForm.medicationsDuringPregnancy || prev.medicationsDuringPregnancy,
        medicationsDuringPregnancyDetails: intakeForm.medicationsDuringPregnancyDetails || prev.medicationsDuringPregnancyDetails,
        miscarriagesAbortions: intakeForm.miscarriagesAbortions ?? prev.miscarriagesAbortions,
        fullTermOrPremature: intakeForm.fullTermOrPremature || prev.fullTermOrPremature,
        deliveryType: intakeForm.deliveryType || prev.deliveryType,
        gestationalAge: (intakeForm as any).gestationalAge || prev.gestationalAge || '',
        nicuStay: (intakeForm as any).nicuStay || prev.nicuStay || '',
        birthWeight: (intakeForm as any).birthWeight || prev.birthWeight || '',
        pregnancyComplications: (intakeForm as any).pregnancyComplications || prev.pregnancyComplications || [],
        feedingDifficulties: (intakeForm as any).feedingDifficulties ?? prev.feedingDifficulties ?? false,
        significantIllness: (intakeForm as any).significantIllness ?? prev.significantIllness ?? false,
        significantIllnessDetails: (intakeForm as any).significantIllnessDetails || prev.significantIllnessDetails || '',

        // Section 4: Post Natal Factors
        breastFed: typeof (intakeForm as any).breastFed === 'boolean'
          ? ((intakeForm as any).breastFed ? 'Yes' : 'No')
          : (intakeForm as any).breastFed || prev.breastFed || '',
        breastFedDuration: (intakeForm as any).breastFedDuration?.toString() || prev.breastFedDuration || '',
        infantJaundice: intakeForm.infantJaundice ?? prev.infantJaundice,
        infantJaundiceTreatment: (intakeForm as any).infantJaundiceTreatment || prev.infantJaundiceTreatment || '',
        incubation: intakeForm.incubation ?? prev.incubation,
        incubationDays: (intakeForm as any).incubationDays?.toString() || prev.incubationDays || '',
        incubationReason: (intakeForm as any).incubationReason || prev.incubationReason || [],
        immunizationDone: typeof (intakeForm as any).immunizationDone === 'boolean'
          ? ((intakeForm as any).immunizationDone ? 'Complete' : 'Not Done')
          : (intakeForm as any).immunizationDone || prev.immunizationDone || '',
        consanguineousMarriage: typeof (intakeForm as any).consanguineousMarriage === 'boolean'
          ? ((intakeForm as any).consanguineousMarriage ? 'Yes' : 'No')
          : (intakeForm as any).consanguineousMarriage || prev.consanguineousMarriage || '',
        birthCry: intakeForm.birthCry || prev.birthCry,
        birthCryDelayDuration: (intakeForm as any).birthCryDelayDuration || prev.birthCryDelayDuration || '',
        resuscitationRequired: (intakeForm as any).resuscitationRequired ?? prev.resuscitationRequired ?? false,
        delayInNeckStanding: intakeForm.delayInNeckStanding ?? prev.delayInNeckStanding,
        delayInNeckStandingDetails: intakeForm.delayInNeckStandingDetails || prev.delayInNeckStandingDetails,
        ageOfWalking: intakeForm.ageOfWalking?.toString() || prev.ageOfWalking,
        ageOfTwoWordSpeech: intakeForm.ageOfTwoWordSpeech?.toString() || prev.ageOfTwoWordSpeech,
        seizuresInfancy: (intakeForm as any).seizuresInfancy ?? prev.seizuresInfancy ?? false,
        seizuresInfancyDetails: (intakeForm as any).seizuresInfancyDetails || prev.seizuresInfancyDetails || '',
        visionProblemsEarly: (intakeForm as any).visionProblemsEarly ?? prev.visionProblemsEarly ?? false,
        hearingProblemsEarly: (intakeForm as any).hearingProblemsEarly ?? prev.hearingProblemsEarly ?? false,
        hospitalizationFirstTwoYears: (intakeForm as any).hospitalizationFirstTwoYears ?? prev.hospitalizationFirstTwoYears ?? false,
        hospitalizationFirstTwoYearsReason: (intakeForm as any).hospitalizationFirstTwoYearsReason || prev.hospitalizationFirstTwoYearsReason || '',

        // Section 5: Medical History
        healthConcerns: intakeForm.healthConcerns || prev.healthConcerns,
        epilepticHistory: intakeForm.epilepticHistory ?? prev.epilepticHistory,
        epilepsyType: (intakeForm as any).epilepsyType || prev.epilepsyType || '',
        epilepsyLastEpisode: (intakeForm as any).epilepsyLastEpisode || prev.epilepsyLastEpisode || '',
        epilepsyFrequency: (intakeForm as any).epilepsyFrequency || prev.epilepsyFrequency || '',
        epilepsyUnderMedicalCare: (intakeForm as any).epilepsyUnderMedicalCare ?? prev.epilepsyUnderMedicalCare ?? false,
        onMedication: intakeForm.onMedication ?? prev.onMedication,
        medicationDetails: intakeForm.medicationDetails || prev.medicationDetails,
        medicationName: (intakeForm as any).medicationName || prev.medicationName || '',
        medicationDosage: (intakeForm as any).medicationDosage || prev.medicationDosage || '',
        medicationFrequency: (intakeForm as any).medicationFrequency || prev.medicationFrequency || '',
        medicationPurpose: (intakeForm as any).medicationPurpose || prev.medicationPurpose || [],
        asthmaWheezing: intakeForm.asthmaWheezing ?? prev.asthmaWheezing,
        asthmaUsesInhaler: (intakeForm as any).asthmaUsesInhaler ?? prev.asthmaUsesInhaler ?? false,
        asthmaFrequency: (intakeForm as any).asthmaFrequency || prev.asthmaFrequency || '',
        asthmaEmergencyPlan: (intakeForm as any).asthmaEmergencyPlan ?? prev.asthmaEmergencyPlan ?? false,
        wearsGlasses: intakeForm.wearsGlasses ?? prev.wearsGlasses,
        glassesUsage: (intakeForm as any).glassesUsage || prev.glassesUsage || '',
        visionTestDone: intakeForm.visionTestDone ?? prev.visionTestDone,
        visionTestResult: (intakeForm as any).visionTestResult || prev.visionTestResult || '',
        visionTestDate: (intakeForm as any).visionTestDate || prev.visionTestDate || '',
        hearingTestDone: intakeForm.hearingTestDone ?? prev.hearingTestDone,
        hearingTestResult: (intakeForm as any).hearingTestResult || prev.hearingTestResult || '',
        hearingTestDate: (intakeForm as any).hearingTestDate || prev.hearingTestDate || '',
        sleepDifficulties: (intakeForm as any).sleepDifficulties ?? prev.sleepDifficulties ?? false,
        sleepDifficultiesDetails: (intakeForm as any).sleepDifficultiesDetails || prev.sleepDifficultiesDetails || [],
        hospitalizationHistory: (intakeForm as any).hospitalizationHistory ?? prev.hospitalizationHistory ?? false,
        hospitalizationHistoryReason: (intakeForm as any).hospitalizationHistoryReason || prev.hospitalizationHistoryReason || '',
        hospitalizationHistoryDate: (intakeForm as any).hospitalizationHistoryDate || prev.hospitalizationHistoryDate || '',

        // Section 6: Educational History
        attendedPreschool: intakeForm.attendedPreschool ?? prev.attendedPreschool,
        ageStartedPreschool: (intakeForm as any).ageStartedPreschool?.toString() || prev.ageStartedPreschool || '',
        yearsPreschool: (intakeForm as any).yearsPreschool?.toString() || prev.yearsPreschool || '',
        repeatedGrades: intakeForm.repeatedGrades ?? prev.repeatedGrades,
        whichGradeRepeated: intakeForm.whichGradeRepeated || prev.whichGradeRepeated || '',
        reasonForRepeating: (intakeForm as any).reasonForRepeating || prev.reasonForRepeating || '',
        dominantWritingHand: intakeForm.dominantWritingHand || prev.dominantWritingHand || '',
        overallPerformance: (intakeForm as any).overallPerformance || prev.overallPerformance || '',
        overallPercentage: (intakeForm as any).overallPercentage?.toString() || prev.overallPercentage || '',
        subjectPerformance: (intakeForm as any).subjectPerformance || prev.subjectPerformance || {},
        subjectMarks: (intakeForm as any).subjectMarks || prev.subjectMarks || {},
        academicTrend: (intakeForm as any).academicTrend || prev.academicTrend || '',
        teacherComments: (intakeForm as any).teacherComments || prev.teacherComments || '',
        languageStruggles: (intakeForm as any).languageStruggles || prev.languageStruggles || [],
        mathStruggles: (intakeForm as any).mathStruggles || prev.mathStruggles || [],
        homeworkCompletion: (intakeForm as any).homeworkCompletion || prev.homeworkCompletion || '',
        classroomParticipation: (intakeForm as any).classroomParticipation || prev.classroomParticipation || '',
        attendancePercentage: (intakeForm as any).attendancePercentage?.toString() || prev.attendancePercentage || '',
        learningStrengths: (intakeForm as any).learningStrengths || prev.learningStrengths || [],
        areasSupport: (intakeForm as any).areasSupport || prev.areasSupport || [],
        previousSupport: (intakeForm as any).previousSupport || prev.previousSupport || [],
        strugglesInLanguages: intakeForm.strugglesInLanguages ?? prev.strugglesInLanguages ?? false,
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
        // New demographic context fields
        dateOfBirth: '',
        chronologicalAge: '',
        schoolType: '',
        city: '',
        state: '',
        urbanOrRural: '',
        languageSpokenAtHome: '',
        mediumOfInstruction: '',
        yearsExposedToInstructionLanguage: '',
        numberOfLanguagesUnderstood: '',
        childLivesWith: '',
        previousGradeRetention: '',
        schoolAttendance: '',
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
        primaryCaregiver: '',
        numberOfSiblings: '',
        birthOrder: '',
        familyHistoryOfDifficulties: false,
        familyHistoryDetails: '',
        digitalResourceTypes: [],
        languagesSpokenAtHome: [],
        parentHelpsWithHomework: '',
        enjoySchoolRating: '',
        enjoyReadingRating: '',
        externalSupportTypes: [],
        fatherName: '',
        motherName: '',
        guardianName: '',
        pregnancyNormal: false,
        medicationsDuringPregnancy: '',
        medicationsDuringPregnancyDetails: '',
        miscarriagesAbortions: false,
        fullTermOrPremature: '',
        deliveryType: '',
        gestationalAge: '',
        nicuStay: '',
        birthWeight: '',
        pregnancyComplications: [],
        feedingDifficulties: false,
        significantIllness: false,
        significantIllnessDetails: '',
        breastFed: '',
        breastFedDuration: '',
        infantJaundice: false,
        infantJaundiceTreatment: '',
        incubation: false,
        incubationDays: '',
        incubationReason: [],
        immunizationDone: '',
        consanguineousMarriage: '',
        birthCry: '',
        birthCryDelayDuration: '',
        resuscitationRequired: false,
        delayInNeckStanding: false,
        delayInNeckStandingDetails: '',
        ageOfWalking: '',
        ageOfTwoWordSpeech: '',
        seizuresInfancy: false,
        seizuresInfancyDetails: '',
        visionProblemsEarly: false,
        hearingProblemsEarly: false,
        hospitalizationFirstTwoYears: false,
        hospitalizationFirstTwoYearsReason: '',
        healthConcerns: '',
        epilepticHistory: false,
        epilepsyType: '',
        epilepsyLastEpisode: '',
        epilepsyFrequency: '',
        epilepsyUnderMedicalCare: false,
        onMedication: false,
        medicationDetails: '',
        medicationName: '',
        medicationDosage: '',
        medicationFrequency: '',
        medicationPurpose: [],
        asthmaWheezing: false,
        asthmaUsesInhaler: false,
        asthmaFrequency: '',
        asthmaEmergencyPlan: false,
        wearsGlasses: false,
        glassesUsage: '',
        visionTestDone: false,
        visionTestResult: '',
        visionTestDate: '',
        hearingTestDone: false,
        hearingTestResult: '',
        hearingTestDate: '',
        sleepDifficulties: false,
        sleepDifficultiesDetails: [],
        hospitalizationHistory: false,
        hospitalizationHistoryReason: '',
        hospitalizationHistoryDate: '',
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

  // Calculate chronological age from date of birth
  const calculateChronologicalAge = (dob: string): { years: number; months: number; display: string } => {
    if (!dob) return { years: 0, months: 0, display: '' };
    const birth = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    if (months < 0) { years--; months += 12; }
    if (today.getDate() < birth.getDate()) { months--; if (months < 0) { years--; months += 12; } }
    const display = years > 0 && months > 0
      ? `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`
      : years > 0
        ? `${years} year${years !== 1 ? 's' : ''}`
        : `${months} month${months !== 1 ? 's' : ''}`;
    return { years, months, display };
  };

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

  const prepareSubmitData = (data: FormData, studentId: string) => {
    return {
      ...data,
      studentId,
      dailyDigitalUse: data.dailyDigitalUse ? parseInt(data.dailyDigitalUse) : null,
      dailyParentChildTime: data.dailyParentChildTime ? parseInt(data.dailyParentChildTime) : null,
      ageOfWalking: data.ageOfWalking ? parseInt(data.ageOfWalking) : null,
      ageOfTwoWordSpeech: data.ageOfTwoWordSpeech ? parseInt(data.ageOfTwoWordSpeech) : null,
      // New demographic numeric fields
      yearsExposedToInstructionLanguage: data.yearsExposedToInstructionLanguage
        ? parseInt(data.yearsExposedToInstructionLanguage)
        : null,
      numberOfLanguagesUnderstood: data.numberOfLanguagesUnderstood
        ? parseInt(data.numberOfLanguagesUnderstood)
        : null,
      // Block C numeric fields
      numberOfSiblings: data.numberOfSiblings ? parseInt(data.numberOfSiblings) : null,
      enjoySchoolRating: data.enjoySchoolRating ? parseInt(data.enjoySchoolRating) : null,
      enjoyReadingRating: data.enjoyReadingRating ? parseInt(data.enjoyReadingRating) : null,
      // Redesigned postnatal numeric fields
      breastFedDuration: data.breastFedDuration ? parseInt(data.breastFedDuration) : null,
      incubationDays: data.incubationDays ? parseInt(data.incubationDays) : null,
      // New educational history numeric conversions and backward-compatibility mapping
      ageStartedPreschool: data.ageStartedPreschool ? parseInt(data.ageStartedPreschool) : null,
      yearsPreschool: data.yearsPreschool ? parseInt(data.yearsPreschool) : null,
      overallPercentage: data.overallPercentage ? parseInt(data.overallPercentage) : null,
      attendancePercentage: data.attendancePercentage ? parseInt(data.attendancePercentage) : null,
      strugglesInLanguages: data.languageStruggles && data.languageStruggles.length > 0 && !data.languageStruggles.includes('None'),
      // Dynamic backward-compatibility boolean synchronization
      pregnancyNormal: data.pregnancyComplications.includes('None') || data.pregnancyComplications.length === 0,
      digitalResourcesAtHome: data.digitalResourceTypes && data.digitalResourceTypes.length > 0 && !data.digitalResourceTypes.includes('NONE'),
      enjoysSchool: data.enjoySchoolRating ? parseInt(data.enjoySchoolRating) >= 4 : false,
      enjoysReading: data.enjoyReadingRating ? parseInt(data.enjoyReadingRating) >= 4 : false,
      externalAcademicSupport: data.externalSupportTypes && data.externalSupportTypes.length > 0 && !data.externalSupportTypes.includes('NONE'),
    };
  };

  const handleSaveDraft = async () => {
    if (!selectedStudentId) return;
    if (intakeForm?.status === 'COMPLETED') return;

    try {
      const submitData = prepareSubmitData(formData, selectedStudentId);

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
      const submitData = prepareSubmitData(formData, selectedStudentId);

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
                <p style={{ margin: '0.25rem 0' }}><strong>Date of Birth:</strong> {formData.dateOfBirth || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Chronological Age:</strong> {formData.chronologicalAge || (formData.age ? `${formData.age} years` : 'N/A')}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>School Type:</strong> {formData.schoolType || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Syllabus:</strong> {formData.syllabus || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Mother Tongue:</strong> {formData.motherTongue || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Language at Home:</strong> {formData.languageSpokenAtHome || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Medium of Instruction:</strong> {formData.mediumOfInstruction || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Years in Instruction Language:</strong> {formData.yearsExposedToInstructionLanguage || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>School Attendance:</strong> {formData.schoolAttendance || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Grade Retention:</strong> {formData.previousGradeRetention || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Child Lives With:</strong> {formData.childLivesWith || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Languages Understood:</strong> {formData.numberOfLanguagesUnderstood || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0', gridColumn: '1 / -1' }}><strong>Address:</strong> {[formData.address, formData.city, formData.state, formData.urbanOrRural].filter(Boolean).join(', ') || 'N/A'}</p>
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
                <p style={{ margin: '0.25rem 0' }}><strong>Primary Caregiver:</strong> {formData.primaryCaregiver || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Family Income:</strong> {formData.familyIncome || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Family Type:</strong> {formData.familyType || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Number of Siblings:</strong> {formData.numberOfSiblings || '0'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Birth Order:</strong> {formData.birthOrder || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Family History of Difficulties:</strong> {formData.familyHistoryOfDifficulties ? '✓ Yes' : '✗ No'}</p>
                {formData.familyHistoryOfDifficulties && (
                  <p style={{ margin: '0.25rem 0', gridColumn: '1 / -1' }}><strong>Family History Details:</strong> {formData.familyHistoryDetails || 'N/A'}</p>
                )}
                <p style={{ margin: '0.25rem 0' }}><strong>Daily Digital Use:</strong> {formData.dailyDigitalUse ? `${formData.dailyDigitalUse} hours/day` : 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Digital Resources:</strong> {formData.digitalResourceTypes?.join(', ') || 'None'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Languages Spoken at Home:</strong> {formData.languagesSpokenAtHome?.join(', ') || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Parent Homework Support:</strong> {formData.parentHelpsWithHomework || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Enjoys School (1-5):</strong> {formData.enjoySchoolRating || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Enjoys Reading (1-5):</strong> {formData.enjoyReadingRating || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>External Support:</strong> {formData.externalSupportTypes?.join(', ') || 'None'}</p>
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
                <p style={{ margin: '0.25rem 0' }}><strong>Complications:</strong> {formData.pregnancyComplications?.join(', ') || 'None'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Full Term/Premature:</strong> {formData.fullTermOrPremature || 'N/A'}</p>
                {formData.fullTermOrPremature === 'Premature' && (
                  <>
                    <p style={{ margin: '0.25rem 0' }}><strong>Gestational Age:</strong> {formData.gestationalAge || 'N/A'}</p>
                    <p style={{ margin: '0.25rem 0' }}><strong>NICU Stay:</strong> {formData.nicuStay || 'N/A'}</p>
                    <p style={{ margin: '0.25rem 0' }}><strong>Birth Weight:</strong> {formData.birthWeight || 'N/A'}</p>
                  </>
                )}
                <p style={{ margin: '0.25rem 0' }}><strong>Delivery Type:</strong> {formData.deliveryType || 'N/A'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Medications:</strong> {formData.medicationsDuringPregnancy || 'N/A'}</p>
                {formData.medicationsDuringPregnancy === 'Yes' && formData.medicationsDuringPregnancyDetails && (
                  <p style={{ margin: '0.25rem 0', gridColumn: '1 / -1' }}><strong>Medication Details:</strong> {formData.medicationsDuringPregnancyDetails}</p>
                )}
                <p style={{ margin: '0.25rem 0' }}><strong>Miscarriages/Abortions:</strong> {formData.miscarriagesAbortions ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Jaundice After Birth:</strong> {formData.infantJaundice ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Feeding Difficulties:</strong> {formData.feedingDifficulties ? '✓ Yes' : '✗ No'}</p>
                <p style={{ margin: '0.25rem 0' }}><strong>Significant Illness (1st Year):</strong> {formData.significantIllness ? '✓ Yes' : '✗ No'}</p>
                {formData.significantIllness && formData.significantIllnessDetails && (
                  <p style={{ margin: '0.25rem 0', gridColumn: '1 / -1' }}><strong>Significant Illness Details:</strong> {formData.significantIllnessDetails}</p>
                )}
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

  const toggleItemInArray = useCallback((field: 'digitalResourceTypes' | 'languagesSpokenAtHome' | 'externalSupportTypes', item: string) => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      let newArray: string[];
      if (currentArray.includes(item)) {
        newArray = currentArray.filter(i => i !== item);
      } else {
        if (item === 'NONE') {
          newArray = ['NONE'];
        } else {
          newArray = currentArray.filter(i => i !== 'NONE').concat(item);
        }
      }
      return {
        ...prev,
        [field]: newArray
      };
    });
    setHasUnsavedChanges(true);
  }, []);

  const togglePregnancyComplication = useCallback((item: string) => {
    setFormData(prev => {
      const currentArray = prev.pregnancyComplications || [];
      let newArray: string[];
      if (currentArray.includes(item)) {
        newArray = currentArray.filter(i => i !== item);
      } else {
        if (item === 'None') {
          newArray = ['None'];
        } else {
          newArray = currentArray.filter(i => i !== 'None').concat(item);
        }
      }
      return {
        ...prev,
        pregnancyComplications: newArray
      };
    });
    setHasUnsavedChanges(true);
  }, []);

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
        return !!(formData.name && (formData.dateOfBirth || formData.age) && formData.gender && formData.schoolCenter && formData.class && formData.syllabus);
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
        return TABS_IDS.slice(0, -1).every(tabId => isTabCompleted(tabId));
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

            {/* ── Row 1: Name + Date of Birth ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('intake.name')} <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('intake.name')}
                  required
                  disabled={isFormCompleted}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">{t('intake.dateOfBirth')} <span className="text-destructive">*</span></Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => {
                    const dob = e.target.value;
                    handleInputChange('dateOfBirth', dob);
                    if (dob) {
                      const calc = calculateChronologicalAge(dob);
                      handleInputChange('chronologicalAge', calc.display);
                      handleInputChange('age', calc.years.toString());
                    } else {
                      handleInputChange('chronologicalAge', '');
                    }
                  }}
                  disabled={isFormCompleted}
                />
                {formData.chronologicalAge && (
                  <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded flex items-center gap-1">
                    🎂 <span className="font-medium">{formData.chronologicalAge}</span>
                    <span className="text-muted-foreground/70">{t('intake.chronologicalAgeLabel')}</span>
                  </p>
                )}
              </div>
            </div>

            {/* ── Row 2: Gender + School/Center ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">{t('intake.gender')} <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('intake.selectGender')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">{t('intake.genderMale')}</SelectItem>
                    <SelectItem value="Female">{t('intake.genderFemale')}</SelectItem>
                    <SelectItem value="Other">{t('intake.genderOther')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t('intake.usedForAnalyticsOnly')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolCenter">{t('intake.schoolCenter')} <span className="text-destructive">*</span></Label>
                <Input
                  id="schoolCenter"
                  value={formData.schoolCenter}
                  onChange={(e) => handleInputChange('schoolCenter', e.target.value)}
                  placeholder={t('intake.schoolCenter')}
                  required
                  disabled={isFormCompleted}
                />
              </div>
            </div>

            {/* ── School Type ── */}
            <div className="space-y-2">
              <Label htmlFor="schoolType">{t('intake.schoolType')}</Label>
              <Select
                value={formData.schoolType}
                onValueChange={(value) => handleInputChange('schoolType', value)}
                disabled={isFormCompleted}
              >
                <SelectTrigger id="schoolType">
                  <SelectValue placeholder={t('intake.selectSchoolType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mainstream School">{t('intake.mainstreamSchool')}</SelectItem>
                  <SelectItem value="Inclusive School">{t('intake.inclusiveSchool')}</SelectItem>
                  <SelectItem value="Special School">{t('intake.specialSchool')}</SelectItem>
                  <SelectItem value="Alternative School">{t('intake.alternativeSchool')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{t('intake.schoolTypeDesc')}</p>
            </div>

            {/* ── Address breakdown ── */}
            <div className="space-y-3">
              <Label>{t('intake.address')}</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder={t('intake.address')}
                disabled={isFormCompleted}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">{t('intake.city')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder={t('intake.city')}
                    disabled={isFormCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">{t('intake.state')}</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder={t('intake.state')}
                    disabled={isFormCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urbanOrRural">{t('intake.urbanOrRural')}</Label>
                  <Select
                    value={formData.urbanOrRural}
                    onValueChange={(value) => handleInputChange('urbanOrRural', value)}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="urbanOrRural">
                      <SelectValue placeholder={t('intake.selectArea')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urban">{t('intake.urban')}</SelectItem>
                      <SelectItem value="Semi-Urban">{t('intake.semiUrban')}</SelectItem>
                      <SelectItem value="Rural">{t('intake.rural')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{t('intake.addressDesc')}</p>
            </div>

            {/* ── Class + Syllabus ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">{t('intake.class')} <span className="text-destructive">*</span></Label>
                <Input
                  id="class"
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                  placeholder="E.g., Grade 6"
                  required
                  disabled={isFormCompleted}
                />
                <p className="text-xs text-muted-foreground">{t('intake.classDesc')}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="syllabus">{t('intake.syllabus')} <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.syllabus}
                  onValueChange={(value) => handleInputChange('syllabus', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('intake.selectSyllabus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBSE">{t('intake.cbse')}</SelectItem>
                    <SelectItem value="ICSE">{t('intake.icse')}</SelectItem>
                    <SelectItem value="State Board">{t('intake.stateBoard')}</SelectItem>
                    <SelectItem value="IB">{t('intake.ib')}</SelectItem>
                    <SelectItem value="IGCSE">{t('intake.igcse')}</SelectItem>
                    <SelectItem value="Others">{t('intake.others')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t('intake.syllabusDesc')}</p>
              </div>
            </div>

            {/* ── Language Profile ── */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{t('intake.languageProfileTitle')}</span>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                {t('intake.languageProfileDesc')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="motherTongue">{t('intake.motherTongue')}</Label>
                  <Input
                    id="motherTongue"
                    value={formData.motherTongue}
                    onChange={(e) => handleInputChange('motherTongue', e.target.value)}
                    placeholder={t('intake.motherTongue')}
                    disabled={isFormCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="languageSpokenAtHome">{t('intake.languageSpokenAtHome')}</Label>
                  <Select
                    value={formData.languageSpokenAtHome}
                    onValueChange={(value) => handleInputChange('languageSpokenAtHome', value)}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="languageSpokenAtHome">
                      <SelectValue placeholder={t('intake.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">{t('intake.english')}</SelectItem>
                      <SelectItem value="Hindi">{t('intake.hindi')}</SelectItem>
                      <SelectItem value="Kannada">{t('intake.kannada')}</SelectItem>
                      <SelectItem value="Tamil">{t('intake.tamil')}</SelectItem>
                      <SelectItem value="Telugu">{t('intake.telugu')}</SelectItem>
                      <SelectItem value="Malayalam">{t('intake.malayalam')}</SelectItem>
                      <SelectItem value="Marathi">{t('intake.marathi')}</SelectItem>
                      <SelectItem value="Bengali">{t('intake.bengali')}</SelectItem>
                      <SelectItem value="Gujarati">{t('intake.gujarati')}</SelectItem>
                      <SelectItem value="Punjabi">{t('intake.punjabi')}</SelectItem>
                      <SelectItem value="Odia">{t('intake.odia')}</SelectItem>
                      <SelectItem value="Urdu">{t('intake.urdu')}</SelectItem>
                      <SelectItem value="Other">{t('intake.otherLanguage')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mediumOfInstruction">{t('intake.mediumOfInstruction')}</Label>
                  <Select
                    value={formData.mediumOfInstruction}
                    onValueChange={(value) => handleInputChange('mediumOfInstruction', value)}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="mediumOfInstruction">
                      <SelectValue placeholder={t('intake.selectMedium')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">{t('intake.english')}</SelectItem>
                      <SelectItem value="Hindi">{t('intake.hindi')}</SelectItem>
                      <SelectItem value="Kannada">{t('intake.kannada')}</SelectItem>
                      <SelectItem value="Tamil">{t('intake.tamil')}</SelectItem>
                      <SelectItem value="Telugu">{t('intake.telugu')}</SelectItem>
                      <SelectItem value="Malayalam">{t('intake.malayalam')}</SelectItem>
                      <SelectItem value="Marathi">{t('intake.marathi')}</SelectItem>
                      <SelectItem value="Bengali">{t('intake.bengali')}</SelectItem>
                      <SelectItem value="Gujarati">{t('intake.gujarati')}</SelectItem>
                      <SelectItem value="Other">{t('intake.otherLanguage')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExposedToInstructionLanguage">{t('intake.yearsExposedToInstructionLanguage')}</Label>
                  <Input
                    id="yearsExposedToInstructionLanguage"
                    type="number"
                    min="0"
                    max="20"
                    value={formData.yearsExposedToInstructionLanguage}
                    onChange={(e) => handleInputChange('yearsExposedToInstructionLanguage', e.target.value)}
                    placeholder="e.g., 1"
                    disabled={isFormCompleted}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfLanguagesUnderstood">{t('intake.numberOfLanguagesUnderstood')}</Label>
                <Input
                  id="numberOfLanguagesUnderstood"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.numberOfLanguagesUnderstood}
                  onChange={(e) => handleInputChange('numberOfLanguagesUnderstood', e.target.value)}
                  placeholder="e.g., 2"
                  disabled={isFormCompleted}
                  className="max-w-[200px]"
                />
                <p className="text-xs text-muted-foreground">{t('intake.languagesUnderstoodDesc')}</p>
              </div>
            </div>

            {/* ── Additional Context ── */}
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{t('intake.additionalContextTitle')}</span>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">{t('intake.additionalContextDesc')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="childLivesWith">{t('intake.childLivesWith')}</Label>
                  <Select
                    value={formData.childLivesWith}
                    onValueChange={(value) => handleInputChange('childLivesWith', value)}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="childLivesWith">
                      <SelectValue placeholder={t('intake.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Both Parents">{t('intake.bothParents')}</SelectItem>
                      <SelectItem value="Mother">{t('intake.mother')}</SelectItem>
                      <SelectItem value="Father">{t('intake.father')}</SelectItem>
                      <SelectItem value="Grandparents">{t('intake.grandparents')}</SelectItem>
                      <SelectItem value="Guardian">{t('intake.guardian')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previousGradeRetention">{t('intake.previousGradeRetention')}</Label>
                  <Select
                    value={formData.previousGradeRetention}
                    onValueChange={(value) => handleInputChange('previousGradeRetention', value)}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="previousGradeRetention">
                      <SelectValue placeholder={t('intake.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{t('intake.gradeRetentionDesc')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolAttendance">{t('intake.schoolAttendance')}</Label>
                  <Select
                    value={formData.schoolAttendance}
                    onValueChange={(value) => handleInputChange('schoolAttendance', value)}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="schoolAttendance">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Average">Average</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">AI uses to interpret academic performance</p>
                </div>
              </div>
            </div>

          </div>
        );

      case 'family':
        const DIGITAL_RESOURCE_OPTIONS = [
          { label: 'Smartphone', value: 'SMARTPHONE' },
          { label: 'Tablet', value: 'TABLET' },
          { label: 'Laptop', value: 'LAPTOP' },
          { label: 'Desktop', value: 'DESKTOP' },
          { label: 'Internet Access', value: 'INTERNET' },
          { label: 'Educational Apps', value: 'EDUCATIONAL_APPS' },
          { label: 'None', value: 'NONE' },
        ];

        const LANGUAGE_OPTIONS = [
          { label: 'Kannada', value: 'KANNADA' },
          { label: 'English', value: 'ENGLISH' },
          { label: 'Hindi', value: 'HINDI' },
          { label: 'Tamil', value: 'TAMIL' },
          { label: 'Telugu', value: 'TELUGU' },
          { label: 'Other', value: 'OTHER' },
        ];

        const EXTERNAL_SUPPORT_OPTIONS = [
          { label: 'Tuition', value: 'TUITION' },
          { label: 'Special Education', value: 'SPECIAL_EDUCATION' },
          { label: 'None', value: 'NONE' },
        ];

        const RatingSelector = ({ value, onChange, disabled }: { value: string; onChange: (val: string) => void; disabled?: boolean }) => {
          const options = [
            { rating: '1', label: 'Strongly Dislike' },
            { rating: '2', label: 'Dislike' },
            { rating: '3', label: 'Neutral' },
            { rating: '4', label: 'Like' },
            { rating: '5', label: 'Strongly Enjoy' }
          ];

          return (
            <div className="flex gap-2 flex-wrap mt-2">
              {options.map((opt) => {
                const isSelected = value === opt.rating;
                return (
                  <button
                    key={opt.rating}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(opt.rating)}
                    className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg border transition-all text-center min-w-[75px] ${
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground shadow-sm font-semibold'
                        : 'bg-card border-input hover:bg-accent hover:text-accent-foreground'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="text-lg font-bold">{opt.rating}</span>
                    <span className="text-[10px] whitespace-nowrap">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          );
        };

        return (
          <div className="space-y-8">
            {/* ── CARD 1: FAMILY STRUCTURE & RECORDS ── */}
            <div className="space-y-4 p-5 bg-card rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 border-b pb-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-md font-semibold text-foreground">Family Structure & Identity</h3>
              </div>
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
                    placeholder="Guardian's full name (if applicable)"
                    disabled={isFormCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryCaregiver">Primary Caregiver <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.primaryCaregiver}
                    onValueChange={(value) => handleInputChange('primaryCaregiver', value)}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="primaryCaregiver">
                      <SelectValue placeholder="Select primary caregiver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MOTHER">Mother</SelectItem>
                      <SelectItem value="FATHER">Father</SelectItem>
                      <SelectItem value="GRANDPARENT">Grandparent</SelectItem>
                      <SelectItem value="GUARDIAN">Guardian</SelectItem>
                      <SelectItem value="SHARED">Shared Responsibility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="familyType">Family Type <span className="text-destructive">*</span></Label>
                  <Select
                    value={formData.familyType}
                    onValueChange={(value) => handleInputChange('familyType', value)}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="familyType">
                      <SelectValue placeholder="Select family type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nuclear">Nuclear Family</SelectItem>
                      <SelectItem value="Joint">Joint Family</SelectItem>
                      <SelectItem value="Single Parent">Single Parent</SelectItem>
                      <SelectItem value="Guardian Care">Guardian Care</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="familyIncome">Family Income</Label>
                  <Input
                    id="familyIncome"
                    value={formData.familyIncome}
                    onChange={(e) => handleInputChange('familyIncome', e.target.value)}
                    placeholder="Monthly / Annual income"
                    disabled={isFormCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numberOfSiblings">Number of Siblings</Label>
                  <Input
                    id="numberOfSiblings"
                    type="number"
                    min="0"
                    max="20"
                    value={formData.numberOfSiblings}
                    onChange={(e) => handleInputChange('numberOfSiblings', e.target.value)}
                    placeholder="e.g. 2"
                    disabled={isFormCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthOrder">Birth Order</Label>
                  <Select
                    value={formData.birthOrder}
                    onValueChange={(value) => handleInputChange('birthOrder', value)}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="birthOrder">
                      <SelectValue placeholder="Select birth order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIRST">First Child</SelectItem>
                      <SelectItem value="MIDDLE">Middle Child</SelectItem>
                      <SelectItem value="YOUNGEST">Youngest Child</SelectItem>
                      <SelectItem value="ONLY">Only Child</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── CARD 2: FAMILY DIFFICULTIES HISTORY ── */}
            <div className="space-y-4 p-5 bg-card rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 border-b pb-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-md font-semibold text-foreground">Hereditary & Developmental History</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="familyHistoryOfDifficulties">Family History of any Learning / Developmental Difficulties?</Label>
                  <Select
                    value={formData.familyHistoryOfDifficulties ? 'Yes' : 'No'}
                    onValueChange={(value) => handleInputChange('familyHistoryOfDifficulties', value === 'Yes')}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="familyHistoryOfDifficulties" className="max-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Helps AI identify hereditary risk factors (e.g. speech, reading, or attention difficulties)</p>
                </div>

                {formData.familyHistoryOfDifficulties && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <Label htmlFor="familyHistoryDetails">Details of Difficulties <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="familyHistoryDetails"
                      value={formData.familyHistoryDetails}
                      onChange={(e) => handleInputChange('familyHistoryDetails', e.target.value)}
                      placeholder="Please mention who (e.g., father, sibling) and what difficulties (e.g., reading issues, ADHD, speech delay)"
                      required
                      disabled={isFormCompleted}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ── CARD 3: HOME LEARNING ENVIRONMENT ── */}
            <div className="space-y-4 p-5 bg-card rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 border-b pb-2">
                <Home className="h-5 w-5 text-primary" />
                <h3 className="text-md font-semibold text-foreground">Home Learning Environment</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dailyDigitalUse">Daily Digital Use (Screen Time)</Label>
                    <Input
                      id="dailyDigitalUse"
                      type="number"
                      min="0"
                      max="24"
                      value={formData.dailyDigitalUse}
                      onChange={(e) => handleInputChange('dailyDigitalUse', e.target.value)}
                      placeholder="Hours per day"
                      disabled={isFormCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentHelpsWithHomework">Parent Helps with Homework</Label>
                    <Select
                      value={formData.parentHelpsWithHomework}
                      onValueChange={(value) => handleInputChange('parentHelpsWithHomework', value)}
                      disabled={isFormCompleted}
                    >
                      <SelectTrigger id="parentHelpsWithHomework">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALWAYS">Always</SelectItem>
                        <SelectItem value="OFTEN">Often</SelectItem>
                        <SelectItem value="SOMETIMES">Sometimes</SelectItem>
                        <SelectItem value="RARELY">Rarely</SelectItem>
                        <SelectItem value="NEVER">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Digital Resources Available at Home</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {DIGITAL_RESOURCE_OPTIONS.map((opt) => {
                      const isChecked = formData.digitalResourceTypes?.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-primary/5 border-primary text-primary font-medium shadow-sm'
                              : 'bg-card border-border hover:bg-accent'
                          } ${isFormCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => {
                              if (isFormCompleted) return;
                              toggleItemInArray('digitalResourceTypes', opt.value);
                            }}
                            disabled={isFormCompleted}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Languages Spoken at Home</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LANGUAGE_OPTIONS.map((opt) => {
                      const isChecked = formData.languagesSpokenAtHome?.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-primary/5 border-primary text-primary font-medium shadow-sm'
                              : 'bg-card border-border hover:bg-accent'
                          } ${isFormCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => {
                              if (isFormCompleted) return;
                              toggleItemInArray('languagesSpokenAtHome', opt.value);
                            }}
                            disabled={isFormCompleted}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ── CARD 4: SCHOOL ENGAGEMENT & EXTERNAL SUPPORT ── */}
            <div className="space-y-5 p-5 bg-card rounded-xl border shadow-sm">
              <div className="flex items-center gap-2 border-b pb-2">
                <School className="h-5 w-5 text-primary" />
                <h3 className="text-md font-semibold text-foreground">Engagement & External Supports</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Enjoys School</Label>
                  <RatingSelector
                    value={formData.enjoySchoolRating}
                    onChange={(val) => handleInputChange('enjoySchoolRating', val)}
                    disabled={isFormCompleted}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Enjoys Reading</Label>
                  <RatingSelector
                    value={formData.enjoyReadingRating}
                    onChange={(val) => handleInputChange('enjoyReadingRating', val)}
                    disabled={isFormCompleted}
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Label>External Academic Support Currently in Place</Label>
                  <div className="flex gap-3 flex-wrap">
                    {EXTERNAL_SUPPORT_OPTIONS.map((opt) => {
                      const isChecked = formData.externalSupportTypes?.includes(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer select-none min-w-[120px] ${
                            isChecked
                              ? 'bg-primary/5 border-primary text-primary font-medium shadow-sm'
                              : 'bg-card border-border hover:bg-accent'
                          } ${isFormCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => {
                              if (isFormCompleted) return;
                              toggleItemInArray('externalSupportTypes', opt.value);
                            }}
                            disabled={isFormCompleted}
                          />
                          <span className="text-sm">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'prenatal':
        const PREGNANCY_COMPLICATION_OPTIONS = [
          { label: 'None', value: 'None' },
          { label: 'High Blood Pressure', value: 'High Blood Pressure' },
          { label: 'Gestational Diabetes', value: 'Gestational Diabetes' },
          { label: 'Infection', value: 'Infection' },
          { label: 'Significant Stress', value: 'Significant Stress' },
          { label: 'Hospitalization', value: 'Hospitalization' },
          { label: 'Bleeding', value: 'Bleeding' },
          { label: 'Other', value: 'Other' },
        ];

        return (
          <div className="space-y-6">
            {/* ── Row 1: Full Term/Premature + Delivery Type ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullTermOrPremature">Full Term or Premature</Label>
                <Select
                  value={formData.fullTermOrPremature}
                  onValueChange={(value) => handleInputChange('fullTermOrPremature', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger id="fullTermOrPremature">
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
                  <SelectTrigger id="deliveryType">
                    <SelectValue placeholder="Select delivery type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal Delivery">Normal Delivery</SelectItem>
                    <SelectItem value="Caesarean Section">Caesarean Section</SelectItem>
                    <SelectItem value="Assisted Delivery">Assisted Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Conditional Premature Fields ── */}
            {formData.fullTermOrPremature === 'Premature' && (
              <div className="p-4 bg-muted/40 rounded-lg border border-border/60 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <Label htmlFor="gestationalAge">Gestational Age (weeks)</Label>
                  <Input
                    id="gestationalAge"
                    value={formData.gestationalAge}
                    onChange={(e) => handleInputChange('gestationalAge', e.target.value)}
                    placeholder="e.g. 32 Weeks"
                    disabled={isFormCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nicuStay">NICU Stay (days)</Label>
                  <Input
                    id="nicuStay"
                    value={formData.nicuStay}
                    onChange={(e) => handleInputChange('nicuStay', e.target.value)}
                    placeholder="e.g. 21 Days"
                    disabled={isFormCompleted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthWeight">Birth Weight</Label>
                  <Input
                    id="birthWeight"
                    value={formData.birthWeight}
                    onChange={(e) => handleInputChange('birthWeight', e.target.value)}
                    placeholder="e.g. 1.8 kg"
                    disabled={isFormCompleted}
                  />
                </div>
              </div>
            )}

            {/* ── Pregnancy Complications (Multi-select) ── */}
            <div className="space-y-3">
              <Label>Pregnancy Complications</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {PREGNANCY_COMPLICATION_OPTIONS.map((opt) => {
                  const isChecked = formData.pregnancyComplications?.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-primary/5 border-primary text-primary font-medium shadow-sm'
                          : 'bg-card border-border hover:bg-accent'
                      } ${isFormCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => {
                          if (isFormCompleted) return;
                          togglePregnancyComplication(opt.value);
                        }}
                        disabled={isFormCompleted}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* ── Medications During Pregnancy ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="medicationsDuringPregnancy">Medications During Pregnancy</Label>
                <Select
                  value={formData.medicationsDuringPregnancy}
                  onValueChange={(value) => handleInputChange('medicationsDuringPregnancy', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger id="medicationsDuringPregnancy">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.medicationsDuringPregnancy === 'Yes' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="medicationsDuringPregnancyDetails">Specify Medication</Label>
                  <Input
                    id="medicationsDuringPregnancyDetails"
                    value={formData.medicationsDuringPregnancyDetails}
                    onChange={(e) => handleInputChange('medicationsDuringPregnancyDetails', e.target.value)}
                    placeholder="E.g., thyroid hormone, blood pressure medication"
                    disabled={isFormCompleted}
                  />
                </div>
              )}
            </div>

            {/* ── Miscarriages/Abortions + Jaundice + Feeding Difficulties ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="miscarriagesAbortions">History of Miscarriages/Abortions</Label>
                <Select
                  value={formData.miscarriagesAbortions ? 'Yes' : 'No'}
                  onValueChange={(value) => handleInputChange('miscarriagesAbortions', value === 'Yes')}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger id="miscarriagesAbortions">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="infantJaundice">Jaundice After Birth</Label>
                <Select
                  value={formData.infantJaundice ? 'Yes' : 'No'}
                  onValueChange={(value) => handleInputChange('infantJaundice', value === 'Yes')}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger id="infantJaundice">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedingDifficulties">Feeding Difficulties in Infancy</Label>
                <Select
                  value={formData.feedingDifficulties ? 'Yes' : 'No'}
                  onValueChange={(value) => handleInputChange('feedingDifficulties', value === 'Yes')}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger id="feedingDifficulties">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Significant Illness During First Year ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="significantIllness">Significant Illness During First Year</Label>
                <Select
                  value={formData.significantIllness ? 'Yes' : 'No'}
                  onValueChange={(value) => handleInputChange('significantIllness', value === 'Yes')}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger id="significantIllness">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.significantIllness && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label htmlFor="significantIllnessDetails">Specify Illness / Treatment</Label>
                  <Input
                    id="significantIllnessDetails"
                    value={formData.significantIllnessDetails}
                    onChange={(e) => handleInputChange('significantIllnessDetails', e.target.value)}
                    placeholder="Details of illness or hospitalization"
                    disabled={isFormCompleted}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 'postnatal':
        return (
          <div className="space-y-6">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-primary">About Post Natal History</p>
                <p>This section provides early developmental context to help educators interpret assessment findings. <strong>It is not used to generate a diagnosis.</strong></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Birth Cry */}
              <div className="space-y-2">
                <Label htmlFor="birthCry">Birth Cry</Label>
                <Select
                  value={formData.birthCry}
                  onValueChange={(value) => {
                    handleInputChange('birthCry', value);
                    if (value !== 'Delayed') {
                      handleInputChange('birthCryDelayDuration', '');
                      handleInputChange('resuscitationRequired', false);
                    }
                  }}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger id="birthCry">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Immediate">Immediate</SelectItem>
                    <SelectItem value="Delayed">Delayed</SelectItem>
                    <SelectItem value="Did Not Cry">Did Not Cry</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age of Walking */}
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
                <p className="text-xs text-muted-foreground italic">Expected range: 8–18 months. Flags if &gt; 18 months.</p>
              </div>

              {/* Age of Two-Word Speech */}
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
                <p className="text-xs text-muted-foreground italic">Expected range: 18–24 months. Flags if &gt; 24 months.</p>
              </div>

              {/* Immunization Done */}
              <div className="space-y-2">
                <Label htmlFor="immunizationDone">Immunization Done</Label>
                <Select
                  value={formData.immunizationDone}
                  onValueChange={(value) => handleInputChange('immunizationDone', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger id="immunizationDone">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="Partial">Partial</SelectItem>
                    <SelectItem value="Not Done">Not Done</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Consanguineous Marriage */}
              <div className="space-y-2">
                <Label htmlFor="consanguineousMarriage">Consanguineous Marriage</Label>
                <Select
                  value={formData.consanguineousMarriage}
                  onValueChange={(value) => handleInputChange('consanguineousMarriage', value)}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger id="consanguineousMarriage">
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Breast Fed */}
              <div className="space-y-2">
                <Label htmlFor="breastFed">Breast Fed</Label>
                <Select
                  value={formData.breastFed}
                  onValueChange={(value) => {
                    handleInputChange('breastFed', value);
                    if (value !== 'Yes') {
                      handleInputChange('breastFedDuration', '');
                    }
                  }}
                  disabled={isFormCompleted}
                >
                  <SelectTrigger id="breastFed">
                    <SelectValue placeholder="Select feeding history" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                    <SelectItem value="Mixed Feeding">Mixed Feeding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditional Sub-fields Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              {/* Birth Cry Delay sub-fields */}
              {formData.birthCry === 'Delayed' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/40 rounded-lg border border-border">
                  <div className="space-y-2">
                    <Label htmlFor="birthCryDelayDuration">Delay Duration (Optional)</Label>
                    <Input
                      id="birthCryDelayDuration"
                      value={formData.birthCryDelayDuration}
                      onChange={(e) => handleInputChange('birthCryDelayDuration', e.target.value)}
                      placeholder="e.g. 5 minutes, 1 hour"
                      disabled={isFormCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resuscitationRequired">Resuscitation Required?</Label>
                    <Select
                      value={formData.resuscitationRequired ? 'Yes' : 'No'}
                      onValueChange={(value) => handleInputChange('resuscitationRequired', value === 'Yes')}
                      disabled={isFormCompleted}
                    >
                      <SelectTrigger id="resuscitationRequired">
                        <SelectValue placeholder="Select Yes/No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Breast Fed Duration sub-field */}
              {formData.breastFed === 'Yes' && (
                <div className="p-4 bg-muted/40 rounded-lg border border-border space-y-2 max-w-md">
                  <Label htmlFor="breastFedDuration">Duration (Months)</Label>
                  <Input
                    id="breastFedDuration"
                    type="number"
                    value={formData.breastFedDuration}
                    onChange={(e) => handleInputChange('breastFedDuration', e.target.value)}
                    placeholder="Duration in months"
                    disabled={isFormCompleted}
                  />
                </div>
              )}

              {/* Infant Jaundice Checkbox & Treatment Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="infantJaundice"
                    checked={formData.infantJaundice}
                    onCheckedChange={(checked) => {
                      handleInputChange('infantJaundice', checked as boolean);
                      if (!checked) handleInputChange('infantJaundiceTreatment', '');
                    }}
                    disabled={isFormCompleted}
                  />
                  <Label htmlFor="infantJaundice" className="font-medium cursor-pointer">Infant Jaundice Experienced</Label>
                </div>
                {formData.infantJaundice && (
                  <div className="p-4 bg-muted/40 rounded-lg border border-border space-y-2 max-w-md ml-6">
                    <Label htmlFor="infantJaundiceTreatment">Treatment Required</Label>
                    <Select
                      value={formData.infantJaundiceTreatment}
                      onValueChange={(value) => handleInputChange('infantJaundiceTreatment', value)}
                      disabled={isFormCompleted}
                    >
                      <SelectTrigger id="infantJaundiceTreatment">
                        <SelectValue placeholder="Select treatment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Phototherapy">Phototherapy</SelectItem>
                        <SelectItem value="Hospital Admission">Hospital Admission</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Incubation Required Checkbox, Days, and Reasons */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incubation"
                    checked={formData.incubation}
                    onCheckedChange={(checked) => {
                      handleInputChange('incubation', checked as boolean);
                      if (!checked) {
                        handleInputChange('incubationDays', '');
                        handleInputChange('incubationReason', []);
                      }
                    }}
                    disabled={isFormCompleted}
                  />
                  <Label htmlFor="incubation" className="font-medium cursor-pointer">Incubation Required (NICU/Incubator)</Label>
                </div>
                {formData.incubation && (
                  <div className="p-4 bg-muted/40 rounded-lg border border-border space-y-4 ml-6">
                    <div className="max-w-md space-y-2">
                      <Label htmlFor="incubationDays">Number of Days</Label>
                      <Input
                        id="incubationDays"
                        type="number"
                        value={formData.incubationDays}
                        onChange={(e) => handleInputChange('incubationDays', e.target.value)}
                        placeholder="Days in incubator"
                        disabled={isFormCompleted}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reason for Incubation (Select all that apply)</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {['Prematurity', 'Breathing Difficulty', 'Low Birth Weight', 'Infection', 'Other'].map((reason) => {
                          const isSelected = formData.incubationReason?.includes(reason);
                          return (
                            <div key={reason} className="flex items-center space-x-2">
                              <Checkbox
                                id={`incubationReason-${reason}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  let currentReasons = formData.incubationReason || [];
                                  if (checked) {
                                    handleInputChange('incubationReason', [...currentReasons, reason]);
                                  } else {
                                    handleInputChange('incubationReason', currentReasons.filter(r => r !== reason));
                                  }
                                }}
                                disabled={isFormCompleted}
                              />
                              <Label htmlFor={`incubationReason-${reason}`} className="text-sm cursor-pointer">{reason}</Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Delay in Neck Standing */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delayInNeckStanding"
                    checked={formData.delayInNeckStanding}
                    onCheckedChange={(checked) => {
                      handleInputChange('delayInNeckStanding', checked as boolean);
                      if (!checked) handleInputChange('delayInNeckStandingDetails', '');
                    }}
                    disabled={isFormCompleted}
                  />
                  <Label htmlFor="delayInNeckStanding" className="font-medium cursor-pointer">Delay in Neck Standing</Label>
                </div>
                {formData.delayInNeckStanding && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="delayInNeckStandingDetails">Delay Details</Label>
                    <Textarea
                      id="delayInNeckStandingDetails"
                      value={formData.delayInNeckStandingDetails}
                      onChange={(e) => handleInputChange('delayInNeckStandingDetails', e.target.value)}
                      placeholder="e.g. Neck control achieved at 6 months"
                      disabled={isFormCompleted}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Recommended Fields Section */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground">Additional Recommended Fields (Early Health & Sensory factors)</h3>
              
              {/* Seizures during Infancy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seizuresInfancy">Seizures During Infancy</Label>
                  <Select
                    value={formData.seizuresInfancy ? 'Yes' : 'No'}
                    onValueChange={(value) => {
                      handleInputChange('seizuresInfancy', value === 'Yes');
                      if (value === 'No') handleInputChange('seizuresInfancyDetails', '');
                    }}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="seizuresInfancy">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.seizuresInfancy && (
                  <div className="space-y-2">
                    <Label htmlFor="seizuresInfancyDetails">Specify Details</Label>
                    <Input
                      id="seizuresInfancyDetails"
                      value={formData.seizuresInfancyDetails}
                      onChange={(e) => handleInputChange('seizuresInfancyDetails', e.target.value)}
                      placeholder="e.g. type of seizures, medication details"
                      disabled={isFormCompleted}
                    />
                  </div>
                )}
              </div>

              {/* Early Sensory Problems (Vision & Hearing) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="visionProblemsEarly">Vision Problems Detected Early?</Label>
                  <Select
                    value={formData.visionProblemsEarly ? 'Yes' : 'No'}
                    onValueChange={(value) => handleInputChange('visionProblemsEarly', value === 'Yes')}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="visionProblemsEarly">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hearingProblemsEarly">Hearing Problems Detected Early?</Label>
                  <Select
                    value={formData.hearingProblemsEarly ? 'Yes' : 'No'}
                    onValueChange={(value) => handleInputChange('hearingProblemsEarly', value === 'Yes')}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="hearingProblemsEarly">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Hospitalization History during First Two Years */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hospitalizationFirstTwoYears">Hospitalization During First Two Years?</Label>
                  <Select
                    value={formData.hospitalizationFirstTwoYears ? 'Yes' : 'No'}
                    onValueChange={(value) => {
                      handleInputChange('hospitalizationFirstTwoYears', value === 'Yes');
                      if (value === 'No') handleInputChange('hospitalizationFirstTwoYearsReason', '');
                    }}
                    disabled={isFormCompleted}
                  >
                    <SelectTrigger id="hospitalizationFirstTwoYears">
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.hospitalizationFirstTwoYears && (
                  <div className="space-y-2">
                    <Label htmlFor="hospitalizationFirstTwoYearsReason">Reason for Hospitalization</Label>
                    <Input
                      id="hospitalizationFirstTwoYearsReason"
                      value={formData.hospitalizationFirstTwoYearsReason}
                      onChange={(e) => handleInputChange('hospitalizationFirstTwoYearsReason', e.target.value)}
                      placeholder="e.g. pneumonia, high fever"
                      disabled={isFormCompleted}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'medical':
        return (
          <div className="space-y-6">
            <div className="space-y-6">
              {/* General Health Concerns */}
              <div className="space-y-2 bg-muted/20 p-4 rounded-xl border border-border/60">
                <Label htmlFor="healthConcerns" className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-primary" /> Health Concerns / Diagnoses
                </Label>
                <Textarea
                  id="healthConcerns"
                  value={formData.healthConcerns}
                  onChange={(e) => handleInputChange('healthConcerns', e.target.value)}
                  placeholder="e.g. Frequent Migraines, Cerebral Palsy, ADHD (Previously Diagnosed), Autism Diagnosis, etc."
                  disabled={isFormCompleted}
                  className="min-h-[80px]"
                />
              </div>

              {/* Epileptic History Section */}
              <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/60">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="epilepticHistory"
                    checked={formData.epilepticHistory}
                    onCheckedChange={(checked) => {
                      handleInputChange('epilepticHistory', checked as boolean);
                      if (!checked) {
                        handleInputChange('epilepsyType', '');
                        handleInputChange('epilepsyLastEpisode', '');
                        handleInputChange('epilepsyFrequency', '');
                        handleInputChange('epilepsyUnderMedicalCare', false);
                      }
                    }}
                    disabled={isFormCompleted}
                  />
                  <Label htmlFor="epilepticHistory" className="text-sm font-semibold cursor-pointer">Epileptic History</Label>
                </div>

                {formData.epilepticHistory && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 pt-2 border-l-2 border-primary/20 space-y-4 md:space-y-0">
                    <div className="space-y-2">
                      <Label htmlFor="epilepsyType">Epilepsy Type (Optional)</Label>
                      <Input
                        id="epilepsyType"
                        value={formData.epilepsyType}
                        onChange={(e) => handleInputChange('epilepsyType', e.target.value)}
                        placeholder="e.g. Absence Seizures, Tonic-Clonic"
                        disabled={isFormCompleted}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="epilepsyLastEpisode">Last Episode</Label>
                      <Input
                        id="epilepsyLastEpisode"
                        value={formData.epilepsyLastEpisode}
                        onChange={(e) => handleInputChange('epilepsyLastEpisode', e.target.value)}
                        placeholder="e.g. 6 months ago, 12-May-2025"
                        disabled={isFormCompleted}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="epilepsyFrequency">Frequency</Label>
                      <Input
                        id="epilepsyFrequency"
                        value={formData.epilepsyFrequency}
                        onChange={(e) => handleInputChange('epilepsyFrequency', e.target.value)}
                        placeholder="e.g. Occasional, Once a month"
                        disabled={isFormCompleted}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="epilepsyUnderMedicalCare">Under Medical Care?</Label>
                      <Select
                        value={formData.epilepsyUnderMedicalCare ? 'Yes' : 'No'}
                        onValueChange={(val) => handleInputChange('epilepsyUnderMedicalCare', val === 'Yes')}
                        disabled={isFormCompleted}
                      >
                        <SelectTrigger id="epilepsyUnderMedicalCare">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Medication Section */}
              <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/60">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="onMedication"
                    checked={formData.onMedication}
                    onCheckedChange={(checked) => {
                      handleInputChange('onMedication', checked as boolean);
                      if (!checked) {
                        handleInputChange('medicationName', '');
                        handleInputChange('medicationDosage', '');
                        handleInputChange('medicationFrequency', '');
                        handleInputChange('medicationPurpose', []);
                        handleInputChange('medicationDetails', '');
                      }
                    }}
                    disabled={isFormCompleted}
                  />
                  <Label htmlFor="onMedication" className="text-sm font-semibold cursor-pointer">On Medication</Label>
                </div>

                {formData.onMedication && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pl-6 pt-2 border-l-2 border-primary/20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="medicationName">Medication Name</Label>
                        <Input
                          id="medicationName"
                          value={formData.medicationName}
                          onChange={(e) => handleInputChange('medicationName', e.target.value)}
                          placeholder="e.g. Methylphenidate, Levetiracetam"
                          disabled={isFormCompleted}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medicationDosage">Dosage (Optional)</Label>
                        <Input
                          id="medicationDosage"
                          value={formData.medicationDosage}
                          onChange={(e) => handleInputChange('medicationDosage', e.target.value)}
                          placeholder="e.g. 10 mg, 250 mg"
                          disabled={isFormCompleted}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medicationFrequency">Frequency</Label>
                        <Input
                          id="medicationFrequency"
                          value={formData.medicationFrequency}
                          onChange={(e) => handleInputChange('medicationFrequency', e.target.value)}
                          placeholder="e.g. Once daily, Twice daily"
                          disabled={isFormCompleted}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Medication Purpose</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-background/50 rounded-lg border border-border/40">
                        {['Attention', 'Behaviour', 'Seizures', 'Anxiety', 'Sleep', 'Other'].map((purpose) => (
                          <div key={purpose} className="flex items-center space-x-2">
                            <Checkbox
                              id={`purpose-${purpose}`}
                              checked={formData.medicationPurpose?.includes(purpose)}
                              onCheckedChange={(checked) => {
                                const current = formData.medicationPurpose || [];
                                if (checked) {
                                  handleInputChange('medicationPurpose', [...current, purpose]);
                                } else {
                                  handleInputChange('medicationPurpose', current.filter(p => p !== purpose));
                                }
                              }}
                              disabled={isFormCompleted}
                            />
                            <Label htmlFor={`purpose-${purpose}`} className="text-xs cursor-pointer capitalize">{purpose}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="medicationDetails">Other Medication Details (Optional)</Label>
                      <Textarea
                        id="medicationDetails"
                        value={formData.medicationDetails}
                        onChange={(e) => handleInputChange('medicationDetails', e.target.value)}
                        placeholder="Additional details regarding medication or side effects..."
                        disabled={isFormCompleted}
                        className="min-h-[60px]"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Asthma Section */}
              <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/60">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="asthmaWheezing"
                    checked={formData.asthmaWheezing}
                    onCheckedChange={(checked) => {
                      handleInputChange('asthmaWheezing', checked as boolean);
                      if (!checked) {
                        handleInputChange('asthmaUsesInhaler', false);
                        handleInputChange('asthmaFrequency', '');
                        handleInputChange('asthmaEmergencyPlan', false);
                      }
                    }}
                    disabled={isFormCompleted}
                  />
                  <Label htmlFor="asthmaWheezing" className="text-sm font-semibold cursor-pointer">Asthma / Wheezing</Label>
                </div>

                {formData.asthmaWheezing && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6 pt-2 border-l-2 border-primary/20 space-y-4 md:space-y-0">
                    <div className="space-y-2">
                      <Label htmlFor="asthmaUsesInhaler">Uses Inhaler?</Label>
                      <Select
                        value={formData.asthmaUsesInhaler ? 'Yes' : 'No'}
                        onValueChange={(val) => handleInputChange('asthmaUsesInhaler', val === 'Yes')}
                        disabled={isFormCompleted}
                      >
                        <SelectTrigger id="asthmaUsesInhaler">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="asthmaFrequency">Frequency of Episodes</Label>
                      <Input
                        id="asthmaFrequency"
                        value={formData.asthmaFrequency}
                        onChange={(e) => handleInputChange('asthmaFrequency', e.target.value)}
                        placeholder="e.g. During cold weather, after running"
                        disabled={isFormCompleted}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="asthmaEmergencyPlan">Emergency Plan Available?</Label>
                      <Select
                        value={formData.asthmaEmergencyPlan ? 'Yes' : 'No'}
                        onValueChange={(val) => handleInputChange('asthmaEmergencyPlan', val === 'Yes')}
                        disabled={isFormCompleted}
                      >
                        <SelectTrigger id="asthmaEmergencyPlan">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Visual Support & Tests */}
              <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/60">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <Eye className="w-4 h-4 text-primary" /> Vision & Hearing Support
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 pb-2">
                      <Checkbox
                        id="wearsGlasses"
                        checked={formData.wearsGlasses}
                        onCheckedChange={(checked) => {
                          handleInputChange('wearsGlasses', checked as boolean);
                          if (!checked) handleInputChange('glassesUsage', '');
                        }}
                        disabled={isFormCompleted}
                      />
                      <Label htmlFor="wearsGlasses" className="text-sm font-medium cursor-pointer">Wears Glasses</Label>
                    </div>
                    {formData.wearsGlasses && (
                      <Select
                        value={formData.glassesUsage}
                        onValueChange={(val) => handleInputChange('glassesUsage', val)}
                        disabled={isFormCompleted}
                      >
                        <SelectTrigger id="glassesUsage">
                          <SelectValue placeholder="Glasses usage pattern" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Constantly">Constantly</SelectItem>
                          <SelectItem value="Reading Only">Reading Only</SelectItem>
                          <SelectItem value="Distance Only">Distance Only</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 pb-2">
                      <Checkbox
                        id="visionTestDone"
                        checked={formData.visionTestDone}
                        onCheckedChange={(checked) => {
                          handleInputChange('visionTestDone', checked as boolean);
                          if (!checked) {
                            handleInputChange('visionTestResult', '');
                            handleInputChange('visionTestDate', '');
                          }
                        }}
                        disabled={isFormCompleted}
                      />
                      <Label htmlFor="visionTestDone" className="text-sm font-medium cursor-pointer">Vision Test Done</Label>
                    </div>
                    {formData.visionTestDone && (
                      <div className="space-y-2 border-l border-primary/20 pl-4">
                        <Select
                          value={formData.visionTestResult}
                          onValueChange={(val) => handleInputChange('visionTestResult', val)}
                          disabled={isFormCompleted}
                        >
                          <SelectTrigger id="visionTestResult">
                            <SelectValue placeholder="Test result" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Vision Difficulty Identified">Vision Difficulty Identified</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={formData.visionTestDate}
                          onChange={(e) => handleInputChange('visionTestDate', e.target.value)}
                          disabled={isFormCompleted}
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 pb-2">
                      <Checkbox
                        id="hearingTestDone"
                        checked={formData.hearingTestDone}
                        onCheckedChange={(checked) => {
                          handleInputChange('hearingTestDone', checked as boolean);
                          if (!checked) {
                            handleInputChange('hearingTestResult', '');
                            handleInputChange('hearingTestDate', '');
                          }
                        }}
                        disabled={isFormCompleted}
                      />
                      <Label htmlFor="hearingTestDone" className="text-sm font-medium cursor-pointer">Hearing Test Done</Label>
                    </div>
                    {formData.hearingTestDone && (
                      <div className="space-y-2 border-l border-primary/20 pl-4">
                        <Select
                          value={formData.hearingTestResult}
                          onValueChange={(val) => handleInputChange('hearingTestResult', val)}
                          disabled={isFormCompleted}
                        >
                          <SelectTrigger id="hearingTestResult">
                            <SelectValue placeholder="Test result" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Hearing Difficulty Identified">Hearing Difficulty Identified</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="date"
                          value={formData.hearingTestDate}
                          onChange={(e) => handleInputChange('hearingTestDate', e.target.value)}
                          disabled={isFormCompleted}
                          className="text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Recommended Fields: Sleep & Hospitalization */}
              <div className="space-y-4 bg-muted/20 p-4 rounded-xl border border-border/60">
                <h4 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <Stethoscope className="w-4 h-4 text-primary" /> Additional Medical History (Recommended)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sleep Difficulties */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sleepDifficulties"
                        checked={formData.sleepDifficulties}
                        onCheckedChange={(checked) => {
                          handleInputChange('sleepDifficulties', checked as boolean);
                          if (!checked) handleInputChange('sleepDifficultiesDetails', []);
                        }}
                        disabled={isFormCompleted}
                      />
                      <Label htmlFor="sleepDifficulties" className="text-sm font-medium cursor-pointer">Sleep Difficulties?</Label>
                    </div>
                    {formData.sleepDifficulties && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pl-6 border-l-2 border-primary/20">
                        <Label className="text-xs text-muted-foreground block mb-1">Specify Details:</Label>
                        <div className="space-y-2 bg-background/50 p-3 rounded-lg border border-border/40">
                          {['Difficulty Falling Asleep', 'Frequent Night Waking', 'Sleep Apnea'].map((sleepOpt) => (
                            <div key={sleepOpt} className="flex items-center space-x-2">
                              <Checkbox
                                id={`sleep-${sleepOpt}`}
                                checked={formData.sleepDifficultiesDetails?.includes(sleepOpt)}
                                onCheckedChange={(checked) => {
                                  const current = formData.sleepDifficultiesDetails || [];
                                  if (checked) {
                                    handleInputChange('sleepDifficultiesDetails', [...current, sleepOpt]);
                                  } else {
                                    handleInputChange('sleepDifficultiesDetails', current.filter(s => s !== sleepOpt));
                                  }
                                }}
                                disabled={isFormCompleted}
                              />
                              <Label htmlFor={`sleep-${sleepOpt}`} className="text-xs cursor-pointer">{sleepOpt}</Label>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Hospitalization History */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="hospitalizationHistory"
                        checked={formData.hospitalizationHistory}
                        onCheckedChange={(checked) => {
                          handleInputChange('hospitalizationHistory', checked as boolean);
                          if (!checked) {
                            handleInputChange('hospitalizationHistoryReason', '');
                            handleInputChange('hospitalizationHistoryDate', '');
                          }
                        }}
                        disabled={isFormCompleted}
                      />
                      <Label htmlFor="hospitalizationHistory" className="text-sm font-medium cursor-pointer">Hospitalization History?</Label>
                    </div>
                    {formData.hospitalizationHistory && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pl-6 border-l-2 border-primary/20">
                        <div className="space-y-2">
                          <Label htmlFor="hospitalizationHistoryReason" className="text-xs">Reason</Label>
                          <Input
                            id="hospitalizationHistoryReason"
                            value={formData.hospitalizationHistoryReason}
                            onChange={(e) => handleInputChange('hospitalizationHistoryReason', e.target.value)}
                            placeholder="e.g. Broken bone, surgery"
                            disabled={isFormCompleted}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hospitalizationHistoryDate" className="text-xs">Date of Hospitalization (Optional)</Label>
                          <Input
                            type="text"
                            id="hospitalizationHistoryDate"
                            value={formData.hospitalizationHistoryDate}
                            onChange={(e) => handleInputChange('hospitalizationHistoryDate', e.target.value)}
                            placeholder="e.g. October 2024, Age 5"
                            disabled={isFormCompleted}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'educational': {
        const handleCheckboxGroupChange = (field: keyof FormData, item: string, checked: boolean) => {
          const currentArray = (formData[field] as string[]) || [];
          if (checked) {
            if (item === 'None' || item === 'NONE') {
              handleInputChange(field, [item]);
            } else {
              handleInputChange(field, [...currentArray.filter(i => i !== 'None' && i !== 'NONE'), item]);
            }
          } else {
            handleInputChange(field, currentArray.filter(i => i !== item));
          }
        };

        const handleSubjectPerformanceChange = (subject: string, value: string) => {
          const current = formData.subjectPerformance || {};
          handleInputChange('subjectPerformance', { ...current, [subject]: value });
        };

        const handleSubjectMarksChange = (subject: string, key: 'marks' | 'grade', value: string) => {
          const current = formData.subjectMarks || {};
          const subjectObj = current[subject] || { marks: '', grade: '' };
          handleInputChange('subjectMarks', {
            ...current,
            [subject]: { ...subjectObj, [key]: value }
          });
        };

        const performanceOptions = ['Excellent', 'Good', 'Average', 'Needs Support'];
        const gradeOptions = ['Pre-K', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

        return (
          <div className="space-y-6">
            {/* Card 1: School & Preschool History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Preschool & School Progression
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dominant Writing Hand */}
                  <div className="space-y-2">
                    <Label htmlFor="dominantWritingHand">Dominant Writing Hand</Label>
                    <Select
                      value={formData.dominantWritingHand}
                      onValueChange={(value) => handleInputChange('dominantWritingHand', value)}
                      disabled={isFormCompleted}
                    >
                      <SelectTrigger id="dominantWritingHand">
                        <SelectValue placeholder="Select hand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Right">Right</SelectItem>
                        <SelectItem value="Left">Left</SelectItem>
                        <SelectItem value="Mixed">Uses Both Hands (Mixed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Attended Preschool */}
                  <div className="space-y-2">
                    <Label htmlFor="attendedPreschool">Attended Preschool</Label>
                    <Select
                      value={formData.attendedPreschool ? 'Yes' : 'No'}
                      onValueChange={(value) => handleInputChange('attendedPreschool', value === 'Yes')}
                      disabled={isFormCompleted}
                    >
                      <SelectTrigger id="attendedPreschool">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Repeated Grades */}
                  <div className="space-y-2">
                    <Label htmlFor="repeatedGrades">Has Repeated any Grade?</Label>
                    <Select
                      value={formData.repeatedGrades ? 'Yes' : 'No'}
                      onValueChange={(value) => handleInputChange('repeatedGrades', value === 'Yes')}
                      disabled={isFormCompleted}
                    >
                      <SelectTrigger id="repeatedGrades">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditional Preschool Details */}
                {formData.attendedPreschool && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="ageStartedPreschool">Age Started Preschool (Years)</Label>
                      <Input
                        id="ageStartedPreschool"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.ageStartedPreschool}
                        onChange={(e) => handleInputChange('ageStartedPreschool', e.target.value)}
                        placeholder="Age child started preschool"
                        disabled={isFormCompleted}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearsPreschool">Number of Years Attended</Label>
                      <Input
                        id="yearsPreschool"
                        type="number"
                        min="1"
                        max="8"
                        value={formData.yearsPreschool}
                        onChange={(e) => handleInputChange('yearsPreschool', e.target.value)}
                        placeholder="Years spent in preschool"
                        disabled={isFormCompleted}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Conditional Grade Repeated Details */}
                {formData.repeatedGrades && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-2 border-t border-border/40"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="whichGradeRepeated">Which Grade Repeated</Label>
                        <Select
                          value={formData.whichGradeRepeated}
                          onValueChange={(value) => handleInputChange('whichGradeRepeated', value)}
                          disabled={isFormCompleted}
                        >
                          <SelectTrigger id="whichGradeRepeated">
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {gradeOptions.map(g => (
                              <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reasonForRepeating">Reason for Repeating</Label>
                      <Textarea
                        id="reasonForRepeating"
                        value={formData.reasonForRepeating}
                        onChange={(e) => handleInputChange('reasonForRepeating', e.target.value)}
                        placeholder="Provide details or observations from teachers regarding repetition..."
                        disabled={isFormCompleted}
                        rows={2}
                      />
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Card 2: Academic Profile & Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Academic Profile & Marks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="overallPerformance">Overall Performance Rating</Label>
                    <Select
                      value={formData.overallPerformance}
                      onValueChange={(value) => handleInputChange('overallPerformance', value)}
                      disabled={isFormCompleted}
                    >
                      <SelectTrigger id="overallPerformance">
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Above Average">Above Average</SelectItem>
                        <SelectItem value="Average">Average</SelectItem>
                        <SelectItem value="Below Average">Below Average</SelectItem>
                        <SelectItem value="Significantly Below Expected">Significantly Below Expected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overallPercentage">Overall Percentage (%)</Label>
                    <Input
                      id="overallPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.overallPercentage}
                      onChange={(e) => handleInputChange('overallPercentage', e.target.value)}
                      placeholder="e.g. 74"
                      disabled={isFormCompleted}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="academicTrend">Academic Trend</Label>
                    <Select
                      value={formData.academicTrend}
                      onValueChange={(value) => handleInputChange('academicTrend', value)}
                      disabled={isFormCompleted}
                    >
                      <SelectTrigger id="academicTrend">
                        <SelectValue placeholder="Select trend" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Improving">Improving</SelectItem>
                        <SelectItem value="Stable">Stable</SelectItem>
                        <SelectItem value="Declining">Declining</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject performance grid */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <Label className="text-sm font-medium">Subject-wise Academic Performance</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: 'Reading', key: 'reading' },
                      { name: 'Writing', key: 'writing' },
                      { name: 'Spelling', key: 'spelling' },
                      { name: 'Mathematics', key: 'mathematics' },
                      { name: 'Science', key: 'science' },
                      { name: 'Social Science', key: 'socialScience' },
                      { name: 'English', key: 'english' },
                      { name: 'Second Language', key: 'secondLanguage' }
                    ].map((subject) => (
                      <div key={subject.key} className="bg-muted/30 p-3 rounded-lg border border-border/50 space-y-2">
                        <span className="text-xs font-semibold block text-foreground">{subject.name}</span>
                        <Select
                          value={formData.subjectPerformance?.[subject.key] || ''}
                          onValueChange={(value) => handleSubjectPerformanceChange(subject.key, value)}
                          disabled={isFormCompleted}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Rating" />
                          </SelectTrigger>
                          <SelectContent>
                            {performanceOptions.map(o => (
                              <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject marks grid */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <Label className="text-sm font-medium">Core Subject Marks & Grades (Optional)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: 'English', key: 'english' },
                      { name: 'Mathematics', key: 'mathematics' },
                      { name: 'Science', key: 'science' },
                      { name: 'Social Science', key: 'socialScience' }
                    ].map((subject) => (
                      <div key={subject.key} className="bg-muted/30 p-3 rounded-lg border border-border/50 space-y-2">
                        <span className="text-xs font-semibold block text-foreground">{subject.name}</span>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Marks"
                            className="h-8 text-xs px-2"
                            value={formData.subjectMarks?.[subject.key]?.marks || ''}
                            onChange={(e) => handleSubjectMarksChange(subject.key, 'marks', e.target.value)}
                            disabled={isFormCompleted}
                          />
                          <Input
                            placeholder="Grade"
                            className="h-8 text-xs px-2 uppercase"
                            value={formData.subjectMarks?.[subject.key]?.grade || ''}
                            onChange={(e) => handleSubjectMarksChange(subject.key, 'grade', e.target.value)}
                            disabled={isFormCompleted}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Classroom Engagement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Classroom Engagement & Observations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classroomParticipation">Classroom Participation</Label>
                    <Select
                      value={formData.classroomParticipation}
                      onValueChange={(value) => handleInputChange('classroomParticipation', value)}
                      disabled={isFormCompleted}
                    >
                      <SelectTrigger id="classroomParticipation">
                        <SelectValue placeholder="Select participation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Average">Average</SelectItem>
                        <SelectItem value="Limited">Limited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homeworkCompletion">Homework Completion</Label>
                    <Select
                      value={formData.homeworkCompletion}
                      onValueChange={(value) => handleInputChange('homeworkCompletion', value)}
                      disabled={isFormCompleted}
                    >
                      <SelectTrigger id="homeworkCompletion">
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Always">Always</SelectItem>
                        <SelectItem value="Usually">Usually</SelectItem>
                        <SelectItem value="Sometimes">Sometimes</SelectItem>
                        <SelectItem value="Rarely">Rarely</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendancePercentage">Attendance Percentage (%)</Label>
                    <Input
                      id="attendancePercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.attendancePercentage}
                      onChange={(e) => handleInputChange('attendancePercentage', e.target.value)}
                      placeholder="e.g. 95"
                      disabled={isFormCompleted}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/40">
                  <Label htmlFor="teacherComments">Teacher Comments & Observations</Label>
                  <Textarea
                    id="teacherComments"
                    value={formData.teacherComments}
                    onChange={(e) => handleInputChange('teacherComments', e.target.value)}
                    placeholder="Describe child's academic behaviors (e.g. 'Easily distracted', 'Slow reader', 'Good verbal skills', 'Difficulty completing work', 'Excellent participation')...."
                    disabled={isFormCompleted}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Subject Struggles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Academic Struggles Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Struggles in Languages */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold block text-blue-900 border-b border-border pb-1">Struggles in Languages</Label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      { name: 'Reading', value: 'Reading' },
                      { name: 'Writing', value: 'Writing' },
                      { name: 'Spelling', value: 'Spelling' },
                      { name: 'Grammar', value: 'Grammar' },
                      { name: 'Vocabulary', value: 'Vocabulary' },
                      { name: 'Reading Comprehension', value: 'Reading Comprehension' },
                      { name: 'Speaking', value: 'Speaking' },
                      { name: 'Listening', value: 'Listening' },
                      { name: 'None', value: 'None' }
                    ].map((item) => (
                      <div key={item.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`langStruggle-${item.value}`}
                          checked={formData.languageStruggles?.includes(item.value)}
                          onCheckedChange={(checked) => handleCheckboxGroupChange('languageStruggles', item.value, checked as boolean)}
                          disabled={isFormCompleted}
                        />
                        <Label htmlFor={`langStruggle-${item.value}`} className="font-normal cursor-pointer select-none">{item.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Struggles in Mathematics */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold block text-blue-900 border-b border-border pb-1">Struggles in Mathematics</Label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {[
                      { name: 'Arithmetic', value: 'Arithmetic' },
                      { name: 'Word Problems', value: 'Word Problems' },
                      { name: 'Number Sense', value: 'Number Sense' },
                      { name: 'Calculations', value: 'Calculations' },
                      { name: 'Geometry', value: 'Geometry' },
                      { name: 'Time & Money', value: 'Time/Money' },
                      { name: 'Math Facts', value: 'Math Facts' },
                      { name: 'None', value: 'None' }
                    ].map((item) => (
                      <div key={item.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`mathStruggle-${item.value}`}
                          checked={formData.mathStruggles?.includes(item.value)}
                          onCheckedChange={(checked) => handleCheckboxGroupChange('mathStruggles', item.value, checked as boolean)}
                          disabled={isFormCompleted}
                        />
                        <Label htmlFor={`mathStruggle-${item.value}`} className="font-normal cursor-pointer select-none">{item.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 5: Learning Strengths & Previous Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Strengths & Support Profiles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Learning Strengths */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold block text-blue-900 border-b border-border pb-1">Learning Strengths</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                    {[
                      'Reading', 'Mathematics', 'Art', 'Music', 'Sports',
                      'Creativity', 'Logical Thinking', 'Communication', 'Problem Solving',
                      'Leadership', 'Technology'
                    ].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`strength-${item}`}
                          checked={formData.learningStrengths?.includes(item)}
                          onCheckedChange={(checked) => handleCheckboxGroupChange('learningStrengths', item, checked as boolean)}
                          disabled={isFormCompleted}
                        />
                        <Label htmlFor={`strength-${item}`} className="font-normal cursor-pointer select-none">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Areas Requiring Support */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <Label className="text-sm font-semibold block text-blue-900 border-b border-border pb-1">Areas Requiring Support</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                    {[
                      'Reading Fluency', 'Reading Comprehension', 'Writing', 'Spelling',
                      'Handwriting', 'Mathematics', 'Attention', 'Memory', 'Organization',
                      'Following Instructions', 'Behaviour', 'Communication'
                    ].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`supportArea-${item}`}
                          checked={formData.areasSupport?.includes(item)}
                          onCheckedChange={(checked) => handleCheckboxGroupChange('areasSupport', item, checked as boolean)}
                          disabled={isFormCompleted}
                        />
                        <Label htmlFor={`supportArea-${item}`} className="font-normal cursor-pointer select-none">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Previous Educational Support */}
                <div className="space-y-3 pt-2 border-t border-border/40">
                  <Label className="text-sm font-semibold block text-blue-900 border-b border-border pb-1">Previous Educational Support</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                    {[
                      { name: 'None', value: 'None' },
                      { name: 'Remedial Classes', value: 'Remedial Classes' },
                      { name: 'Special Education', value: 'Special Education' },
                      { name: 'Resource Room', value: 'Resource Room' },
                      { name: 'Tuition', value: 'Tuition' },
                      { name: 'Shadow Teacher', value: 'Shadow Teacher' },
                      { name: 'Occupational Therapy', value: 'Occupational Therapy' },
                      { name: 'Speech Therapy', value: 'Speech Therapy' }
                    ].map((item) => (
                      <div key={item.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`prevSupport-${item.value}`}
                          checked={formData.previousSupport?.includes(item.value)}
                          onCheckedChange={(checked) => handleCheckboxGroupChange('previousSupport', item.value, checked as boolean)}
                          disabled={isFormCompleted}
                        />
                        <Label htmlFor={`prevSupport-${item.value}`} className="font-normal cursor-pointer select-none">{item.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

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
                  <p className="truncate"><span className="font-medium">Age:</span> {formData.chronologicalAge || (formData.age ? `${formData.age} yrs` : '-')}</p>
                  <p className="truncate"><span className="font-medium">Gender:</span> {formData.gender || '-'}</p>
                  <p className="truncate"><span className="font-medium">Class:</span> {formData.class || '-'}</p>
                  <p className="truncate"><span className="font-medium">Syllabus:</span> {formData.syllabus || '-'}</p>
                  <p className="truncate"><span className="font-medium">Instruction:</span> {formData.mediumOfInstruction || '-'}</p>
                  <p className="truncate"><span className="font-medium">Attendance:</span> {formData.schoolAttendance || '-'}</p>
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
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-2">
          {/* Row 1 - Child Selector */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm font-medium text-foreground whitespace-nowrap flex-shrink-0">Child:</span>
            {selectedStudentId ? (
              <div
                className="flex items-center gap-3 bg-primary/10 px-3 py-2 rounded-lg border border-primary/20 flex-1 min-w-0 max-w-xs cursor-pointer hover:bg-primary/15 transition-colors"
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
                <Users className="h-4 w-4 flex-shrink-0 text-primary" />
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowStudentModal(true)}
                className="flex items-center gap-2 px-4 py-2 h-9"
                disabled={isFormCompleted}
              >
                <Users className="h-4 w-4" />
                {t('intake.selectStudentHeader')}
              </Button>
            )}
          </div>

          {/* Row 2 - Status and Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Indicator */}
            {intakeForm?.status === 'COMPLETED' ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-foreground rounded-full text-xs font-medium flex-shrink-0">
                <CheckCircle className="h-3.5 w-3.5" />
                {t('iep.statusCompleted')}
              </div>
            ) : hasUnsavedChanges ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 text-amber-800 rounded-full text-xs font-medium flex-shrink-0">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t('profile.cancel')}
              </div>
            ) : intakeForm ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex-shrink-0">
                <Clock className="h-3.5 w-3.5" />
                {t('educator.sidebar.iepInProgress')}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted text-muted-foreground rounded-full text-xs font-medium flex-shrink-0">
                <FileText className="h-3.5 w-3.5" />
                {t('intake.newForm')}
              </div>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-border flex-shrink-0" />

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                onClick={handleSaveDraft}
                variant="outline"
                size="sm"
                className="rounded-md px-3 py-1.5 h-8 text-xs"
                disabled={!selectedStudentId || isCreating || isUpdating || isFormCompleted}
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                {t('lessonPlans.generatePlan')}
              </Button>

              {/* AI Profile Button */}
              {selectedStudentId && (
                <Link href={`/educator/intake/ai-profile?studentId=${selectedStudentId}`}>
                  <Button
                    id="view-ai-profile-btn"
                    variant="outline"
                    size="sm"
                    className="rounded-md px-3 py-1.5 h-8 text-xs border-violet-500/40 text-violet-600 hover:bg-violet-50 hover:border-violet-500"
                  >
                    <Brain className="h-3.5 w-3.5 mr-1.5" />
                    AI Profile
                  </Button>
                </Link>
              )}

              <Button
                onClick={handleSubmit}
                size="sm"
                className="rounded-md px-3 py-1.5 h-8 text-xs"
                disabled={!selectedStudentId || isSubmitting || isFormCompleted || !isFormComplete()}
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    {t('intake.saving')}
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                    Submit & Lock
                  </>
                )}
              </Button>

              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="rounded-md px-3 py-1.5 h-8 text-xs"
                disabled={!selectedStudentId}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                PDF
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
                className="rounded-md px-3 py-1.5 h-8 text-xs"
                disabled={isFormCompleted}
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload Excel
              </Button>
              <Button
                onClick={() => setShowExcelPreview(true)}
                variant="ghost"
                size="sm"
                className="rounded-md px-2 py-1.5 h-8"
                title="View expected Excel format"
              >
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
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
                {t('intake.noStudentSelected')}
              </CardTitle>
              <p className="text-muted-foreground mt-2 text-base">
                {t('intake.noStudentSelectedDesc')}
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
                      width: `${(TABS_IDS.indexOf(activeTab as any) / (TABS_IDS.length - 1)) * 100}%`
                    }}
                  />
                </div>

                {/* Tab Icons */}
                <div className="relative z-10 flex justify-between items-center">
                  {TABS_IDS.map((tabId, index) => {
                    const Icon = TAB_ICONS[tabId];
                    const status = getTabStatus(tabId);
                    const isActive = activeTab === tabId;
                    const isCompleted = status === 'completed';

                    return (
                      <div key={tabId} className="flex flex-col items-center group">
                        <button
                          onClick={() => setActiveTab(tabId)}
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
                            {t(`intake.${tabId}`)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 max-w-20 leading-tight h-8 flex items-start justify-center">
                            {t(`intake.${tabId === 'demographics' ? 'studentInfoDesc' : tabId === 'family' ? 'familyBackgroundDesc' : tabId === 'prenatal' ? 'birthDevelopmentDesc' : tabId === 'postnatal' ? 'postBirthDesc' : tabId === 'medical' ? 'healthMedicalDesc' : tabId === 'educational' ? 'academicBackgroundDesc' : 'reviewSubmitDesc'}`)}
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
                  {React.createElement(TAB_ICONS[activeTab as TabId] || User, { className: "h-5 w-5" })}
                  {t(`intake.${activeTab}`)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t(`intake.${activeTab === 'demographics' ? 'studentInfoDesc' : activeTab === 'family' ? 'familyBackgroundDesc' : activeTab === 'prenatal' ? 'birthDevelopmentDesc' : activeTab === 'postnatal' ? 'postBirthDesc' : activeTab === 'medical' ? 'healthMedicalDesc' : activeTab === 'educational' ? 'academicBackgroundDesc' : 'reviewSubmitDesc'}`)}
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
        selectedStudentId={selectedStudentId ?? undefined}
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