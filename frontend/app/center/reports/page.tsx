'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedCard } from '@/components/ui/enhanced-card';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { 
  FileText, 
  Users,
  Filter,
  Search,
  Download,
  Eye,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  PieChart,
  FileBarChart,
  School,
  User,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface Report {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    fullName: string;
    grade: string;
  };
  specialEducator?: {
    id: string;
    fullName: string;
  };
  superSpecialEducator?: {
    id: string;
    fullName: string;
  };
}

interface ReportStats {
  totalReports: number;
  pendingReports: number;
  completedReports: number;
  reportsByType: Record<string, number>;
  reportsByMonth: Record<string, number>;
  recentReports: Report[];
}

export default function CenterReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [educatorFilter, setEducatorFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const reportsPerPage = 10;

  useEffect(() => {
    loadReports();
  }, [currentPage]);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, typeFilter, statusFilter, educatorFilter, dateFilter]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const centerId = user?.profile?.id;
      if (!centerId) {
        setError('Center ID not found');
        return;
      }

      const reportsData = await apiClient.getCenterReports(centerId, {
        page: currentPage,
        limit: reportsPerPage
      });

      setReports(reportsData.data);
      setTotalPages(reportsData.pagination.totalPages);
      
      // Calculate stats
      calculateStats(reportsData.data);
    } catch (error) {
      console.error('Failed to load reports:', error);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reportsData: Report[]) => {
    const totalReports = reportsData.length;
    const pendingReports = reportsData.filter(r => r.status === 'PENDING').length;
    const completedReports = reportsData.filter(r => r.status === 'COMPLETED').length;
    
    // Group by type
    const reportsByType = reportsData.reduce((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Group by month
    const reportsByMonth = reportsData.reduce((acc, report) => {
      const month = new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Recent reports (last 5)
    const recentReports = reportsData
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    setStats({
      totalReports,
      pendingReports,
      completedReports,
      reportsByType,
      reportsByMonth,
      recentReports
    });
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.specialEducator?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.superSpecialEducator?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(report => report.type === typeFilter);
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Educator filter
    if (educatorFilter) {
      filtered = filtered.filter(report => 
        report.specialEducator?.id === educatorFilter ||
        report.superSpecialEducator?.id === educatorFilter
      );
    }

    // Date filter
    if (dateFilter) {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(report => 
            new Date(report.createdAt) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(report => 
            new Date(report.createdAt) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(report => 
            new Date(report.createdAt) >= filterDate
          );
          break;
      }
    }

    setFilteredReports(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ASSESSMENT': return 'bg-blue-100 text-blue-800';
      case 'IEP': return 'bg-purple-100 text-purple-800';
      case 'PROGRESS': return 'bg-green-100 text-green-800';
      case 'INTAKE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUniqueTypes = () => {
    return Array.from(new Set(reports.map(r => r.type)));
  };

  const getUniqueEducators = () => {
    const educators = new Map();
    reports.forEach(report => {
      if (report.specialEducator) {
        educators.set(report.specialEducator.id, report.specialEducator);
      }
      if (report.superSpecialEducator) {
        educators.set(report.superSpecialEducator.id, report.superSpecialEducator);
      }
    });
    return Array.from(educators.values());
  };

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <LoadingSkeleton className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
          <LoadingSkeleton className="h-32" />
        </div>
        <LoadingSkeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadReports}>
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="">
      <PageHeader
        title="Reports Dashboard"
        description="View and manage all reports generated by your center"
        badge={{
          text: `${stats?.totalReports || 0} Total Reports`,
          variant: 'secondary'
        }}
        actions={[
          {
            label: 'Export Reports',
            onClick: () => console.log('Export reports'),
            icon: Download,
            variant: 'outline'
          }
        ]}
      />

      {/* Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <EnhancedCard
            title="Total Reports"
            value={stats.totalReports}
            description="All generated reports"
            icon={FileText}
            iconColor="text-blue-600"
            iconBgColor="bg-blue-50"
            change={`${stats.completedReports} completed`}
            changeType="positive"
          />
          <EnhancedCard
            title="Pending Reports"
            value={stats.pendingReports}
            description="Awaiting completion"
            icon={Clock}
            iconColor="text-yellow-600"
            iconBgColor="bg-yellow-50"
            change={`${Math.round((stats.pendingReports / stats.totalReports) * 100) || 0}% of total`}
            changeType="neutral"
          />
          <EnhancedCard
            title="Completed Reports"
            value={stats.completedReports}
            description="Finalized reports"
            icon={CheckCircle}
            iconColor="text-green-600"
            iconBgColor="bg-green-50"
            change={`${Math.round((stats.completedReports / stats.totalReports) * 100) || 0}% completion rate`}
            changeType="positive"
          />
          <EnhancedCard
            title="Report Types"
            value={Object.keys(stats.reportsByType).length}
            description="Different report categories"
            icon={BarChart3}
            iconColor="text-purple-600"
            iconBgColor="bg-purple-50"
            change="Active categories"
            changeType="neutral"
          />
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reports">All Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filter Reports
                </CardTitle>
                <CardDescription>
                  Search and filter reports by various criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Search</label>
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        {getUniqueTypes().map(type => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Educator</label>
                    <Select value={educatorFilter} onValueChange={setEducatorFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All educators" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All educators</SelectItem>
                        {getUniqueEducators().map((educator: any) => (
                          <SelectItem key={educator.id} value={educator.id}>
                            {educator.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Date Range</label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All dates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All dates</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">Last 7 days</SelectItem>
                        <SelectItem value="month">Last 30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Reports ({filteredReports.length})
                </CardTitle>
                <CardDescription>
                  All reports matching your filter criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredReports.length > 0 ? (
                  <div className="space-y-4">
                    {filteredReports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {report.type.replace('_', ' ')} Report
                              </h3>
                              <Badge className={getTypeColor(report.type)}>
                                {report.type}
                              </Badge>
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {report.student.fullName} (Grade {report.student.grade})
                              </div>
                              
                              {(report.specialEducator || report.superSpecialEducator) && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {report.specialEducator?.fullName || report.superSpecialEducator?.fullName}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(report.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/center/reports/${report.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">
                      {reports.length === 0 
                        ? 'No reports generated yet'
                        : 'No reports match your filters'
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reports.length === 0 
                        ? 'Reports will appear here as they are generated'
                        : 'Try adjusting your search criteria'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Reports by Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.reportsByType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(type)}>
                              {type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${(count / stats.totalReports) * 100}%` }}
                              />
                            </div>
                            <span className="font-medium w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Reports by Month
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.reportsByMonth).map(([month, count]) => (
                        <div key={month} className="flex items-center justify-between p-3 border rounded">
                          <span className="font-medium">{month}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${(count / Math.max(...Object.values(stats.reportsByMonth))) * 100}%` }}
                              />
                            </div>
                            <span className="font-medium w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest report generation activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.recentReports.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentReports.map((report, index) => (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {report.type.replace('_', ' ')} Report
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {report.student.fullName} • {new Date(report.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(report.status)}>
                              {report.status}
                            </Badge>
                            <Link href={`/center/reports/${report.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
