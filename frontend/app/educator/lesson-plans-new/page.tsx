'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEducatorStudents } from '@/hooks/useEducator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Calendar, BookOpen, PenTool, Calculator, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const SKILL_AREAS = [
  { value: 'READING', label: 'Reading', icon: BookOpen },
  { value: 'WRITING', label: 'Writing', icon: PenTool },
  { value: 'MATH', label: 'Math', icon: Calculator },
];

const RESOURCES = [
  'Worksheets',
  'Manipulatives',
  'Videos',
  'Digital Content',
  'Flashcards',
  'Games',
  'Books',
  'Other',
];

const MOTIVATION_LEVELS = [
  { value: 'HIGH', label: 'High', color: 'text-green-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600' },
  { value: 'LOW', label: 'Low', color: 'text-red-600' },
];

const formSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  date: z.date({ message: 'Date is required' }),
  skillArea: z.enum(['READING', 'WRITING', 'MATH'], { message: 'Skill area is required' }),
  specificTopic: z.string().min(1, 'Specific topic is required'),
  areasOfRemediation: z.array(z.string()).min(1, 'Select at least one area'),
  activityStrategy: z.string().min(1, 'Activity/strategy is required'),
  resourcesUsed: z.array(z.string()).min(1, 'Select at least one resource'),
  expectedTime: z.coerce.number().min(1).optional(),
  actualTimeTaken: z.coerce.number().min(1).optional(),
  motivationLevel: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  outcome: z.string().optional(),
  nextStep: z.string().optional(),
});

type LessonPlanFormValues = z.infer<typeof formSchema>;

export default function LessonPlansPage() {
  const { students, isLoading: studentsLoading } = useEducatorStudents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Lesson plans listing state
  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [filterStudent, setFilterStudent] = useState('');
  const [filterSkillArea, setFilterSkillArea] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState<Date | null>(null);
  const [filterDateTo, setFilterDateTo] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Detail view state
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const form = useForm<LessonPlanFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      studentId: '',
      skillArea: 'READING',
      specificTopic: '',
      areasOfRemediation: [],
      activityStrategy: '',
      resourcesUsed: [],
    },
  });

  // Fetch lesson plans
  const fetchLessonPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (filterStudent) params.studentId = filterStudent;
      if (filterSkillArea) params.skillArea = filterSkillArea;
      if (filterDateFrom) params.dateFrom = filterDateFrom.toISOString();
      if (filterDateTo) params.dateTo = filterDateTo.toISOString();

      const response = await apiClient.getLessonPlansByEducator(params);
      // Response structure: { success: true, data: { items: [], pagination: {} } }
      setLessonPlans(response.data?.items || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setTotalCount(response.data?.pagination?.total || 0);
    } catch (error: any) {
      console.error('Fetch lesson plans error:', error);
      toast.error('Failed to load lesson plans');
      setLessonPlans([]); // Set empty array on error
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Fetch lesson plans on mount and when filters/page change
  useEffect(() => {
    fetchLessonPlans();
  }, [currentPage, filterStudent, filterSkillArea, filterDateFrom, filterDateTo]);

  const onSubmit = async (values: LessonPlanFormValues) => {
    setIsSubmitting(true);
    try {
      const data = {
        ...values,
        date: values.date.toISOString(),
      };

      await apiClient.createLessonPlan(data);
      toast.success('Lesson plan created successfully!');
      form.reset();
      setShowForm(false);

      // Refresh the list
      setCurrentPage(1);
      fetchLessonPlans();
    } catch (error: any) {
      console.error('Create lesson plan error:', error);
      toast.error(error.response?.data?.error || 'Failed to create lesson plan');
    } finally {
      setIsSubmitting(false);
    }
  };

const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this lesson plan?')) return;

  try {
    await apiClient.deleteLessonPlan(id);
    toast.success('Lesson plan deleted successfully');
    fetchLessonPlans();
  } catch (error: any) {
    console.error('Delete error:', error);
    toast.error('Failed to delete lesson plan');
  }
};

const clearFilters = () => {
  setFilterStudent('');
  setFilterSkillArea('');
  setFilterDateFrom(null);
  setFilterDateTo(null);
  setCurrentPage(1);
};

const fillDemoData = () => {
  const demoData = {
    studentId: students?.[0]?.id || '',
    date: new Date(),
    skillArea: 'READING' as const,
    specificTopic: 'CVC word blending and decoding',
    areasOfRemediation: ['Decoding', 'Fluency', 'Attention'],
    activityStrategy: 'Used multi-sensory approach with letter tiles and picture cards. Student practiced blending CVC words with visual support.',
    resourcesUsed: ['Flashcards', 'Worksheets', 'Manipulatives'],
    expectedTime: 25,
    actualTimeTaken: 28,
    motivationLevel: 'HIGH' as const,
    outcome: 'Student showed good progress with CVC blending. Was able to decode 8 out of 10 words independently by the end of the session.',
    nextStep: 'Continue with CVC words, introduce digraphs (sh, ch, th) in next session.'
  };

  form.reset(demoData);
  toast.success('Demo data loaded!');
};

