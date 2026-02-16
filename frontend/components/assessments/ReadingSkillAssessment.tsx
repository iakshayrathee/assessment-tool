'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Download, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GradeLevelMappingComponent, type GradeLevelMapping } from './GradeLevelMapping';
import { BatteryTestSection } from './BatteryTestSection';

interface ReadingSkillAssessmentProps {
  studentId: string;
  studentGrade?: string;
  assessmentId?: string;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const READING_QUESTIONS = [
  {
    id: 'readingQ1',
    question: 'Is the child reading at grade level?',
    options: ['Yes', '1 Level Below', '2+ Levels Below']
  },
  {
    id: 'readingQ2',
    question: 'Can the child decode unfamiliar words?',
    options: ['Yes', 'With Help', 'No']
  },
  {
    id: 'readingQ3',
    question: 'Can the child answer comprehension questions?',
    options: ['Fully', 'Partially', 'Not Yet']
  }
];

const READING_SYMPTOMS = {
  'Decoding & Word Reading Errors': [
    { key: 'missesLetters', label: 'Misses letters' },
    { key: 'missesWords', label: 'Misses words' },
    { key: 'missesSentences', label: 'Misses sentences' },
    { key: 'substitution', label: 'Substitution' },
    { key: 'omissionBeginning', label: 'Omission (beginning syllable)' },
    { key: 'omissionEnding', label: 'Omission (ending syllable)' },
    { key: 'omissionWholeWord', label: 'Omission (whole word)' },
    { key: 'additionWordsOrSyllables', label: 'Addition of words or syllables' },
    { key: 'guessingWords', label: 'Guessing words' },
    { key: 'mispronunciation', label: 'Mispronunciation' },
    { key: 'troubleBlendingSyllables', label: 'Trouble blending syllables' },
    { key: 'difficultyDecodingUnfamiliar', label: 'Difficulty decoding unfamiliar words' },
    { key: 'poorWordRecognition', label: 'Poor word recognition (reads same word differently each time)' },
    { key: 'troubleRememberingSightWords', label: 'Trouble remembering sight words' },
    { key: 'troubleLearningLetterSound', label: 'Trouble learning letter-sound associations' },
    { key: 'shortLongVowelConfusion', label: 'Short/long vowel confusion' },
    { key: 'poorSyllabication', label: 'Poor syllabication' },
  ],
  'Fluency & Reading Flow': [
    { key: 'poorFlowWhileReading', label: 'Poor flow while reading' },
    { key: 'choppyReading', label: 'Choppy reading' },
    { key: 'lotsOfGaps', label: 'A lot of gaps while reading' },
    { key: 'wordByWordReading', label: 'Word-by-word reading' },
    { key: 'reReadingSameLine', label: 'Re-reading the same line' },
    { key: 'repetitionOfWords', label: 'Repetition of words' },
    { key: 'vocalizeDuringSilentReading', label: 'Vocalizes during silent reading' },
    { key: 'poorIntonations', label: 'Poor intonations' },
    { key: 'poorPhrasing', label: 'Poor phrasing' },
    { key: 'slowEffortfulReading', label: 'Slow and effortful reading' },
  ],
  'Tracking, Eye Movement, Visual Skills': [
    { key: 'movesHeadWhileReading', label: 'Moves head while reading' },
    { key: 'losesPlaceWhileReading', label: 'Loses place while reading' },
    { key: 'skipsLines', label: 'Skips lines' },
    { key: 'poorEyeTracking', label: 'Poor eye tracking' },
    { key: 'poorScanningSkills', label: 'Poor scanning skills' },
    { key: 'holdsBookTooClose', label: 'Holds book too close' },
    { key: 'difficultyLeftRightEyeMovement', label: 'Difficulty with left–right eye movement' },
    { key: 'difficultyRecognizingSimilarLetters', label: 'Difficulty recognizing similar-looking letters (b↔d, p↔q, etc.)' },
  ],
  'Comprehension Indicators': [
    { key: 'readsWithoutUnderstanding', label: 'Reads without understanding' },
    { key: 'forgetsWhatWasRead', label: 'Forgets what was just read' },
    { key: 'difficultyAnsweringQuestions', label: 'Difficulty answering comprehension questions' },
  ],
  'Attention & Reading Behavior': [
    { key: 'notInterestedInReading', label: 'Not interested in reading' },
    { key: 'avoidsReadingAloud', label: 'Avoids reading aloud' },
    { key: 'avoidsReadingActivities', label: 'Avoids reading activities' },
    { key: 'yawningFrequently', label: 'Yawning frequently' },
    { key: 'easilyFrustrated', label: 'Easily frustrated' },
    { key: 'lowConfidence', label: 'Low confidence' },
    { key: 'poorReadingStamina', label: 'Poor reading stamina' },
  ],
  'Mechanics & Punctuation': [
    { key: 'punctuationErrors', label: 'Punctuation errors' },
    { key: 'doesNotPauseAtFullStop', label: 'Does not pause at full stop' },
    { key: 'extraPausesAtCommas', label: 'Extra pauses at commas' },
    { key: 'incorrectToneForQuestionExclamation', label: 'Incorrect tone for ? and !' },
  ],
};

// Helper functions to extract data from saved assessment
function extractSymptoms(data: any): Record<string, boolean> {
  const symptoms: Record<string, boolean> = {};
  const allSymptomKeys = Object.values(READING_SYMPTOMS).flat().map(s => s.key);

  allSymptomKeys.forEach(key => {
    if (data[key] === true) {
      symptoms[key] = true;
    }
  });

  return symptoms;
}

function extractQuestionAnswers(data: any): Record<string, string> {
  const answers: Record<string, string> = {};

  READING_QUESTIONS.forEach(q => {
    if (data[q.id]) {
      answers[q.id] = data[q.id];
    }
  });

  return answers;
}

export function ReadingSkillAssessment({
  studentId,
  assessmentId,
  initialData,
  mode = 'create',
  onSuccess,
  onCancel
}: ReadingSkillAssessmentProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, boolean>>(
    initialData ? extractSymptoms(initialData) : {}
  );
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>(
    initialData ? extractQuestionAnswers(initialData) : {}
  );
  const [additionalNotes, setAdditionalNotes] = useState(initialData?.additionalNotes || '');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [showPreview, setShowPreview] = useState(mode === 'view');
  const [savedAssessment, setSavedAssessment] = useState<any>(initialData || null);
  const reportRef = useRef<HTMLDivElement>(null);

  // NEW: Grade Level Mapping State
  const [isAtGradeLevel, setIsAtGradeLevel] = useState<boolean | null>(
    initialData?.isAtGradeLevel ?? null
  );
  const [functionalGradeLevel, setFunctionalGradeLevel] = useState(
    initialData?.functionalGradeLevel || ''
  );
  const [performanceSummary, setPerformanceSummary] = useState(
    initialData?.performanceSummary || ''
  );
  const [gradeLevelMappings, setGradeLevelMappings] = useState<GradeLevelMapping[]>(
    initialData?.gradeLevelMappings || []
  );
  const [gradeLevelObservation, setGradeLevelObservation] = useState(
    initialData?.gradeLevelObservation || ''
  );

  // NEW: Initial Reading Level Assessment State
  const [independentLevelKnownText, setIndependentLevelKnownText] = useState(
    initialData?.independentLevelKnownText || false
  );
  const [independentLevelUnknownText, setIndependentLevelUnknownText] = useState(
    initialData?.independentLevelUnknownText || false
  );
  const [instructionalLevelKnownText, setInstructionalLevelKnownText] = useState(
    initialData?.instructionalLevelKnownText || false
  );
  const [instructionalLevelUnknownText, setInstructionalLevelUnknownText] = useState(
    initialData?.instructionalLevelUnknownText || false
  );
  const [frustrationLevelKnownText, setFrustrationLevelKnownText] = useState(
    initialData?.frustrationLevelKnownText || false
  );
  const [frustrationLevelUnknownText, setFrustrationLevelUnknownText] = useState(
    initialData?.frustrationLevelUnknownText || false
  );

  // NEW: Battery Test State
  const [batteryTestConducted, setBatteryTestConducted] = useState(
    initialData?.batteryTestConducted || false
  );
  const [batteryTestSummary, setBatteryTestSummary] = useState(
    initialData?.batteryTestSummary || ''
  );
  const [batteryTestReportUrl, setBatteryTestReportUrl] = useState(
    initialData?.batteryTestReportUrl || ''
  );

  // NEW: Comprehension Levels State
  const [atGradeLevelComprehension, setAtGradeLevelComprehension] = useState<boolean | null>(
    initialData?.atGradeLevelComprehension ?? null
  );
  const [comprehensionLevels, setComprehensionLevels] = useState<string[]>(
    initialData?.comprehensionLevels || []
  );
  const [currentLevelComprehension, setCurrentLevelComprehension] = useState<string[]>(
    initialData?.currentLevelComprehension || []
  );
  const [comprehensionObservation, setComprehensionObservation] = useState(
    initialData?.comprehensionObservation || ''
  );

  const isViewMode = mode === 'view';

  // Get student and educator details from saved assessment response
  const studentDetails = savedAssessment?.student || null;
  const educatorDetails = savedAssessment?.specialEducator || null;

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleSymptom = (key: string) => {
    setSelectedSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async () => {
    // Validate that at least one symptom is selected or there are additional notes
    const hasSelectedSymptoms = Object.values(selectedSymptoms).some(value => value === true);
    const hasQuestionAnswers = Object.values(questionAnswers).some(value => value && value.trim() !== '');

    if (!hasSelectedSymptoms && !hasQuestionAnswers && !additionalNotes.trim()) {
      toast.error('Please select at least one symptom, answer questions, or add notes before saving.');
      return;
    }

    try {
      setIsSubmitting(true);

      const data = {
        studentId,
        ...selectedSymptoms,
        ...questionAnswers,
        additionalNotes,

        // NEW: Initial Reading Level Assessment
        independentLevelKnownText,
        independentLevelUnknownText,
        instructionalLevelKnownText,
        instructionalLevelUnknownText,
        frustrationLevelKnownText,
        frustrationLevelUnknownText,

        // NEW: Grade Level Mapping fields
        isAtGradeLevel,
        functionalGradeLevel: isAtGradeLevel ? functionalGradeLevel : null,
        performanceSummary: isAtGradeLevel ? performanceSummary : null,
        gradeLevelMappings: !isAtGradeLevel && gradeLevelMappings.length > 0
          ? gradeLevelMappings
          : null,
        gradeLevelObservation: !isAtGradeLevel ? gradeLevelObservation : null,

        // NEW: Battery Test fields
        batteryTestConducted,
        batteryTestSummary: batteryTestConducted ? batteryTestSummary : null,
        batteryTestReportUrl: batteryTestConducted ? batteryTestReportUrl : null,

        // NEW: Comprehension Levels fields
        atGradeLevelComprehension,
        comprehensionLevels: atGradeLevelComprehension ? comprehensionLevels : [],
        currentLevelComprehension: !atGradeLevelComprehension ? currentLevelComprehension : [],
        comprehensionObservation,
      };

      let response;
      if (mode === 'edit' && assessmentId) {
        response = await apiClient.updateReadingSkillAssessment(assessmentId, data);
        toast.success('Reading skill assessment updated successfully!');
      } else {
        response = await apiClient.createReadingSkillAssessment(data);
        toast.success('Reading skill assessment created successfully!');
      }

      // Store the full response data which includes student and specialEducator
      setSavedAssessment(response.data || response);
      setShowPreview(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Save reading assessment error:', error);
      toast.error(error.response?.data?.error || 'Failed to save reading assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const html2pdf = (await import('html2pdf.js')).default;

      const element = reportRef.current;

      // Generate filename with student name, grade, educator name, date and time
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');

      // Use available data or fallback values
      const studentName = studentDetails?.fullName ? studentDetails.fullName.replace(/\s+/g, '_') : 'student';
      const grade = studentDetails?.grade ? `grade_${studentDetails.grade}` : 'grade_unknown';
      const educatorName = educatorDetails?.fullName ? educatorDetails.fullName.replace(/\s+/g, '_') : 'educator';

      const filename = `${studentName}_${grade}_${educatorName}_${dateStr}_${timeStr}.pdf`;

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

  return (
    <div className="space-y-6">
      {/* NEW: Initial Reading Level Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Level Assessment</CardTitle>
          <p className="text-sm text-gray-600">Assess the student's reading performance at different levels</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Independent Level */}
          <div className="p-4 border rounded-lg bg-blue-50">
            <Label className="text-base font-semibold mb-3 block">1. Independent Level</Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={independentLevelKnownText}
                  onChange={(e) => setIndependentLevelKnownText(e.target.checked)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span className="text-sm">Known Text</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={independentLevelUnknownText}
                  onChange={(e) => setIndependentLevelUnknownText(e.target.checked)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span className="text-sm">Unknown Text</span>
              </label>
            </div>
          </div>

          {/* Instructional Level */}
          <div className="p-4 border rounded-lg bg-yellow-50">
            <Label className="text-base font-semibold mb-3 block">2. Instructional Level</Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={instructionalLevelKnownText}
                  onChange={(e) => setInstructionalLevelKnownText(e.target.checked)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span className="text-sm">Known Text</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={instructionalLevelUnknownText}
                  onChange={(e) => setInstructionalLevelUnknownText(e.target.checked)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span className="text-sm">Unknown Text</span>
              </label>
            </div>
          </div>

          {/* Frustration Level */}
          <div className="p-4 border rounded-lg bg-red-50">
            <Label className="text-base font-semibold mb-3 block">3. Frustration Level</Label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={frustrationLevelKnownText}
                  onChange={(e) => setFrustrationLevelKnownText(e.target.checked)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span className="text-sm">Known Text</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={frustrationLevelUnknownText}
                  onChange={(e) => setFrustrationLevelUnknownText(e.target.checked)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span className="text-sm">Unknown Text</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Assessment Questions</CardTitle>
          <p className="text-sm text-gray-600">Answer the following questions about the student's reading abilities</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {READING_QUESTIONS.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label className="text-sm font-medium">{q.question}</Label>
              <Select
                value={questionAnswers[q.id] || ''}
                onValueChange={(value) => setQuestionAnswers(prev => ({ ...prev, [q.id]: value }))}
                disabled={isViewMode}
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
          ))}
        </CardContent>
      </Card>

      {/* NEW: Grade Level Identification */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Level Identification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Radio buttons for Yes/No */}
          <div>
            <Label className="text-base font-semibold">
              Is Child at Grade Level? *
            </Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isAtGradeLevel"
                  checked={isAtGradeLevel === true}
                  onChange={() => setIsAtGradeLevel(true)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isAtGradeLevel"
                  checked={isAtGradeLevel === false}
                  onChange={() => setIsAtGradeLevel(false)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Conditional: If YES */}
          {isAtGradeLevel === true && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg">
              <div>
                <Label htmlFor="functionalGradeLevel">Grade Level *</Label>
                <Input
                  id="functionalGradeLevel"
                  value={functionalGradeLevel}
                  onChange={(e) => setFunctionalGradeLevel(e.target.value)}
                  placeholder="e.g., Grade 3"
                  disabled={isViewMode}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="performanceSummary">Performance Summary *</Label>
                <Textarea
                  id="performanceSummary"
                  value={performanceSummary}
                  onChange={(e) => setPerformanceSummary(e.target.value)}
                  placeholder="Describe the student's performance at grade level..."
                  disabled={isViewMode}
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Conditional: If NO */}
          {isAtGradeLevel === false && (
            <div className="space-y-4">
              <GradeLevelMappingComponent
                mappings={gradeLevelMappings}
                onChange={setGradeLevelMappings}
                maxMappings={4}
                disabled={isViewMode}
                title="Grade Level Mapping"
                showSummaryNote={false}
              />
              <div>
                <Label htmlFor="gradeLevelObservation">Observation</Label>
                <Textarea
                  id="gradeLevelObservation"
                  value={gradeLevelObservation}
                  onChange={(e) => setGradeLevelObservation(e.target.value)}
                  placeholder="Additional observations about grade level performance..."
                  disabled={isViewMode}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NEW: Battery Test Section */}
      <BatteryTestSection
        conducted={batteryTestConducted}
        onConductedChange={setBatteryTestConducted}
        summary={batteryTestSummary}
        onSummaryChange={setBatteryTestSummary}
        reportUrl={batteryTestReportUrl}
        onReportUpload={(file) => {
          // TODO: Implement file upload to server
          console.log('File to upload:', file);
          toast.success('File upload functionality to be implemented');
        }}
        onReportRemove={() => setBatteryTestReportUrl('')}
        disabled={isViewMode}
        title="Knowledcare Battery Test Results (Optional)"
      />

      {/* NEW: Reading Comprehension Level */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Comprehension Level</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Radio buttons for Yes/No */}
          <div>
            <Label className="text-base font-semibold">
              At Grade Level Reading Comprehension? *
            </Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="atGradeLevelComprehension"
                  checked={atGradeLevelComprehension === true}
                  onChange={() => setAtGradeLevelComprehension(true)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="atGradeLevelComprehension"
                  checked={atGradeLevelComprehension === false}
                  onChange={() => setAtGradeLevelComprehension(false)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {/* Conditional: If YES - Comprehension Levels */}
          {atGradeLevelComprehension === true && (
            <div className="p-4 bg-green-50 rounded-lg">
              <Label className="text-sm font-semibold mb-2 block">
                Comprehension Levels (Select all that apply)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['Literal', 'Inferential', 'Application', 'Critical Evaluation'].map((level) => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={comprehensionLevels.includes(level)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setComprehensionLevels([...comprehensionLevels, level]);
                        } else {
                          setComprehensionLevels(comprehensionLevels.filter((l) => l !== level));
                        }
                      }}
                      disabled={isViewMode}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Conditional: If NO - Current Level Comprehension */}
          {atGradeLevelComprehension === false && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                At the Child's Current Reading Level, Comprehension is:
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-yellow-50 rounded-lg">
                {['Literal', 'Inferential', 'Application', 'Critical Evaluation'].map((level) => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentLevelComprehension.includes(level)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCurrentLevelComprehension([...currentLevelComprehension, level]);
                        } else {
                          setCurrentLevelComprehension(currentLevelComprehension.filter((l) => l !== level));
                        }
                      }}
                      disabled={isViewMode}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{level}</span>
                  </label>
                ))}
              </div>
              <div>
                <Label htmlFor="comprehensionObservation">Observation</Label>
                <Textarea
                  id="comprehensionObservation"
                  value={comprehensionObservation}
                  onChange={(e) => setComprehensionObservation(e.target.value)}
                  placeholder="Additional observations about comprehension..."
                  disabled={isViewMode}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Symptoms */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Reading Symptoms</CardTitle>
          <p className="text-sm text-gray-600">Select all symptoms that apply to the student</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(READING_SYMPTOMS).map(([category, symptoms]) => (
            <Collapsible
              key={category}
              open={openSections[category]}
              onOpenChange={() => toggleSection(category)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="font-medium text-left">{category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {symptoms.filter(s => selectedSymptoms[s.key]).length} / {symptoms.length}
                  </span>
                  {openSections[category] ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 pb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                  {symptoms.map((symptom) => (
                    <div key={symptom.key} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id={symptom.key}
                        checked={selectedSymptoms[symptom.key] || false}
                        onChange={() => toggleSymptom(symptom.key)}
                        disabled={isViewMode}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label
                        htmlFor={symptom.key}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {symptom.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          <div className="pt-4">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Add any additional observations or notes..."
              rows={4}
              className="mt-2"
              disabled={isViewMode}
            />
          </div>
        </CardContent>
      </Card>

      {!isViewMode && (
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Assessment' : 'Save Assessment'}
          </Button>
        </div>
      )}

      {isViewMode && (
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
          <Button onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            View Full Report
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assessment Preview</DialogTitle>
            <p className="text-sm text-gray-600">
              Your reading assessment has been saved successfully. You can now download it as PDF.
            </p>
          </DialogHeader>

          <div ref={reportRef} className="p-6 bg-white">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800">Reading Skill Assessment</h2>
              <p className="text-gray-600">Assessment Date: {new Date().toLocaleDateString()}</p>

              {/* Student and Educator Details */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <h4 className="font-semibold text-blue-800">Student Information</h4>
                  {studentDetails ? (
                    <>
                      <p><span className="font-medium">Name:</span> {studentDetails.fullName || 'N/A'}</p>
                      <p><span className="font-medium">Grade:</span> {studentDetails.grade || 'N/A'}</p>
                      {studentDetails.age && <p><span className="font-medium">Age:</span> {studentDetails.age}</p>}
                    </>
                  ) : (
                    <p className="text-gray-500">Loading student information...</p>
                  )}
                </div>

                <div className="bg-green-50 p-3 rounded">
                  <h4 className="font-semibold text-green-800">Special Educator Information</h4>
                  {educatorDetails ? (
                    <>
                      <p><span className="font-medium">Name:</span> {educatorDetails.fullName || 'N/A'}</p>
                      <p><span className="font-medium">Role:</span> Special Educator</p>
                      <p><span className="font-medium">Date & Time:</span> {new Date().toLocaleString()}</p>
                    </>
                  ) : (
                    <p className="text-gray-500">Loading educator information...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Assessment Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Assessment Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-medium">Total Symptoms Selected:</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {Object.values(selectedSymptoms).filter(val => val).length}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="font-medium">Questions Answered:</p>
                  <p className="text-2xl font-bold text-green-700">
                    {Object.values(questionAnswers).filter(val => val && val.trim()).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Symptoms */}
            {Object.values(selectedSymptoms).some(val => val) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Selected Symptoms</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(READING_SYMPTOMS).flatMap(([category, symptoms]) =>
                      symptoms
                        .filter(symptom => selectedSymptoms[symptom.key])
                        .map(symptom => (
                          <li key={symptom.key} className="text-sm">
                            <span className="font-medium">{category}:</span> {symptom.label}
                          </li>
                        ))
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Question Answers */}
            {Object.values(questionAnswers).some(val => val && val.trim()) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Question Responses</h3>
                <div className="bg-gray-50 p-4 rounded">
                  {READING_QUESTIONS.map(q =>
                    questionAnswers[q.id] && (
                      <div key={q.id} className="mb-2">
                        <p className="font-medium">{q.question}</p>
                        <p className="text-blue-700">{questionAnswers[q.id]}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Reading Level Assessment */}
            {(independentLevelKnownText || independentLevelUnknownText ||
              instructionalLevelKnownText || instructionalLevelUnknownText ||
              frustrationLevelKnownText || frustrationLevelUnknownText) && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Reading Level Assessment</h3>
                  <div className="bg-gray-50 p-4 rounded space-y-3">
                    {(independentLevelKnownText || independentLevelUnknownText) && (
                      <div className="p-3 bg-blue-50 rounded">
                        <p className="font-medium mb-2">Independent Level</p>
                        <div className="flex gap-4 text-sm">
                          {independentLevelKnownText && (
                            <span className="text-green-700">✓ Known Text</span>
                          )}
                          {independentLevelUnknownText && (
                            <span className="text-green-700">✓ Unknown Text</span>
                          )}
                        </div>
                      </div>
                    )}

                    {(instructionalLevelKnownText || instructionalLevelUnknownText) && (
                      <div className="p-3 bg-yellow-50 rounded">
                        <p className="font-medium mb-2">Instructional Level</p>
                        <div className="flex gap-4 text-sm">
                          {instructionalLevelKnownText && (
                            <span className="text-green-700">✓ Known Text</span>
                          )}
                          {instructionalLevelUnknownText && (
                            <span className="text-green-700">✓ Unknown Text</span>
                          )}
                        </div>
                      </div>
                    )}

                    {(frustrationLevelKnownText || frustrationLevelUnknownText) && (
                      <div className="p-3 bg-red-50 rounded">
                        <p className="font-medium mb-2">Frustration Level</p>
                        <div className="flex gap-4 text-sm">
                          {frustrationLevelKnownText && (
                            <span className="text-green-700">✓ Known Text</span>
                          )}
                          {frustrationLevelUnknownText && (
                            <span className="text-green-700">✓ Unknown Text</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Reading Grade Level Identification */}
            {isAtGradeLevel !== null && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Grade Level Identification</h3>
                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <div>
                    <p className="font-medium">Is Child at Grade Level?</p>
                    <p className={isAtGradeLevel ? "text-green-700" : "text-orange-700"}>
                      {isAtGradeLevel ? "Yes" : "No"}
                    </p>
                  </div>

                  {isAtGradeLevel && functionalGradeLevel && (
                    <>
                      <div>
                        <p className="font-medium">Grade Level:</p>
                        <p>{functionalGradeLevel}</p>
                      </div>
                      {performanceSummary && (
                        <div>
                          <p className="font-medium">Performance Summary:</p>
                          <p className="whitespace-pre-wrap">{performanceSummary}</p>
                        </div>
                      )}
                    </>
                  )}

                  {!isAtGradeLevel && gradeLevelMappings && gradeLevelMappings.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Grade Level Mappings:</p>
                      <div className="space-y-2">
                        {gradeLevelMappings.map((mapping, idx) => (
                          <div key={idx} className="bg-white p-3 rounded border">
                            <p className="font-medium text-sm">Grade: {mapping.gradeLevel}</p>
                            <div className="grid grid-cols-3 gap-2 mt-1 text-xs">
                              <div>
                                <span className="font-medium">Independent:</span> {mapping.independent || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Instructional:</span> {mapping.instructional || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium">Frustration:</span> {mapping.frustration || 'N/A'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isAtGradeLevel && gradeLevelObservation && (
                    <div>
                      <p className="font-medium">Observation:</p>
                      <p className="whitespace-pre-wrap">{gradeLevelObservation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Battery Test Results */}
            {batteryTestConducted && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Knowledcare Battery Test Results</h3>
                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <div>
                    <p className="font-medium">Test Conducted:</p>
                    <p className="text-green-700">Yes</p>
                  </div>
                  {batteryTestSummary && (
                    <div>
                      <p className="font-medium">Test Summary:</p>
                      <p className="whitespace-pre-wrap">{batteryTestSummary}</p>
                    </div>
                  )}
                  {batteryTestReportUrl && (
                    <div>
                      <p className="font-medium">Report URL:</p>
                      <p className="text-blue-600 text-sm break-all">{batteryTestReportUrl}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reading Comprehension Level */}
            {atGradeLevelComprehension !== null && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Reading Comprehension Level</h3>
                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <div>
                    <p className="font-medium">At Grade Level Reading Comprehension?</p>
                    <p className={atGradeLevelComprehension ? "text-green-700" : "text-orange-700"}>
                      {atGradeLevelComprehension ? "Yes" : "No"}
                    </p>
                  </div>

                  {atGradeLevelComprehension && comprehensionLevels.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Comprehension Levels:</p>
                      <div className="flex flex-wrap gap-2">
                        {comprehensionLevels.map((level) => (
                          <span key={level} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!atGradeLevelComprehension && currentLevelComprehension.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">At Current Reading Level, Comprehension is:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentLevelComprehension.map((level) => (
                          <span key={level} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {comprehensionObservation && (
                    <div>
                      <p className="font-medium">Observation:</p>
                      <p className="whitespace-pre-wrap">{comprehensionObservation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Notes */}
            {additionalNotes.trim() && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Additional Notes</h3>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="whitespace-pre-wrap">{additionalNotes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button variant="outline" onClick={() => {
              setShowPreview(false);
              if (!isViewMode) {
                onSuccess?.();
              }
            }}>
              Close
            </Button>
            <Button
              onClick={downloadPDF}
              disabled={!studentDetails || !educatorDetails}
              title={!studentDetails || !educatorDetails ? 'Waiting for student and educator information to load...' : ''}
            >
              <Download className="h-4 w-4 mr-2" />
              {!studentDetails || !educatorDetails ? 'Loading...' : 'Download PDF'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

