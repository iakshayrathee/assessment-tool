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
import { toast } from '@/lib/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GradeLevelMappingComponent, type GradeLevelMapping } from './GradeLevelMapping';
import { BatteryTestSection } from './BatteryTestSection';
import { MultiConceptMapping, type ConceptPerformance } from './ConceptPerformanceMapping';

interface MathSkillAssessmentProps {
  studentId: string;
  studentGrade?: string;
  assessmentId?: string;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Helper function to determine if geometry should be shown based on grade
function shouldShowGeometry(grade?: string): boolean {
  if (!grade) return true; // Show by default if grade is not available

  const lowerGrade = grade.toLowerCase().trim();

  // Hide geometry for Pre-KG, KG, Grade 1, and Grade 2
  const hideForGrades = [
    'pre-kg', 'prekg', 'pre kg',
    'kg', 'kindergarten',
    'grade 1', 'grade1', '1',
    'grade 2', 'grade2', '2'
  ];

  return !hideForGrades.includes(lowerGrade);
}

const MATH_QUESTIONS = [
  {
    id: 'mathQ1',
    question: 'Does the child understand number concepts?',
    options: ['Yes', 'Partially', 'No']
  },
  {
    id: 'mathQ2',
    question: 'Can the child perform basic operations?',
    options: ['Yes', 'With Help', 'No']
  },
  {
    id: 'mathQ3',
    question: 'Can the child solve word problems?',
    options: ['Yes', 'Sometimes', 'No']
  }
];

const MATH_SYMPTOMS = {
  'Number Sense & Number Identification': [
    { key: 'difficultyIdentifyingNumbers1to10', label: 'Difficulty identifying numbers (1–10)' },
    { key: 'difficultyIdentifyingNumbers1to20', label: 'Difficulty identifying numbers (1–20)' },
    { key: 'difficultyIdentifyingNumbers1to100', label: 'Difficulty identifying numbers (1–100)' },
    { key: 'reversesNumbers', label: 'Reverses numbers (e.g., 6↔9, 2↔5)' },
    { key: 'writesNumbersIncorrectly', label: 'Writes numbers incorrectly' },
    { key: 'difficultySequencingNumbers', label: 'Difficulty sequencing numbers' },
    { key: 'skipsNumbersWhileCounting', label: 'Skips numbers while counting' },
    { key: 'countsSlowlyOrWithEffort', label: 'Counts slowly or with effort' },
    { key: 'troubleWithForwardCounting', label: 'Trouble with forward counting' },
    { key: 'troubleWithBackwardCounting', label: 'Trouble with backward counting' },
    { key: 'difficultyWithSkipCounting', label: 'Difficulty with skip counting' },
    { key: 'doesNotUnderstandQuantity', label: 'Does not understand quantity' },
    { key: 'cannotMatchNumberToQuantity', label: 'Cannot match number to quantity' },
    { key: 'cannotCompareNumbers', label: 'Cannot compare numbers (big/small)' },
    { key: 'difficultyIdentifyingPlaceValue', label: 'Difficulty identifying place value (tens/ones)' },
  ],
  'Basic Operations: Addition & Subtraction': [
    { key: 'strugglesSingleDigitAddition', label: 'Struggles with single-digit addition' },
    { key: 'strugglesSingleDigitSubtraction', label: 'Struggles with single-digit subtraction' },
    { key: 'cannotCarryOver', label: 'Cannot carry over (regrouping)' },
    { key: 'cannotBorrow', label: 'Cannot borrow (regrouping)' },
    { key: 'usesFingerCountingExcessively', label: 'Uses finger counting excessively' },
    { key: 'cannotPerformMentalMath', label: 'Cannot perform mental math' },
    { key: 'doesNotUnderstandPlusMinusSymbols', label: 'Does not understand + or – symbols' },
    { key: 'confusesAdditionSubtraction', label: 'Confuses addition and subtraction' },
    { key: 'difficultyWithWordProblems', label: 'Difficulty with word problems' },
    { key: 'cannotUnderstandRealWorldMath', label: 'Cannot understand real-world math situations' },
  ],
  'Concepts & Pre-Math Skills': [
    { key: 'difficultyUnderstandingPatterns', label: 'Difficulty understanding patterns' },
    { key: 'difficultyFinishingPatterns', label: 'Difficulty finishing patterns' },
    { key: 'troubleIdentifyingShapes', label: 'Trouble identifying shapes' },
    { key: 'troubleSortingObjects', label: 'Trouble sorting objects' },
    { key: 'difficultyInMatching', label: 'Difficulty in matching' },
    { key: 'difficultyWithSpatialConcepts', label: 'Difficulty with spatial concepts (in/out, top/bottom)' },
    { key: 'difficultyUnderstandingMeasurement', label: 'Difficulty in understanding measurement (long/short, heavy/light)' },
    { key: 'difficultyWithTimeConcepts', label: 'Difficulty with time concepts (yesterday/today/tomorrow)' },
    { key: 'difficultyReadingClock', label: 'Difficulty reading a clock' },
  ],
  'Math Fluency & Working Speed': [
    { key: 'verySlowInSolvingProblems', label: 'Very slow in solving math problems' },
    { key: 'frequentCalculationMistakes', label: 'Makes frequent calculation mistakes' },
    { key: 'poorWorkingMemoryForMath', label: 'Poor working memory for math' },
    { key: 'troubleRememberingMathFacts', label: 'Trouble remembering math facts' },
    { key: 'difficultyRememberingSteps', label: 'Difficulty remembering steps in solving a problem' },
    { key: 'needsRepeatedInstructions', label: 'Needs repeated instructions' },
    { key: 'getsConfusedDuringMultiStep', label: 'Gets confused easily during multi-step problems' },
  ],
  'Visual–Spatial & Alignment Issues': [
    { key: 'misalignsNumbersInColumns', label: 'Misaligns numbers in columns' },
    { key: 'writesNumbersOutsideGrid', label: 'Writes numbers outside grid/box' },
    { key: 'poorSpatialOrganization', label: 'Poor spatial organization' },
    { key: 'placesDigitsInWrongOrder', label: 'Places digits in wrong order' },
    { key: 'drawsShapesIncorrectly', label: 'Draws shapes incorrectly' },
    { key: 'cannotVisuallyGroupObjects', label: 'Cannot visually group objects' },
    { key: 'difficultyCopyingMathFromBoard', label: 'Difficulty copying math problems from board' },
  ],
  'Symbol & Concept Confusion': [
    { key: 'confusesMathSymbols', label: 'Confuses math symbols (+, –, ×, =)' },
    { key: 'cannotUnderstandEqualsMeansSameAs', label: 'Cannot understand = means "same as"' },
    { key: 'treatsEqualsAsAnswerComesAfter', label: 'Treats = as "answer comes after"' },
    { key: 'difficultyRememberingOperationRules', label: 'Difficulty remembering operation rules' },
    { key: 'cannotDifferentiateTensOnes', label: 'Cannot differentiate between tens and ones' },
    { key: 'misunderstandsMoreLess', label: 'Misunderstands more/less, greater/smaller' },
  ],
  'Behavioral & Learning Indicators': [
    { key: 'avoidsMathTasks', label: 'Avoids math tasks' },
    { key: 'lowMathConfidence', label: 'Low math confidence' },
    { key: 'givesUpQuickly', label: 'Gives up quickly' },
    { key: 'anxiousDuringMathActivities', label: 'Anxious during math activities' },
    { key: 'needsConstantPrompting', label: 'Needs constant prompting' },
    { key: 'appearsConfusedAfterExplanation', label: 'Appears confused even after verbal explanation' },
    { key: 'poorAttentionDuringMath', label: 'Poor attention during math tasks' },
  ],
};

// Helper functions to extract data from saved assessment
function extractSymptoms(data: any): Record<string, boolean> {
  const symptoms: Record<string, boolean> = {};
  const allSymptomKeys = Object.values(MATH_SYMPTOMS).flat().map(s => s.key);

  allSymptomKeys.forEach(key => {
    if (data[key] === true) {
      symptoms[key] = true;
    }
  });

  return symptoms;
}

function extractQuestionAnswers(data: any): Record<string, string> {
  const answers: Record<string, string> = {};

  MATH_QUESTIONS.forEach(q => {
    if (data[q.id]) {
      answers[q.id] = data[q.id];
    }
  });

  return answers;
}

export function MathSkillAssessment({
  studentId,
  studentGrade,
  assessmentId,
  initialData,
  mode = 'create',
  onSuccess,
  onCancel
}: MathSkillAssessmentProps) {
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

  // NEW: Math Grade Level State
  const [isAtMathGradeLevel, setIsAtMathGradeLevel] = useState<boolean | null>(
    initialData?.isAtMathGradeLevel ?? null
  );
  const [mathFunctionalGradeLevel, setMathFunctionalGradeLevel] = useState(
    initialData?.mathFunctionalGradeLevel || ''
  );
  const [mathPerformanceSummary, setMathPerformanceSummary] = useState(
    initialData?.mathPerformanceSummary || ''
  );
  const [mathGradeLevelMappings, setMathGradeLevelMappings] = useState<GradeLevelMapping[]>(
    initialData?.mathGradeLevelMappings || []
  );
  const [mathGradeLevelObservation, setMathGradeLevelObservation] = useState(
    initialData?.mathGradeLevelObservation || ''
  );

  // NEW: Math Battery Test State
  const [mathBatteryTestConducted, setMathBatteryTestConducted] = useState(
    initialData?.mathBatteryTestConducted || false
  );
  const [mathBatteryTestSummary, setMathBatteryTestSummary] = useState(
    initialData?.mathBatteryTestSummary || ''
  );
  const [mathBatteryTestReportUrl, setMathBatteryTestReportUrl] = useState(
    initialData?.mathBatteryTestReportUrl || ''
  );

  // NEW: Math Concepts Performance State (11 concepts)
  const [mathConcepts, setMathConcepts] = useState<Record<string, ConceptPerformance>>({
    addition: initialData?.additionPerformance || { performance: '', summary: '', errorPattern: '' },
    subtraction: initialData?.subtractionPerformance || { performance: '', summary: '', errorPattern: '' },
    multiplication: initialData?.multiplicationPerformance || { performance: '', summary: '', errorPattern: '' },
    division: initialData?.divisionPerformance || { performance: '', summary: '', errorPattern: '' },
    placeValue: initialData?.placeValuePerformance || { performance: '', summary: '', errorPattern: '' },
    numberLine: initialData?.numberLinePerformance || { performance: '', summary: '', errorPattern: '' },
    fractions: initialData?.fractionsPerformance || { performance: '', summary: '', errorPattern: '' },
    decimals: initialData?.decimalsPerformance || { performance: '', summary: '', errorPattern: '' },
    algebra: initialData?.algebraPerformance || { performance: '', summary: '', errorPattern: '' },
    statementSums: initialData?.statementSumsPerformance || { performance: '', summary: '', errorPattern: '' },
    geometry: initialData?.geometryPerformance || { performance: '', summary: '', errorPattern: '' },
  });

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

        // NEW: Math Grade Level fields
        isAtMathGradeLevel,
        mathFunctionalGradeLevel: isAtMathGradeLevel ? mathFunctionalGradeLevel : null,
        mathPerformanceSummary: isAtMathGradeLevel ? mathPerformanceSummary : null,
        mathGradeLevelMappings: !isAtMathGradeLevel && mathGradeLevelMappings.length > 0
          ? mathGradeLevelMappings
          : null,
        mathGradeLevelObservation: !isAtMathGradeLevel ? mathGradeLevelObservation : null,

        // NEW: Math Battery Test fields
        mathBatteryTestConducted,
        mathBatteryTestSummary: mathBatteryTestConducted ? mathBatteryTestSummary : null,
        mathBatteryTestReportUrl: mathBatteryTestConducted ? mathBatteryTestReportUrl : null,

        // NEW: Math Concepts Performance fields (11 concepts)
        additionPerformance: mathConcepts.addition.performance ? mathConcepts.addition : null,
        subtractionPerformance: mathConcepts.subtraction.performance ? mathConcepts.subtraction : null,
        multiplicationPerformance: mathConcepts.multiplication.performance ? mathConcepts.multiplication : null,
        divisionPerformance: mathConcepts.division.performance ? mathConcepts.division : null,
        placeValuePerformance: mathConcepts.placeValue.performance ? mathConcepts.placeValue : null,
        numberLinePerformance: mathConcepts.numberLine.performance ? mathConcepts.numberLine : null,
        fractionsPerformance: mathConcepts.fractions.performance ? mathConcepts.fractions : null,
        decimalsPerformance: mathConcepts.decimals.performance ? mathConcepts.decimals : null,
        algebraPerformance: mathConcepts.algebra.performance ? mathConcepts.algebra : null,
        statementSumsPerformance: mathConcepts.statementSums.performance ? mathConcepts.statementSums : null,
        geometryPerformance: mathConcepts.geometry.performance ? mathConcepts.geometry : null,
      };

