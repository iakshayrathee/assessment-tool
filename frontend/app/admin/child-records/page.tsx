'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FolderOpen,
  FileText,
  ClipboardList,
  BookOpen,
  Upload,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  User,
  GraduationCap,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ChildRecord {
  id: string;
  studentName: string;
  studentId: string;
  age: number;
  centerName: string;
  educatorName: string;
  parentName: string;
  reports: {
    total: number;
    recent: number;
  };
  assessments: {
    total: number;
    pending: number;
    completed: number;
  };
  ieps: {
    active: number;
    completed: number;
  };
  progressNotes: {
    total: number;
    thisMonth: number;
  };
  documents: {
    total: number;
    categories: string[];
  };
  lastUpdated: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED';
}

interface DocumentCategory {
  name: string;
  count: number;
  icon: React.ReactNode;
  color: string;
}

export default function ChildRecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<ChildRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [centerFilter, setCenterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  useEffect(() => {
    loadChildRecords();
  }, []);

  const loadChildRecords = async () => {
    try {
      setLoading(true);
      
      // Mock data - replace with actual API call
      const mockRecords: ChildRecord[] = [
        {
          id: '1',
          studentName: 'Alex Johnson',
          studentId: 'STU001',
          age: 8,
          centerName: 'Learning Center Mumbai',
          educatorName: 'Dr. Sarah Johnson',
          parentName: 'Michael Johnson',
          reports: { total: 12, recent: 3 },
          assessments: { total: 8, pending: 1, completed: 7 },
          ieps: { active: 2, completed: 1 },
          progressNotes: { total: 45, thisMonth: 8 },
          documents: { 
            total: 23, 
            categories: ['Medical Records', 'Assessment Reports', 'IEP Documents', 'Progress Photos'] 
          },
          lastUpdated: '2024-01-15T14:30:00Z',
          status: 'ACTIVE'
        },
        {
          id: '2',
          studentName: 'Emma Davis',
          studentId: 'STU002',
          age: 6,
          centerName: 'Special Education Hub Delhi',
          educatorName: 'Ms. Priya Sharma',
          parentName: 'Jennifer Davis',
          reports: { total: 8, recent: 2 },
          assessments: { total: 5, pending: 2, completed: 3 },
          ieps: { active: 1, completed: 0 },
          progressNotes: { total: 28, thisMonth: 12 },
          documents: { 
            total: 18, 
            categories: ['Medical Records', 'Therapy Notes', 'Assessment Reports'] 
          },
          lastUpdated: '2024-01-14T09:15:00Z',
          status: 'ACTIVE'
        },
        {
          id: '3',
          studentName: 'Ryan Wilson',
          studentId: 'STU003',
          age: 10,
          centerName: 'Inclusive Learning Center',
          educatorName: 'Dr. Rajesh Kumar',
          parentName: 'David Wilson',
          reports: { total: 15, recent: 1 },
          assessments: { total: 12, pending: 0, completed: 12 },
          ieps: { active: 3, completed: 2 },
          progressNotes: { total: 67, thisMonth: 5 },
          documents: { 
            total: 31, 
            categories: ['Medical Records', 'Assessment Reports', 'IEP Documents', 'Therapy Notes', 'Progress Photos'] 
          },
          lastUpdated: '2024-01-13T16:45:00Z',
          status: 'ACTIVE'
        }
      ];

      await new Promise(resolve => setTimeout(resolve, 1000));
      setRecords(mockRecords);
    } catch (error) {
      console.error('Failed to load child records:', error);
    } finally {
      setLoading(false);
    }
  };

  const documentCategories: DocumentCategory[] = [
    {
      name: 'Reports',
      count: records.reduce((sum, r) => sum + r.reports.total, 0),
      icon: <FileText className="h-5 w-5" />,
      color: 'blue'
    },
    {
      name: 'Assessments',
      count: records.reduce((sum, r) => sum + r.assessments.total, 0),
      icon: <ClipboardList className="h-5 w-5" />,
      color: 'green'
    },
    {
      name: 'IEPs',
      count: records.reduce((sum, r) => sum + r.ieps.active + r.ieps.completed, 0),
      icon: <BookOpen className="h-5 w-5" />,
      color: 'purple'
    },
    {
      name: 'Progress Notes',
      count: records.reduce((sum, r) => sum + r.progressNotes.total, 0),
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'orange'
    },
    {
      name: 'Documents',
      count: records.reduce((sum, r) => sum + r.documents.total, 0),
      icon: <Upload className="h-5 w-5" />,
      color: 'indigo'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'GRADUATED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = !searchQuery || 
      record.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.educatorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCenter = !centerFilter || record.centerName.includes(centerFilter);
    const matchesStatus = !statusFilter || record.status === statusFilter;
    
    return matchesSearch && matchesCenter && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
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
                <Skeleton key={i} className="h-20 w-full" />
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
          <h1 className="text-3xl font-bold tracking-tight">Child Records</h1>
          <p className="text-muted-foreground">
            Manage reports, assessments, IEPs, progress notes, and uploaded documents
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {records.length} Students
          </Badge>
          <Button variant="outline" onClick={loadChildRecords}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        </div>
      </div>

      {/* Document Categories Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-6 md:grid-cols-5"
      >
        {documentCategories.map((category, index) => (
          <Card key={category.name} className="overflow-hidden">
            <CardHeader className={`bg-gradient-to-r from-${category.color}-50 to-${category.color}-100 dark:from-${category.color}-950 dark:to-${category.color}-900 pb-3`}>
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-${category.color}-100 dark:bg-${category.color}-900 text-${category.color}-600`}>
                  {category.icon}
                </div>
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="text-2xl font-bold">{category.count}</div>
                <div className="text-sm font-medium text-muted-foreground">{category.name}</div>
                <div className="text-xs text-muted-foreground">
                  Across all students
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Search & Filter Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by student name, ID, parent, or educator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={centerFilter} onValueChange={setCenterFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Centers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Centers</SelectItem>
                  <SelectItem value="Learning Center Mumbai">Learning Center Mumbai</SelectItem>
                  <SelectItem value="Special Education Hub Delhi">Special Education Hub Delhi</SelectItem>
                  <SelectItem value="Inclusive Learning Center">Inclusive Learning Center</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="GRADUATED">Graduated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Records with Collapsible Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-indigo-600" />
              Student Records ({filteredRecords.length})
            </CardTitle>
            <CardDescription>
              Organized view of all child records with collapsible sections
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {filteredRecords.map((record) => (
                <Collapsible
                  key={record.id}
                  open={expandedRecord === record.id}
                  onOpenChange={(open) => setExpandedRecord(open ? record.id : null)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-6 hover:bg-muted/50 border-b">
                      <div className="flex items-center gap-4">
                        {expandedRecord === record.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="text-left">
                          <div className="font-medium">{record.studentName}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {record.studentId} • Age: {record.age} • {record.centerName}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="font-medium">
                            {record.reports.total + record.assessments.total + record.ieps.active + record.ieps.completed + record.progressNotes.total + record.documents.total} Total Items
                          </div>
                          <div className="text-muted-foreground">
                            Updated {new Date(record.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-6 bg-muted/20">
                      <Tabs defaultValue="reports" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-5">
                          <TabsTrigger value="reports" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Reports ({record.reports.total})
                          </TabsTrigger>
                          <TabsTrigger value="assessments" className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Assessments ({record.assessments.total})
                          </TabsTrigger>
                          <TabsTrigger value="ieps" className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            IEPs ({record.ieps.active + record.ieps.completed})
                          </TabsTrigger>
                          <TabsTrigger value="progress" className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Progress ({record.progressNotes.total})
                          </TabsTrigger>
                          <TabsTrigger value="documents" className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            Documents ({record.documents.total})
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="reports" className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Assessment Reports</CardTitle>
                                <CardDescription>Formal evaluation reports</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="flex items-center justify-between">
                                  <span className="text-2xl font-bold">{record.reports.total}</span>
                                  <Badge variant="secondary">{record.reports.recent} recent</Badge>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View All Reports
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create New Report
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="assessments" className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  Completed
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <span className="text-2xl font-bold">{record.assessments.completed}</span>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-orange-600" />
                                  Pending
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <span className="text-2xl font-bold">{record.assessments.pending}</span>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Actions</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <Plus className="h-4 w-4 mr-2" />
                                  New Assessment
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="ieps" className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Star className="h-5 w-5 text-blue-600" />
                                  Active IEPs
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <span className="text-2xl font-bold">{record.ieps.active}</span>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  Completed
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <span className="text-2xl font-bold">{record.ieps.completed}</span>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Actions</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View IEPs
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create IEP
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="progress" className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Progress Notes</CardTitle>
                                <CardDescription>Regular progress tracking</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span>Total Notes</span>
                                    <span className="font-bold">{record.progressNotes.total}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>This Month</span>
                                    <Badge variant="secondary">{record.progressNotes.thisMonth}</Badge>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Actions</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Progress
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Note
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Document Categories</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  {record.documents.categories.map((category, index) => (
                                    <Badge key={index} variant="outline" className="mr-2 mb-2">
                                      {category}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Actions</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Documents
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start">
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload New
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            {filteredRecords.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No records found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search criteria or add new records.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