const getMotivationColor = (level: string) => {
  switch (level) {
    case 'HIGH': return 'text-green-600 bg-green-50';
    case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
    case 'LOW': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

return (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Link href="/educator/students">
          <Button variant="ghost" size="sm" className="mb-3">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lesson Plans</h1>
            <p className="text-gray-600">Plan and track remediation sessions</p>
          </div>
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Lesson Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Lesson Plan</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {students?.map((student: any) => (
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
                      control={form.control as any}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ProfessionalDatePicker
                              label="Date"
                              value={field.value || null}
                              onChange={(date) => field.onChange(date || undefined)}
                              placeholder="Select date"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Skill Area and Topic */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="skillArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skill Area *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
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
                      control={form.control as any}
                      name="specificTopic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific Topic *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., CVC blending, Number sequencing 1-20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Areas of Remediation */}
                  <FormField
                    control={form.control as any}
                    name="areasOfRemediation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Areas of Remediation *</FormLabel>
                        <FormDescription>
                          Select all areas being addressed in this lesson
                        </FormDescription>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          {['Decoding', 'Comprehension', 'Fluency', 'Spelling', 'Number Sense', 'Operations', 'Fine Motor', 'Letter Formation', 'Attention', 'Memory'].map((area) => (
                            <div key={area} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={area}
                                checked={field.value?.includes(area)}
                                onChange={(e) => {
                                  const currentValue = field.value || [];
                                  if (e.target.checked) {
                                    field.onChange([...currentValue, area]);
                                  } else {
                                    field.onChange(currentValue.filter((v: string) => v !== area));
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <Label htmlFor={area} className="text-sm font-normal cursor-pointer">
                                {area}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Activity/Strategy */}
                  <FormField
                    control={form.control as any}
                    name="activityStrategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity / Strategy Used *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the activities and strategies used in this lesson..."
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Resources Used */}
                  <FormField
                    control={form.control as any}
                    name="resourcesUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resources Used *</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                          {RESOURCES.map((resource) => (
                            <div key={resource} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={resource}
                                checked={field.value?.includes(resource)}
                                onChange={(e) => {
                                  const currentValue = field.value || [];
                                  if (e.target.checked) {
                                    field.onChange([...currentValue, resource]);
                                  } else {
                                    field.onChange(currentValue.filter((v: string) => v !== resource));
                                  }
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <Label htmlFor={resource} className="text-sm font-normal cursor-pointer">
                                {resource}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Time and Motivation */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control as any}
                      name="expectedTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Time (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="actualTimeTaken"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Actual Time Taken (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="25" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="motivationLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motivation Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
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

                  {/* Outcome and Next Step */}
                  <FormField
                    control={form.control as any}
                    name="outcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Outcome / Child Response</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Document what was observed, improvements, or difficulties..."
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="nextStep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Step (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Plan for the next session..."
                            {...field}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={fillDemoData}
                      className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                    >
                      Fill Demo Data
                    </Button>
                    <div className="flex space-x-4">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Lesson Plan'}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="flex gap-2">
              {(filterStudent || filterSkillArea || filterDateFrom || filterDateTo) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Student</Label>
                <Select value={filterStudent} onValueChange={setFilterStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="All students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All students</SelectItem>
                    {students?.map((student: any) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Skill Area</Label>
                <Select value={filterSkillArea} onValueChange={setFilterSkillArea}>
                  <SelectTrigger>
                    <SelectValue placeholder="All areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All areas</SelectItem>
                    {SKILL_AREAS.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <ProfessionalDatePicker
                  label="Date From"
                  value={filterDateFrom}
                  onChange={setFilterDateFrom}
                  placeholder="Start date"
                />
              </div>

              <div>
                <ProfessionalDatePicker
                  label="Date To"
                  value={filterDateTo}
                  onChange={setFilterDateTo}
                  placeholder="End date"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lesson Plans List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lesson Plans ({totalCount})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPlans ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading lesson plans...</p>
            </div>
          ) : lessonPlans.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No lesson plans yet</p>
              <Button onClick={() => setShowForm(true)} variant="outline">
                Create First Lesson Plan
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skill Area</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivation</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lessonPlans?.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {format(new Date(plan.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {plan.student?.fullName}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {plan.skillArea}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                          {plan.specificTopic}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {plan.actualTimeTaken ? `${plan.actualTimeTaken}m` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {plan.motivationLevel && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMotivationColor(plan.motivationLevel)}`}>
                              {plan.motivationLevel}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPlan(plan);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(plan.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lesson Plan Details</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Student</Label>
                  <p className="font-medium">{selectedPlan.student?.fullName}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Date</Label>
                  <p className="font-medium">{format(new Date(selectedPlan.date), 'MMMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Skill Area</Label>
                  <p className="font-medium">{selectedPlan.skillArea}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Topic</Label>
                  <p className="font-medium">{selectedPlan.specificTopic}</p>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Areas of Remediation</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedPlan.areasOfRemediation?.map((area: string) => (
                    <span key={area} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Activity / Strategy</Label>
                <p className="mt-1 text-gray-900">{selectedPlan.activityStrategy}</p>
              </div>

              <div>
                <Label className="text-gray-600">Resources Used</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedPlan.resourcesUsed?.map((resource: string) => (
                    <span key={resource} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {resource}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-600">Expected Time</Label>
                  <p className="font-medium">{selectedPlan.expectedTime ? `${selectedPlan.expectedTime} min` : '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Actual Time</Label>
                  <p className="font-medium">{selectedPlan.actualTimeTaken ? `${selectedPlan.actualTimeTaken} min` : '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Motivation Level</Label>
                  <p className={`font-medium ${selectedPlan.motivationLevel === 'HIGH' ? 'text-green-600' : selectedPlan.motivationLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'}`}>
                    {selectedPlan.motivationLevel || '-'}
                  </p>
                </div>
              </div>

              {selectedPlan.outcome && (
                <div>
                  <Label className="text-gray-600">Outcome / Child Response</Label>
                  <p className="mt-1 text-gray-900">{selectedPlan.outcome}</p>
                </div>
              )}

              {selectedPlan.nextStep && (
                <div>
                  <Label className="text-gray-600">Next Step</Label>
                  <p className="mt-1 text-gray-900">{selectedPlan.nextStep}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  </div>
);
}

