'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { PageHeader } from '@/components/ui/page-header';
import {
  School,
  Users,
  MapPin,
  Phone,
  Mail,
  User,
  ArrowLeft,
  Edit,
  Eye,
  UserPlus,
  Building,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { GradeDisplay } from '@/components/ui/GradeDisplay';

interface SchoolDetail {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  principalName?: string;
  createdAt: string;
  updatedAt: string;
  students: Array<{
    id: string;
    fullName: string;
    grade: string;
    status: string;
    assignments: Array<{
      specialEducator: {
        id: string;
        fullName: string;
      };
      isActive: boolean;
    }>;
  }>;
  viewers: Array<{
    id: string;
    fullName: string;
    position?: string;
    user: {
      email: string;
      isActive: boolean;
    };
  }>;
  studentCount: number;
  activeStudentCount: number;
  viewerCount: number;
}

export default function SchoolDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const schoolId = params.id as string;

  useEffect(() => {
    loadSchoolDetail();
  }, [schoolId]);

  const loadSchoolDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const centerId = user?.profile?.id;
      if (!centerId) {
        setError('Center ID not found');
        return;
      }

      // Get school details from center schools
      const schools = await apiClient.getCenterSchools(centerId);
      const schoolDetail = schools.find(s => s.id === schoolId);

      if (!schoolDetail) {
        setError('School not found');
        return;
      }

      setSchool(schoolDetail);
    } catch (error) {
      console.error('Failed to load school detail:', error);
      setError('Failed to load school details. Please try again.');
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

  const getAssignmentStatus = (student: any) => {
    const activeAssignment = student.assignments?.find((a: any) => a.isActive);
    return activeAssignment ? 'Assigned' : 'Unassigned';
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <LoadingSkeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
          <LoadingSkeleton className="h-48" />
        </div>
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error || 'School not found'}</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={loadSchoolDetail}>
              Try Again
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="">
      <PageHeader
        title={school.name}
        description={`${school.address || 'No address provided'} • Linked to center`}
        badge={{
          text: `${school.studentCount} Students`,
          variant: 'secondary'
        }}
        actions={[
          {
            label: 'Back to Schools',
            href: '/center/schools',
            icon: ArrowLeft,
            variant: 'outline'
          },
          {
            label: 'View Students',
            href: `/center/schools/${schoolId}/students`,
            icon: Users
          },
          {
            label: 'Edit School',
            href: `/center/schools/${schoolId}/edit`,
            icon: Edit,
            variant: 'outline'
          }
        ]}
      />

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <EnhancedCard
          title="Total Students"
          value={school.studentCount}
          description="Enrolled students"
          icon={Users}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
          change={`${school.activeStudentCount} active`}
          changeType="positive"
        />
        <EnhancedCard
          title="Active Students"
          value={school.activeStudentCount}
          description="Currently receiving services"
          icon={CheckCircle}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
          change={`${Math.round((school.activeStudentCount / school.studentCount) * 100) || 0}%`}
          changeType="positive"
        />
        <EnhancedCard
          title="School Viewers"
          value={school.viewerCount}
          description="Staff with access"
          icon={Eye}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-50"
          change="Access granted"
          changeType="neutral"
        />
        <EnhancedCard
          title="Days Linked"
          value={Math.floor((new Date().getTime() - new Date(school.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
          description="Since partnership"
          icon={Calendar}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-50"
          change="Active"
          changeType="positive"
        />
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="viewers">School Viewers</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* School Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5" />
                    School Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">School Name</label>
                    <p className="font-medium text-lg">{school.name}</p>
                  </div>

                  {school.address && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Address</label>
                      <div className="flex items-start gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="font-medium">{school.address}</p>
                      </div>
                    </div>
                  )}

                  {school.phone && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{school.phone}</p>
                      </div>
                    </div>
                  )}

                  {school.email && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{school.email}</p>
                      </div>
                    </div>
                  )}

                  {school.principalName && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Principal</label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{school.principalName}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Partnership Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Partnership Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Partnership Started</label>
                    <p className="font-medium">{new Date(school.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                    <p className="font-medium">{new Date(school.updatedAt).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge className="bg-green-100 text-green-800">
                        Active Partnership
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Services</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="secondary">Special Education</Badge>
                      <Badge variant="secondary">Assessment Services</Badge>
                      <Badge variant="secondary">IEP Support</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Students from {school.name}
                </CardTitle>
                <CardDescription>
                  Students enrolled from this school
                </CardDescription>
              </CardHeader>
              <CardContent>
                {school.students.length > 0 ? (
                  <div className="space-y-4">
                    {school.students.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {student.fullName.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {student.fullName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <GradeDisplay grade={student.grade} />
                              <span>•</span>
                              <Badge className={getStatusColor(student.status)}>
                                {student.status}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">Assignment Status</p>
                            <Badge variant={getAssignmentStatus(student) === 'Assigned' ? 'default' : 'secondary'}>
                              {getAssignmentStatus(student)}
                            </Badge>
                          </div>

                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/center/students/${student.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </Link>
                            {getAssignmentStatus(student) === 'Unassigned' && (
                              <Link href={`/center/students/${student.id}/assign`}>
                                <Button size="sm">
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Assign
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No students from this school yet</p>
                    <Link href="/center/students/new">
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Student
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="viewers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  School Viewers
                </CardTitle>
                <CardDescription>
                  School staff with access to student reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                {school.viewers.length > 0 ? (
                  <div className="space-y-4">
                    {school.viewers.map((viewer) => (
                      <div key={viewer.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 dark:text-purple-400 font-semibold">
                              {viewer.fullName.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{viewer.fullName}</h3>
                            <p className="text-sm text-muted-foreground">{viewer.user.email}</p>
                            {viewer.position && (
                              <Badge variant="outline" className="mt-1">
                                {viewer.position}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant={viewer.user.isActive ? 'default' : 'secondary'}>
                            {viewer.user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No school viewers assigned yet</p>
                    <Button variant="outline">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add School Viewer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
