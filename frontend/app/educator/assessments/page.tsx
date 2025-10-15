'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAssessments } from '@/hooks/useAssessments';
import { useEducatorStudents } from '@/hooks/useSpecialEducator';

// Type definitions for assessment data
interface AssessmentFormData {
  [key: string]: any; // Index signature for dynamic key access
  studentId: string;
  assessmentType: string;
  // Reading
  readingObservations: string;
  readingLevel: string;
  readingFiles: File[];
  readingQ1: string; // Is the child reading at grade level?
  readingQ2: string; // Can the child decode unfamiliar words?
  readingQ3: string; // Can the child answer comprehension questions?
  // Writing
  writingObservations: string;
  writingLevel: string;
  writingFiles: File[];
  writingQ1: string; // Can the child write legibly?
  writingQ2: string; // Does the child use proper letter formation?
  writingQ3: string; // Can the child compose sentences?
  // Math
  mathObservations: string;
  mathLevel: string;
  mathFiles: File[];
  mathQ1: string; // Does the child understand number concepts?
  mathQ2: string; // Can the child perform basic operations?
  mathQ3: string; // Can the child solve word problems?
  // Visual Perception
  vpObservations: string;
  vpLevel: string;
  vpFiles: File[];
  vpQ1: string; // Can the child copy shapes accurately?
  vpQ2: string; // Does the child show spatial awareness?
  vpQ3: string; // Can the child complete puzzles?
  // Motor Skills
  motorObservations: string;
  motorLevel: string;
  motorFiles: File[];
  motorQ1: string; // Fine motor control (pencil grip, cutting)?
  motorQ2: string; // Gross motor skills (balance, coordination)?
  motorQ3: string; // Can the child tie shoes/buttons?
  // Attention
  attentionObservations: string;
  attentionLevel: string;
  attentionFiles: File[];
  attentionQ1: string; // Can the child focus on tasks?
  attentionQ2: string; // How long can the child sustain attention?
  attentionQ3: string; // Does the child get easily distracted?
}

