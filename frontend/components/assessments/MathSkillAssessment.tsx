'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MathSkillAssessmentProps {
  studentId: string;
  assessmentId?: string;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
  onCancel?: () => void;
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
          <p className="text-sm text-gray-600">Answer the following questions about the student's math abilities</p>
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

      {/* Detailed Symptoms */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Math Symptoms</CardTitle>
          <p className="text-sm text-gray-600">Select all symptoms that apply to the student</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(MATH_SYMPTOMS).map(([category, symptoms]) => (
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
              Your math assessment has been saved successfully. You can now download it as PDF.
            </p>
          </DialogHeader>
          
          <div ref={reportRef} className="p-6 bg-white">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-purple-800">Math Skill Assessment</h2>
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
                <div className="bg-green-50 p-3 rounded">
                  <p className="font-medium">Total Symptoms Selected:</p>
                  <p className="text-2xl font-bold text-green-700">
                    {Object.values(selectedSymptoms).filter(val => val).length}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <p className="font-medium">Questions Answered:</p>
                  <p className="text-2xl font-bold text-blue-700">
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
                <div className="bg-gray-50 p-4 rounded">
                  {MATH_QUESTIONS.map(q => 
                    questionAnswers[q.id] && (
                      <div key={q.id} className="mb-2">
                        <p className="font-medium">{q.question}</p>
                        <p className="text-green-700">{questionAnswers[q.id]}</p>
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

