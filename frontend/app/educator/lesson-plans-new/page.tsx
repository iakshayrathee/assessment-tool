'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEducatorStudents } from '@/hooks/useEducator';
import { Student } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BookOpen,
  PenTool,
  Calculator,
  Plus,
  Calendar,
  Target,
  TrendingUp,
  BarChart3,
  CheckCircle,
  Users,
  Loader2,
  Eye,
  Pencil,
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

const SKILL_AREAS = [
  { value: 'READING', label: 'Reading', icon: BookOpen },
  { value: 'WRITING', label: 'Writing', icon: PenTool },
  { value: 'MATH', label: 'Math', icon: Calculator },
] as const;

const RESOURCES = [
  'Worksheets',
  'Manipulatives',
  'Videos',
  'Digital Content',
  'Flashcards',
  'Games',
  'Books',
  'Other',
] as const;

const MOTIVATION_LEVELS = [
  { value: 'HIGH', label: 'High', color: 'text-green-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600' },
  { value: 'LOW', label: 'Low', color: 'text-red-600' },
] as const;

const PROGRESS_LEVELS = [
  { value: 'NOT_STARTED', label: 'Not Started', color: 'text-gray-700', bgColor: 'bg-gray-200' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'text-yellow-700', bgColor: 'bg-yellow-200' },
  { value: 'COMPLETED', label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-200' },
  { value: 'NEEDS_REVIEW', label: 'Needs Review', color: 'text-red-700', bgColor: 'bg-red-200' },
] as const;

interface LessonPlan {
  id: string;
  studentId: string;
  startDate?: string;
  endDate?: string;
  date?: string; // Legacy field for backward compatibility
  skillArea: string;
  specificTopic: string;
  areasOfRemediation: string[];
  activityStrategy: string;
  resourcesUsed: string[];
  expectedTime?: number;
  actualTimeTaken?: number;
  motivationLevel?: string;
  outcome?: string;
  nextStep?: string;
  longTermGoal?: string;
  shortTermGoal?: string;
  progressPercentage?: number;
  progressStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_REVIEW';
  weeklyPlan?: WeeklyPlan[];
  createdAt: string;
  updatedAt: string;
  student?: Student;
}

interface WeeklyPlan {
  weekNumber: number;
  weekStartDate: string;
  weekEndDate: string;
  objectives: string;
  activities: string;
  progress: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'NEEDS_REVIEW';
}

const formSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  skillArea: z.enum(['READING', 'WRITING', 'MATH'], {
    required_error: 'Skill area is required',
  }),
  specificTopic: z.string().min(1, 'Specific topic is required'),
  areasOfRemediation: z.array(z.string()).min(1, 'Select at least one area'),
  activityStrategy: z.string().min(1, 'Activity/strategy is required'),
  resourcesUsed: z.array(z.string()).min(1, 'Select at least one resource'),
  expectedTime: z.coerce.number().min(1).optional(),
  actualTimeTaken: z.coerce.number().min(1).optional(),
  motivationLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  outcome: z.string().optional(),
  nextStep: z.string().optional(),
  longTermGoal: z.string().optional(),
  shortTermGoal: z.string().optional(),
  progressPercentage: z.coerce.number().min(0).max(100).optional(),
  progressStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_REVIEW']).optional(),
  weeklyPlan: z.array(z.object({
    weekNumber: z.number(),
    weekStartDate: z.string(),
    weekEndDate: z.string(),
    objectives: z.string(),
    activities: z.string(),
    progress: z.number().min(0).max(100),
    status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NEEDS_REVIEW']),
  })).optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type LessonPlanFormValues = z.infer<typeof formSchema>;

// Helper function to calculate automatic progress based on dates
function calculateAutoProgress(startDate: Date, endDate: Date): number {
  const now = new Date();
  const start = startDate.getTime();
  const end = endDate.getTime();
  const current = now.getTime();

  if (current < start) return 0;
  if (current > end) return 100;

  const totalDuration = end - start;
  const elapsed = current - start;
  const progress = Math.round((elapsed / totalDuration) * 100);

  return Math.min(Math.max(progress, 0), 100);
}

// Helper function to get start/end dates from plan (handles legacy data)
function getPlanDates(plan: LessonPlan): { startDate: Date | null; endDate: Date | null } {
  // New format: has startDate and endDate
  if (plan.startDate && plan.endDate) {
    return {
      startDate: new Date(plan.startDate),
      endDate: new Date(plan.endDate),
    };
  }

  // Legacy format: has only date field
  if (plan.date) {
    const date = new Date(plan.date);
    return {
      startDate: date,
      endDate: date, // Use same date for both
    };
  }

  return { startDate: null, endDate: null };
}

// Helper function to generate dynamic weekly plan based on date range
function generateWeeklyPlan(startDate: Date, endDate: Date): any[] {
  const weeks = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate number of weeks
  const diffDays = differenceInDays(end, start) + 1;
  const numWeeks = Math.ceil(diffDays / 7);

  for (let i = 0; i < numWeeks; i++) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + (i * 7));

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Don't let week end go beyond the plan end date
    if (weekEnd > end) {
      weekEnd.setTime(end.getTime());
    }

    weeks.push({
      weekNumber: i + 1,
      weekStartDate: format(weekStart, 'MMM dd, yyyy'),
      weekEndDate: format(weekEnd, 'MMM dd, yyyy'),
      objectives: '',
      activities: '',
      progress: 0,
      status: 'NOT_STARTED' as const,
    });
  }

  return weeks;
}

