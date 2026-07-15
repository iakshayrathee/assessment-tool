'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Download, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WritingSkillAssessmentProps {
  studentId: string;
  studentGrade?: string;
  assessmentId?: string;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const WRITING_QUESTIONS = [
  {
    id: 'writingQ1',
    question: 'Can the child write legibly?',
    options: ['Yes', 'With Effort', 'No']
  },
  {
    id: 'writingQ2',
    question: 'Does the child use proper letter formation?',
    options: ['Always', 'Sometimes', 'Rarely']
  },
  {
    id: 'writingQ3',
    question: 'Can the child compose sentences?',
    options: ['Independently', 'With Help', 'Not Yet']
  }
];

const WRITING_SYMPTOMS = {
  'Fine Motor & Grip Issues': [
    { key: 'incorrectPencilGrip', label: 'Incorrect pencil grip' },
    { key: 'holdsPencilTooTightly', label: 'Holds pencil too tightly' },
    { key: 'holdsPencilTooLoosely', label: 'Holds pencil too loosely' },
    { key: 'writesExcessivePressure', label: 'Writes with excessive pressure' },
    { key: 'writesLightPressure', label: 'Writes with very light pressure' },
    { key: 'wristFingerPainComplaints', label: 'Wrist or finger pain complaints' },
    { key: 'slowFineMotorSpeed', label: 'Slow fine motor speed' },
    { key: 'fatigueAfterShortWriting', label: 'Fatigue after short writing task' },
  ],
  'Letter Formation Issues': [
    { key: 'incorrectLetterFormation', label: 'Incorrect letter formation' },
    { key: 'reversals', label: 'Reversals (b/d, p/q, m/w, n/u, etc.)' },
    { key: 'difficultiesFormingCurvesDiagonals', label: 'Difficulties forming curves or diagonals' },
    { key: 'lettersWrittenMirrorImage', label: 'Letters written in mirror image' },
    { key: 'poorStrokeSequence', label: 'Poor stroke sequence' },
    { key: 'capitalsInsertedBetweenWords', label: 'Capitals inserted in between words' },
    { key: 'difficultyCopyingLetters', label: 'Difficulty copying letters accurately' },
  ],
  'Spacing, Alignment & Presentation': [
    { key: 'poorSpacingBetweenLetters', label: 'Poor spacing between letters' },
    { key: 'poorSpacingBetweenWords', label: 'Poor spacing between words' },
    { key: 'writesOutsideLine', label: 'Writes outside the line' },
    { key: 'difficultyMaintainingBaseline', label: 'Difficulty maintaining baseline' },
    { key: 'unevenLetterSize', label: 'Uneven letter size' },
    { key: 'inconsistentSpacingAcrossPage', label: 'Inconsistent spacing across the page' },
    { key: 'crowdedWriting', label: 'Crowded writing' },
    { key: 'tooMuchSpaceBetweenLetters', label: 'Too much space between letters' },
    { key: 'floatingLettersAboveLine', label: 'Floating letters above the line' },
  ],
  'Handwriting Fluency': [
    { key: 'verySlowWriting', label: 'Very slow writing' },
    { key: 'writesTooFastManyErrors', label: 'Writes too fast with many errors' },
    { key: 'poorHandwritingEndurance', label: 'Poor handwriting endurance' },
    { key: 'choppyWriting', label: 'Choppy writing' },
    { key: 'inconsistentPace', label: 'Inconsistent pace' },
    { key: 'repeatedErasing', label: 'Repeated erasing' },
    { key: 'frequentCorrections', label: 'Frequent corrections' },
  ],
  'Dictation & Spelling': [
    { key: 'difficultyWritingDictatedLetters', label: 'Difficulty writing dictated letters' },
    { key: 'difficultyWritingDictatedWords', label: 'Difficulty writing dictated words' },
    { key: 'spellsPhonetically', label: 'Spells phonetically but incorrectly' },
    { key: 'omitsLettersInSpelling', label: 'Omits letters in spelling' },
    { key: 'addsExtraLetters', label: 'Adds extra letters' },
    { key: 'substitutesLettersOrSounds', label: 'Substitutes letters or sounds' },
    { key: 'confusesVowelSounds', label: 'Confuses vowel sounds' },
    { key: 'troubleEncodingCVC', label: 'Trouble encoding CVC words' },
    { key: 'troubleEncodingBlendsDigraphs', label: 'Trouble encoding blends/digraphs' },
  ],
  'Sentence Formation / Written Expression': [
    { key: 'cannotConstructSimpleSentences', label: 'Cannot construct simple sentences' },
    { key: 'writesOnlySingleWords', label: 'Writes only single words' },
    { key: 'strugglesExpandSentences', label: 'Struggles to expand sentences' },
    { key: 'poorGrammarUsage', label: 'Poor grammar usage' },
    { key: 'writesIncompleteSentences', label: 'Writes incomplete sentences' },
    { key: 'confusingSentenceOrder', label: 'Confusing sentence order' },
    { key: 'difficultyExpressingIdeas', label: 'Difficulty expressing ideas' },
    { key: 'avoidsWrittenTasks', label: 'Avoids written tasks' },
    { key: 'needsVerbalPromptsToWrite', label: 'Needs verbal prompts to write' },
  ],
  'Copying Skills': [
    { key: 'difficultyCopyingFromBoard', label: 'Difficulty copying from board' },
    { key: 'difficultyCopyingFromBook', label: 'Difficulty copying from book' },
    { key: 'slowCopying', label: 'Slow copying' },
    { key: 'skipsWordsOrLettersWhenCopying', label: 'Skips words or letters when copying' },
    { key: 'copiesInaccurately', label: 'Copies inaccurately' },
    { key: 'looksAwayFrequentlyWhileCopying', label: 'Looks away frequently while copying' },
  ],
  'Organization & Structure': [
    { key: 'writingDisorganized', label: 'Writing is disorganized' },
    { key: 'thoughtsNotLogicallySequenced', label: 'Thoughts not logically sequenced' },
    { key: 'cannotPlanWriting', label: 'Cannot plan writing' },
    { key: 'beginsWritingRandomAreasOnPage', label: 'Begins writing in random areas on page' },
    { key: 'noConceptOfMargins', label: 'No concept of margins' },
    { key: 'paragraphingDifficulty', label: 'Paragraphing difficulty (Grade-level kids)' },
  ],
  'Behavioral / Self-Management Issues': [
    { key: 'avoidsWritingActivities', label: 'Avoids writing activities' },
    { key: 'complainsWritingIsHard', label: 'Complains writing is hard' },
    { key: 'getsFrustratedQuickly', label: 'Gets frustrated quickly' },
    { key: 'lowWritingStamina', label: 'Low writing stamina' },
    { key: 'givesUpInMiddleOfTask', label: 'Gives up in the middle of task' },
    { key: 'lowConfidenceWriting', label: 'Low confidence' },
    { key: 'inconsistentPerformanceAcrossDays', label: 'Inconsistent performance across days' },
  ],
};

