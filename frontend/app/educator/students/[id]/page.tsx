'use client';

import { useParams } from 'next/navigation';
import { useEducatorStudentDetails } from '@/hooks/useEducator';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
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
  TrendingUp,
  Notebook
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  // Comprehensive data fetching using the dashboard endpoint
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['studentDashboard', studentId],
    queryFn: () => apiClient.getStudentDashboard(studentId),
    enabled: !!studentId,
  });

  // Use student data from dashboard for complete information
  const student = dashboardData?.student;
  const isLoading = isDashboardLoading;

  // Extract data from dashboard response
  const assessmentsData = dashboardData?.assessments || [];
  const iepDocuments = dashboardData?.iepDocuments || [];
  const lessonPlans = dashboardData?.lessonPlans || [];
  const reportsData = dashboardData?.reports || [];
  const activeIEPGoals = dashboardData?.activeIEPGoals || [];
  const recentSessionNotes = dashboardData?.recentSessionNotes || [];
  const intakeForm = dashboardData?.student?.intakeForms?.[0] || null;

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
                    <span>{student.age || 'N/A'} years old</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <span>{student.grade || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{student.center?.centerName || 'N/A'}</span>
                  </div>
                  {student.school && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{student.school.name || 'N/A'}</span>
                    </div>
                  )}
                </div>

                {student.parent && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-600">
                      <strong>Parent/Guardian:</strong> {student.parent.fullName || 'N/A'}
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
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-600">{iepDocuments?.length || 0}</div>
                  <div className="text-xs text-blue-600">IEP Goals</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{assessmentsData?.length || 0}</div>
                  <div className="text-xs text-green-600">Assessments</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-xs text-purple-600">Sessions</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">{reportsData?.length || 0}</div>
                  <div className="text-xs text-orange-600">Reports</div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-indigo-600">{lessonPlans?.length || 0}</div>
                  <div className="text-xs text-indigo-600">Lesson Plans</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="intake" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="intake">Intake Form</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="iep">IEP Goals</TabsTrigger>
          <TabsTrigger value="lesson-plans">Lesson Plans</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>



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
                        <strong>Family Type:</strong> {intakeForm.familyType || 'Not specified'}
                      </div>
                      <div>
                        <strong>Child Type:</strong> {intakeForm.childType || 'Not specified'}
                      </div>
                      <div>
                        <strong>Family Income:</strong> {intakeForm.familyIncome || 'Not specified'}
                      </div>
                      <div>
                        <strong>Digital Resources:</strong> {intakeForm.digitalResourcesAtHome ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <strong>Daily Digital Use:</strong> {intakeForm.dailyDigitalUse ? `${intakeForm.dailyDigitalUse} hrs/day` : 'Not specified'}
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
        <TabsContent value="assessments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assessment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Assessments</span>
                    <span className="font-medium">{assessmentsData?.all?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Formal Assessments</span>
                    <span className="font-medium">
                      {assessmentsData?.formal?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Skill Assessments</span>
                    <span className="font-medium">
                      {(assessmentsData?.reading?.length || 0) + (assessmentsData?.writing?.length || 0) + (assessmentsData?.math?.length || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Assessments</span>
                    <span className="font-medium">
                      {assessmentsData?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Assessment</span>
                    <span className="font-medium">
                      {assessmentsData && assessmentsData.length > 0 ? new Date(assessmentsData[0].createdAt || assessmentsData[0].date).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Recent Activity</span>
                    <span className="font-medium">
                      {recentSessionNotes?.length || 0} sessions
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assessment History</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Assessment
              </Button>
            </CardHeader>
            <CardContent>
              {assessmentsData && assessmentsData.length > 0 ? (
                <div className="space-y-4">
                  {assessmentsData.map((assessment: any) => (
                    <div key={assessment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{assessment.title || assessment.assessmentName || 'Untitled Assessment'}</h4>
                        <Badge variant={assessment.type === 'FORMAL' ? 'default' : 'secondary'}>
                          {assessment.type || 'SKILL'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{assessment.description || 'No description available'}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Date: {assessment.date || assessment.createdAt ? new Date(assessment.date || assessment.createdAt).toLocaleDateString() : 'Not set'}</span>
                        <span>Score: {assessment.score || assessment.overallScore || 'N/A'}</span>
                        <span>Status: {assessment.status || 'COMPLETED'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No assessments found for this student.</p>
                  <p className="text-sm">Create assessments to track student performance.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iep" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">IEP Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Documents</span>
                    <span className="font-medium">{iepDocuments?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Documents</span>
                    <span className="font-medium">
                      {iepDocuments?.filter((doc: any) => doc.status === 'ACTIVE').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed Documents</span>
                    <span className="font-medium">
                      {iepDocuments?.filter((doc: any) => doc.status === 'COMPLETED').length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Goals</span>
                    <span className="font-medium">
                      {activeIEPGoals?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Goals</span>
                    <span className="font-medium">
                      {iepDocuments?.reduce((total: number, doc: any) => total + (doc.goals?.length || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="font-medium">
                      {iepDocuments && iepDocuments.length > 0 ? new Date(iepDocuments[0].updatedAt).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>IEP Documents</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </CardHeader>
            <CardContent>
              {iepDocuments && iepDocuments.length > 0 ? (
                <div className="space-y-4">
                  {iepDocuments.map((doc: any) => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{doc.title}</h4>
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Duration: {doc.durationMonths} months</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Start: {doc.startDate ? new Date(doc.startDate).toLocaleDateString() : 'Not set'}</span>
                        <span>End: {doc.endDate ? new Date(doc.endDate).toLocaleDateString() : 'Not set'}</span>
                        <span>Sections: {doc.subjectSections?.length || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No IEP documents found for this student.</p>
                  <p className="text-sm">Create an IEP document to track student progress.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reports Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Reports</span>
                    <span className="font-medium">{reportsData?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Assessment Reports</span>
                    <span className="font-medium">
                      {reportsData?.filter((r: any) => r.reportType === 'ASSESSMENT').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Lesson Plan Reports</span>
                    <span className="font-medium">
                      {reportsData?.filter((r: any) => r.reportType === 'LESSON_PLAN').length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Report Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Generated</span>
                    <span className="font-medium">
                      {reportsData?.filter((r: any) => r.status === 'GENERATED').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="font-medium">
                      {reportsData?.filter((r: any) => r.status === 'PENDING').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Failed</span>
                    <span className="font-medium">
                      {reportsData?.filter((r: any) => r.status === 'FAILED').length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Generated Reports</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardHeader>
            <CardContent>
              {reportsData && reportsData.length > 0 ? (
                <div className="space-y-4">
                  {reportsData.map((report: any) => (
                    <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{report.title || 'Untitled Report'}</h4>
                        <Badge variant={report.status === 'GENERATED' ? 'default' : 'secondary'}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{report.description || 'No description available'}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Type: {report.reportType}</span>
                        <span>Generated: {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Not generated'}</span>
                        <span>Format: {report.format || 'PDF'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No reports found for this student.</p>
                  <p className="text-sm">Generate reports to document student progress.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lesson Plans & Remediations Tab */}
        <TabsContent value="lesson-plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lesson Plan Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Plans</span>
                    <span className="font-medium">{lessonPlans?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Plans</span>
                    <span className="font-medium">
                      {lessonPlans?.filter((plan: any) => plan.progressStatus === 'IN_PROGRESS').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed Plans</span>
                    <span className="font-medium">
                      {lessonPlans?.filter((plan: any) => plan.progressStatus === 'COMPLETED').length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Created</span>
                    <span className="font-medium">
                      {lessonPlans && lessonPlans.length > 0 ?
                        new Date(lessonPlans[0].createdAt).toLocaleDateString() : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Progress</span>
                    <span className="font-medium">
                      {lessonPlans?.reduce((acc: number, plan: any) => acc + (plan.progressPercentage || 0), 0) / (lessonPlans?.length || 1) || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Skill Areas</span>
                    <span className="font-medium">
                      {[...new Set(lessonPlans?.map((plan: any) => plan.skillArea))].length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lesson Plans</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Plan
              </Button>
            </CardHeader>
            <CardContent>
              {lessonPlans && lessonPlans.length > 0 ? (
                <div className="space-y-4">
                  {lessonPlans.map((plan: any) => (
                    <div key={plan.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{plan.specificTopic || 'Untitled Plan'}</h4>
                        <Badge variant={plan.progressStatus === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                          {plan.progressStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Skill Area: {plan.skillArea}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Start: {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : 'Not set'}</span>
                        <span>End: {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'Not set'}</span>
                        <span>Progress: {plan.progressPercentage || 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No lesson plans found for this student.</p>
                  <p className="text-sm">Create lesson plans to organize teaching activities.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
