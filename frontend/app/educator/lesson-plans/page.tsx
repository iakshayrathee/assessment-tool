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
import { ArrowLeft, Plus, Calendar, Target, TrendingUp, User, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
  
  // Get educator ID from auth
  const educatorId = user?.profile?.id;
  
  // Fetch students for this educator
  const { students, isLoading: studentsLoading } = useEducatorStudents();
  
  // Fetch IEP goals for all students under this educator
  const { 
    iepGoals, 
    createIEPGoal, 
    updateIEPGoal, 
    updateProgress, 
    isCreating, 
    isUpdating,
    isLoading: goalsLoading 
  } = useIEPGoals(undefined, educatorId);

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

  // Filter goals by selected student
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
            <Select value={selectedStudentId || ''} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a student to view their IEP goals" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student: Student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{filteredGoals.length}</div>
                  <p className="text-xs text-muted-foreground">
                    For selected student
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {filteredGoals.filter((goal: any) => goal.status === 'IN_PROGRESS').length}
                  </div>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">
                    {filteredGoals.filter((goal: any) => goal.status === 'ACHIEVED').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Achieved</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{calculateOverallProgress()}%</div>
                  <p className="text-xs text-muted-foreground">Overall Progress</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">{calculateOverallProgress()}%</span>
                </div>
              </div>
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
            </CardTitle>
          </CardHeader>
          <CardContent>
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
