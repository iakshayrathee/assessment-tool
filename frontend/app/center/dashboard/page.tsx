'use client';

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
  Users, 
  School, 
  UserCheck, 
  GraduationCap,
  Plus,
  Building,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Calendar,
  Clock,
  Target,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { useCenterDashboard } from '@/hooks/useCenter';

interface DashboardData {
  overview: {
    totalStudents: number;
    activeStudents: number;
    totalSchools: number;
    assignedEducators: number;
    assignedSuperEducators: number;
    unassignedStudents?: number;
    pendingReports?: number;
  };
  recentStudents: Array<{
    id: string;
    fullName: string;
    createdAt: string;
    status: string;
    hasAssignment?: boolean;
    assignedEducator?: string | null;
  }>;
  schools: Array<{
    id: string;
    name: string;
    address?: string;
    studentCount?: number;
    activeStudentCount?: number;
    students?: Array<{ id: string }>;
  }>;
  educators: Array<{
    type: string;
    name: string;
    id: string;
    experience?: number;
    specializations?: string[];
  }>;
}

export default function CenterDashboard() {
  const { user } = useAuth();
  const centerId = user?.profile?.id;
  
  // Use React Query hook for caching and automatic refetching
  const { 
    data: dashboardData, 
    isLoading: loading, 
    error,
    refetch: loadDashboardData 
  } = useCenterDashboard(centerId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : 'Failed to load dashboard data'}
          </p>
          <Button onClick={() => loadDashboardData()}>
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="">
      <PageHeader
        title={`${user?.profile?.centerName || 'Center'} Dashboard`}
        description="Manage your center operations and track progress"
        badge={{
          text: `${dashboardData?.overview?.totalStudents || 0} Students`,
          variant: 'secondary'
        }}
        actions={[
          {
            label: 'Link School',
            href: '/center/schools/new',
            icon: Building,
            variant: 'outline'
          },
          {
            label: 'Add Student',
            href: '/center/students/new',
            icon: Plus
          }
        ]}
      />

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        {[
          {
            title: "Total Students",
            value: dashboardData.overview.totalStudents,
            description: "Enrolled in center",
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            change: "+12%",
            changeType: "positive" as const
          },
          {
            title: "Active Students", 
            value: dashboardData.overview.activeStudents,
            description: "Currently receiving services",
            icon: CheckCircle,
            color: "text-green-600",
            bgColor: "bg-green-50",
            change: "+8%",
            changeType: "positive" as const
          },
          {
            title: "Linked Schools",
            value: dashboardData.overview.totalSchools,
            description: "Partner schools",
            icon: School,
            color: "text-purple-600", 
            bgColor: "bg-purple-50",
            change: "+2",
            changeType: "positive" as const
          },
          {
            title: "Special Educators",
            value: dashboardData.overview.assignedEducators,
            description: "Assigned to center",
            icon: UserCheck,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
            change: "+3",
            changeType: "positive" as const
          },
          {
            title: "Super Educators",
            value: dashboardData.overview.assignedSuperEducators,
            description: "Supervising quality",
            icon: GraduationCap,
            color: "text-indigo-600",
            bgColor: "bg-indigo-50",
            change: "+1",
            changeType: "positive" as const
          },
        ].map((stat, index) => (
          <EnhancedCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            iconColor={stat.color}
            iconBgColor={stat.bgColor}
            change={stat.change}
            changeType={stat.changeType}
            interactive
            className="hover:shadow-lg transition-all duration-300"
          />
        ))}
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList>
            <TabsTrigger value="students">Recent Students</TabsTrigger>
            <TabsTrigger value="schools">Linked Schools</TabsTrigger>
            <TabsTrigger value="educators">Assigned Educators</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Recently Added Students
                  </CardTitle>
                  <CardDescription>
                    Students recently enrolled in your center
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {dashboardData?.recentStudents.map((student: any, index: number) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-6 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center space-x-4">
                          <motion.div 
                            whileHover={{ scale: 1.1 }}
                            className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-full flex items-center justify-center"
                          >
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {student.fullName.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </motion.div>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {student.fullName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Added: {new Date(student.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className="capitalize"
                          >
                            {student.status.toLowerCase()}
                          </Badge>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/center/students/${student.id}`}>
                              <Button variant="outline" size="sm" className="group/btn">
                                <Eye className="h-3 w-3 mr-1 group-hover/btn:scale-110 transition-transform" />
                                View
                              </Button>
                            </Link>
                            <Link href={`/center/students/${student.id}/assign`}>
                              <Button size="sm" className="group/btn">
                                <UserCheck className="h-3 w-3 mr-1 group-hover/btn:scale-110 transition-transform" />
                                Assign
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="p-6 bg-muted/30 text-center">
                    <Link href="/center/students">
                      <Button variant="outline" className="group">
                        View All Students
                        <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="schools" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                  <CardTitle className="flex items-center gap-2">
                    <School className="h-5 w-5 text-purple-600" />
                    Linked Schools
                  </CardTitle>
                  <CardDescription>
                    Schools partnered with your center
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData?.schools.map((school: any, index: number) => (
                      <motion.div
                        key={school.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="group"
                      >
                        <Card className="h-full border-2 hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-300 hover:shadow-lg">
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3 mb-4">
                              <motion.div
                                whileHover={{ rotate: 5, scale: 1.1 }}
                                className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg"
                              >
                                <School className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                              </motion.div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-foreground group-hover:text-purple-600 transition-colors">
                                  {school.name}
                                </h3>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {school.studentCount || school.students?.length || 0} students
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Link href={`/center/schools/${school.id}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full group/btn">
                                  <Eye className="h-3 w-3 mr-1 group-hover/btn:scale-110 transition-transform" />
                                  Details
                                </Button>
                              </Link>
                              <Link href={`/center/schools/${school.id}/students`} className="flex-1">
                                <Button size="sm" className="w-full group/btn">
                                  <Users className="h-3 w-3 mr-1 group-hover/btn:scale-110 transition-transform" />
                                  Students
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-center"
                  >
                    <Link href="/center/schools/new">
                      <Button className="group">
                        <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                        Link New School
                      </Button>
                    </Link>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="educators" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-orange-600" />
                    Assigned Educators
                  </CardTitle>
                  <CardDescription>
                    Educators working at your center
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {dashboardData?.educators.map((educator: any, index: number) => (
                      <motion.div
                        key={educator.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-6 hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center space-x-4">
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 rounded-full flex items-center justify-center"
                          >
                            <span className="text-orange-600 dark:text-orange-400 font-semibold">
                              {educator.name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </motion.div>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {educator.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge 
                                variant={educator.type === 'Super Special Educator' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {educator.type}
                              </Badge>
                              {educator.experience && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {educator.experience} years
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/center/educators/${educator.id}`}>
                            <Button variant="outline" size="sm" className="group/btn">
                              <Eye className="h-3 w-3 mr-1 group-hover/btn:scale-110 transition-transform" />
                              Profile
                            </Button>
                          </Link>
                          <Link href={`/center/educators/${educator.id}/students`}>
                            <Button size="sm" className="group/btn">
                              <Users className="h-3 w-3 mr-1 group-hover/btn:scale-110 transition-transform" />
                              Students
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="p-6 bg-muted/30 text-center">
                    <Link href="/center/educators">
                      <Button variant="outline" className="group">
                        View All Educators
                        <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