// Student Selection Modal Component
function StudentSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedStudentId
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  selectedStudentId: string;
}) {
  const { students, isLoading } = useEducatorStudents();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter students based on search query
  const filteredStudents = students?.filter((student: Student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.fullName?.toLowerCase().includes(query) ||
      student.grade?.toString().includes(query) ||
      student.school?.name?.toLowerCase().includes(query)
    );
  }) || [];

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Student</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {/* Search Input */}
          {!isLoading && students.length > 0 && (
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by name, grade, or school..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* Student List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : students.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No students available</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No students found matching "{searchQuery}"</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
              {filteredStudents.map((student: Student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    onSelect(student.id);
                    onClose();
                  }}
                  className={`p-4 text-left border rounded-lg hover:bg-blue-50 transition-colors ${selectedStudentId === student.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                >
                  <p className="font-medium text-gray-900">{student.fullName}</p>
                  <p className="text-sm text-gray-600">Grade {student.grade}</p>
                  {student.school?.name && (
                    <p className="text-xs text-gray-500 mt-1">{student.school.name}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LessonPlansPage() {
  const { students, isLoading: studentsLoading } = useEducatorStudents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [showStudentModal, setShowStudentModal] = useState(false);

  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [editingPlan, setEditingPlan] = useState<any>(null);

  const selectedStudent = students?.find(s => s.id === selectedStudentId);

  const form = useForm<LessonPlanFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: '',
      skillArea: 'READING',
      specificTopic: '',
      areasOfRemediation: [],
      activityStrategy: '',
      resourcesUsed: [],
      motivationLevel: undefined,
      expectedTime: undefined,
      actualTimeTaken: undefined,
      outcome: '',
      nextStep: '',
      longTermGoal: '',
      shortTermGoal: '',
      progressPercentage: 0,
      progressStatus: 'NOT_STARTED',
      weeklyPlan: [],
    },
  });

  // Watch start and end dates to regenerate weekly plan
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');

  useEffect(() => {
    if (startDate && endDate && endDate >= startDate && !editingPlan) {
      const newWeeklyPlan = generateWeeklyPlan(startDate, endDate);
      form.setValue('weeklyPlan', newWeeklyPlan);

      // Calculate and set automatic progress
      const autoProgress = calculateAutoProgress(startDate, endDate);
      form.setValue('progressPercentage', autoProgress);
    }
  }, [startDate, endDate, editingPlan]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchLessonPlans();
    } else {
      setLessonPlans([]);
    }
  }, [selectedStudentId, currentPage]);

  const fetchLessonPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        studentId: selectedStudentId
      };
      const response = await apiClient.getLessonPlansByEducator(params);
      setLessonPlans(response.data?.lessonPlans || []);
      const total = response.data?.total || 0;
      setTotalCount(total);
      setTotalPages(Math.ceil(total / 10) || 1);
    } catch (error: any) {
      console.error('Fetch lesson plans error:', error);
      toast.error('Failed to load lesson plans');
      setLessonPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const onSubmit = async (values: LessonPlanFormValues) => {
    setIsSubmitting(true);
    try {
      const data = {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
      };

      if (editingPlan?.id) {
        await apiClient.updateLessonPlan(editingPlan.id, data);
        toast.success('Lesson plan updated successfully!');
      } else {
        await apiClient.createLessonPlan(data);
        toast.success('Lesson plan created successfully!');
      }

      form.reset();
      setShowForm(false);
      setEditingPlan(null);
      setCurrentPage(1);
      fetchLessonPlans();
    } catch (error: unknown) {
      console.error('Save lesson plan error:', error);
      toast.error('Failed to save lesson plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewPlan = (plan: LessonPlan) => {
    setEditingPlan({ ...plan, mode: 'view' });

    // Get dates safely (handles both old and new formats)
    const { startDate, endDate } = getPlanDates(plan);

    // Pre-fill form with plan data
    form.reset({
      studentId: plan.studentId,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
      skillArea: plan.skillArea as any,
      specificTopic: plan.specificTopic,
      areasOfRemediation: plan.areasOfRemediation || [],
      activityStrategy: plan.activityStrategy,
      resourcesUsed: plan.resourcesUsed || [],
      expectedTime: plan.expectedTime,
      actualTimeTaken: plan.actualTimeTaken,
      motivationLevel: plan.motivationLevel as any,
      outcome: plan.outcome || '',
      nextStep: plan.nextStep || '',
      longTermGoal: plan.longTermGoal || '',
      shortTermGoal: plan.shortTermGoal || '',
      progressPercentage: plan.progressPercentage || 0,
      progressStatus: plan.progressStatus || 'NOT_STARTED',
      weeklyPlan: plan.weeklyPlan || [],
    });

    setShowForm(true);
  };

  const handleEditPlan = (plan: LessonPlan) => {
    setEditingPlan({ ...plan, mode: 'edit' });

    // Get dates safely (handles both old and new formats)
    const { startDate, endDate } = getPlanDates(plan);

    // Pre-fill form with plan data
    form.reset({
      studentId: plan.studentId,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(),
      skillArea: plan.skillArea as any,
      specificTopic: plan.specificTopic,
      areasOfRemediation: plan.areasOfRemediation || [],
      activityStrategy: plan.activityStrategy,
      resourcesUsed: plan.resourcesUsed || [],
      expectedTime: plan.expectedTime,
      actualTimeTaken: plan.actualTimeTaken,
      motivationLevel: plan.motivationLevel as any,
      outcome: plan.outcome || '',
      nextStep: plan.nextStep || '',
      longTermGoal: plan.longTermGoal || '',
      shortTermGoal: plan.shortTermGoal || '',
      progressPercentage: plan.progressPercentage || 0,
      progressStatus: plan.progressStatus || 'NOT_STARTED',
      weeklyPlan: plan.weeklyPlan || [],
    });

    setShowForm(true);
  };

  const handleCreateNew = () => {
    setEditingPlan(null);
    form.reset({
      studentId: selectedStudentId,
      skillArea: 'READING',
      specificTopic: '',
      areasOfRemediation: [],
      activityStrategy: '',
      resourcesUsed: [],
      motivationLevel: undefined,
      expectedTime: undefined,
      actualTimeTaken: undefined,
      outcome: '',
      nextStep: '',
      longTermGoal: '',
      shortTermGoal: '',
      progressPercentage: 0,
      progressStatus: 'NOT_STARTED',
      weeklyPlan: [],
    });
    setShowForm(true);
  };

  const getSkillAreaColor = (skillArea: string) => {
    switch (skillArea) {
      case 'READING':
        return 'bg-blue-100 text-blue-800';
      case 'WRITING':
        return 'bg-purple-100 text-purple-800';
      case 'MATH':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isViewMode = editingPlan?.mode === 'view';

  return (
    <div className="max-w-7xl mx-auto p-6 pb-12">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lesson Plans</h1>
            <p className="text-gray-600">Create and manage comprehensive lesson plans</p>
          </div>

          <div className="flex items-center gap-4">
            {selectedStudent ? (
              <Button
                variant="outline"
                onClick={() => setShowStudentModal(true)}
                className="flex items-center gap-4 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200 min-w-[250px] hover:bg-blue-100"
              >
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-blue-900 text-sm truncate">
                    {selectedStudent.fullName}
                  </p>
                  <p className="text-xs text-blue-700">
                    Grade {selectedStudent.grade || 'N/A'}
                  </p>
                </div>
                <Users className="h-4 w-4 flex-shrink-0" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowStudentModal(true)}
                className="flex items-center gap-2 px-4 py-2 min-w-[140px]"
              >
                <Users className="h-4 w-4" />
                Select Student
              </Button>
            )}
          </div>
        </div>
      </div>

      {selectedStudentId ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lesson Plans ({totalCount})</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Comprehensive lesson plans with progress tracking
                </p>
              </div>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                New Lesson Plan
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : lessonPlans.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No lesson plans yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Skill Area</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessonPlans.map((plan) => {
                    // Get dates safely (handles both old and new formats)
                    const { startDate, endDate } = getPlanDates(plan);

                    // Calculate auto progress for display
                    const autoProgress = startDate && endDate
                      ? calculateAutoProgress(startDate, endDate)
                      : plan.progressPercentage || 0;

                    return (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          {startDate ? format(startDate, 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {endDate ? format(endDate, 'MMM dd, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillAreaColor(plan.skillArea)}`}>
                            {plan.skillArea}
                          </span>
                        </TableCell>
                        <TableCell>{plan.specificTopic}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{ width: `${autoProgress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{autoProgress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.progressStatus ? (
                            <span className="text-sm font-medium">
                              {plan.progressStatus.replace(/_/g, ' ')}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPlan(plan)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPlan(plan)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="flex-1">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Student Selected</h3>
              <p className="text-gray-600">
                Please select a student from above to begin creating lesson plans
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <StudentSelectionModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSelect={setSelectedStudentId}
        selectedStudentId={selectedStudentId}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
          <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle>
                {isViewMode
                  ? 'View Lesson Plan'
                  : editingPlan
                    ? 'Edit Lesson Plan'
                    : 'Create Comprehensive Lesson Plan'}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Student & Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students?.map((student: Student) => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.fullName} - Grade {student.grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date *</FormLabel>
                        <FormControl>
                          <ProfessionalDatePicker
                            label=""
                            value={field.value || null}
                            onChange={(date) => field.onChange(date || undefined)}
                            placeholder="Select start date"
                            disabled={isViewMode}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date *</FormLabel>
                        <FormControl>
                          <ProfessionalDatePicker
                            label=""
                            value={field.value || null}
                            onChange={(date) => field.onChange(date || undefined)}
                            placeholder="Select end date"
                            disabled={isViewMode}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Auto Progress Display */}
                {startDate && endDate && endDate >= startDate && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Automatic Progress Calculation</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Based on start date, end date, and current date
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-blue-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full bg-blue-600"
                            style={{ width: `${calculateAutoProgress(startDate, endDate)}%` }}
                          />
                        </div>
                        <span className="text-lg font-bold text-blue-900">
                          {calculateAutoProgress(startDate, endDate)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Long-term and Short-term Goals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg">
                  <FormField
                    control={form.control}
                    name="longTermGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Long-term Goal
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Student will read grade-level text with 80% accuracy"
                            rows={3}
                            {...field}
                            disabled={isViewMode}
                            className={isViewMode ? 'bg-gray-100 text-gray-800' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shortTermGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Short-term Goal
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Student will decode CVC words with 90% accuracy"
                            rows={3}
                            {...field}
                            disabled={isViewMode}
                            className={isViewMode ? 'bg-gray-100 text-gray-800' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Skill Area & Topic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="skillArea"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Area *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                          <FormControl>
                            <SelectTrigger className={isViewMode ? 'bg-gray-100 text-gray-800' : ''}>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SKILL_AREAS.map((area) => (
                              <SelectItem key={area.value} value={area.value}>
                                {area.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specificTopic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specific Topic *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., CVC blending, Addition within 20"
                            {...field}
                            disabled={isViewMode}
                            className={isViewMode ? 'bg-gray-100 text-gray-800' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Progress Status */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <FormField
                    control={form.control}
                    name="progressStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Progress Status
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                          <FormControl>
                            <SelectTrigger className={isViewMode ? 'bg-gray-100 text-gray-800' : ''}>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PROGRESS_LEVELS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <span className={status.color}>{status.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Weekly Planning Table */}
                {form.watch('weeklyPlan') && form.watch('weeklyPlan')!.length > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Weekly Planning ({form.watch('weeklyPlan')!.length} weeks)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-purple-100">
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Week</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Date Range</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Objectives</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Activities</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Progress</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.watch('weeklyPlan')?.map((week, index) => (
                            <tr key={week.weekNumber} className={isViewMode ? 'bg-gray-50' : ''}>
                              <td className="border border-gray-300 px-3 py-2 font-medium">
                                Week {week.weekNumber}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-sm">
                                {week.weekStartDate} - {week.weekEndDate}
                              </td>
                              <td className="border border-gray-300 px-3 py-2">
                                <Input
                                  placeholder="Weekly objectives"
                                  value={week.objectives}
                                  onChange={(e) => {
                                    const updated = [...(form.getValues('weeklyPlan') || [])];
                                    updated[index] = { ...updated[index], objectives: e.target.value };
                                    form.setValue('weeklyPlan', updated);
                                  }}
                                  className={`border-0 focus:ring-0 ${isViewMode ? 'bg-gray-100 text-gray-800' : ''}`}
                                  disabled={isViewMode}
                                />
                              </td>
                              <td className="border border-gray-300 px-3 py-2">
                                <Input
                                  placeholder="Activities & strategies"
                                  value={week.activities}
                                  onChange={(e) => {
                                    const updated = [...(form.getValues('weeklyPlan') || [])];
                                    updated[index] = { ...updated[index], activities: e.target.value };
                                    form.setValue('weeklyPlan', updated);
                                  }}
                                  className={`border-0 focus:ring-0 ${isViewMode ? 'bg-gray-100 text-gray-800' : ''}`}
                                  disabled={isViewMode}
                                />
                              </td>
                              <td className="border border-gray-300 px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={week.progress}
                                    onChange={(e) => {
                                      const updated = [...(form.getValues('weeklyPlan') || [])];
                                      updated[index] = { ...updated[index], progress: Number(e.target.value) };
                                      form.setValue('weeklyPlan', updated);
                                    }}
                                    className={`w-16 border-0 focus:ring-0 ${isViewMode ? 'bg-gray-100 text-gray-800' : ''}`}
                                    disabled={isViewMode}
                                  />
                                  <span className="text-gray-600">%</span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-3 py-2">
                                <Select
                                  value={week.status}
                                  onValueChange={(value: any) => {
                                    const updated = [...(form.getValues('weeklyPlan') || [])];
                                    updated[index] = { ...updated[index], status: value };
                                    form.setValue('weeklyPlan', updated);
                                  }}
                                  disabled={isViewMode}
                                >
                                  <SelectTrigger className={`border-0 focus:ring-0 ${isViewMode ? 'bg-gray-100 text-gray-800' : ''}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PROGRESS_LEVELS.map((status) => (
                                      <SelectItem key={status.value} value={status.value}>
                                        {status.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Areas of Remediation */}
                <FormField
                  control={form.control}
                  name="areasOfRemediation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Areas of Remediation *</FormLabel>
                      <FormDescription>Select all that apply</FormDescription>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        {[
                          'Decoding',
                          'Comprehension',
                          'Fluency',
                          'Spelling',
                          'Number Sense',
                          'Operations',
                          'Fine Motor',
                          'Letter Formation',
                          'Attention',
                          'Memory',
                        ].map((area) => (
                          <div key={area} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`remediation-${area}`}
                              checked={field.value?.includes(area) || false}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...(field.value || []), area]
                                  : field.value?.filter((v) => v !== area) || [];
                                field.onChange(updated);
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              disabled={isViewMode}
                            />
                            <Label
                              htmlFor={`remediation-${area}`}
                              className={`text-sm font-normal cursor-pointer ${isViewMode ? 'text-gray-700' : ''}`}
                            >
                              {area}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Activity Strategy */}
                <FormField
                  control={form.control}
                  name="activityStrategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity / Strategy *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the activity, materials, and teaching strategy..."
                          rows={4}
                          {...field}
                          disabled={isViewMode}
                          className={isViewMode ? 'bg-gray-100 text-gray-800' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resources */}
                <FormField
                  control={form.control}
                  name="resourcesUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resources Used *</FormLabel>
                      <FormDescription>Select all that apply</FormDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        {RESOURCES.map((resource) => (
                          <div key={resource} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`resource-${resource}`}
                              checked={field.value?.includes(resource) || false}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...(field.value || []), resource]
                                  : field.value?.filter((v) => v !== resource) || [];
                                field.onChange(updated);
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              disabled={isViewMode}
                            />
                            <Label
                              htmlFor={`resource-${resource}`}
                              className={`text-sm font-normal cursor-pointer ${isViewMode ? 'text-gray-700' : ''}`}
                            >
                              {resource}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Time & Motivation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="expectedTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Time (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            value={field.value ?? ''}
                            disabled={isViewMode}
                            className={isViewMode ? 'bg-gray-100 text-gray-800' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="actualTimeTaken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual Time (min)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="28"
                            {...field}
                            value={field.value ?? ''}
                            disabled={isViewMode}
                            className={isViewMode ? 'bg-gray-100 text-gray-800' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="motivationLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motivation Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isViewMode}>
                          <FormControl>
                            <SelectTrigger className={isViewMode ? 'bg-gray-100 text-gray-800' : ''}>
                              <SelectValue placeholder="Select motivation level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MOTIVATION_LEVELS.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                <span className={level.color}>{level.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Outcome & Next Steps */}
                <FormField
                  control={form.control}
                  name="outcome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outcome / Student Response</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What did you observe? Any progress or challenges?"
                          rows={3}
                          {...field}
                          disabled={isViewMode}
                          className={isViewMode ? 'bg-gray-100 text-gray-800' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextStep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Steps (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Plan for the next session..."
                          rows={2}
                          {...field}
                          disabled={isViewMode}
                          className={isViewMode ? 'bg-gray-100 text-gray-800' : ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end items-center pt-4 gap-3">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowForm(false);
                    setEditingPlan(null);
                  }}>
                    {isViewMode ? 'Close' : 'Cancel'}
                  </Button>
                  {!isViewMode && (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : editingPlan ? 'Update Lesson Plan' : 'Save Lesson Plan'}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}