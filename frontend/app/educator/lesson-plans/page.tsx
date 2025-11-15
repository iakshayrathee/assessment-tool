'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ArrowLeft, Plus, Calendar, Target, TrendingUp, User, CheckCircle, Clock, AlertCircle, Search, Filter, ArrowUpDown } from 'lucide-react';
import { useIEPGoals } from '@/hooks/useAssessments';
import { useEducatorStudents } from '@/hooks/useEducator';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Student } from '@/types';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';

const DOMAINS = [
  'Reading', 'Writing', 'Math', 'Visual Perception', 'Motor Skills', 'Attention', 'Communication', 'Social Skills'
];

const GOAL_STATUS_CONFIG = {
  'NOT_STARTED': { color: 'bg-gray-100 text-gray-800', icon: Clock },
  'IN_PROGRESS': { color: 'bg-yellow-100 text-yellow-800', icon: TrendingUp },
  'ACHIEVED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'DISCONTINUED': { color: 'bg-red-100 text-red-800', icon: AlertCircle }
};

export const dynamic = 'force-dynamic';

function LessonPlansPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  // State for student selection (single student only)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    searchParams.get('studentId') || null
  );
  const [showNewGoalDialog, setShowNewGoalDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [newGoal, setNewGoal] = useState({
    studentId: '',
    domain: '',
    goalStatement: '',
    strategy: '',
    startDate: '',
    targetDate: '',
    expectedOutcome: ''
  });
  const [progressUpdate, setProgressUpdate] = useState({
    progress: 0,
    notes: '',
    rating: ''
  });
  
  // Student search modal state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [studentCurrentPage, setStudentCurrentPage] = useState(1);
  const [studentItemsPerPage, setStudentItemsPerPage] = useState(10);
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('startDate');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Get educator ID from auth
  const educatorId = user?.profile?.id;
  
  // Fetch students for this educator
  const { students, isLoading: studentsLoading } = useEducatorStudents();
  
  // Fetch IEP goals for all students under this educator with pagination and filtering
  const filters = {
    domain: domainFilter === 'all' ? '' : domainFilter,
    status: statusFilter === 'all' ? '' : statusFilter,
    search: searchTerm,
    sortBy,
    sortOrder
  };

  const { 
    iepGoals, 
    pagination,
    createIEPGoal, 
    updateIEPGoal, 
    updateProgress, 
    isCreating, 
    isUpdating,
    isLoading: goalsLoading,
    isFetching: goalsFetching 
  } = useIEPGoals(undefined, educatorId, currentPage, itemsPerPage, filters);

  // Update newGoal studentId when selectedStudentId changes
  useEffect(() => {
    if (selectedStudentId) {
      setNewGoal(prev => ({ ...prev, studentId: selectedStudentId }));
    }
  }, [selectedStudentId]);

  const handleCreateGoal = () => {
    if (!selectedStudentId) {
      toast.error('Please select a student first');
      return;
    }
    
    // Convert dates to ISO-8601 DateTime format for Prisma
    const goalData = {
      ...newGoal,
      startDate: newGoal.startDate ? new Date(newGoal.startDate + 'T00:00:00.000Z').toISOString() : '',
      targetDate: newGoal.targetDate ? new Date(newGoal.targetDate + 'T00:00:00.000Z').toISOString() : ''
    };
    
    createIEPGoal(goalData);
    setShowNewGoalDialog(false);
    setNewGoal({
      studentId: selectedStudentId || '',
      domain: '',
      goalStatement: '',
      strategy: '',
      startDate: '',
      targetDate: '',
      expectedOutcome: ''
    });
  };

  const handleUpdateProgress = () => {
    if (!selectedGoal) return;
    
    updateProgress({
      goalId: selectedGoal.id,
      progress: progressUpdate.progress,
      notes: progressUpdate.notes,
      rating: progressUpdate.rating
    });
    setShowProgressDialog(false);
    setSelectedGoal(null);
    setProgressUpdate({ progress: 0, notes: '', rating: '' });
  };

  const getStudentName = (studentId: string) => {
    const student = students?.find((s: Student) => s.id === studentId);
    return student ? student.fullName : 'Unknown Student';
  };

  const getGoalStatusDisplay = (status: string) => {
    const config = GOAL_STATUS_CONFIG[status as keyof typeof GOAL_STATUS_CONFIG];
    if (!config) return { color: 'bg-gray-100 text-gray-800', icon: Clock };
    return config;
  };

  // Filter goals by selected student (now handled by backend, but maintain frontend filtering for consistency)
  const filteredGoals = selectedStudentId 
    ? iepGoals?.filter((goal: any) => goal.studentId === selectedStudentId) || []
    : iepGoals || [];

  const calculateOverallProgress = () => {
    if (!filteredGoals || filteredGoals.length === 0) return 0;
    const totalProgress = filteredGoals.reduce((sum: number, goal: any) => sum + (goal.progressPercent || 0), 0);
    return Math.round(totalProgress / filteredGoals.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Students
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IEP Goals</h1>
              <p className="text-gray-600">Manage and track student progress</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={showNewGoalDialog} onOpenChange={setShowNewGoalDialog}>
              <DialogTrigger asChild>
                <Button disabled={!selectedStudentId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New IEP Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="domain">Domain</Label>
                      <Select value={newGoal.domain} onValueChange={(value) => setNewGoal(prev => ({ ...prev, domain: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select domain" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOMAINS.map(domain => (
                            <SelectItem key={domain} value={domain}>
                              {domain}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <ProfessionalDatePicker
                        label="Start Date"
                        value={newGoal.startDate ? new Date(newGoal.startDate) : null}
                        onChange={(date) => setNewGoal(prev => ({ ...prev, startDate: date ? date.toISOString().split('T')[0] : '' }))}
                        placeholder="Select start date"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="goalStatement">Goal Statement</Label>
                    <Textarea
                      id="goalStatement"
                      placeholder="Describe the specific goal..."
                      value={newGoal.goalStatement}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, goalStatement: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="strategy">Strategy</Label>
                    <Textarea
                      id="strategy"
                      placeholder="Describe the strategy to achieve this goal..."
                      value={newGoal.strategy}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, strategy: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expectedOutcome">Expected Outcome</Label>
                    <Textarea
                      id="expectedOutcome"
                      placeholder="Describe the expected outcome for this goal..."
                      value={newGoal.expectedOutcome}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, expectedOutcome: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <ProfessionalDatePicker
                      label="Target Date"
                      value={newGoal.targetDate ? new Date(newGoal.targetDate) : null}
                      onChange={(date) => setNewGoal(prev => ({ ...prev, targetDate: date ? date.toISOString().split('T')[0] : '' }))}
                      placeholder="Select target date"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowNewGoalDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateGoal} disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Goal'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Student Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Select Student</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal"
                onClick={() => setShowStudentModal(true)}
              >
                {selectedStudentId ? getStudentName(selectedStudentId) : 'Choose a student to view their IEP goals'}
              </Button>
              
              {selectedStudentId && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {getStudentName(selectedStudentId)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStudentId(null)}
                    className="h-6 px-2"
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search Goals</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search goals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Domain Filter */}
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All domains" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All domains</SelectItem>
                    {DOMAINS.map(domain => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="ACHIEVED">Achieved</SelectItem>
                    <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <Label htmlFor="sort">Sort By</Label>
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startDate-desc">Start Date (Newest)</SelectItem>
                    <SelectItem value="startDate-asc">Start Date (Oldest)</SelectItem>
                    <SelectItem value="targetDate-desc">Target Date (Newest)</SelectItem>
                    <SelectItem value="targetDate-asc">Target Date (Oldest)</SelectItem>
                    <SelectItem value="progressPercent-desc">Progress (High to Low)</SelectItem>
                    <SelectItem value="progressPercent-asc">Progress (Low to High)</SelectItem>
                    <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                    <SelectItem value="status-desc">Status (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              {goalsLoading ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-300">--</div>
                    <p className="text-xs text-muted-foreground">
                      For selected student
                    </p>
                  </div>
                  <div className="animate-pulse">
                    <Target className="h-8 w-8 text-gray-200" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{filteredGoals.length}</div>
                    <p className="text-xs text-muted-foreground">
                      For selected student
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-500" />
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              {goalsLoading ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-300">--</div>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div className="animate-pulse">
                    <TrendingUp className="h-8 w-8 text-gray-200" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {filteredGoals.filter((goal: any) => goal.status === 'IN_PROGRESS').length}
                    </div>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-500" />
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              {goalsLoading ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-300">--</div>
                    <p className="text-xs text-muted-foreground">Achieved</p>
                  </div>
                  <div className="animate-pulse">
                    <CheckCircle className="h-8 w-8 text-gray-200" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {filteredGoals.filter((goal: any) => goal.status === 'ACHIEVED').length}
                    </div>
                    <p className="text-xs text-muted-foreground">Achieved</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              {goalsLoading ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-300">--</div>
                    <p className="text-xs text-muted-foreground">Overall Progress</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-xs font-bold">--%</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{calculateOverallProgress()}%</div>
                    <p className="text-xs text-muted-foreground">Overall Progress</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">{calculateOverallProgress()}%</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* IEP Goals List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              IEP Goals
              {selectedStudentId && (
                <span className="text-sm font-normal text-gray-600">
                  - {getStudentName(selectedStudentId)}
                </span>
              )}
              {goalsFetching && (
                <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalsFetching && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading goals...</p>
                </div>
              </div>
            )}
            {filteredGoals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedStudentId 
                    ? 'No IEP goals created yet for this student'
                    : 'No IEP goals found'
                  }
                </h3>
                <p className="text-gray-500 mb-4">
                  {selectedStudentId
                    ? 'Start by creating the first goal for this student'
                    : 'Create goals for your students to get started'
                  }
                </p>
                {selectedStudentId && (
                  <Button onClick={() => setShowNewGoalDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Goal
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredGoals.map((goal: any) => {
                  const statusConfig = getGoalStatusDisplay(goal.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div key={goal.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {goal.domain}
                            </Badge>
                            <Badge className={`text-xs ${statusConfig.color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              <span className="ml-1">{goal.status.replace('_', ' ')}</span>
                            </Badge>
                            {!selectedStudentId && (
                              <Badge variant="secondary" className="text-xs">
                                <User className="h-3 w-3 mr-1" />
                                {getStudentName(goal.studentId)}
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="font-medium text-gray-900 mb-1">{goal.goalStatement}</h4>
                          <p className="text-sm text-gray-600 mb-2">{goal.strategy}</p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.targetDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">{goal.progressPercent || 0}%</div>
                            <Progress value={goal.progressPercent || 0} className="w-20 h-2" />
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedGoal(goal);
                              setProgressUpdate({
                                progress: goal.progressPercent || 0,
                                notes: '',
                                rating: ''
                              });
                              setShowProgressDialog(true);
                            }}
                          >
                            Update Progress
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > pagination.totalPages) return null;
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                isActive={currentPage === pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                            className={currentPage === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    
                    <div className="text-center text-sm text-gray-500 mt-2">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalItems)} of {pagination.totalItems} goals
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Update Dialog */}
        <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Progress</DialogTitle>
            </DialogHeader>
            {selectedGoal && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium">{selectedGoal.goalStatement}</p>
                  <p className="text-sm text-gray-600">{selectedGoal.domain}</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="progress">Progress Percentage</Label>
                  <Input
                    id="progress"
                    type="number"
                    min="0"
                    max="100"
                    value={progressUpdate.progress}
                    onChange={(e) => setProgressUpdate(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Progress Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about the progress..."
                    value={progressUpdate.notes}
                    onChange={(e) => setProgressUpdate(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Select value={progressUpdate.rating} onValueChange={(value) => setProgressUpdate(prev => ({ ...prev, rating: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="satisfactory">Satisfactory</SelectItem>
                      <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateProgress} disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update Progress'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Student Search Modal */}
        <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Select Student</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students by name..."
                  value={studentSearchTerm}
                  onChange={(e) => {
                    setStudentSearchTerm(e.target.value);
                    setStudentCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Students List */}
              <div className="flex-1 overflow-y-auto border rounded-lg">
                {studentsLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading students...</p>
                  </div>
                ) : students && students.length > 0 ? (
                  <div className="divide-y">
                    {students
                      .filter((student: Student) => 
                        student.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase())
                      )
                      .slice((studentCurrentPage - 1) * studentItemsPerPage, studentCurrentPage * studentItemsPerPage)
                      .map((student: Student) => (
                        <div
                          key={student.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedStudentId === student.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                          }`}
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setShowStudentModal(false);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{student.fullName}</h4>
                              <p className="text-sm text-gray-600">
                                {student.grade && student.grade !== '' ? 
                                  `Grade ${student.grade}` : 
                                  'No grade level'
                                }
                              </p>
                            </div>
                            {selectedStudentId === student.id && (
                              <Badge variant="default" className="bg-blue-600">
                                Selected
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                    <p className="text-gray-600">
                      {studentSearchTerm 
                        ? 'No students match your search criteria' 
                        : 'No students are assigned to you yet'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {students && students.filter((student: Student) => 
                student.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase())
              ).length > studentItemsPerPage && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((studentCurrentPage - 1) * studentItemsPerPage) + 1} to {
                      Math.min(studentCurrentPage * studentItemsPerPage, 
                      students.filter((student: Student) => 
                        student.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase())
                      ).length)
                    } of {
                      students.filter((student: Student) => 
                        student.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase())
                      ).length
                    } students
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStudentCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={studentCurrentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm text-gray-600">
                      Page {studentCurrentPage}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStudentCurrentPage(prev => prev + 1)}
                      disabled={
                        studentCurrentPage * studentItemsPerPage >= 
                        students.filter((student: Student) => 
                          student.fullName.toLowerCase().includes(studentSearchTerm.toLowerCase())
                        ).length
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function LessonPlansPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading lesson plans...</p>
      </div>
    </div>}>
      <LessonPlansPageContent />
    </Suspense>
  );
}
