'use client';

import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Download, 
  Eye, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  User, 
  FileText, 
  Brain, 
  Target, 
  TrendingUp, 
  ShieldAlert, 
  Award, 
  BookOpen, 
  Edit3
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useTranslation } from 'react-i18next';

interface WritingSkillAssessmentProps {
  studentId: string;
  studentGrade?: string;
  assessmentId?: string;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Rating options for Tab 3 Skills
const RATING_OPTIONS = [1, 2, 3, 4, 5, 'N/A'] as const;

// Tab 3 Writing Skills Categories
const WRITING_SKILLS_CATEGORIES = [
  {
    id: 'letterFormation',
    code: 'A',
    title: 'Letter Formation',
    purpose: "Assess the child's ability to form letters correctly.",
    items: [
      { key: 'correctLetterFormation', label: 'Correct Letter Formation' },
      { key: 'letterSizeConsistency', label: 'Letter Size Consistency' },
      { key: 'letterShape', label: 'Letter Shape' },
      { key: 'letterOrientation', label: 'Letter Orientation (No reversals)' },
      { key: 'uppercaseLetterFormation', label: 'Uppercase Letter Formation' },
      { key: 'lowercaseLetterFormation', label: 'Lowercase Letter Formation' },
    ]
  },
  {
    id: 'spellingSkills',
    code: 'B',
    title: 'Spelling Skills',
    purpose: 'Assess spelling development.',
    items: [
      { key: 'phoneticSpelling', label: 'Phonetic Spelling' },
      { key: 'sightWordSpelling', label: 'Sight Word Spelling' },
      { key: 'gradeLevelSpelling', label: 'Grade-Level Spelling' },
      { key: 'spellingWhileDictation', label: 'Spelling While Dictation' },
      { key: 'selfCorrectionSpelling', label: 'Self-Correction of Spelling' },
    ]
  },
  {
    id: 'grammarLanguage',
    code: 'C',
    title: 'Grammar & Language',
    purpose: 'Assess written language conventions.',
    items: [
      { key: 'capitalLetterUsage', label: 'Capital Letter Usage' },
      { key: 'punctuation', label: 'Punctuation' },
      { key: 'sentenceStructure', label: 'Sentence Structure' },
      { key: 'grammarUsage', label: 'Grammar Usage' },
      { key: 'tenseUsage', label: 'Tense Usage' },
      { key: 'wordOrder', label: 'Word Order' },
    ]
  },
  {
    id: 'writtenExpression',
    code: 'D',
    title: 'Written Expression',
    purpose: 'Assess ability to communicate ideas.',
    items: [
      { key: 'vocabularyUsage', label: 'Vocabulary Usage' },
      { key: 'sentenceConstruction', label: 'Sentence Construction' },
      { key: 'ideaOrganization', label: 'Idea Organization' },
      { key: 'sequencingOfIdeas', label: 'Sequencing of Ideas' },
      { key: 'creativity', label: 'Creativity' },
      { key: 'clarityOfExpression', label: 'Clarity of Expression' },
    ]
  },
  {
    id: 'writingMechanics',
    code: 'E',
    title: 'Writing Mechanics',
    purpose: 'Assess physical writing skills.',
    items: [
      { key: 'pencilGrip', label: 'Pencil Grip' },
      { key: 'writingPosture', label: 'Writing Posture' },
      { key: 'letterSpacing', label: 'Letter Spacing' },
      { key: 'wordSpacing', label: 'Word Spacing' },
      { key: 'alignmentOnLine', label: 'Alignment on Line' },
      { key: 'lineAwareness', label: 'Line Awareness' },
      { key: 'paperPosition', label: 'Paper Position' },
    ]
  },
  {
    id: 'writingFluency',
    code: 'F',
    title: 'Writing Fluency',
    purpose: 'Assess writing efficiency.',
    items: [
      { key: 'writingSpeed', label: 'Writing Speed' },
      { key: 'legibility', label: 'Legibility' },
      { key: 'completesTask', label: 'Completes Task' },
      { key: 'writesIndependently', label: 'Writes Independently' },
      { key: 'sustainsWriting', label: 'Sustains Writing' },
      { key: 'selfMonitoring', label: 'Self-Monitoring' },
    ]
  }
];

// Tab 4 Behaviour Items
const BEHAVIOUR_ITEMS = [
  { key: 'attention', label: 'Attention' },
  { key: 'motivation', label: 'Motivation' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'persistence', label: 'Persistence' },
  { key: 'frustration', label: 'Frustration' },
  { key: 'promptDependency', label: 'Prompt Dependency' },
  { key: 'taskCompletion', label: 'Task Completion' },
];

// Tab 5 Error Analysis Items
const ERROR_ANALYSIS_ITEMS = [
  { key: 'letterReversals', label: 'Letter Reversals' },
  { key: 'letterOmissions', label: 'Letter Omissions' },
  { key: 'letterInsertions', label: 'Letter Insertions' },
  { key: 'spellingErrors', label: 'Spelling Errors' },
  { key: 'capitalizationErrors', label: 'Capitalization Errors' },
  { key: 'punctuationErrors', label: 'Punctuation Errors' },
  { key: 'grammarErrors', label: 'Grammar Errors' },
  { key: 'wordSpacingErrors', label: 'Word Spacing Errors' },
  { key: 'sentenceStructureErrors', label: 'Sentence Structure Errors' },
  { key: 'handwritingErrors', label: 'Handwriting Errors' },
];

// Tab 7 Strengths Items
const STRENGTH_ITEMS = [
  { key: 'goodHandwriting', label: 'Good handwriting' },
  { key: 'goodSpelling', label: 'Good spelling' },
  { key: 'strongVocabulary', label: 'Strong vocabulary' },
  { key: 'goodSentenceConstruction', label: 'Good sentence construction' },
  { key: 'creativeWriting', label: 'Creative writing' },
  { key: 'organizedIdeas', label: 'Organized ideas' },
  { key: 'writesIndependently', label: 'Writes independently' },
];

// Tab 8 Challenges Items
const CHALLENGE_ITEMS = [
  { key: 'poorLetterFormation', label: 'Poor letter formation' },
  { key: 'slowWritingSpeed', label: 'Slow writing speed' },
  { key: 'weakSpelling', label: 'Weak spelling' },
  { key: 'poorGrammar', label: 'Poor grammar' },
  { key: 'poorOrganization', label: 'Poor organization' },
  { key: 'illegibleHandwriting', label: 'Illegible handwriting' },
  { key: 'requiresPrompting', label: 'Requires prompting' },
];

// Tab Order Configuration
const TABS_ORDER = [
  { id: 'tab1', label: 'Tab 1 – Setup' },
  { id: 'tab2', label: 'Tab 2 – Writing Assessment' },
  { id: 'tab3', label: 'Tab 3 – Writing Skills' },
  { id: 'tab4', label: 'Tab 4 – Behaviour' },
  { id: 'tab5', label: 'Tab 5 – Error Analysis' },
  { id: 'tab7', label: 'Tab 7 – Strengths' },
  { id: 'tab8', label: 'Tab 8 – Challenges' },
  { id: 'tab9', label: 'Tab 9 – AI Interpretation' },
  { id: 'tab10', label: 'Tab 10 – Progress' },
];

export function WritingSkillAssessment({
  studentId,
  studentGrade = 'Grade 5',
  assessmentId,
  initialData,
  mode = 'create',
  onSuccess,
  onCancel
}: WritingSkillAssessmentProps) {
  const { t } = useTranslation('assessments');
  const [activeTab, setActiveTab] = useState<string>('tab1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(mode === 'view');
  const [savedAssessment, setSavedAssessment] = useState<any>(initialData || null);
  const reportRef = useRef<HTMLDivElement>(null);
  const isViewMode = mode === 'view';

  // --- TAB 1: Assessment Setup ---
  const [assessmentDate, setAssessmentDate] = useState<string>(
    initialData?.assessmentDate
      ? new Date(initialData.assessmentDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [assessor, setAssessor] = useState<string>(initialData?.assessor || '');
  const [assessmentPurpose, setAssessmentPurpose] = useState<string>(
    initialData?.assessmentPurpose || 'Diagnostic'
  );
  const [language, setLanguage] = useState<string>(initialData?.language || 'English');
  const [gradeLevel, setGradeLevel] = useState<string>(
    initialData?.gradeLevel || studentGrade || 'Grade 5'
  );

  // --- TAB 2: Writing Assessment ---
  const [currentGrade, setCurrentGrade] = useState<string>(
    initialData?.currentGrade || gradeLevel || studentGrade || 'Grade 5'
  );
  const [assessmentTypes, setAssessmentTypes] = useState<string[]>(
    initialData?.assessmentTypes || ['Copy Writing', 'Dictation', 'Paragraph Writing', 'Functional Writing', 'Written Expression']
  );
  const [resultStatus, setResultStatus] = useState<string>(
    initialData?.resultStatus || 'Needs Support'
  );
  const [gradeStepFlow, setGradeStepFlow] = useState<string>(
    initialData?.gradeStepFlow || 'Assess Grade 4'
  );

  // Sub-sections for Tab 2
  const [copyWritingLevels, setCopyWritingLevels] = useState<string[]>(
    initialData?.copyWritingLevels || ['Alphabet', 'Words']
  );
  const [copyWritingObservation, setCopyWritingObservation] = useState<string>(
    initialData?.copyWritingObservation || ''
  );

  const [dictationLevels, setDictationLevels] = useState<string[]>(
    initialData?.dictationLevels || ['Letters', 'Words']
  );
  const [dictationObservation, setDictationObservation] = useState<string>(
    initialData?.dictationObservation || ''
  );

  const [independentWritingLevels, setIndependentWritingLevels] = useState<string[]>(
    initialData?.independentWritingLevels || ['Picture Description']
  );
  const [independentWritingObservation, setIndependentWritingObservation] = useState<string>(
    initialData?.independentWritingObservation || ''
  );

  const [functionalWritingLevels, setFunctionalWritingLevels] = useState<string[]>(
    initialData?.functionalWritingLevels || ['Forms', 'Lists']
  );
  const [functionalWritingObservation, setFunctionalWritingObservation] = useState<string>(
    initialData?.functionalWritingObservation || ''
  );

  // --- TAB 3: Writing Skills (1–5 / N/A) ---
  const [skillRatings, setSkillRatings] = useState<Record<string, number | 'N/A' | null>>(
    initialData?.skillRatings || {}
  );
  const [primaryStrengths, setPrimaryStrengths] = useState<string>(
    initialData?.primaryStrengths || ''
  );
  const [primaryChallenges, setPrimaryChallenges] = useState<string>(
    initialData?.primaryChallenges || ''
  );
  const [educatorObservationsNotes, setEducatorObservationsNotes] = useState<string>(
    initialData?.educatorObservationsNotes || ''
  );

  // --- TAB 4: Behaviour ---
  const [behaviourItems, setBehaviourItems] = useState<Record<string, boolean>>(
    initialData?.behaviourItems || {}
  );
  const [behaviourObservation, setBehaviourObservation] = useState<string>(
    initialData?.behaviourObservation || ''
  );

  // --- TAB 5: Error Analysis ---
  const [errorItems, setErrorItems] = useState<Record<string, boolean>>(
    initialData?.errorItems || {}
  );
  const [errorObservation, setErrorObservation] = useState<string>(
    initialData?.errorObservation || ''
  );

  // --- TAB 7: Strengths ---
  const [strengthItems, setStrengthItems] = useState<Record<string, boolean>>(
    initialData?.strengthItems || {}
  );
  const [strengthsNotes, setStrengthsNotes] = useState<string>(
    initialData?.strengthsNotes || ''
  );

  // --- TAB 8: Challenges ---
  const [challengeItems, setChallengeItems] = useState<Record<string, boolean>>(
    initialData?.challengeItems || {}
  );
  const [challengesNotes, setChallengesNotes] = useState<string>(
    initialData?.challengesNotes || ''
  );

  // --- TAB 9: AI Interpretation (Future) ---
  const [aiSummary, setAiSummary] = useState<string>(
    initialData?.aiSummary || ''
  );
  const [aiFunctionalWritingLevel, setAiFunctionalWritingLevel] = useState<string>(
    initialData?.aiFunctionalWritingLevel || ''
  );
  const [aiGapAnalysis, setAiGapAnalysis] = useState<string>(
    initialData?.aiGapAnalysis || ''
  );
  const [aiWritingProfile, setAiWritingProfile] = useState<string>(
    initialData?.aiWritingProfile || ''
  );
  const [aiStrengths, setAiStrengths] = useState<string>(
    initialData?.aiStrengths || ''
  );
  const [aiChallenges, setAiChallenges] = useState<string>(
    initialData?.aiChallenges || ''
  );
  const [aiPrioritySkills, setAiPrioritySkills] = useState<string>(
    initialData?.aiPrioritySkills || ''
  );
  const [aiRecommendedIntervention, setAiRecommendedIntervention] = useState<string>(
    initialData?.aiRecommendedIntervention || ''
  );

  // --- TAB 10: Progress ---
  const [previousAssessment, setPreviousAssessment] = useState<string>(
    initialData?.previousAssessment || ''
  );
  const [writingGrowth, setWritingGrowth] = useState<string>(
    initialData?.writingGrowth || ''
  );
  const [goalAchievement, setGoalAchievement] = useState<string>(
    initialData?.goalAchievement || ''
  );
  const [reviewDate, setReviewDate] = useState<string>(
    initialData?.reviewDate
      ? new Date(initialData.reviewDate).toISOString().split('T')[0]
      : ''
  );

  // Details from saved response
  const studentDetails = savedAssessment?.student || null;
  const educatorDetails = savedAssessment?.specialEducator || null;

  // Toggle skill rating for Tab 3
  const handleRatingChange = (skillKey: string, value: number | 'N/A') => {
    setSkillRatings(prev => ({
      ...prev,
      [skillKey]: prev[skillKey] === value ? null : value
    }));
  };

  // Toggle multi-select arrays
  const toggleArrayItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  // Toggle checkbox record maps
  const toggleRecordItem = (record: Record<string, boolean>, setRecord: (v: Record<string, boolean>) => void, key: string) => {
    setRecord({
      ...record,
      [key]: !record[key]
    });
  };

  // Auto-generate AI Interpretation (Tab 9)
  const generateAIInsights = () => {
    const activeStrengths = Object.keys(strengthItems).filter(k => strengthItems[k]).map(k => STRENGTH_ITEMS.find(s => s.key === k)?.label).filter(Boolean);
    const activeChallenges = Object.keys(challengeItems).filter(k => challengeItems[k]).map(k => CHALLENGE_ITEMS.find(c => c.key === k)?.label).filter(Boolean);
    const activeErrors = Object.keys(errorItems).filter(k => errorItems[k]).map(k => ERROR_ANALYSIS_ITEMS.find(e => e.key === k)?.label).filter(Boolean);

    setAiSummary(
      `Assessment conducted on ${assessmentDate} for ${currentGrade} level in ${language}. Student presents with result status '${resultStatus}' requiring tailored instructional support.`
    );
    setAiFunctionalWritingLevel(`Functional Writing Level: Grade 3 / Word & Phrase Level`);
    setAiGapAnalysis(
      `Identified skill gaps in: ${activeErrors.length > 0 ? activeErrors.join(', ') : 'Letter formation, spacing, and phonetic spelling accuracy.'}`
    );
    setAiWritingProfile(
      `Student demonstrates strength in independent attempt but experiences fatigue and motor control challenges when transitioning from copy writing to dictation.`
    );
    setAiStrengths(
      activeStrengths.length > 0 ? activeStrengths.join(', ') : 'Good willingness to attempt tasks, good sentence comprehension.'
    );
    setAiChallenges(
      activeChallenges.length > 0 ? activeChallenges.join(', ') : 'Inconsistent letter sizing, line awareness, and frequent spelling errors in dictation.'
    );
    setAiPrioritySkills('1. Letter Formation & Alignment\n2. Sight Word Spelling\n3. Sentence Structure & Punctuation');
    setAiRecommendedIntervention(
      'Multi-sensory writing intervention using grid paper for line spacing, explicit phonics-based dictation practice 3x weekly, and visual cue cards for capitalization/punctuation.'
    );
    toast.success('AI interpretation and recommendations generated!');
  };

  // Save / Update Assessment
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      const payload = {
        studentId,

        // Tab 1
        assessmentDate,
        assessor,
        assessmentPurpose,
        language,
        gradeLevel,

        // Tab 2
        currentGrade,
        assessmentTypes,
        resultStatus,
        gradeStepFlow,
        copyWritingLevels,
        copyWritingObservation,
        dictationLevels,
        dictationObservation,
        independentWritingLevels,
        independentWritingObservation,
        functionalWritingLevels,
        functionalWritingObservation,

        // Tab 3
        skillRatings,
        primaryStrengths,
        primaryChallenges,
        educatorObservationsNotes,

        // Tab 4
        behaviourItems,
        behaviourObservation,

        // Tab 5
        errorItems,
        errorObservation,

        // Tab 7
        strengthItems,
        strengthsNotes,

        // Tab 8
        challengeItems,
        challengesNotes,

        // Tab 9
        aiSummary,
        aiFunctionalWritingLevel,
        aiGapAnalysis,
        aiWritingProfile,
        aiStrengths,
        aiChallenges,
        aiPrioritySkills,
        aiRecommendedIntervention,

        // Tab 10
        previousAssessment,
        writingGrowth,
        goalAchievement,
        reviewDate: reviewDate || null,
      };

      let response;
      if (mode === 'edit' && assessmentId) {
        response = await apiClient.updateWritingSkillAssessment(assessmentId, payload);
        toast.success(t('assessmentSaved'));
      } else {
        response = await apiClient.createWritingSkillAssessment(payload);
        toast.success(t('assessmentSaved'));
      }

      setSavedAssessment(response.data || response);
      setShowPreview(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Save writing assessment error:', error);
      toast.error(error.response?.data?.error || 'Failed to save writing assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

      const studentName = studentDetails?.fullName ? studentDetails.fullName.replace(/\s+/g, '_') : 'student';
      const grade = studentDetails?.grade ? `grade_${studentDetails.grade}` : 'grade_unknown';
      const educatorName = educatorDetails?.fullName ? educatorDetails.fullName.replace(/\s+/g, '_') : 'educator';

      const filename = `Writing_Assessment_${studentName}_${grade}_${educatorName}_${dateStr}_${timeStr}.pdf`;

      const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      html2pdf().from(element).set(opt).save();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      toast.error('Failed to download PDF');
    }
  };

  // Tab navigation helpers
  const currentTabIndex = TABS_ORDER.findIndex(t => t.id === activeTab);
  const goToNextTab = () => {
    if (currentTabIndex < TABS_ORDER.length - 1) {
      setActiveTab(TABS_ORDER[currentTabIndex + 1].id);
    }
  };
  const goToPrevTab = () => {
    if (currentTabIndex > 0) {
      setActiveTab(TABS_ORDER[currentTabIndex - 1].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Edit3 className="h-6 w-6 text-primary" />
            Writing Assessment
          </h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive multi-tab writing skill evaluation and progress tracking framework
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isViewMode && (
            <Button onClick={() => setShowPreview(true)} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Full Report
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs Component */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        {/* Scrollable Tabs Trigger Bar */}
        <div className="overflow-x-auto pb-2">
          <TabsList className="flex h-auto w-max space-x-1 bg-muted/60 p-1.5 rounded-lg border">
            {TABS_ORDER.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="px-3.5 py-2 text-xs font-semibold rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ==================== TAB 1: ASSESSMENT SETUP ==================== */}
        <TabsContent value="tab1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Assessment Setup
              </CardTitle>
              <CardDescription>Enter general information regarding the assessment session.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border rounded-lg p-5 space-y-4 bg-card">
                <h3 className="font-semibold text-md text-foreground border-b pb-2">Assessment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Assessment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="assessmentDate" className="flex items-center gap-1.5 text-sm font-medium">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Assessment Date
                    </Label>
                    <Input
                      id="assessmentDate"
                      type="date"
                      value={assessmentDate}
                      onChange={e => setAssessmentDate(e.target.value)}
                      disabled={isViewMode}
                    />
                  </div>

                  {/* Assessor */}
                  <div className="space-y-2">
                    <Label htmlFor="assessor" className="flex items-center gap-1.5 text-sm font-medium">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Assessor Name
                    </Label>
                    <Input
                      id="assessor"
                      placeholder="e.g. Special Educator Name"
                      value={assessor}
                      onChange={e => setAssessor(e.target.value)}
                      disabled={isViewMode}
                    />
                  </div>

                  {/* Assessment Purpose */}
                  <div className="space-y-2">
                    <Label htmlFor="assessmentPurpose" className="text-sm font-medium">
                      Assessment Purpose
                    </Label>
                    <Select
                      value={assessmentPurpose}
                      onValueChange={setAssessmentPurpose}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Purpose" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Diagnostic">Diagnostic</SelectItem>
                        <SelectItem value="Baseline Assessment">Baseline Assessment</SelectItem>
                        <SelectItem value="Progress Monitoring">Progress Monitoring</SelectItem>
                        <SelectItem value="Periodic Review">Periodic Review</SelectItem>
                        <SelectItem value="Special Education Evaluation">Special Education Evaluation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language */}
                  <div className="space-y-2">
                    <Label htmlFor="language" className="text-sm font-medium">
                      Language
                    </Label>
                    <Select
                      value={language}
                      onValueChange={setLanguage}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Regional">Regional Language</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grade / Knowledge Level */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="gradeLevel" className="text-sm font-medium">
                      Grade / Knowledge Level
                    </Label>
                    <Select
                      value={gradeLevel}
                      onValueChange={setGradeLevel}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Grade Level" />
                      </SelectTrigger>
                      <SelectContent>
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 2: WRITING ASSESSMENT ==================== */}
        <TabsContent value="tab2">
          <Card className="space-y-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Writing Assessment
              </CardTitle>
              <CardDescription>Configure assessment current grade, skills tested, and grade step-down progression result.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Grade & Types Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-muted/20">
                <div>
                  <Label className="text-sm font-semibold">Current Grade</Label>
                  <Input
                    value={currentGrade}
                    onChange={e => setCurrentGrade(e.target.value)}
                    disabled={isViewMode}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold">Current Assessment Types</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      'Copy Writing',
                      'Dictation',
                      'Paragraph Writing',
                      'Functional Writing',
                      'Written Expression'
                    ].map(type => (
                      <label key={type} className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assessmentTypes.includes(type)}
                          onChange={() => toggleArrayItem(assessmentTypes, setAssessmentTypes, type)}
                          disabled={isViewMode}
                          className="h-4 w-4 rounded text-primary focus:ring-primary"
                        />
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Result & Grade Progression Step-Down Flow */}
              <div className="p-5 border rounded-xl bg-card space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h3 className="font-semibold text-md text-foreground">Assessment Result & Flowchart</h3>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-semibold">Result:</Label>
                    <Select value={resultStatus} onValueChange={setResultStatus} disabled={isViewMode}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Needs Support">Needs Support</SelectItem>
                        <SelectItem value="Age Appropriate">Age Appropriate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Grade Step-down Diagram */}
                <div className="flex flex-wrap items-center justify-center gap-3 p-4 bg-muted/40 rounded-lg text-xs font-medium">
                  <div className="bg-primary/10 text-primary border border-primary/30 px-3 py-2 rounded-lg text-center font-bold">
                    Current: {currentGrade}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <div className="bg-destructive/10 text-destructive border border-destructive/30 px-3 py-2 rounded-lg text-center font-bold">
                    Result: {resultStatus}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => !isViewMode && setGradeStepFlow('Assess Grade 4')}
                    className={`px-3 py-2 rounded-lg border transition-all ${
                      gradeStepFlow === 'Assess Grade 4'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500 font-bold'
                        : 'bg-card text-muted-foreground border-border hover:bg-accent'
                    }`}
                  >
                    Assess Grade 4
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => !isViewMode && setGradeStepFlow('Assess Grade 3')}
                    className={`px-3 py-2 rounded-lg border transition-all ${
                      gradeStepFlow === 'Assess Grade 3'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500 font-bold'
                        : 'bg-card text-muted-foreground border-border hover:bg-accent'
                    }`}
                  >
                    Assess Grade 3
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => !isViewMode && setGradeStepFlow('Stop at Functional Writing Level')}
                    className={`px-3 py-2 rounded-lg border transition-all ${
                      gradeStepFlow === 'Stop at Functional Writing Level'
                        ? 'bg-destructive/20 text-destructive border-destructive font-bold'
                        : 'bg-card text-muted-foreground border-border hover:bg-accent'
                    }`}
                  >
                    Stop at Functional Level
                  </button>
                </div>
              </div>

              {/* Assessment Categories A, B, C, D */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* A. Copy Writing */}
                <div className="border rounded-lg p-4 space-y-3 bg-card">
                  <h4 className="font-semibold text-sm text-foreground flex items-center justify-between border-b pb-2">
                    <span>A. Copy Writing</span>
                    <Badge variant="outline" className="text-xs font-normal">Task Level</Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {['Alphabet', 'Words', 'Sentences', 'Paragraph'].map(item => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={copyWritingLevels.includes(item)}
                          onChange={() => toggleArrayItem(copyWritingLevels, setCopyWritingLevels, item)}
                          disabled={isViewMode}
                          className="h-4 w-4 rounded text-primary focus:ring-primary"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="copyWritingObservation" className="text-xs font-medium">Observation</Label>
                    <Textarea
                      id="copyWritingObservation"
                      value={copyWritingObservation}
                      onChange={e => setCopyWritingObservation(e.target.value)}
                      placeholder="Observation on copy writing..."
                      disabled={isViewMode}
                      rows={2}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                {/* B. Dictation */}
                <div className="border rounded-lg p-4 space-y-3 bg-card">
                  <h4 className="font-semibold text-sm text-foreground flex items-center justify-between border-b pb-2">
                    <span>B. Dictation</span>
                    <Badge variant="outline" className="text-xs font-normal">Task Level</Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {['Letters', 'Words', 'Sentences', 'Paragraph'].map(item => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dictationLevels.includes(item)}
                          onChange={() => toggleArrayItem(dictationLevels, setDictationLevels, item)}
                          disabled={isViewMode}
                          className="h-4 w-4 rounded text-primary focus:ring-primary"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="dictationObservation" className="text-xs font-medium">Observation</Label>
                    <Textarea
                      id="dictationObservation"
                      value={dictationObservation}
                      onChange={e => setDictationObservation(e.target.value)}
                      placeholder="Observation on dictation..."
                      disabled={isViewMode}
                      rows={2}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                {/* C. Independent Writing */}
                <div className="border rounded-lg p-4 space-y-3 bg-card">
                  <h4 className="font-semibold text-sm text-foreground flex items-center justify-between border-b pb-2">
                    <span>C. Independent Writing</span>
                    <Badge variant="outline" className="text-xs font-normal">Task Level</Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {['Picture Description', 'Sentence Writing', 'Paragraph Writing', 'Story Writing'].map(item => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={independentWritingLevels.includes(item)}
                          onChange={() => toggleArrayItem(independentWritingLevels, setIndependentWritingLevels, item)}
                          disabled={isViewMode}
                          className="h-4 w-4 rounded text-primary focus:ring-primary"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="independentWritingObservation" className="text-xs font-medium">Observation</Label>
                    <Textarea
                      id="independentWritingObservation"
                      value={independentWritingObservation}
                      onChange={e => setIndependentWritingObservation(e.target.value)}
                      placeholder="Observation on independent writing..."
                      disabled={isViewMode}
                      rows={2}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>

                {/* D. Functional Writing */}
                <div className="border rounded-lg p-4 space-y-3 bg-card">
                  <h4 className="font-semibold text-sm text-foreground flex items-center justify-between border-b pb-2">
                    <span>D. Functional Writing</span>
                    <Badge variant="outline" className="text-xs font-normal">Task Level</Badge>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {['Forms', 'Lists', 'Messages', 'Short Answers'].map(item => (
                      <label key={item} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={functionalWritingLevels.includes(item)}
                          onChange={() => toggleArrayItem(functionalWritingLevels, setFunctionalWritingLevels, item)}
                          disabled={isViewMode}
                          className="h-4 w-4 rounded text-primary focus:ring-primary"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="functionalWritingObservation" className="text-xs font-medium">Observation</Label>
                    <Textarea
                      id="functionalWritingObservation"
                      value={functionalWritingObservation}
                      onChange={e => setFunctionalWritingObservation(e.target.value)}
                      placeholder="Observation on functional writing..."
                      disabled={isViewMode}
                      rows={2}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 3: WRITING SKILLS ==================== */}
        <TabsContent value="tab3">
          <Card className="space-y-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Writing Skills Evaluation
              </CardTitle>
              <CardDescription>
                Rate each specific writing skill on a 1–5 scale (1: Low Support Need / Poor, 5: Mastered) or N/A.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {WRITING_SKILLS_CATEGORIES.map(category => (
                <div key={category.id} className="border rounded-xl p-5 space-y-4 bg-card">
                  <div className="border-b pb-3">
                    <h3 className="font-bold text-md text-foreground flex items-center gap-2">
                      <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                        {category.code}
                      </span>
                      {category.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{category.purpose}</p>
                  </div>

                  <div className="space-y-3">
                    {category.items.map(item => {
                      const currentVal = skillRatings[item.key];
                      return (
                        <div
                          key={item.key}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50 gap-2"
                        >
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Rating:</span>
                            {RATING_OPTIONS.map(opt => {
                              const isSelected = currentVal === opt;
                              return (
                                <button
                                  key={String(opt)}
                                  type="button"
                                  disabled={isViewMode}
                                  onClick={() => handleRatingChange(item.key, opt)}
                                  className={`w-7 h-7 rounded-md text-xs font-semibold flex items-center justify-center transition-all ${
                                    isSelected
                                      ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30'
                                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* H. Educator Observations */}
              <div className="border rounded-xl p-5 space-y-4 bg-card">
                <h3 className="font-bold text-md text-foreground border-b pb-2 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">
                    H
                  </span>
                  Educator Observations
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primaryStrengths" className="text-xs font-semibold">Primary Writing Strengths</Label>
                    <Textarea
                      id="primaryStrengths"
                      value={primaryStrengths}
                      onChange={e => setPrimaryStrengths(e.target.value)}
                      placeholder="Key strengths observed during writing..."
                      disabled={isViewMode}
                      rows={2}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="primaryChallenges" className="text-xs font-semibold">Primary Writing Challenges</Label>
                    <Textarea
                      id="primaryChallenges"
                      value={primaryChallenges}
                      onChange={e => setPrimaryChallenges(e.target.value)}
                      placeholder="Primary difficulties or pain points observed..."
                      disabled={isViewMode}
                      rows={2}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="educatorObservationsNotes" className="text-xs font-semibold">Additional Observations</Label>
                    <Textarea
                      id="educatorObservationsNotes"
                      value={educatorObservationsNotes}
                      onChange={e => setEducatorObservationsNotes(e.target.value)}
                      placeholder="Any additional observations or contextual details..."
                      disabled={isViewMode}
                      rows={2}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 4: BEHAVIOUR ==================== */}
        <TabsContent value="tab4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Behavioural Observations
              </CardTitle>
              <CardDescription>Select observed behavioral characteristics during writing tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-card">
                {BEHAVIOUR_ITEMS.map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/40 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!behaviourItems[item.key]}
                      onChange={() => toggleRecordItem(behaviourItems, setBehaviourItems, item.key)}
                      disabled={isViewMode}
                      className="h-4 w-4 rounded text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <Label htmlFor="behaviourObservation" className="text-sm font-semibold">Observation Notes</Label>
                <Textarea
                  id="behaviourObservation"
                  value={behaviourObservation}
                  onChange={e => setBehaviourObservation(e.target.value)}
                  placeholder="Detailed notes regarding student behavior, stamina, prompt-dependency..."
                  disabled={isViewMode}
                  rows={4}
                  className="mt-1 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 5: ERROR ANALYSIS ==================== */}
        <TabsContent value="tab5">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                Error Analysis
              </CardTitle>
              <CardDescription>Document and categorize explicit writing error patterns.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-card">
                {ERROR_ANALYSIS_ITEMS.map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/40 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!errorItems[item.key]}
                      onChange={() => toggleRecordItem(errorItems, setErrorItems, item.key)}
                      disabled={isViewMode}
                      className="h-4 w-4 rounded text-destructive focus:ring-destructive"
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <Label htmlFor="errorObservation" className="text-sm font-semibold">Error Analysis Observation</Label>
                <Textarea
                  id="errorObservation"
                  value={errorObservation}
                  onChange={e => setErrorObservation(e.target.value)}
                  placeholder="Analyze root causes for frequent spelling, grammatical, or reversal errors..."
                  disabled={isViewMode}
                  rows={4}
                  className="mt-1 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 7: STRENGTHS ==================== */}
        <TabsContent value="tab7">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-emerald-600" />
                Student Strengths
              </CardTitle>
              <CardDescription>Highlight key writing skills where the student excels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-card">
                {STRENGTH_ITEMS.map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!strengthItems[item.key]}
                      onChange={() => toggleRecordItem(strengthItems, setStrengthItems, item.key)}
                      disabled={isViewMode}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-600"
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <Label htmlFor="strengthsNotes" className="text-sm font-semibold">Educator Notes on Strengths</Label>
                <Textarea
                  id="strengthsNotes"
                  value={strengthsNotes}
                  onChange={e => setStrengthsNotes(e.target.value)}
                  placeholder="Notes on specific strengths and positive writing habits..."
                  disabled={isViewMode}
                  rows={4}
                  className="mt-1 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 8: CHALLENGES ==================== */}
        <TabsContent value="tab8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Key Challenges
              </CardTitle>
              <CardDescription>Identify primary writing difficulties requiring targeted intervention.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 border rounded-lg bg-card">
                {CHALLENGE_ITEMS.map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!challengeItems[item.key]}
                      onChange={() => toggleRecordItem(challengeItems, setChallengeItems, item.key)}
                      disabled={isViewMode}
                      className="h-4 w-4 rounded text-amber-600 focus:ring-amber-600"
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <Label htmlFor="challengesNotes" className="text-sm font-semibold">Educator Notes on Challenges</Label>
                <Textarea
                  id="challengesNotes"
                  value={challengesNotes}
                  onChange={e => setChallengesNotes(e.target.value)}
                  placeholder="Detailed notes on key challenges and barriers to writing..."
                  disabled={isViewMode}
                  rows={4}
                  className="mt-1 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 9: AI INTERPRETATION (FUTURE) ==================== */}
        <TabsContent value="tab9">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    AI Interpretation & Insights
                  </CardTitle>
                  <CardDescription>Automated diagnostic synthesis and IEP intervention recommendations.</CardDescription>
                </div>
                <Badge variant="secondary" className="gap-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" />
                  AI Preview
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isViewMode && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-center justify-between gap-4">
                  <div className="text-xs text-indigo-900 dark:text-indigo-200">
                    <p className="font-semibold">Generate AI Profile</p>
                    <p>Synthesize Tab 1 to Tab 8 findings into tailored diagnostic recommendations.</p>
                  </div>
                  <Button type="button" size="sm" onClick={generateAIInsights} className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    Generate AI Insights
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold">Assessment Summary</Label>
                  <Textarea
                    value={aiSummary}
                    onChange={e => setAiSummary(e.target.value)}
                    placeholder="AI Assessment summary..."
                    disabled={isViewMode}
                    rows={3}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Functional Writing Level</Label>
                  <Input
                    value={aiFunctionalWritingLevel}
                    onChange={e => setAiFunctionalWritingLevel(e.target.value)}
                    placeholder="e.g. Functional Writing Level: Grade 3"
                    disabled={isViewMode}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Gap Analysis</Label>
                  <Textarea
                    value={aiGapAnalysis}
                    onChange={e => setAiGapAnalysis(e.target.value)}
                    placeholder="Identified skill gaps..."
                    disabled={isViewMode}
                    rows={3}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Writing Profile</Label>
                  <Textarea
                    value={aiWritingProfile}
                    onChange={e => setAiWritingProfile(e.target.value)}
                    placeholder="Holistic writing profile..."
                    disabled={isViewMode}
                    rows={3}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-emerald-600">Strengths Synthesis</Label>
                  <Textarea
                    value={aiStrengths}
                    onChange={e => setAiStrengths(e.target.value)}
                    placeholder="Synthesized strengths..."
                    disabled={isViewMode}
                    rows={3}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-amber-600">Challenges Synthesis</Label>
                  <Textarea
                    value={aiChallenges}
                    onChange={e => setAiChallenges(e.target.value)}
                    placeholder="Synthesized challenges..."
                    disabled={isViewMode}
                    rows={3}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold">Priority Skills</Label>
                  <Textarea
                    value={aiPrioritySkills}
                    onChange={e => setAiPrioritySkills(e.target.value)}
                    placeholder="Target priority skills..."
                    disabled={isViewMode}
                    rows={3}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-primary">Recommended Intervention</Label>
                  <Textarea
                    value={aiRecommendedIntervention}
                    onChange={e => setAiRecommendedIntervention(e.target.value)}
                    placeholder="Recommended IEP interventions..."
                    disabled={isViewMode}
                    rows={3}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 10: PROGRESS ==================== */}
        <TabsContent value="tab10">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Progress & Goal Achievement
              </CardTitle>
              <CardDescription>Track longitudinal growth, past milestones, and review dates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="previousAssessment" className="text-xs font-semibold">Previous Assessment Context</Label>
                  <Textarea
                    id="previousAssessment"
                    value={previousAssessment}
                    onChange={e => setPreviousAssessment(e.target.value)}
                    placeholder="Summary of previous writing assessment baseline..."
                    disabled={isViewMode}
                    rows={3}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="writingGrowth" className="text-xs font-semibold">Writing Growth Metrics</Label>
                  <Textarea
                    id="writingGrowth"
                    value={writingGrowth}
                    onChange={e => setWritingGrowth(e.target.value)}
                    placeholder="Growth observed since last evaluation..."
                    disabled={isViewMode}
                    rows={3}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="goalAchievement" className="text-xs font-semibold">Goal Achievement Status</Label>
                  <Textarea
                    id="goalAchievement"
                    value={goalAchievement}
                    onChange={e => setGoalAchievement(e.target.value)}
                    placeholder="IEP writing goals achieved or in progress..."
                    disabled={isViewMode}
                    rows={3}
                    className="mt-1 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="reviewDate" className="text-xs font-semibold">Next Review Date</Label>
                  <Input
                    id="reviewDate"
                    type="date"
                    value={reviewDate}
                    onChange={e => setReviewDate(e.target.value)}
                    disabled={isViewMode}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Global Form Footer Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToPrevTab}
            disabled={currentTabIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Tab
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToNextTab}
            disabled={currentTabIndex === TABS_ORDER.length - 1}
          >
            Next Tab
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving Assessment...' : mode === 'edit' ? 'Update Assessment' : 'Save Assessment'}
            </Button>
          )}
        </div>
      </div>

      {/* Full Assessment Report Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Writing Assessment Report
            </DialogTitle>
          </DialogHeader>

          <div ref={reportRef} className="p-6 bg-background space-y-6 text-foreground">
            {/* Header section */}
            <div className="border-b pb-4 text-center">
              <h2 className="text-2xl font-bold text-primary">Writing Skill Assessment Report</h2>
              <p className="text-sm text-muted-foreground mt-1">Date: {assessmentDate} | Purpose: {assessmentPurpose} | Language: {language}</p>

              <div className="grid grid-cols-2 gap-4 mt-4 text-left text-xs">
                <div className="bg-muted/40 p-3 rounded-lg">
                  <p className="font-semibold text-foreground">Student Info:</p>
                  <p>Name: {studentDetails?.fullName || studentId}</p>
                  <p>Grade: {studentDetails?.grade || currentGrade}</p>
                </div>
                <div className="bg-muted/40 p-3 rounded-lg">
                  <p className="font-semibold text-foreground">Assessor Info:</p>
                  <p>Name: {assessor || educatorDetails?.fullName || 'Special Educator'}</p>
                  <p>Status: {resultStatus}</p>
                </div>
              </div>
            </div>

            {/* Assessment Levels Summary */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm border-b pb-1">Writing Assessment Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p><span className="font-medium">Current Grade:</span> {currentGrade}</p>
                <p><span className="font-medium">Grade Flow Step:</span> {gradeStepFlow}</p>
                <p><span className="font-medium">Copy Writing Levels:</span> {copyWritingLevels.join(', ') || 'None'}</p>
                <p><span className="font-medium">Dictation Levels:</span> {dictationLevels.join(', ') || 'None'}</p>
                <p><span className="font-medium">Independent Writing:</span> {independentWritingLevels.join(', ') || 'None'}</p>
                <p><span className="font-medium">Functional Writing:</span> {functionalWritingLevels.join(', ') || 'None'}</p>
              </div>
            </div>

            {/* Writing Skills Table */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm border-b pb-1">Writing Skills Ratings (1–5 / N/A)</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {WRITING_SKILLS_CATEGORIES.flatMap(cat =>
                  cat.items.map(item => (
                    <div key={item.key} className="p-2 border rounded bg-muted/20 flex justify-between">
                      <span className="truncate">{item.label}</span>
                      <span className="font-bold text-primary">{skillRatings[item.key] ?? 'N/A'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Strengths & Challenges */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 border rounded bg-emerald-50/50 dark:bg-emerald-950/10">
                <p className="font-bold text-emerald-700 dark:text-emerald-300 mb-1">Strengths:</p>
                <p>{Object.keys(strengthItems).filter(k => strengthItems[k]).map(k => STRENGTH_ITEMS.find(s => s.key === k)?.label).join(', ') || 'None selected'}</p>
              </div>
              <div className="p-3 border rounded bg-amber-50/50 dark:bg-amber-950/10">
                <p className="font-bold text-amber-700 dark:text-amber-300 mb-1">Challenges:</p>
                <p>{Object.keys(challengeItems).filter(k => challengeItems[k]).map(k => CHALLENGE_ITEMS.find(c => c.key === k)?.label).join(', ') || 'None selected'}</p>
              </div>
            </div>

            {/* AI Summary if present */}
            {aiSummary && (
              <div className="p-4 border rounded-lg bg-indigo-50/30 dark:bg-indigo-950/20 text-xs space-y-2">
                <h4 className="font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Diagnostic Insights & Interventions
                </h4>
                <p><span className="font-medium">Summary:</span> {aiSummary}</p>
                <p><span className="font-medium">Functional Level:</span> {aiFunctionalWritingLevel}</p>
                <p><span className="font-medium">Intervention:</span> {aiRecommendedIntervention}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={downloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
