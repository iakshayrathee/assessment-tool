'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  School, 
  Phone, 
  Mail,
  MapPin,
  Calendar,
  Target,
  FileText,
  TrendingUp,
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle,
  BookOpen,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface ChildDetails {
  id: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  grade: string;
  status: string;
  center: {
    centerName: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  school?: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  assignments: Array<{
    specialEducator: {
      id: string;
      fullName: string;
      phone?: string;
    };
  }>;
  iepGoals: Array<{
    id: string;
    domain: string;
    goalStatement: string;
    status: string;
    progressPercent: number;
    targetDate: string;
    progressUpdates: Array<{
      updateDate: string;
      notes: string;
      progressPercent: number;
    }>;
  }>;
  reports: Array<{
    id: string;
    type: string;
    title: string;
    createdAt: string;
  }>;
  sessionNotes: Array<{
    id: string;
    sessionDate: string;
    notes: string;
    specialEducator: {
      fullName: string;
    };
  }>;
}

export default function ChildDetails() {
  const params = useParams();
  const childId = params.id as string;
  const { user } = useAuth();
  const [child, setChild] = useState<ChildDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (childId) {
      loadChildDetails();
    }
  }, [childId]);

  const loadChildDetails = async () => {
    try {
      setLoading(true);
      const childData = await apiClient.getChildDetails(childId);
      setChild(childData);
    } catch (error) {
      console.error('Failed to load child details:', error);
      toast.error('Failed to load child details');
      // Mock data for demonstration
      setChild({
        id: childId,
        fullName: 'Aarav Sharma',
        dateOfBirth: '2016-03-15',
        age: 8,
        gender: 'MALE',
        grade: 'Grade 3',
        status: 'ACTIVE',
        center: {
          centerName: 'Knowled Learning Center - Mumbai',
          phone: '+91 98765 43210',
          email: 'mumbai@knowled.com',
          address: '123 Learning Street, Mumbai, Maharashtra 400001'
        },
        school: {
          name: 'St. Mary\'s School',
          phone: '+91 98765 43211',
          email: 'info@stmarys.edu',
          address: '456 School Road, Mumbai, Maharashtra 400002'
        },
        assignments: [{
          specialEducator: {
            id: '1',
            fullName: 'Ms. Priya Patel',
            phone: '+91 98765 43212'
          }
        }],
        iepGoals: [
          {
            id: '1',
            domain: 'Reading',
            goalStatement: 'Read 50 sight words fluently with 90% accuracy',
            status: 'IN_PROGRESS',
            progressPercent: 70,
            targetDate: '2024-03-15',
            progressUpdates: [
              {
                updateDate: '2024-01-15',
                notes: 'Good progress on sight word recognition. Can now read 35 words fluently.',
                progressPercent: 70
              },
              {
                updateDate: '2024-01-01',
                notes: 'Started with basic sight words. Shows good interest in reading activities.',
                progressPercent: 40
              }
            ]
          },
          {
            id: '2',
            domain: 'Math',
            goalStatement: 'Count to 100 without assistance and identify numbers 1-50',
            status: 'IN_PROGRESS',
            progressPercent: 85,
            targetDate: '2024-02-28',
            progressUpdates: [
              {
                updateDate: '2024-01-15',
                notes: 'Excellent progress in counting. Can count to 85 independently.',
                progressPercent: 85
              }
            ]
          },
          {
            id: '3',
            domain: 'Writing',
            goalStatement: 'Write name independently and form basic letters correctly',
            status: 'ACHIEVED',
            progressPercent: 100,
            targetDate: '2024-01-30',
            progressUpdates: [
              {
                updateDate: '2024-01-25',
                notes: 'Goal achieved! Can write name clearly and forms most letters correctly.',
                progressPercent: 100
              }
            ]
          }
        ],
        reports: [
          {
            id: '1',
            type: 'ASSESSMENT',
            title: 'Reading Assessment Report',
            createdAt: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            type: 'PROGRESS',
            title: 'Monthly Progress Report - January',
            createdAt: '2024-01-10T10:00:00Z'
          },
          {
            id: '3',
            type: 'IEP',
            title: 'Individual Education Plan - Q1 Review',
            createdAt: '2024-01-05T10:00:00Z'
          }
        ],
        sessionNotes: [
          {
            id: '1',
            sessionDate: '2024-01-15',
            notes: 'Great session today. Aarav showed improved focus during reading activities and completed all tasks.',
            specialEducator: {
              fullName: 'Ms. Priya Patel'
            }
          },
          {
            id: '2',
            sessionDate: '2024-01-12',
            notes: 'Worked on math concepts. Aarav is making good progress with number recognition.',
            specialEducator: {
              fullName: 'Ms. Priya Patel'
            }
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoalStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return <Clock className="h-4 w-4" />;
      case 'ACHIEVED': return <CheckCircle className="h-4 w-4" />;
      case 'NOT_STARTED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'ACHIEVED': return 'bg-green-100 text-green-800';
      case 'NOT_STARTED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'ASSESSMENT': return 'bg-blue-100 text-blue-800';
      case 'IEP': return 'bg-purple-100 text-purple-800';
      case 'PROGRESS': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading child details...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load child details</p>
          <Button onClick={loadChildDetails} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link href="/parent/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{child.fullName}</h1>
                <p className="text-gray-600">{child.age} years • {child.grade}</p>
              </div>
            </div>
            <Badge className={getStatusColor(child.status)}>
              {child.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Goals</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {child.iepGoals.filter(goal => goal.status === 'IN_PROGRESS').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Achieved Goals</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {child.iepGoals.filter(goal => goal.status === 'ACHIEVED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{child.reports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(child.iepGoals.reduce((acc, goal) => acc + goal.progressPercent, 0) / child.iepGoals.length)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="goals">IEP Goals</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="sessions">Session Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Child Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Child Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Full Name</p>
                      <p className="text-sm text-gray-900">{child.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Age</p>
                      <p className="text-sm text-gray-900">{child.age} years</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Grade</p>
                      <p className="text-sm text-gray-900">{child.grade}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                      <p className="text-sm text-gray-900">
                        {new Date(child.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assigned Educator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Assigned Educator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {child.assignments.length > 0 ? (
                    <div className="space-y-3">
                      {child.assignments.map((assignment, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded-lg">
                          <p className="font-medium text-blue-900">
                            {assignment.specialEducator.fullName}
                          </p>
                          {assignment.specialEducator.phone && (
                            <p className="text-sm text-blue-700 flex items-center mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {assignment.specialEducator.phone}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No educator assigned</p>
                  )}
                </CardContent>
              </Card>

              {/* Center Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <School className="h-5 w-5 mr-2" />
                    Learning Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">{child.center.centerName}</p>
                  </div>
                  {child.center.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {child.center.phone}
                    </div>
                  )}
                  {child.center.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {child.center.email}
                    </div>
                  )}
                  {child.center.address && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                      {child.center.address}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* School Information */}
              {child.school && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      School
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-900">{child.school.name}</p>
                    </div>
                    {child.school.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {child.school.phone}
                      </div>
                    )}
                    {child.school.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        {child.school.email}
                      </div>
                    )}
                    {child.school.address && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                        {child.school.address}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {child.iepGoals.map((goal) => (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{goal.domain}</CardTitle>
                        <CardDescription className="mt-1">
                          {goal.goalStatement}
                        </CardDescription>
                      </div>
                      <Badge className={getGoalStatusColor(goal.status)}>
                        {getGoalStatusIcon(goal.status)}
                        <span className="ml-1">{goal.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-gray-600">{goal.progressPercent}%</span>
                      </div>
                      <Progress value={goal.progressPercent} className="mb-2" />
                      <p className="text-xs text-gray-500">
                        Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    {goal.progressUpdates.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Recent Updates</h4>
                        <div className="space-y-2">
                          {goal.progressUpdates.slice(0, 2).map((update, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500">
                                  {new Date(update.updateDate).toLocaleDateString()}
                                </span>
                                <span className="text-xs font-medium">
                                  {update.progressPercent}%
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{update.notes}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {child.reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <FileText className="h-8 w-8 text-gray-600" />
                      <Badge className={getReportTypeColor(report.type)}>
                        {report.type}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Created: {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <Link href={`/parent/children/${child.id}/reports/${report.id}`}>
                      <Button variant="outline" className="w-full">
                        View Report
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <div className="space-y-4">
              {child.sessionNotes.map((session) => (
                <Card key={session.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          Session with {session.specialEducator.fullName}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(session.sessionDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700">{session.notes}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
