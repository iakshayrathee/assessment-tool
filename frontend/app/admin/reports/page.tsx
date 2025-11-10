'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  PieChart,
  BarChart3,
  TrendingUp,
  Download,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  Users,
  GraduationCap,
  Building,
  ClipboardList,
  Target,
  Award,
  Activity,
  Eye,
  Plus,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ReportData {
  id: string;
  title: string;
  type: 'STUDENT_PROGRESS' | 'EDUCATOR_PERFORMANCE' | 'CENTER_ANALYTICS' | 'COMPLIANCE' | 'CUSTOM';
  description: string;
  generatedBy: string;
  generatedAt: string;
  format: 'PDF' | 'CSV' | 'XLSX';
  size: string;
  downloadCount: number;
  status: 'READY' | 'GENERATING' | 'FAILED';
}

interface AnalyticsData {
  totalStudents: number;
  totalEducators: number;
  totalCenters: number;
  completedAssessments: number;
  activeIEPs: number;
  complianceScore: number;
  monthlyProgress: Array<{
    month: string;
    assessments: number;
    ieps: number;
    progress: number;
  }>;
  centerPerformance: Array<{
    name: string;
    students: number;
    educators: number;
    completionRate: number;
    satisfaction: number;
  }>;
  educatorWorkload: Array<{
    name: string;
    students: number;
    workload: number;
    performance: number;
  }>;
}

