'use client';

import { useState } from 'react';
import { useEducatorStudents } from '@/hooks/useEducator';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BookOpen, PenTool, Calculator, FileText, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { FormalAssessmentForm } from '@/components/assessments/FormalAssessmentForm';
import { ReadingSkillAssessment } from '@/components/assessments/ReadingSkillAssessment';
import { WritingSkillAssessment } from '@/components/assessments/WritingSkillAssessment';
import { MathSkillAssessment } from '@/components/assessments/MathSkillAssessment';
import { StudentSelectionModal } from '@/components/assessments/StudentSelectionModal';

export default function AssessmentsPage() {
  const { user } = useAuth();
  const { students, isLoading: studentsLoading } = useEducatorStudents();
  
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [assessmentTab, setAssessmentTab] = useState('formal');
  const [showFormalForm, setShowFormalForm] = useState(false);
  const [showSkillAssessment, setShowSkillAssessment] = useState<'reading' | 'writing' | 'math' | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const selectedStudent = students?.find(s => s.id === selectedStudentId);

  return (
    <div className="max-w-7xl mx-auto p-6 pb-12">
      {/* Header with student selection in top right */}
      <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comprehensive Assessments</h1>
            <p className="text-gray-600">Formal referrals and detailed skill assessments</p>
          </div>
          
          {/* Student Selection - Top Right with more width */}
          <div className="flex items-center gap-4">
            {selectedStudent ? (
              <div className="flex items-center gap-4 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 min-w-[250px]">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-blue-900 text-sm truncate">
                    {selectedStudent.fullName || selectedStudent.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-blue-700">
                    Grade {selectedStudent.grade || 'N/A'}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowStudentModal(true)}
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
              >
                <Users className="h-4 w-4" />
                Select Student
              </Button>
            )}
          </div>
        </div>

        {/* Assessment Tabs */}
        {selectedStudentId ? (
          <Tabs value={assessmentTab} onValueChange={setAssessmentTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="formal">
                <FileText className="h-4 w-4 mr-2" />
                Formal Assessments
              </TabsTrigger>
              <TabsTrigger value="skill">
                <BookOpen className="h-4 w-4 mr-2" />
                Skill Assessments
              </TabsTrigger>
            </TabsList>

            {/* Formal Assessments Tab */}
            <TabsContent value="formal" className="mt-6">
              <Card className="flex-1">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Formal Assessment Referrals</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Create referrals for psychological, educational, or specialized assessments
                      </p>
                    </div>
                    <Button onClick={() => setShowFormalForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Referral
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No formal assessments yet</p>
                    <Button onClick={() => setShowFormalForm(true)} variant="outline">
                      Create First Referral
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skill Assessments Tab */}
            <TabsContent value="skill" className="mt-6">
              {showSkillAssessment ? (
                <div>
                  {showSkillAssessment === 'reading' && (
                    <ReadingSkillAssessment
                      studentId={selectedStudentId}
                      onSuccess={() => setShowSkillAssessment(null)}
                      onCancel={() => setShowSkillAssessment(null)}
                    />
                  )}
                  {showSkillAssessment === 'writing' && (
                    <WritingSkillAssessment
                      studentId={selectedStudentId}
                      onSuccess={() => setShowSkillAssessment(null)}
                      onCancel={() => setShowSkillAssessment(null)}
                    />
                  )}
                  {showSkillAssessment === 'math' && (
                    <MathSkillAssessment
                      studentId={selectedStudentId}
                      onSuccess={() => setShowSkillAssessment(null)}
                      onCancel={() => setShowSkillAssessment(null)}
                    />
                  )}
                </div>
              ) : (
                <div className="flex-1">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Choose Assessment Type</h3>
                    <p className="text-sm text-gray-600">
                      Select a skill area to conduct a detailed symptom-based assessment
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Reading Assessment Card */}
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                      onClick={() => setShowSkillAssessment('reading')}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                          <div className="p-4 bg-blue-100 rounded-full">
                            <BookOpen className="h-8 w-8 text-blue-600" />
                          </div>
                        </div>
                        <CardTitle className="text-center">Reading Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li>• Decoding & Word Reading (17 symptoms)</li>
                          <li>• Fluency & Reading Flow (10 symptoms)</li>
                          <li>• Eye Tracking & Visual Skills (8 symptoms)</li>
                          <li>• Comprehension (3 symptoms)</li>
                          <li>• Attention & Behavior (7 symptoms)</li>
                          <li>• Mechanics & Punctuation (4 symptoms)</li>
                        </ul>
                        <div className="mt-4 text-center">
                          <span className="text-xs font-semibold text-blue-600">50+ Symptoms</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Writing Assessment Card */}
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
                      onClick={() => setShowSkillAssessment('writing')}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                          <div className="p-4 bg-green-100 rounded-full">
                            <PenTool className="h-8 w-8 text-green-600" />
                          </div>
                        </div>
                        <CardTitle className="text-center">Writing Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li>• Fine Motor & Grip (8 symptoms)</li>
                          <li>• Letter Formation (7 symptoms)</li>
                          <li>• Spacing & Alignment (9 symptoms)</li>
                          <li>• Handwriting Fluency (7 symptoms)</li>
                          <li>• Dictation & Spelling (9 symptoms)</li>
                          <li>• Sentence Formation (9 symptoms)</li>
                          <li>• Copying & Organization (12 symptoms)</li>
                        </ul>
                        <div className="mt-4 text-center">
                          <span className="text-xs font-semibold text-green-600">60+ Symptoms</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Math Assessment Card */}
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-500"
                      onClick={() => setShowSkillAssessment('math')}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                          <div className="p-4 bg-purple-100 rounded-full">
                            <Calculator className="h-8 w-8 text-purple-600" />
                          </div>
                        </div>
                        <CardTitle className="text-center">Math Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li>• Number Sense (15 symptoms)</li>
                          <li>• Basic Operations (10 symptoms)</li>
                          <li>• Concepts & Pre-Math (9 symptoms)</li>
                          <li>• Math Fluency (7 symptoms)</li>
                          <li>• Visual-Spatial (7 symptoms)</li>
                          <li>• Symbol Confusion (6 symptoms)</li>
                          <li>• Behavioral Indicators (7 symptoms)</li>
                        </ul>
                        <div className="mt-4 text-center">
                          <span className="text-xs font-semibold text-purple-600">60+ Symptoms</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="flex-1">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Student Selected</h3>
                <p className="text-gray-600">
                  Please select a student from above to begin an assessment
                </p>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Student Selection Modal */}
      <StudentSelectionModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSelect={setSelectedStudentId}
        selectedStudentId={selectedStudentId}
      />

      {/* Formal Assessment Form Modal */}
      <Dialog open={showFormalForm} onOpenChange={setShowFormalForm}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle>New Formal Assessment Referral</DialogTitle>
            </DialogHeader>
          </div>
          <div className="px-6 pb-6">
            <FormalAssessmentForm
              studentId={selectedStudentId}
              referredBy={user?.profile?.fullName || 'Educator'}
              onSuccess={() => {
                setShowFormalForm(false);
                // Could add refresh logic here
              }}
              onCancel={() => setShowFormalForm(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}