      let response;
      if (mode === 'edit' && assessmentId) {
        response = await apiClient.updateMathSkillAssessment(assessmentId, data);
        toast.success('Math skill assessment updated successfully!');
      } else {
        response = await apiClient.createMathSkillAssessment(data);
        toast.success('Math skill assessment created successfully!');
      }

      // Store the full response data which includes student and specialEducator
      setSavedAssessment(response.data || response);
      setShowPreview(true);
      onSuccess?.();
    } catch (error: any) {
      console.error('Save math assessment error:', error);
      toast.error(error.response?.data?.error || 'Failed to save math assessment');
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
          <CardTitle>Math Assessment Questions</CardTitle>
          <p className="text-sm text-muted-foreground">Answer the following questions about the student's math abilities</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {MATH_QUESTIONS.map((q) => (
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

      {/* NEW: Math Grade Level Identification */}
      <Card>
        <CardHeader>
          <CardTitle>Math Grade Level Identification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-base font-semibold">
              Is Child at Grade Level in Math? *
            </Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isAtMathGradeLevel"
                  checked={isAtMathGradeLevel === true}
                  onChange={() => setIsAtMathGradeLevel(true)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isAtMathGradeLevel"
                  checked={isAtMathGradeLevel === false}
                  onChange={() => setIsAtMathGradeLevel(false)}
                  disabled={isViewMode}
                  className="h-4 w-4"
                />
                <span>No</span>
              </label>
            </div>
          </div>

          {isAtMathGradeLevel === true && (
            <div className="space-y-4 p-4 bg-success/10 rounded-lg">
              <div>
                <Label htmlFor="mathFunctionalGradeLevel">Grade Level *</Label>
                <Input
                  id="mathFunctionalGradeLevel"
                  value={mathFunctionalGradeLevel}
                  onChange={(e) => setMathFunctionalGradeLevel(e.target.value)}
                  placeholder="e.g., Grade 3"
                  disabled={isViewMode}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="mathPerformanceSummary">Performance Summary *</Label>
                <Textarea
                  id="mathPerformanceSummary"
                  value={mathPerformanceSummary}
                  onChange={(e) => setMathPerformanceSummary(e.target.value)}
                  placeholder="Describe the student's math performance at grade level..."
                  disabled={isViewMode}
                  className="mt-1"
                  rows={4}
                />
              </div>
            </div>
          )}

          {isAtMathGradeLevel === false && (
            <div className="space-y-4">
              <GradeLevelMappingComponent
                mappings={mathGradeLevelMappings}
                onChange={setMathGradeLevelMappings}
                maxMappings={4}
                disabled={isViewMode}
                title="Math Grade Level Mapping"
                showSummaryNote={false}
              />
              <div>
                <Label htmlFor="mathGradeLevelObservation">Observation</Label>
                <Textarea
                  id="mathGradeLevelObservation"
                  value={mathGradeLevelObservation}
                  onChange={(e) => setMathGradeLevelObservation(e.target.value)}
                  placeholder="Additional observations about math grade level performance..."
                  disabled={isViewMode}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* NEW: Math Battery Test Section */}
      <BatteryTestSection
        conducted={mathBatteryTestConducted}
        onConductedChange={setMathBatteryTestConducted}
        summary={mathBatteryTestSummary}
        onSummaryChange={setMathBatteryTestSummary}
        reportUrl={mathBatteryTestReportUrl}
        onReportUpload={(file) => {
          console.log('File to upload:', file);
          toast.success('File upload functionality to be implemented');
        }}
        onReportRemove={() => setMathBatteryTestReportUrl('')}
        disabled={isViewMode}
        title="Math Battery Test Results (Optional)"
      />

      {/* NEW: Math Concepts Performance Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>Math Concepts Performance Assessment</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Assess student performance across different math concepts
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Operations */}
          <MultiConceptMapping
            title="Basic Operations"
            concepts={[
              { key: 'addition', label: 'Addition' },
              { key: 'subtraction', label: 'Subtraction' },
              { key: 'multiplication', label: 'Multiplication' },
              { key: 'division', label: 'Division' },
            ]}
            values={mathConcepts}
            onChange={(key, value) => setMathConcepts({ ...mathConcepts, [key]: value })}
            disabled={isViewMode}
            showErrorPattern={true}
          />

          {/* Number & Place Value */}
          <MultiConceptMapping
            title="Number & Place Value"
            concepts={[
              { key: 'placeValue', label: 'Place Value' },
              { key: 'numberLine', label: 'Number Line' },
            ]}
            values={mathConcepts}
            onChange={(key, value) => setMathConcepts({ ...mathConcepts, [key]: value })}
            disabled={isViewMode}
            showErrorPattern={true}
          />

          {/* Fractions & Decimals */}
          <MultiConceptMapping
            title="Fractions & Decimals"
            concepts={[
              { key: 'fractions', label: 'Fractions' },
              { key: 'decimals', label: 'Decimals' },
            ]}
            values={mathConcepts}
            onChange={(key, value) => setMathConcepts({ ...mathConcepts, [key]: value })}
            disabled={isViewMode}
            showErrorPattern={true}
          />

          {/* Higher-Level Concepts */}
          <MultiConceptMapping
            title="Higher-Level Concepts"
            concepts={[
              { key: 'algebra', label: 'Algebra' },
              { key: 'statementSums', label: 'Statement Sums' },
              // Only show Geometry for Grade 3 and above
              ...(shouldShowGeometry(studentGrade) ? [{ key: 'geometry', label: 'Geometry' }] : []),
            ]}
            values={mathConcepts}
            onChange={(key, value) => setMathConcepts({ ...mathConcepts, [key]: value })}
            disabled={isViewMode}
            showErrorPattern={true}
          />
        </CardContent>
      </Card>

      {/* Detailed Symptoms */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Math Symptoms</CardTitle>
          <p className="text-sm text-muted-foreground">Select all symptoms that apply to the student</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(MATH_SYMPTOMS).map(([category, symptoms]) => (
            <Collapsible
              key={category}
              open={openSections[category]}
              onOpenChange={() => toggleSection(category)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/40 rounded-lg hover:bg-muted transition-colors">
                <span className="font-medium text-left">{category}</span>
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
            <p className="text-sm text-muted-foreground">
              Your math assessment has been saved successfully. You can now download it as PDF.
            </p>
          </DialogHeader>

          <div ref={reportRef} className="p-6 bg-background">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Math Skill Assessment</h2>
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
                    {Object.entries(MATH_SYMPTOMS).flatMap(([category, symptoms]) =>
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
                  {MATH_QUESTIONS.map(q =>
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

            {/* Math Grade Level Identification */}
            {isAtMathGradeLevel !== null && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Math Grade Level Identification</h3>
                <div className="bg-muted/40 p-4 rounded space-y-3">
                  <div>
                    <p className="font-medium">Is Child at Grade Level in Math?</p>
                    <p className={isAtMathGradeLevel ? "text-success" : "text-orange-700"}>
                      {isAtMathGradeLevel ? "Yes" : "No"}
                    </p>
                  </div>

                  {isAtMathGradeLevel && mathFunctionalGradeLevel && (
                    <>
                      <div>
                        <p className="font-medium">Grade Level:</p>
                        <p>{mathFunctionalGradeLevel}</p>
                      </div>
                      {mathPerformanceSummary && (
                        <div>
                          <p className="font-medium">Performance Summary:</p>
                          <p className="whitespace-pre-wrap">{mathPerformanceSummary}</p>
                        </div>
                      )}
                    </>
                  )}

                  {!isAtMathGradeLevel && mathGradeLevelMappings && mathGradeLevelMappings.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Grade Level Mappings:</p>
                      <div className="space-y-2">
                        {mathGradeLevelMappings.map((mapping, idx) => (
                          <div key={idx} className="bg-background p-3 rounded border">
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

                  {!isAtMathGradeLevel && mathGradeLevelObservation && (
                    <div>
                      <p className="font-medium">Observation:</p>
                      <p className="whitespace-pre-wrap">{mathGradeLevelObservation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Math Battery Test Results */}
            {mathBatteryTestConducted && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Math Battery Test Results</h3>
                <div className="bg-muted/40 p-4 rounded space-y-3">
                  <div>
                    <p className="font-medium">Test Conducted:</p>
                    <p className="text-success">Yes</p>
                  </div>
                  {mathBatteryTestSummary && (
                    <div>
                      <p className="font-medium">Test Summary:</p>
                      <p className="whitespace-pre-wrap">{mathBatteryTestSummary}</p>
                    </div>
                  )}
                  {mathBatteryTestReportUrl && (
                    <div>
                      <p className="font-medium">Report URL:</p>
                      <p className="text-primary text-sm break-all">{mathBatteryTestReportUrl}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Math Concepts Performance Assessment */}
            {Object.values(mathConcepts).some(concept => concept.performance) && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Math Concepts Performance Assessment</h3>
                <div className="bg-muted/40 p-4 rounded space-y-4">
                  {Object.entries(mathConcepts).map(([key, concept]) =>
                    concept.performance && (
                      <div key={key} className="bg-background p-3 rounded border">
                        <p className="font-semibold text-sm capitalize mb-2">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="font-medium">Performance Level:</span>{' '}
                            <span className={
                              concept.performance === 'Independent' ? 'text-success' :
                                concept.performance === 'Instructional' ? 'text-primary' :
                                  concept.performance === 'Frustration' ? 'text-destructive' :
                                    'text-foreground'
                            }>
                              {concept.performance}
                            </span>
                          </div>
                          {concept.summary && (
                            <div>
                              <span className="font-medium">Summary:</span> {concept.summary}
                            </div>
                          )}
                          {concept.errorPattern && (
                            <div>
                              <span className="font-medium">Error Pattern:</span> {concept.errorPattern}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}
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