// Helper functions to extract data from saved assessment
function extractSymptoms(data: any): Record<string, boolean> {
  const symptoms: Record<string, boolean> = {};
  const allSymptomKeys = Object.values(WRITING_SYMPTOMS).flat().map(s => s.key);

  allSymptomKeys.forEach(key => {
    if (data[key] === true) {
      symptoms[key] = true;
    }
  });

  return symptoms;
}

function extractQuestionAnswers(data: any): Record<string, string> {
  const answers: Record<string, string> = {};

  WRITING_QUESTIONS.forEach(q => {
    if (data[q.id]) {
      answers[q.id] = data[q.id];
    }
  });

  return answers;
}

export function WritingSkillAssessment({
  studentId,
  assessmentId,
  initialData,
  mode = 'create',
  onSuccess,
  onCancel
}: WritingSkillAssessmentProps) {
  const { t } = useTranslation('assessments');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getOptionLabel = (opt: string) => {
    const keyMap: Record<string, string> = {
      'yes': 'yes',
      'no': 'no',
      'always': 'always',
      'sometimes': 'sometimes',
      'rarely': 'rarely',
      'never': 'never',
      'with effort': 'withEffort',
      'independently': 'independently',
      'with help': 'withHelp',
      'not yet': 'notYet',
      'partially': 'partially'
    };
    const cleanOpt = opt.toLowerCase().trim();
    const key = keyMap[cleanOpt] || cleanOpt;
    return t(key, opt);
  };
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

  // NEW: Near Copying Skills State
  const [hasNearCopyingSkills, setHasNearCopyingSkills] = useState<boolean | null>(
    initialData?.hasNearCopyingSkills ?? null
  );
  const [nearCopyingLevels, setNearCopyingLevels] = useState<string[]>(
    initialData?.nearCopyingLevels || []
  );
  const [nearCopyingObservation, setNearCopyingObservation] = useState(
    initialData?.nearCopyingObservation || ''
  );

  // NEW: Board Copying Skills State
  const [hasBoardCopyingSkills, setHasBoardCopyingSkills] = useState<boolean | null>(
    initialData?.hasBoardCopyingSkills ?? null
  );
  const [boardCopyingLevels, setBoardCopyingLevels] = useState<string[]>(
    initialData?.boardCopyingLevels || []
  );
  const [boardCopyingSpeedObservation, setBoardCopyingSpeedObservation] = useState(
    initialData?.boardCopyingSpeedObservation || ''
  );
  const [visualTrackingDifficulty, setVisualTrackingDifficulty] = useState(
    initialData?.visualTrackingDifficulty || false
  );
  const [omissionSkippingFlag, setOmissionSkippingFlag] = useState(
    initialData?.omissionSkippingFlag || false
  );
  const [boardCopyingObservation, setBoardCopyingObservation] = useState(
    initialData?.boardCopyingObservation || ''
  );

  // NEW: Punctuation Skills State (Legacy - kept for backward compatibility)
  const [punctuationSkills, setPunctuationSkills] = useState({
    usesCapitalLetters: initialData?.usesCapitalLetters || false,
    usesFullStop: initialData?.usesFullStop || false,
    usesQuestionMark: initialData?.usesQuestionMark || false,
    usesComma: initialData?.usesComma || false,
    usesApostrophe: initialData?.usesApostrophe || false,
  });
  const [punctuationOther, setPunctuationOther] = useState(
    initialData?.punctuationOther || ''
  );
  const [punctuationObservation, setPunctuationObservation] = useState(
    initialData?.punctuationObservation || ''
  );

  // NEW: Punctuation Skills (for Copying)
  const [punctuationSkillsCopying, setPunctuationSkillsCopying] = useState({
    usesCapitalLetters: initialData?.usesCapitalLettersCopying || false,
    usesFullStop: initialData?.usesFullStopCopying || false,
    usesQuestionMark: initialData?.usesQuestionMarkCopying || false,
    usesComma: initialData?.usesCommaCopying || false,
    usesApostrophe: initialData?.usesApostropheCopying || false,
  });
  const [punctuationOtherCopying, setPunctuationOtherCopying] = useState(
    initialData?.punctuationOtherCopying || ''
  );
  const [punctuationObservationCopying, setPunctuationObservationCopying] = useState(
    initialData?.punctuationObservationCopying || ''
  );

  // NEW: Punctuation Skills (in Creative Writing)
  const [punctuationSkillsCreative, setPunctuationSkillsCreative] = useState({
    usesCapitalLetters: initialData?.usesCapitalLettersCreative || false,
    usesFullStop: initialData?.usesFullStopCreative || false,
    usesQuestionMark: initialData?.usesQuestionMarkCreative || false,
    usesComma: initialData?.usesCommaCreative || false,
    usesApostrophe: initialData?.usesApostropheCreative || false,
  });
  const [punctuationOtherCreative, setPunctuationOtherCreative] = useState(
    initialData?.punctuationOtherCreative || ''
  );
  const [punctuationObservationCreative, setPunctuationObservationCreative] = useState(
    initialData?.punctuationObservationCreative || ''
  );

  // NEW: Spelling Observations State
  const [spellingStrengthSummary, setSpellingStrengthSummary] = useState(
    initialData?.spellingStrengthSummary || ''
  );
  const [spellingErrorPatternObservation, setSpellingErrorPatternObservation] = useState(
    initialData?.spellingErrorPatternObservation || ''
  );

  // NEW: Creative Writing Summary
  const [creativeWritingSummary, setCreativeWritingSummary] = useState(
    initialData?.creativeWritingSummary || ''
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

        // NEW: Near Copying Skills
        hasNearCopyingSkills,
        nearCopyingLevels: hasNearCopyingSkills ? nearCopyingLevels : [],
        nearCopyingObservation: hasNearCopyingSkills ? nearCopyingObservation : null,

        // NEW: Board Copying Skills
        hasBoardCopyingSkills,
        boardCopyingLevels: hasBoardCopyingSkills ? boardCopyingLevels : [],
        boardCopyingSpeedObservation: hasBoardCopyingSkills ? boardCopyingSpeedObservation : null,
        visualTrackingDifficulty,
        omissionSkippingFlag,
        boardCopyingObservation: hasBoardCopyingSkills ? boardCopyingObservation : null,

        // NEW: Punctuation Skills (Legacy - for backward compatibility)
        ...punctuationSkills,
        punctuationOther,
        punctuationObservation,

        // NEW: Punctuation Skills (for Copying)
        usesCapitalLettersCopying: punctuationSkillsCopying.usesCapitalLetters,
        usesFullStopCopying: punctuationSkillsCopying.usesFullStop,
        usesQuestionMarkCopying: punctuationSkillsCopying.usesQuestionMark,
        usesCommaCopying: punctuationSkillsCopying.usesComma,
        usesApostropheCopying: punctuationSkillsCopying.usesApostrophe,
        punctuationOtherCopying,
        punctuationObservationCopying,

        // NEW: Punctuation Skills (in Creative Writing)
        usesCapitalLettersCreative: punctuationSkillsCreative.usesCapitalLetters,
        usesFullStopCreative: punctuationSkillsCreative.usesFullStop,
        usesQuestionMarkCreative: punctuationSkillsCreative.usesQuestionMark,
        usesCommaCreative: punctuationSkillsCreative.usesComma,
        usesApostropheCreative: punctuationSkillsCreative.usesApostrophe,
        punctuationOtherCreative,
        punctuationObservationCreative,

        // NEW: Spelling Observations
        spellingStrengthSummary,
        spellingErrorPatternObservation,

        // NEW: Creative Writing Summary
        creativeWritingSummary,
      };

      let response;
      if (mode === 'edit' && assessmentId) {
        response = await apiClient.updateWritingSkillAssessment(assessmentId, data);
        toast.success(t('assessmentSaved'));
      } else {
        response = await apiClient.createWritingSkillAssessment(data);
        toast.success(t('assessmentSaved'));
      }

      // Store the full response data which includes student and specialEducator
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
      {/* Assessment Questions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('writingAssessmentQuestions')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('selectStudentDesc')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {WRITING_QUESTIONS.map((q) => (
            <div key={q.id} className="space-y-2">
              <Label className="text-sm font-medium">{t(q.id, q.question)}</Label>
              <Select
                value={questionAnswers[q.id] || ''}
                onValueChange={(value) => setQuestionAnswers(prev => ({ ...prev, [q.id]: value }))}
                disabled={isViewMode}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectStudentDesc')} />
                </SelectTrigger>
                <SelectContent>
                  {q.options.map((option) => (
                    <SelectItem key={option} value={option}>{getOptionLabel(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* NEW: Near Copying Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Near Copying Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Has Near Copying Skills? *</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={hasNearCopyingSkills === true}
                  onChange={() => setHasNearCopyingSkills(true)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={hasNearCopyingSkills === false}
                  onChange={() => setHasNearCopyingSkills(false)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {hasNearCopyingSkills === true && (
            <div className="space-y-3 p-4 bg-success/10 rounded-lg">
              <Label className="text-sm font-semibold">Copying Levels (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3">
                {['Letter', 'Word', 'Phrase', 'Sentence'].map((level) => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={nearCopyingLevels.includes(level)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNearCopyingLevels([...nearCopyingLevels, level]);
                        } else {
                          setNearCopyingLevels(nearCopyingLevels.filter((l) => l !== level));
                        }
                      }}
                      disabled={isViewMode}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{level}</span>
                  </label>
                ))}
              </div>
              <div>
                <Label htmlFor="nearCopyingObservation">Observation</Label>
                <Textarea
                  id="nearCopyingObservation"
                  value={nearCopyingObservation}
                  onChange={(e) => setNearCopyingObservation(e.target.value)}
                  placeholder="Observations about near copying skills..."
                  disabled={isViewMode}
                  rows={2}
                />
              </div>
            </div>
          )}

          {hasNearCopyingSkills === false && (
            <div className="space-y-3 p-4 bg-destructive/10 rounded-lg">
              <Label htmlFor="nearCopyingNoObservation">Observation (Mandatory) *</Label>
              <Textarea
                id="nearCopyingNoObservation"
                value={nearCopyingObservation}
                onChange={(e) => setNearCopyingObservation(e.target.value)}
                placeholder="Please explain the difficulty with near copying skills..."
                disabled={isViewMode}
                rows={3}
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* NEW: Board Copying Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Board Copying Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-semibold">Has Board Copying Skills? *</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={hasBoardCopyingSkills === true}
                  onChange={() => setHasBoardCopyingSkills(true)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={hasBoardCopyingSkills === false}
                  onChange={() => setHasBoardCopyingSkills(false)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {hasBoardCopyingSkills === true && (
            <div className="space-y-4 p-4 bg-success/10 rounded-lg">
              <div>
                <Label className="text-sm font-semibold">Copying Levels (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {['Letter', 'Word', 'Phrase', 'Sentence', 'Paragraph'].map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={boardCopyingLevels.includes(level)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBoardCopyingLevels([...boardCopyingLevels, level]);
                          } else {
                            setBoardCopyingLevels(boardCopyingLevels.filter((l) => l !== level));
                          }
                        }}
                        disabled={isViewMode}
                        className="h-4 w-4"
                      />
                      <span className="text-sm">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="boardCopyingSpeedObservation">Speed Observation</Label>
                <Textarea
                  id="boardCopyingSpeedObservation"
                  value={boardCopyingSpeedObservation}
                  onChange={(e) => setBoardCopyingSpeedObservation(e.target.value)}
                  placeholder="Observations about copying speed..."
                  disabled={isViewMode}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visualTrackingDifficulty}
                    onChange={(e) => setVisualTrackingDifficulty(e.target.checked)}
                    disabled={isViewMode}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Visual Tracking Difficulty</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={omissionSkippingFlag}
                    onChange={(e) => setOmissionSkippingFlag(e.target.checked)}
                    disabled={isViewMode}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">Omission/Skipping Flag</span>
                </label>
              </div>

              <div>
                <Label htmlFor="boardCopyingObservation">Overall Observation</Label>
                <Textarea
                  id="boardCopyingObservation"
                  value={boardCopyingObservation}
                  onChange={(e) => setBoardCopyingObservation(e.target.value)}
                  placeholder="Overall observations about board copying..."
                  disabled={isViewMode}
                  rows={2}
                />
              </div>
            </div>
          )}

          {hasBoardCopyingSkills === false && (
            <div className="space-y-3 p-4 bg-destructive/10 rounded-lg">
              <Label htmlFor="boardCopyingNoObservation">Observation (Mandatory) *</Label>
              <Textarea
                id="boardCopyingNoObservation"
                value={boardCopyingObservation}
                onChange={(e) => setBoardCopyingObservation(e.target.value)}
                placeholder="Please explain the difficulty with board copying skills..."
                disabled={isViewMode}
                rows={3}
                required
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* NEW: Punctuation Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Punctuation Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="text-sm font-semibold">Punctuation Marks Used (Select all that apply)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={punctuationSkills.usesCapitalLetters}
                onChange={(e) => setPunctuationSkills({ ...punctuationSkills, usesCapitalLetters: e.target.checked })}
                disabled={isViewMode}
                className="h-4 w-4"
              />
              <span className="text-sm">Capital Letters</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={punctuationSkills.usesFullStop}
                onChange={(e) => setPunctuationSkills({ ...punctuationSkills, usesFullStop: e.target.checked })}
                disabled={isViewMode}
                className="h-4 w-4"
              />
              <span className="text-sm">Full Stop (.)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={punctuationSkills.usesQuestionMark}
                onChange={(e) => setPunctuationSkills({ ...punctuationSkills, usesQuestionMark: e.target.checked })}
                disabled={isViewMode}
                className="h-4 w-4"
              />
              <span className="text-sm">Question Mark (?)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={punctuationSkills.usesComma}
                onChange={(e) => setPunctuationSkills({ ...punctuationSkills, usesComma: e.target.checked })}
                disabled={isViewMode}
                className="h-4 w-4"
              />
              <span className="text-sm">Comma (,)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={punctuationSkills.usesApostrophe}
                onChange={(e) => setPunctuationSkills({ ...punctuationSkills, usesApostrophe: e.target.checked })}
                disabled={isViewMode}
                className="h-4 w-4"
              />
              <span className="text-sm">Apostrophe (')</span>
            </label>
          </div>

          <div>
            <Label htmlFor="punctuationOther">Other Punctuation</Label>
            <Input
              id="punctuationOther"
              value={punctuationOther}
              onChange={(e) => setPunctuationOther(e.target.value)}
              placeholder="e.g., Exclamation mark, Semicolon, etc."
              disabled={isViewMode}
            />
          </div>

          <div>
            <Label htmlFor="punctuationObservation">Observation</Label>
            <Textarea
              id="punctuationObservation"
              value={punctuationObservation}
              onChange={(e) => setPunctuationObservation(e.target.value)}
              placeholder="Observations about punctuation usage..."
              disabled={isViewMode}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* NEW: Punctuation Skills (for Copying) */}
      <Card>
        <CardHeader>
          <CardTitle>Punctuation Skills (in Creative Writing)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Label className="text-sm font-semibold">Punctuation Marks Used (Select all that apply)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={punctuationSkillsCreative.usesCapitalLetters}
                onChange={(e) => setPunctuationSkillsCreative({ ...punctuationSkillsCreative, usesCapitalLetters: e.target.checked })}
                disabled={isViewMode}
                className="h-4 w-4"
              />
              <span className="text-sm">Capital Letters</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={punctuationSkillsCreative.usesFullStop}
                onChange={(e) => setPunctuationSkillsCreative({ ...punctuationSkillsCreative, usesFullStop: e.target.checked })}
                disabled={isViewMode}
                className="h-4 w-4"
              />
              <span className="text-sm">Full Stop (.)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={punctuationSkillsCreative.usesQuestionMark}
                onChange={(e) => setPunctuationSkillsCreative({ ...punctuationSkillsCreative, usesQuestionMark: e.target.checked })}
                disabled={isViewMode}
                className="h-4 w-4"
              />
              <span className="text-sm">Question Mark (?)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={punctuationSkillsCreative.usesComma}
                onChange={(e) => setPunctuationSkillsCreative({ ...punctuationSkillsCreative, usesComma: e.target.checked })}
                disabled={isViewMode}
                className="h-4 w-4"
              />
              <span className="text-sm">Comma (,)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={punctuationSkillsCreative.usesApostrophe}
                onChange={(e) => setPunctuationSkillsCreative({ ...punctuationSkillsCreative, usesApostrophe: e.target.checked })}
                disabled={isViewMode}
                className="h-4 w-4"
              />
              <span className="text-sm">Apostrophe (')</span>
            </label>
          </div>

          <div>
            <Label htmlFor="punctuationOtherCreative">Other (Please specify)</Label>
            <Input
              id="punctuationOtherCreative"
              value={punctuationOtherCreative}
              onChange={(e) => setPunctuationOtherCreative(e.target.value)}
              disabled={isViewMode}
              placeholder="e.g., Semicolon, Colon, etc."
            />
          </div>

          <div>
            <Label htmlFor="punctuationObservationCreative">Observation Summary</Label>
            <Textarea
              id="punctuationObservationCreative"
              value={punctuationObservationCreative}
              onChange={(e) => setPunctuationObservationCreative(e.target.value)}
              disabled={isViewMode}
              placeholder="Describe punctuation usage patterns in creative writing..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>


      {/* NEW: Spelling Observations */}
      <Card>
        <CardHeader>
          <CardTitle>Spelling Observations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="spellingStrengthSummary">Spelling Strength Summary</Label>
            <Textarea
              id="spellingStrengthSummary"
              value={spellingStrengthSummary}
              onChange={(e) => setSpellingStrengthSummary(e.target.value)}
              placeholder="Describe the student's spelling strengths..."
              disabled={isViewMode}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="spellingErrorPatternObservation">Error Pattern Observation</Label>
            <Textarea
              id="spellingErrorPatternObservation"
              value={spellingErrorPatternObservation}
              onChange={(e) => setSpellingErrorPatternObservation(e.target.value)}
              placeholder="Document common spelling error patterns..."
              disabled={isViewMode}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* NEW: Creative Writing */}
      <Card>
        <CardHeader>
          <CardTitle>Creative Writing</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="creativeWritingSummary">Summary</Label>
            <Textarea
              id="creativeWritingSummary"
              value={creativeWritingSummary}
              onChange={(e) => setCreativeWritingSummary(e.target.value)}
              placeholder="Provide a summary of the student's creative writing abilities..."
              disabled={isViewMode}
              rows={5}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Detailed Symptoms */}
      <Card>
        <CardHeader>
          <CardTitle>{t('detailedWritingSymptoms')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('selectSymptomsDesc')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(WRITING_SYMPTOMS).map(([category, symptoms]) => (
            <Collapsible
              key={category}
              open={openSections[category]}
              onOpenChange={() => toggleSection(category)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/40 rounded-lg hover:bg-muted transition-colors">
                <span className="font-medium text-left">{t('category.' + category, category)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
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
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-blue-500"
                      />
                      <Label
                        htmlFor={symptom.key}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {t('symptom.' + symptom.key, symptom.label)}
                      </Label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}

          <div className="pt-4">
            <Label htmlFor="additionalNotes">{t('additionalNotes')}</Label>
            <Textarea
              id="additionalNotes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder={t('additionalNotesPlaceholder')}
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
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? t('savingAssessment') : mode === 'edit' ? t('updateAssessment') : t('saveAssessment')}
          </Button>
        </div>
      )}

      {isViewMode && (
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('close')}
          </Button>
          <Button onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            {t('viewReport')}
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('writingAssessmentReport')}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {t('assessmentPreview')}
            </p>
          </DialogHeader>

          <div ref={reportRef} className="p-6 bg-background">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Writing Skill Assessment</h2>
              <p className="text-muted-foreground">Assessment Date: {new Date().toLocaleDateString()}</p>

              {/* Student and Educator Details */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-primary/10 p-3 rounded">
                  <h4 className="font-semibold text-primary">Student Information</h4>
                  {studentDetails ? (
                    <>
                      <p><span className="font-medium">Name:</span> {studentDetails.fullName || 'N/A'}</p>
                      <p><span className="font-medium">Grade:</span> {studentDetails.grade || 'N/A'}</p>
                      {studentDetails.age && <p><span className="font-medium">Age:</span> {studentDetails.age}</p>}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Loading student information...</p>
                  )}
                </div>

                <div className="bg-success/10 p-3 rounded">
                  <h4 className="font-semibold text-foreground">Special Educator Information</h4>
                  {educatorDetails ? (
                    <>
                      <p><span className="font-medium">Name:</span> {educatorDetails.fullName || 'N/A'}</p>
                      <p><span className="font-medium">Role:</span> Special Educator</p>
                      <p><span className="font-medium">Date & Time:</span> {new Date().toLocaleString()}</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Loading educator information...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Assessment Summary */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Assessment Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-success/10 p-3 rounded">
                  <p className="font-medium">Total Symptoms Selected:</p>
                  <p className="text-2xl font-bold text-success">
                    {Object.values(selectedSymptoms).filter(val => val).length}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded">
                  <p className="font-medium">Questions Answered:</p>
                  <p className="text-2xl font-bold text-primary">
                    {Object.values(questionAnswers).filter(val => val && val.trim()).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Symptoms */}
            {Object.values(selectedSymptoms).some(val => val) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Selected Symptoms</h3>
                <div className="bg-muted/40 p-4 rounded">
                  <ul className="list-disc list-inside space-y-1">
                    {Object.entries(WRITING_SYMPTOMS).flatMap(([category, symptoms]) =>
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
                <div className="bg-muted/40 p-4 rounded">
                  {WRITING_QUESTIONS.map(q =>
                    questionAnswers[q.id] && (
                      <div key={q.id} className="mb-2">
                        <p className="font-medium">{q.question}</p>
                        <p className="text-success">{questionAnswers[q.id]}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Near Copying Skills */}
            {hasNearCopyingSkills !== null && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Near Copying Skills</h3>
                <div className="bg-muted/40 p-4 rounded space-y-3">
                  <div>
                    <p className="font-medium">Has Near Copying Skills?</p>
                    <p className={hasNearCopyingSkills ? "text-success" : "text-orange-700"}>
                      {hasNearCopyingSkills ? "Yes" : "No"}
                    </p>
                  </div>

                  {hasNearCopyingSkills && nearCopyingLevels.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Copying Levels:</p>
                      <div className="flex flex-wrap gap-2">
                        {nearCopyingLevels.map((level) => (
                          <span key={level} className="bg-success/10 text-foreground px-3 py-1 rounded-full text-sm">
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasNearCopyingSkills && nearCopyingObservation && (
                    <div>
                      <p className="font-medium">Observation:</p>
                      <p className="whitespace-pre-wrap">{nearCopyingObservation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Board Copying Skills */}
            {hasBoardCopyingSkills !== null && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Board Copying Skills</h3>
                <div className="bg-muted/40 p-4 rounded space-y-3">
                  <div>
                    <p className="font-medium">Has Board Copying Skills?</p>
                    <p className={hasBoardCopyingSkills ? "text-success" : "text-orange-700"}>
                      {hasBoardCopyingSkills ? "Yes" : "No"}
                    </p>
                  </div>

                  {hasBoardCopyingSkills && boardCopyingLevels.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Copying Levels:</p>
                      <div className="flex flex-wrap gap-2">
                        {boardCopyingLevels.map((level) => (
                          <span key={level} className="bg-success/10 text-foreground px-3 py-1 rounded-full text-sm">
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {hasBoardCopyingSkills && boardCopyingSpeedObservation && (
                    <div>
                      <p className="font-medium">Speed Observation:</p>
                      <p className="whitespace-pre-wrap">{boardCopyingSpeedObservation}</p>
                    </div>
                  )}

                  {hasBoardCopyingSkills && (visualTrackingDifficulty || omissionSkippingFlag) && (
                    <div>
                      <p className="font-medium mb-2">Flags:</p>
                      <div className="flex flex-wrap gap-2">
                        {visualTrackingDifficulty && (
                          <span className="bg-destructive/10 text-foreground px-3 py-1 rounded-full text-sm">
                            Visual Tracking Difficulty
                          </span>
                        )}
                        {omissionSkippingFlag && (
                          <span className="bg-destructive/10 text-foreground px-3 py-1 rounded-full text-sm">
                            Omission/Skipping Flag
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {hasBoardCopyingSkills && boardCopyingObservation && (
                    <div>
                      <p className="font-medium">Overall Observation:</p>
                      <p className="whitespace-pre-wrap">{boardCopyingObservation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Punctuation Skills */}
            {(Object.values(punctuationSkills).some(val => val) || punctuationOther || punctuationObservation) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Punctuation Skills</h3>
                <div className="bg-muted/40 p-4 rounded space-y-3">
                  {Object.values(punctuationSkills).some(val => val) && (
                    <div>
                      <p className="font-medium mb-2">Punctuation Marks Used:</p>
                      <div className="flex flex-wrap gap-2">
                        {punctuationSkills.usesCapitalLetters && (
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                            Capital Letters
                          </span>
                        )}
                        {punctuationSkills.usesFullStop && (
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                            Full Stop (.)
                          </span>
                        )}
                        {punctuationSkills.usesQuestionMark && (
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                            Question Mark (?)
                          </span>
                        )}
                        {punctuationSkills.usesComma && (
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                            Comma (,)
                          </span>
                        )}
                        {punctuationSkills.usesApostrophe && (
                          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                            Apostrophe (')
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {punctuationOther && (
                    <div>
                      <p className="font-medium">Other Punctuation:</p>
                      <p>{punctuationOther}</p>
                    </div>
                  )}

                  {punctuationObservation && (
                    <div>
                      <p className="font-medium">Observation:</p>
                      <p className="whitespace-pre-wrap">{punctuationObservation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Spelling Observations */}
            {(spellingStrengthSummary || spellingErrorPatternObservation) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Spelling Observations</h3>
                <div className="bg-muted/40 p-4 rounded space-y-3">
                  {spellingStrengthSummary && (
                    <div>
                      <p className="font-medium">Spelling Strength Summary:</p>
                      <p className="whitespace-pre-wrap">{spellingStrengthSummary}</p>
                    </div>
                  )}
                  {spellingErrorPatternObservation && (
                    <div>
                      <p className="font-medium">Error Pattern Observation:</p>
                      <p className="whitespace-pre-wrap">{spellingErrorPatternObservation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Creative Writing */}
            {creativeWritingSummary && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Creative Writing</h3>
                <div className="bg-muted/40 p-4 rounded">
                  <p className="whitespace-pre-wrap">{creativeWritingSummary}</p>
                </div>
              </div>
            )}

            {/* Additional Notes */}
            {additionalNotes.trim() && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Additional Notes</h3>
                <div className="bg-muted/40 p-4 rounded">
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
              {t('close')}
            </Button>
            <Button
              onClick={downloadPDF}
              disabled={!studentDetails || !educatorDetails}
              title={!studentDetails || !educatorDetails ? 'Waiting for student and educator information to load...' : ''}
            >
              <Download className="h-4 w-4 mr-2" />
              {!studentDetails || !educatorDetails ? t('loading', { ns: 'educator' }) : t('downloadPDF')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


