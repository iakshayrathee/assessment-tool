'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEducatorStudents } from '@/hooks/useEducator';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Calendar,
  BookOpen,
  PenTool,
  Calculator,
  Trash2,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { format } from 'date-fns';
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

const formSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  date: z.date({ required_error: 'Date is required' }),
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
});

type LessonPlanFormValues = z.infer<typeof formSchema>;

export default function LessonPlansPage() {
  const { students, isLoading: studentsLoading } = useEducatorStudents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [lessonPlans, setLessonPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

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
    },
  });

  // Fetch lesson plans
  const fetchLessonPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const params = { page: currentPage, limit: 10 };
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

  useEffect(() => {
    fetchLessonPlans();
  }, [currentPage]);

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

  const fillDemoData = () => {
    if (!students || students.length === 0) {
      toast.error('No students available for demo data');
      return;
    }

    const demoData: LessonPlanFormValues = {
      studentId: students[0].id,
      date: new Date(),
      skillArea: 'READING',
      specificTopic: 'CVC word blending and decoding',
      areasOfRemediation: ['Decoding', 'Fluency', 'Attention'],
      activityStrategy:
        'Used multi-sensory approach with letter tiles and picture cards. Student practiced blending CVC words with visual support.',
      resourcesUsed: ['Flashcards', 'Worksheets', 'Manipulatives'],
      expectedTime: 25,
      actualTimeTaken: 28,
      motivationLevel: 'HIGH',
      outcome:
        'Student showed good progress with CVC blending. Was able to decode 8 out of 10 words independently by the end of the session.',
      nextStep:
        'Continue with CVC words, introduce digraphs (sh, ch, th) in next session.',
    };

    form.reset(demoData);
    toast.success('Demo data loaded!');
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

  const getMotivationColor = (level?: string) => {
    switch (level) {
      case 'HIGH':
        return 'text-green-600 bg-green-50';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50';
      case 'LOW':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lesson Plans</h1>
            <p className="text-lg text-gray-600">Plan and track remediation sessions</p>
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
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Student & Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a student" />
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
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date *</FormLabel>
                          <FormControl>
                            <ProfessionalDatePicker
                              value={field.value || null}
                              onChange={(date) => field.onChange(date || undefined)}
                              placeholder="Select date"
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
                          <Select onValueChange={field.onChange} value={field.value}>
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
                      control={form.control}
                      name="specificTopic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific Topic *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., CVC blending, Addition within 20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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
                              />
                              <Label
                                htmlFor={`remediation-${area}`}
                                className="text-sm font-normal cursor-pointer"
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
                        <FormLabel>Activity / Strategy Used *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the teaching methods, activities, and strategies used..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Resources Used */}
                  <FormField
                    control={form.control}
                    name="resourcesUsed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resources Used *</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
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
                              />
                              <Label
                                htmlFor={`resource-${resource}`}
                                className="text-sm font-normal cursor-pointer"
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
                            <Input type="number" placeholder="25" {...field} value={field.value ?? ''} />
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
                            <Input type="number" placeholder="28" {...field} value={field.value ?? ''} />
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MOTIVATION_LEVELS.map((lvl) => (
                                <SelectItem key={lvl.value} value={lvl.value}>
                                  <span className={lvl.color}>{lvl.label}</span>
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
                          <Textarea placeholder="Plan for the next session..." rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between items-center pt-4">
                    <Button type="button" variant="outline" onClick={fillDemoData}>
                      Fill Demo Data
                    </Button>

                    <div className="flex gap-3">
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

        {/* Lesson Plans List */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Lesson Plans ({totalCount})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPlans ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading lesson plans...</p>
              </div>
            ) : lessonPlans.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-6">No lesson plans created yet</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Lesson Plan
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lessonPlans.map((plan) => (
                    <Card
                      key={plan.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setShowDetailDialog(true);
                      }}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{plan.student?.fullName}</h3>
                            <p className="text-sm text-gray-500">
                              {format(new Date(plan.date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getSkillAreaColor(
                              plan.skillArea
                            )}`}
                          >
                            {plan.skillArea}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">{plan.specificTopic}</p>
                        <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                          {plan.activityStrategy}
                        </p>

                        <div className="mt-6 pt-4 border-t flex justify-between items-center">
                          {plan.motivationLevel && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getMotivationColor(
                                plan.motivationLevel
                              )}`}
                            >
                              {plan.motivationLevel}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(plan.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-10">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail View Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lesson Plan Details</DialogTitle>
            </DialogHeader>

            {selectedPlan && (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-gray-600">Student</Label>
                    <p className="font-medium text-lg">{selectedPlan.student?.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Date</Label>
                    <p className className="font-medium">
                      {format(new Date(selectedPlan.date), 'MMMM dd, yyyy')}
                    </p>
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

                {selectedPlan.areasOfRemediation?.length > 0 && (
                  <div>
                    <Label className="text-gray-600">Areas of Remediation</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPlan.areasOfRemediation.map((area: string) => (
                        <span
                          key={area}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-600">Activity / Strategy</Label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                    {selectedPlan.activityStrategy}
                  </p>
                </div>

                {selectedPlan.resourcesUsed?.length > 0 && (
                  <div>
                    <Label className="text-gray-600">Resources Used</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedPlan.resourcesUsed.map((res: string) => (
                        <span
                          key={res}
                          className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                        >
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-600">Expected Time</Label>
                    <p className="font-medium">
                      {selectedPlan.expectedTime ? `${selectedPlan.expectedTime} min` : '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Actual Time</Label>
                    <p className="font-medium">
                      {selectedPlan.actualTimeTaken ? `${selectedPlan.actualTimeTaken} min` : '—'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Motivation</Label>
                    <p
                      className={`font-medium ${
                        selectedPlan.motivationLevel === 'HIGH'
                          ? 'text-green-600'
                          : selectedPlan.motivationLevel === 'MEDIUM'
                          ? 'text-yellow-600'
                          : selectedPlan.motivationLevel === 'LOW'
                          ? 'text-red-600'
                          : ''
                      }`}
                    >
                      {selectedPlan.motivationLevel || '—'}
                    </p>
                  </div>
                </div>

                {selectedPlan.outcome && (
                  <div>
                    <Label className="text-gray-600">Outcome / Student Response</Label>
                    <p className="mt-1 text-gray-900">{selectedPlan.outcome}</p>
                  </div>
                )}

                {selectedPlan.nextStep && (
                  <div>
                    <Label className="text-gray-600">Next Steps</Label>
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