'use client';

import { useParams } from 'next/navigation';
import { useEducatorStudentDetails } from '@/hooks/useSpecialEducator';
import { useIntakeForm, useAssessments, useIEPGoals, useSessionNotes, useReports } from '@/hooks/useAssessments';
// Use route-level UnifiedLayout; remove page-level EducatorLayout
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft,
  User, 
  Calendar, 
  MapPin, 
  Phone,
  Mail,
  FileText, 
  Brain,
  Target,
  BookOpen,
  BarChart3,
  Plus,
  Edit,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const { student, isLoading } = useEducatorStudentDetails(studentId);
  const { intakeForm } = useIntakeForm(studentId);
  const { assessments } = useAssessments(studentId);
  const { iepGoals } = useIEPGoals(studentId);
  const { sessionNotes } = useSessionNotes(studentId, 1, 5);
  const { reports } = useReports(studentId);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PENDING': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getGoalStatusIcon = (status: string) => {
    switch (status) {
      case 'ACHIEVED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'NOT_STARTED': return <AlertCircle className="h-4 w-4 text-gray-600" />;
      case 'DISCONTINUED': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Student not found</h2>
          <p className="text-gray-600 mb-4">The student you're looking for doesn't exist or you don't have access to view them.</p>
          <Link href="/educator/students">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Students
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/educator/students">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Students
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.fullName}</h1>
              <p className="text-gray-600">Student Profile & Progress Overview</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Student Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" alt={student.fullName} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-lg">
                    {getInitials(student.fullName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold">{student.fullName}</h2>
                    <Badge className={getStatusColor(student.status)}>
                      {student.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{student.age} years old</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-gray-400" />
                      <span>{student.grade}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{student.center?.centerName}</span>
                    </div>
                    {student.school && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{student.school.name}</span>
                      </div>
                    )}
                  </div>

                  {student.parent && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-gray-600">
                        <strong>Parent/Guardian:</strong> {student.parent.fullName}
                        {student.parent.phone && (
                          <span className="ml-4">
                            <Phone className="h-3 w-3 inline mr-1" />
                            {student.parent.phone}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{iepGoals.length}</div>
                    <div className="text-xs text-blue-600">IEP Goals</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{assessments.length}</div>
                    <div className="text-xs text-green-600">Assessments</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">{sessionNotes.length}</div>
                    <div className="text-xs text-purple-600">Sessions</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-600">{reports.length}</div>
                    <div className="text-xs text-orange-600">Reports</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="intake">Intake Form</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="iep">IEP Goals</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Progress Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {iepGoals.length > 0 ? (
                    <div className="space-y-4">
                      {iepGoals.slice(0, 3).map((goal: any) => (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{goal.domain}</span>
                            <span className="text-sm text-gray-500">{goal.progressPercent}%</span>
                          </div>
                          <Progress value={goal.progressPercent} className="h-2" />
                        </div>
                      ))}
                      <Link href={`/educator/lesson-plans?studentId=${studentId}`}>
                        <Button variant="outline" size="sm" className="w-full mt-4">
                          View All Goals
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Target className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">No IEP goals set yet</p>
                      <Link href={`/educator/lesson-plans?studentId=${studentId}`}>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Goal
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessionNotes.slice(0, 3).map((note: any) => (
                      <div key={note.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <BookOpen className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Session Note</p>
                          <p className="text-xs text-gray-600">
                            {new Date(note.sessionDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {sessionNotes.length === 0 && (
                      <div className="text-center py-6">
                        <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks for this student</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href={`/educator/intake?studentId=${studentId}`}>
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <FileText className="h-6 w-6" />
                      <span className="text-sm">Intake Form</span>
                    </Button>
                  </Link>
                  <Link href={`/educator/assessments?studentId=${studentId}`}>
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <Brain className="h-6 w-6" />
                      <span className="text-sm">Assessment</span>
                    </Button>
                  </Link>
                  <Link href={`/educator/lesson-plans?studentId=${studentId}`}>
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <Target className="h-6 w-6" />
                      <span className="text-sm">IEP Goals</span>
                    </Button>
                  </Link>
                  <Link href={`/educator/session-notes?studentId=${studentId}`}>
                    <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                      <Calendar className="h-6 w-6" />
                      <span className="text-sm">Session Notes</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intake Form Tab */}
          <TabsContent value="intake">
            <div className="space-y-6">
              {intakeForm ? (
                <>
                  {/* Header with status and actions */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <h2 className="text-xl font-semibold">Intake Form</h2>
                            <p className="text-gray-600">Comprehensive student background information</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(intakeForm.status)}>
                            {intakeForm.status}
                          </Badge>
                          <Link href={`/educator/intake?studentId=${studentId}`}>
                            <Button variant="outline">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Form
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Last updated: {new Date(intakeForm.updatedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Socio Demographic Data */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Socio Demographic Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>Address:</strong> {intakeForm.address || 'Not provided'}
                        </div>
                        <div>
                          <strong>Mother Tongue:</strong> {student.motherTongue || 'Not specified'}
                        </div>
                        <div>
                          <strong>Syllabus:</strong> {student.syllabus || 'Not specified'}
                        </div>
                        <div>
                          <strong>Family Type:</strong> {intakeForm.familyType || 'Not specified'}
                        </div>
                        <div>
                          <strong>Child Type:</strong> {intakeForm.childType || 'Not specified'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Family History */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Family History / Background</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>Father's Name:</strong> {intakeForm.fatherName || 'Not provided'}
                        </div>
                        <div>
                          <strong>Mother's Name:</strong> {intakeForm.motherName || 'Not provided'}
                        </div>
                        <div>
                          <strong>Guardian's Name:</strong> {intakeForm.guardianName || 'Not provided'}
                        </div>
                        <div>
                          <strong>Family Income:</strong> {intakeForm.familyIncome || 'Not provided'}
                        </div>
                        <div>
                          <strong>Digital Resources at Home:</strong> {intakeForm.digitalResourcesAtHome ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Daily Digital Use:</strong> {intakeForm.dailyDigitalUse ? `${intakeForm.dailyDigitalUse} hrs/day` : 'Not specified'}
                        </div>
                        <div>
                          <strong>Enjoys School:</strong> {intakeForm.enjoysSchool ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Study Assistant:</strong> {intakeForm.studyAssistant || 'Not provided'}
                        </div>
                        <div>
                          <strong>External Academic Support:</strong> {intakeForm.externalAcademicSupport ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Enjoys Reading:</strong> {intakeForm.enjoysReading ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Daily Parent-Child Time:</strong> {intakeForm.dailyParentChildTime ? `${intakeForm.dailyParentChildTime} hrs` : 'Not specified'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Prenatal, Natal & Delivery Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Prenatal, Natal & Delivery Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>Pregnancy Normal:</strong> {intakeForm.pregnancyNormal ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Medications During Pregnancy:</strong> {intakeForm.medicationsDuringPregnancy ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Medication Details:</strong> {intakeForm.medicationDetails || 'Not provided'}
                        </div>
                        <div>
                          <strong>Miscarriages/Abortions:</strong> {intakeForm.miscarriagesAbortions ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Full Term or Premature:</strong> {intakeForm.fullTermOrPremature || 'Not specified'}
                        </div>
                        <div>
                          <strong>Delivery Type:</strong> {intakeForm.deliveryType || 'Not specified'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Post Natal Factors */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Post Natal Factors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>Breast Fed:</strong> {intakeForm.breastFed ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Infant Jaundice:</strong> {intakeForm.infantJaundice ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Incubation:</strong> {intakeForm.incubation ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Immunization Done:</strong> {intakeForm.immunizationDone ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Consanguineous Marriage:</strong> {intakeForm.consanguineousMarriage ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Birth Cry:</strong> {intakeForm.birthCry || 'Not specified'}
                        </div>
                        <div>
                          <strong>Delay in Neck Standing:</strong> {intakeForm.delayInNeckStanding ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Neck Standing Details:</strong> {intakeForm.neckStandingDetails || 'Not provided'}
                        </div>
                        <div>
                          <strong>Age of Walking:</strong> {intakeForm.ageOfWalking ? `${intakeForm.ageOfWalking} months` : 'Not specified'}
                        </div>
                        <div>
                          <strong>Age of 2-word Speech:</strong> {intakeForm.ageOfTwoWordSpeech ? `${intakeForm.ageOfTwoWordSpeech} months` : 'Not specified'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Medical History */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Medical History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>Health Concerns:</strong> {intakeForm.healthConcerns || 'None reported'}
                        </div>
                        <div>
                          <strong>Epileptic History:</strong> {intakeForm.epilepticHistory ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>On Medication:</strong> {intakeForm.onMedication ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Current Medications:</strong> {intakeForm.currentMedications || 'None'}
                        </div>
                        <div>
                          <strong>Asthma/Wheezing:</strong> {intakeForm.asthmaWheezing ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Wears Glasses:</strong> {intakeForm.wearsGlasses ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Vision Test Done:</strong> {intakeForm.visionTestDone ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Hearing Test Done:</strong> {intakeForm.hearingTestDone ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Educational History */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Educational History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <strong>Attended Preschool:</strong> {intakeForm.attendedPreschool ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Repeated Grades:</strong> {intakeForm.repeatedGrades ? 'Yes' : 'No'}
                        </div>
                        <div>
                          <strong>Which Grade Repeated:</strong> {intakeForm.whichGradeRepeated || 'Not applicable'}
                        </div>
                        <div>
                          <strong>Dominant Writing Hand:</strong> {intakeForm.dominantWritingHand || 'Not specified'}
                        </div>
                        <div>
                          <strong>Struggles in Kannada/Hindi:</strong> {intakeForm.strugglesInKannadaHindi ? 'Yes' : 'No'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No intake form completed</h3>
                    <p className="text-gray-500 mb-6">Start by collecting comprehensive background information about this student</p>
                    <Link href={`/educator/intake?studentId=${studentId}`}>
                      <Button size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Start Intake Form
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Other tabs would be implemented similarly */}
          <TabsContent value="assessments">
            <Card>
              <CardHeader>
                <CardTitle>Assessments</CardTitle>
                <CardDescription>Student assessment history and results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Assessment functionality coming soon</p>
                  <Button disabled>View Assessments</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="iep">
            <Card>
              <CardHeader>
                <CardTitle>IEP Goals</CardTitle>
                <CardDescription>Individual Education Plan goals and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">IEP Goals functionality coming soon</p>
                  <Button disabled>Manage Goals</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <CardTitle>Session Notes</CardTitle>
                <CardDescription>Documentation of therapy and education sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Session Notes functionality coming soon</p>
                  <Button disabled>View Sessions</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Generated reports and documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Reports functionality coming soon</p>
                  <Button disabled>Generate Report</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