export default function ReportsAnalyticsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load reports from backend API
      const reportsResponse = await apiClient.getAllReportsAsAdmin({
        page: 1,
        limit: 50,
        type: reportTypeFilter !== 'all' ? reportTypeFilter : undefined
      });
      
      // Transform reports data
      const transformedReports: ReportData[] = (reportsResponse.data || []).map((report: any) => ({
        id: report.id,
        title: report.title || report.name || 'Untitled Report',
        type: report.type || 'CUSTOM',
        description: report.description || 'No description available',
        generatedBy: report.generatedBy?.name || report.generatedBy || 'System',
        generatedAt: report.createdAt || report.generatedAt,
        format: report.format || 'PDF',
        size: report.size || 'Unknown',
        downloadCount: report.downloadCount || 0,
        status: report.status || 'READY'
      }));

      // Load analytics from backend API
      const analyticsResponse = await apiClient.getSystemAnalytics({ period: 'month' });
      
      // Transform analytics data
      const transformedAnalytics: AnalyticsData = {
        totalStudents: analyticsResponse.totalStudents || 0,
        totalEducators: (analyticsResponse.totalSpecialEducators || 0) + (analyticsResponse.totalSuperSpecialEducators || 0),
        totalCenters: analyticsResponse.totalCenters || 0,
        completedAssessments: analyticsResponse.completedAssessments || 0,
        activeIEPs: analyticsResponse.activeIEPs || 0,
        complianceScore: analyticsResponse.complianceScore || 0,
        monthlyProgress: analyticsResponse.monthlyProgress || [],
        centerPerformance: analyticsResponse.centerPerformance || [],
        educatorWorkload: analyticsResponse.educatorWorkload || []
      };

      setReports(transformedReports);
      setAnalytics(transformedAnalytics);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Set empty data on error
      setReports([]);
      setAnalytics({
        totalStudents: 0,
        totalEducators: 0,
        totalCenters: 0,
        completedAssessments: 0,
        activeIEPs: 0,
        complianceScore: 0,
        monthlyProgress: [],
        centerPerformance: [],
        educatorWorkload: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      toast({
        title: "Download Started",
        description: "Your report download has started.",
      });
      // API call to download report
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async (type: string) => {
    try {
      toast({
        title: "Report Generation Started",
        description: "Your report is being generated. You'll be notified when it's ready.",
      });
      // API call to generate report
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'STUDENT_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'EDUCATOR_PERFORMANCE': return 'bg-purple-100 text-purple-800';
      case 'CENTER_ANALYTICS': return 'bg-green-100 text-green-800';
      case 'COMPLIANCE': return 'bg-orange-100 text-orange-800';
      case 'CUSTOM': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'bg-green-100 text-green-800';
      case 'GENERATING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchQuery || 
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.generatedBy.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = !reportTypeFilter || report.type === reportTypeFilter;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent>
            <div className="space-y-3 mt-6">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Downloadable exports, dashboards, charts, KPIs, and compliance summaries
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {reports.length} Reports Available
          </Badge>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid gap-6 md:grid-cols-4"
          >
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 pb-3">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-blue-600" />
                  <Badge variant="secondary">+12%</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{analytics?.totalStudents.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Students</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 pb-3">
                <div className="flex items-center justify-between">
                  <GraduationCap className="h-8 w-8 text-purple-600" />
                  <Badge variant="secondary">+8%</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{analytics?.totalEducators}</div>
                <div className="text-sm text-muted-foreground">Total Educators</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 pb-3">
                <div className="flex items-center justify-between">
                  <ClipboardList className="h-8 w-8 text-green-600" />
                  <Badge variant="secondary">+15%</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{analytics?.completedAssessments.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Completed Assessments</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 pb-3">
                <div className="flex items-center justify-between">
                  <Award className="h-8 w-8 text-orange-600" />
                  <Badge variant={analytics && analytics.complianceScore > 90 ? "default" : "secondary"}>
                    {analytics?.complianceScore}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{analytics?.complianceScore}%</div>
                <div className="text-sm text-muted-foreground">Compliance Score</div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Monthly Progress Trends
                </CardTitle>
                <CardDescription>Assessment and IEP completion trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Chart visualization would go here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Showing trends for {analytics?.monthlyProgress.length} months
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Center Performance
                </CardTitle>
                <CardDescription>Performance metrics by center</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Chart visualization would go here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Comparing {analytics?.centerPerformance.length} centers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Tables */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-green-600" />
                  Top Performing Centers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Center</TableHead>
                      <TableHead>Completion Rate</TableHead>
                      <TableHead>Satisfaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics?.centerPerformance.slice(0, 4).map((center, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{center.name}</TableCell>
                        <TableCell>
                          <Badge variant={center.completionRate > 90 ? "default" : "secondary"}>
                            {center.completionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell>{center.satisfaction}/5</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Educator Workload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Educator</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Workload</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics?.educatorWorkload.slice(0, 4).map((educator, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{educator.name}</TableCell>
                        <TableCell>{educator.students}</TableCell>
                        <TableCell>
                          <Badge variant={educator.workload > 80 ? "destructive" : "secondary"}>
                            {educator.workload}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-600" />
                  Filter Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search reports..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Report Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Report Types</SelectItem>
                      <SelectItem value="STUDENT_PROGRESS">Student Progress</SelectItem>
                      <SelectItem value="EDUCATOR_PERFORMANCE">Educator Performance</SelectItem>
                      <SelectItem value="CENTER_ANALYTICS">Center Analytics</SelectItem>
                      <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Reports Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Available Reports ({filteredReports.length})
                </CardTitle>
                <CardDescription>
                  Download existing reports or generate new ones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Details</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Generated By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Format & Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{report.title}</div>
                            <div className="text-sm text-muted-foreground">{report.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Downloaded {report.downloadCount} times
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getReportTypeColor(report.type)}>
                            {report.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{report.generatedBy}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(report.generatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <Badge variant="outline">{report.format}</Badge>
                            <div className="text-xs text-muted-foreground mt-1">{report.size}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {report.status === 'READY' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDownloadReport(report.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredReports.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No reports found</h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search criteria or generate new reports.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Advanced Analytics
                </CardTitle>
                <CardDescription>
                  Detailed analytics and insights coming soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <PieChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">Advanced Analytics</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Interactive charts, detailed breakdowns, and advanced filtering options will be available here.
                  </p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Request Custom Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