interface SkillDomain {
  id: string;
  title: string;
  icon: any;
  color: string;
  description: string;
}
// Use route-level UnifiedLayout; remove page-level EducatorLayout
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { 
  ArrowLeft, 
  Brain,
  BookOpen,
  PenTool,
  Calculator,
  Eye,
  Zap,
  Upload,
  Save,
  Send,
  FileText,
  Plus
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import Link from 'next/link';

const SKILL_DOMAINS: SkillDomain[] = [
  {
    id: 'reading',
    title: 'Reading',
    icon: BookOpen,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    description: 'Phonemic awareness, decoding, comprehension'
  },
  {
    id: 'writing',
    title: 'Writing',
    icon: PenTool,
    color: 'bg-green-50 text-green-600 border-green-200',
    description: 'Handwriting, composition, spelling'
  },
  {
    id: 'math',
    title: 'Math',
    icon: Calculator,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    description: 'Number sense, operations, problem solving'
  },
  {
    id: 'vp',
    title: 'Visual Perception',
    icon: Eye,
    color: 'bg-orange-50 text-orange-600 border-orange-200',
    description: 'Visual processing, spatial awareness'
  },
  {
    id: 'motor',
    title: 'Motor Skills',
    icon: Zap,
    color: 'bg-red-50 text-red-600 border-red-200',
    description: 'Fine and gross motor coordination'
  },
  {
    id: 'attention',
    title: 'Attention',
    icon: Brain,
    color: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    description: 'Focus, concentration, task persistence'
  }
];

export default function AssessmentsPage() {
  const searchParams = useSearchParams();
  const studentIdFromParams = searchParams.get('studentId') || undefined;
  
  // Student selection state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(studentIdFromParams || '');
  const [studentSearch, setStudentSearch] = useState<string>('');
  
  const [selectedDomain, setSelectedDomain] = useState<string>('reading');
  const [assessmentData, setAssessmentData] = useState<AssessmentFormData>({
    studentId: selectedStudentId,
    assessmentType: 'Initial',
    // Reading
    readingObservations: '',
    readingLevel: '',
    readingFiles: [],
    readingQ1: '',
    readingQ2: '',
    readingQ3: '',
    // Writing
    writingObservations: '',
    writingLevel: '',
    writingFiles: [],
    writingQ1: '',
    writingQ2: '',
    writingQ3: '',
    // Math
    mathObservations: '',
    mathLevel: '',
    mathFiles: [],
    mathQ1: '',
    mathQ2: '',
    mathQ3: '',
    // Visual Perception
    vpObservations: '',
    vpLevel: '',
    vpFiles: [],
    vpQ1: '',
    vpQ2: '',
    vpQ3: '',
    // Motor Skills
    motorObservations: '',
    motorLevel: '',
    motorFiles: [],
    motorQ1: '',
    motorQ2: '',
    motorQ3: '',
    // Attention
    attentionObservations: '',
    attentionLevel: '',
    attentionFiles: [],
    attentionQ1: '',
    attentionQ2: '',
    attentionQ3: ''
  });

  // Function to reset form to initial state
  const resetForm = (studentId?: string) => {
    // Check if student has completed initial assessment
    const currentStudentId = studentId || selectedStudentId || '';
    const studentAssessments = assessments?.filter((assessment: any) => assessment.studentId === currentStudentId);
    const hasCompletedInitial = studentAssessments?.some((assessment: any) => 
      assessment.assessmentType === 'Initial' && assessment.status === 'COMPLETED'
    );
    
    setAssessmentData({
      studentId: currentStudentId,
      assessmentType: hasCompletedInitial ? 'Reassessment' : 'Initial',
      // Reading
      readingObservations: '',
      readingLevel: '',
      readingFiles: [],
      readingQ1: '',
      readingQ2: '',
      readingQ3: '',
      // Writing
      writingObservations: '',
      writingLevel: '',
      writingFiles: [],
      writingQ1: '',
      writingQ2: '',
      writingQ3: '',
      // Math
      mathObservations: '',
      mathLevel: '',
      mathFiles: [],
      mathQ1: '',
      mathQ2: '',
      mathQ3: '',
      // Visual Perception
      vpObservations: '',
      vpLevel: '',
      vpFiles: [],
      vpQ1: '',
      vpQ2: '',
      vpQ3: '',
      // Motor Skills
      motorObservations: '',
      motorLevel: '',
      motorFiles: [],
      motorQ1: '',
      motorQ2: '',
      motorQ3: '',
      // Attention
      attentionObservations: '',
      attentionLevel: '',
      attentionFiles: [],
      attentionQ1: '',
      attentionQ2: '',
      attentionQ3: ''
    });
    // Reset to first domain tab
    setSelectedDomain('reading');
  };

  // Fetch students and assessments
  const { students, isLoading: isLoadingStudents } = useEducatorStudents({ 
    limit: 100, 
    search: studentSearch 
  });
  const { assessments, history, createAssessment, updateAssessment, isCreating, isUpdating, isLoadingHistory } = useAssessments(selectedStudentId, resetForm);

  // Update assessment data when student is selected and reset form
  useEffect(() => {
    if (selectedStudentId) {
      resetForm(selectedStudentId);
    }
  }, [selectedStudentId]);

  // Check if initial assessment exists for reassessment validation
  const hasInitialAssessment = assessments?.some((assessment: any) => 
    assessment.assessmentType === 'Initial' && assessment.status === 'COMPLETED'
  );

  // Get latest initial assessment for comparison
  const latestInitialAssessment = assessments?.find((assessment: any) => 
    assessment.assessmentType === 'Initial' && assessment.status === 'COMPLETED'
  );

  // Helper function to determine if there's improvement between levels
  const isImprovement = (currentLevel: string, previousLevel: string): boolean => {
    if (!currentLevel || !previousLevel) return false;
    
    // Define level hierarchies (higher index = better)
    const levelHierarchies = [
      // Reading levels
      ['2+ Levels Below', '1 Level Below', 'Yes'],
      // Yes/Help/No pattern
      ['No', 'With Help', 'Yes'],
      ['Not Yet', 'With Help', 'Yes'],
      ['Not Yet', 'Partially', 'Yes'],
      ['No', 'Partially', 'Yes'],
      ['No', 'Sometimes', 'Yes'],
      // Quality levels
      ['Poor', 'Fair', 'Good'],
      // Frequency levels
      ['Rarely', 'Sometimes', 'Always'],
      // Independence levels
      ['Not Yet', 'With Help', 'Independently'],
      ['No', 'Learning', 'Yes'],
      // Effort levels
      ['No', 'With Effort', 'Yes'],
      ['No', 'With Difficulty', 'Yes'],
      // Comprehension levels
      ['Not Yet', 'Partially', 'Fully'],
      // Visual perception levels
      ['Struggles', 'Below Level', 'Age Appropriate']
    ];

    // Find which hierarchy applies to these levels
    for (const hierarchy of levelHierarchies) {
      const currentIndex = hierarchy.indexOf(currentLevel);
      const previousIndex = hierarchy.indexOf(previousLevel);
      
      if (currentIndex !== -1 && previousIndex !== -1) {
        return currentIndex > previousIndex;
      }
    }
    
    // If no hierarchy matches, consider any change as potential improvement
    return currentLevel !== previousLevel;
  };

  // Progress comparison function
  const getProgressComparison = (domain: string) => {
    if (!latestInitialAssessment || assessmentData.assessmentType !== 'Reassessment') {
      return null;
    }

    const currentLevel = assessmentData[`${domain}Level`];
    const previousLevel = latestInitialAssessment[`${domain}Level`];
    const currentObservations = assessmentData[`${domain}Observations`];
    const previousObservations = latestInitialAssessment[`${domain}Observations`];

    if (!previousLevel && !previousObservations) return null;

    return {
      previousLevel,
      currentLevel,
      previousObservations,
      currentObservations,
      hasImprovement: isImprovement(currentLevel, previousLevel)
    };
  };

  const handleInputChange = (field: string, value: any): void => {
    setAssessmentData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (domain: string, files: FileList | null): void => {
    if (files) {
      const fileArray = Array.from(files);
      handleInputChange(`${domain}Files`, fileArray);
    }
  };

  const transformDataForBackend = (data: AssessmentFormData) => {
    // Transform frontend format to backend format
    const backendData = {
      studentId: data.studentId,
      assessmentType: data.assessmentType,
      // Reading
      readingObservations: data.readingObservations,
      readingLevel: `Q1: ${data.readingQ1 || 'Not answered'} | Q2: ${data.readingQ2 || 'Not answered'} | Q3: ${data.readingQ3 || 'Not answered'}`,
      readingFiles: [], // File handling would need to be implemented separately
      // Writing
      writingObservations: data.writingObservations,
      writingLevel: `Q1: ${data.writingQ1 || 'Not answered'} | Q2: ${data.writingQ2 || 'Not answered'} | Q3: ${data.writingQ3 || 'Not answered'}`,
      writingFiles: [],
      // Math
      mathObservations: data.mathObservations,
      mathLevel: `Q1: ${data.mathQ1 || 'Not answered'} | Q2: ${data.mathQ2 || 'Not answered'} | Q3: ${data.mathQ3 || 'Not answered'}`,
      mathFiles: [],
      // Visual Perception
      vpObservations: data.vpObservations,
      vpLevel: `Q1: ${data.vpQ1 || 'Not answered'} | Q2: ${data.vpQ2 || 'Not answered'} | Q3: ${data.vpQ3 || 'Not answered'}`,
      vpFiles: [],
      // Motor Skills
      motorObservations: data.motorObservations,
      motorLevel: `Q1: ${data.motorQ1 || 'Not answered'} | Q2: ${data.motorQ2 || 'Not answered'} | Q3: ${data.motorQ3 || 'Not answered'}`,
      motorFiles: [],
      // Attention
      attentionObservations: data.attentionObservations,
      attentionLevel: `Q1: ${data.attentionQ1 || 'Not answered'} | Q2: ${data.attentionQ2 || 'Not answered'} | Q3: ${data.attentionQ3 || 'Not answered'}`,
      attentionFiles: []
    };
    return backendData;
  };

  const handleSaveDraft = (): void => {
    if (!selectedStudentId) {
      toast({
        title: "No Student Selected",
        description: "Please select a student before saving the assessment.",
        variant: "destructive"
      });
      return;
    }
    
    const transformedData = transformDataForBackend(assessmentData);
    createAssessment(transformedData);
  };

  // Form validation function
  const validateForm = (): { isValid: boolean; missingFields: string[] } => {
    const missingFields: string[] = [];
    
    // Check if student is selected
    if (!selectedStudentId) {
      missingFields.push('Student selection');
    }
    
    // Check each domain for required fields
    SKILL_DOMAINS.forEach(domain => {
      const domainKey = domain.id;
      const hasQuestions = assessmentData[`${domainKey}Q1`] && 
                          assessmentData[`${domainKey}Q2`] && 
                          assessmentData[`${domainKey}Q3`];
      const hasObservations = assessmentData[`${domainKey}Observations`]?.trim();
      
      if (!hasQuestions) {
        missingFields.push(`${domain.title} - Assessment Questions`);
      }
      if (!hasObservations) {
        missingFields.push(`${domain.title} - Observations`);
      }
    });
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  const handleSubmit = (): void => {
    const validation = validateForm();
    
    if (!validation.isValid) {
      // Show validation error
      toast({
        title: "Assessment Incomplete",
        description: `Please complete the following required fields:\n${validation.missingFields.map(field => `• ${field}`).join('\n')}`,
        variant: "destructive"
      });
      return;
    }
    
    const transformedData = transformDataForBackend(assessmentData);
    const submitData = { ...transformedData, status: 'COMPLETED' };
    createAssessment(submitData);
  };

  const renderDomainAssessment = (domain: SkillDomain) => {
    const domainKey = domain.id;
    const observationsKey = `${domainKey}Observations`;
    const levelKey = `${domainKey}Level`;
    const filesKey = `${domainKey}Files`;

    // Domain-specific questions
    const getQuestions = () => {
      switch (domainKey) {
        case 'reading':
          return [
            { question: 'Is the child reading at grade level?', options: ['Yes', '1 Level Below', '2+ Levels Below'] },
            { question: 'Can the child decode unfamiliar words?', options: ['Yes', 'With Help', 'No'] },
            { question: 'Can the child answer comprehension questions?', options: ['Fully', 'Partially', 'Not Yet'] }
          ];
        case 'writing':
          return [
            { question: 'Can the child write legibly?', options: ['Yes', 'With Effort', 'No'] },
            { question: 'Does the child use proper letter formation?', options: ['Always', 'Sometimes', 'Rarely'] },
            { question: 'Can the child compose sentences?', options: ['Independently', 'With Help', 'Not Yet'] }
          ];
        case 'math':
          return [
            { question: 'Does the child understand number concepts?', options: ['Yes', 'Partially', 'No'] },
            { question: 'Can the child perform basic operations?', options: ['Yes', 'With Help', 'No'] },
            { question: 'Can the child solve word problems?', options: ['Yes', 'Sometimes', 'No'] }
          ];
        case 'vp':
          return [
            { question: 'Can the child copy shapes accurately?', options: ['Yes', 'With Difficulty', 'No'] },
            { question: 'Does the child show spatial awareness?', options: ['Good', 'Fair', 'Poor'] },
            { question: 'Can the child complete puzzles?', options: ['Age Appropriate', 'Below Level', 'Struggles'] }
          ];
        case 'motor':
          return [
            { question: 'Fine motor control (pencil grip, cutting)?', options: ['Good', 'Fair', 'Poor'] },
            { question: 'Gross motor skills (balance, coordination)?', options: ['Good', 'Fair', 'Poor'] },
            { question: 'Can the child tie shoes/buttons?', options: ['Yes', 'Learning', 'No'] }
          ];
        case 'attention':
          return [
            { question: 'Can the child focus on tasks?', options: ['Good Focus', 'Moderate', 'Poor Focus'] },
            { question: 'How long can the child sustain attention?', options: ['15+ minutes', '5-15 minutes', '<5 minutes'] },
            { question: 'Does the child get easily distracted?', options: ['Rarely', 'Sometimes', 'Often'] }
          ];
        default:
          return [];
      }
    };

    // Get progress comparison for this domain
    const progressComparison = getProgressComparison(domainKey);

    return (
      <div className="space-y-6">
        {/* Progress Comparison (for Reassessments) */}
        {progressComparison && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
                📊 Progress Comparison - {domain.title}
              </CardTitle>
              <p className="text-sm text-blue-700">
                Comparing with Initial Assessment from{' '}
                {new Date(latestInitialAssessment.completedAt || latestInitialAssessment.createdAt).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {progressComparison.previousLevel && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-blue-900">Previous Level</Label>
                    <div className="p-2 bg-white rounded border">
                      <p className="text-sm">{progressComparison.previousLevel}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-blue-900">Current Level</Label>
                    <div className="p-2 bg-white rounded border">
                      <p className="text-sm">{progressComparison.currentLevel || 'Not yet assessed'}</p>
                    </div>
                  </div>
                </div>
              )}
              {progressComparison.previousObservations && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-blue-900">Previous Observations</Label>
                  <div className="p-3 bg-white rounded border">
                    <p className="text-sm text-gray-700">{progressComparison.previousObservations}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Structured Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assessment Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {getQuestions().map((q, index) => {
              const questionKey = `${domainKey}Q${index + 1}`;
              return (
                <div key={index} className="space-y-2">
                  <Label className="text-sm font-medium">{q.question}</Label>
                  <Select 
                    value={assessmentData[questionKey] || ''} 
                    onValueChange={(value) => handleInputChange(questionKey, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select response" />
                    </SelectTrigger>
                    <SelectContent>
                      {q.options.map((option) => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Observations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Observations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor={`${domainKey}-observations`}>
                Educator's observations on {domain.title.toLowerCase()} skills
              </Label>
              <Textarea
                id={`${domainKey}-observations`}
                value={assessmentData[observationsKey] || ''}
                onChange={(e) => handleInputChange(observationsKey, e.target.value)}
                placeholder={`Describe the child's ${domain.title.toLowerCase()} abilities, challenges, and specific observations...`}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Worksheets</CardTitle>
            <p className="text-sm text-gray-600">
              Upload supporting worksheets, samples, or evidence (PDF, PNG, JPG)
            </p>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Drag & drop files here, or click to browse
                </p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileUpload(domainKey, e.target.files)}
                  className="hidden"
                  id={`${domainKey}-files`}
                />
                <Label htmlFor={`${domainKey}-files`} className="cursor-pointer">
                  <Button variant="outline" size="sm" type="button">
                    Browse Files
                  </Button>
                </Label>
              </div>
            </div>
            
            {assessmentData[filesKey] && assessmentData[filesKey].length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Selected Files:</p>
                <div className="space-y-1">
                  {assessmentData[filesKey].map((file: File, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{file.name}</span>
                      <span className="text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <Link href="/educator/students">
            <Button variant="ghost" size="sm" className="mb-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Student Assessment</h1>
          <p className="text-sm text-gray-600">Comprehensive skill evaluation</p>
        </div>

        {/* Student Selection */}
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="studentSearch" className="text-sm font-medium">Search Students</Label>
              <Input
                id="studentSearch"
                placeholder="Search by name..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="studentSelect" className="text-sm font-medium">Select Student</Label>
              <Select 
                value={selectedStudentId} 
                onValueChange={(value) => {
                  // Prevent selection of disabled values
                  if (value !== 'loading' && value !== 'no-students') {
                    setSelectedStudentId(value);
                  }
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Choose a student..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingStudents ? (
                    <SelectItem value="loading" disabled>Loading students...</SelectItem>
                  ) : students.length === 0 ? (
                    <SelectItem value="no-students" disabled>No students found</SelectItem>
                  ) : (
                    students
                      .filter((student: any) => 
                        student.fullName.toLowerCase().includes(studentSearch.toLowerCase())
                      )
                      .map((student: any) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.fullName} - Grade {student.grade}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Assessment Type Selection */}
        {selectedStudentId && (
          <div className="p-4 border-b border-gray-200">
            <div className="space-y-3">
              <Label htmlFor="assessmentType" className="text-sm font-medium">Assessment Type</Label>
              <Select 
                value={assessmentData.assessmentType} 
                onValueChange={(value) => handleInputChange('assessmentType', value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem 
                    value="Initial" 
                    disabled={hasInitialAssessment}
                  >
                    Initial Assessment
                    {hasInitialAssessment && ' (Already Completed)'}
                  </SelectItem>
                  <SelectItem 
                    value="Reassessment" 
                    disabled={!hasInitialAssessment}
                  >
                    Reassessment
                    {!hasInitialAssessment && ' (Requires Initial)'}
                  </SelectItem>
                </SelectContent>
              </Select>
              {!hasInitialAssessment && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Complete Initial Assessment first
                </p>
              )}
              {hasInitialAssessment && assessmentData.assessmentType === 'Reassessment' && (
                <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  ✓ Initial Assessment completed - Conducting Reassessment
                </p>
              )}
              {assessmentData.assessmentType === 'Reassessment' && latestInitialAssessment && (
                <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  📊 Comparing with Initial from{' '}
                  {new Date(latestInitialAssessment.completedAt || latestInitialAssessment.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Assessment History */}
        {selectedStudentId && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Assessment History</span>
              {history && (
                <span className="text-xs text-gray-500">
                  ({history.totalAssessments} total, {history.completedAssessments} completed)
                </span>
              )}
            </div>
            
            {isLoadingHistory ? (
              <div className="text-xs text-gray-500">Loading assessment history...</div>
            ) : history && history.assessments.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {history.assessments.map((assessment: any, index: number) => (
                  <div key={assessment.id} className="p-2 border rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          assessment.status === 'COMPLETED' ? 'bg-green-500' : 
                          assessment.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium">
                          {assessment.assessmentType}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs py-0 px-1 ml-2">
                        {assessment.status === 'COMPLETED' ? 'Done' : 
                         assessment.status === 'IN_PROGRESS' ? 'In Progress' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-gray-500">
                      {assessment.completedAt 
                        ? new Date(assessment.completedAt).toLocaleDateString()
                        : new Date(assessment.createdAt).toLocaleDateString()
                      }
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                No assessment history found for this student.
              </div>
            )}
            
            {history && (history.hasSuccessfulAssessments || history.hasDrafts) && (
              <div className="mt-2 flex gap-2 text-xs">
                {history.hasSuccessfulAssessments && (
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                    ✓ Has completed assessments
                  </span>
                )}
                {history.hasDrafts && (
                  <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                    📝 Has drafts/in-progress
                  </span>
                )}
              </div>
            )}
          </div>
        )}


      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with Actions */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              {selectedStudentId && students.find((s: any) => s.id === selectedStudentId) && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {students.find((s: any) => s.id === selectedStudentId)?.fullName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Grade {students.find((s: any) => s.id === selectedStudentId)?.grade} • {assessmentData.assessmentType} Assessment
                  </p>
                </div>
              )}
              {!selectedStudentId && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Select a Student</h2>
                  <p className="text-sm text-gray-600">Choose a student from the sidebar to begin assessment</p>
                </div>
              )}
            </div>
            {selectedStudentId && (
              <div className="flex items-center gap-2">
                <Button onClick={handleSaveDraft} variant="outline" disabled={isCreating || isUpdating} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={handleSubmit} disabled={isCreating || isUpdating} size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Assessment
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Assessment Content */}
        {selectedStudentId ? (
          <div className="flex-1 overflow-y-auto">
            {/* Tabbed Interface for Domains */}
            <Card className="h-full flex flex-col">
              <CardContent className="p-0 flex-1 flex flex-col">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-6 px-6 overflow-x-auto" aria-label="Tabs">
                    {SKILL_DOMAINS.map((domain) => {
                      const Icon = domain.icon;
                      const isSelected = selectedDomain === domain.id;
                      const hasLevel = assessmentData[`${domain.id}Q1`] || assessmentData[`${domain.id}Q2`] || assessmentData[`${domain.id}Q3`];
                      const hasObservations = assessmentData[`${domain.id}Observations`];
                      const hasFiles = assessmentData[`${domain.id}Files`]?.length > 0;
                      const fileCount = assessmentData[`${domain.id}Files`]?.length || 0;
                      const isComplete = hasLevel && hasObservations;
                      const progressComparison = getProgressComparison(domain.id);
                      
                      return (
                        <button
                          key={domain.id}
                          onClick={() => setSelectedDomain(domain.id)}
                          className={`${
                            isSelected
                              ? 'border-blue-500 text-blue-600 bg-blue-50'
                              : isComplete
                                ? 'border-transparent text-green-700 hover:text-green-800 hover:border-green-300 bg-green-50'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          } whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm flex flex-col items-center gap-1 transition-all min-w-[100px] relative`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="text-xs">{domain.title}</span>
                          </div>
                          
                          {/* Progress Indicators */}
                          <div className="flex items-center gap-1 text-xs">
                            {/* Completion Status */}
                            {isComplete ? (
                              <span className="text-green-600 font-medium">✓ Complete</span>
                            ) : hasLevel || hasObservations ? (
                              <span className="text-yellow-600 font-medium">⚠ Partial</span>
                            ) : (
                              <span className="text-gray-400">○ Pending</span>
                            )}
                            
                            {/* File Count */}
                            {fileCount > 0 && (
                              <span className="text-blue-600 ml-1">📎{fileCount}</span>
                            )}
                          </div>
                          
                          {/* Improvement Indicator for Reassessments */}
                          {progressComparison && progressComparison.hasImprovement && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">↗</span>
                            </div>
                          )}
                          
                          {/* Progress Bar */}
                          <div className="w-full h-1 bg-gray-200 rounded-full mt-1">
                            <div 
                              className={`h-1 rounded-full transition-all duration-300 ${
                                isComplete 
                                  ? 'bg-green-500' 
                                  : hasLevel || hasObservations 
                                    ? 'bg-yellow-500' 
                                    : 'bg-gray-300'
                              }`}
                              style={{
                                width: isComplete ? '100%' : (hasLevel || hasObservations) ? '50%' : '0%'
                              }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <motion.div
                    key={selectedDomain}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {(() => {
                      const selectedDomainData = SKILL_DOMAINS.find(d => d.id === selectedDomain);
                      return selectedDomainData ? renderDomainAssessment(selectedDomainData) : null;
                    })()}
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Student Selected</h3>
              <p className="text-gray-600 max-w-sm">
                Please select a student from the sidebar to begin conducting an assessment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>

  );
}
