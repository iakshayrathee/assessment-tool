'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User,
  Mail,
  Phone,
  Calendar,
  School,
  BookOpen,
  Users,
  Building2,
  GraduationCap,
  UserCheck,
  FileText,
  Target,
  Activity,
  X,
  Loader2
} from 'lucide-react';
import { useStudent } from '@/hooks/useStudents';
import { formatDate } from '@/lib/utils';

interface StudentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
}

export default function StudentDetailsModal({ 
  isOpen, 
  onClose, 
  studentId 
}: StudentDetailsModalProps) {
  const { student, dashboard, progress, isLoading, error } = useStudent(studentId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateString = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Student Details
              </DialogTitle>
              <DialogDescription>
                Comprehensive information about the student
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading student details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-2">Failed to load student details</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        ) : student ? (
          <div className="space-y-6">
            {/* Student Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {student.fullName?.split(' ').map((n: string) => n[0]).join('') || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{student.fullName || 'N/A'}</h3>
                      <Badge className={getStatusColor(student.status)}>
                        {student.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      {/* <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>ID: {student.id}</span>
                      </div> */}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Age: {calculateAge(student.dateOfBirth)} years</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Grade: {student.grade || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Registered: {formatDateString(student.registrationDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for detailed information */}
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="academic">Academic</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                        <p className="text-sm">{student.fullName || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                        <p className="text-sm">{formatDateString(student.dateOfBirth)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Gender</label>
                        <p className="text-sm">{student.gender || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Mother Tongue</label>
                        <p className="text-sm">{student.motherTongue || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {student.parent && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Parent Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Parent Name</label>
                          <p className="text-sm">{student.parent.fullName || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <p className="text-sm flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {student.parent.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="academic" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Academic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Grade</label>
                        <p className="text-sm">{student.grade || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Syllabus</label>
                        <p className="text-sm">{student.syllabus || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {student.school && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <School className="h-5 w-5" />
                        School Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">School Name</label>
                          <p className="text-sm">{student.school.name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">School ID</label>
                          <p className="text-sm">{student.school.id || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {student.center && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Center Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Center Name</label>
                          <p className="text-sm">{student.center.centerName || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Center ID</label>
                          <p className="text-sm">{student.center.id || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Educator Assignments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {student.assignments && student.assignments.length > 0 ? (
                      <div className="space-y-3">
                        {student.assignments.map((assignment: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{assignment.specialEducator?.fullName || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">
                                {assignment.specialEducator?.user?.email || 'N/A'}
                              </p>
                            </div>
                            <Badge variant={assignment.isActive ? "default" : "secondary"}>
                              {assignment.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No educator assignments found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Recent Assessments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {student.assessments && student.assessments.length > 0 ? (
                        <div className="space-y-2">
                          {student.assessments.slice(0, 3).map((assessment: any, index: number) => (
                            <div key={index} className="p-2 border rounded text-sm">
                              <p className="font-medium">{assessment.type || 'Assessment'}</p>
                              <p className="text-muted-foreground">
                                {formatDateString(assessment.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No assessments found</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        IEP Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {student.iepGoals && student.iepGoals.length > 0 ? (
                        <div className="space-y-2">
                          {student.iepGoals.slice(0, 3).map((goal: any, index: number) => (
                            <div key={index} className="p-2 border rounded text-sm">
                              <p className="font-medium">{goal.goal || 'IEP Goal'}</p>
                              <div className="flex items-center justify-between mt-1">
                                <Badge variant="outline">{goal.status}</Badge>
                                <span className="text-muted-foreground">
                                  {formatDateString(goal.targetDate)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No IEP goals found</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Reports
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {student.reports && student.reports.length > 0 ? (
                      <div className="space-y-2">
                        {student.reports.slice(0, 5).map((report: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                            <div>
                              <p className="font-medium">{report.type || 'Report'}</p>
                              <p className="text-muted-foreground">
                                {formatDateString(report.createdAt)}
                              </p>
                            </div>
                            <Badge variant="outline">{report.status}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No reports found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">No student data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}