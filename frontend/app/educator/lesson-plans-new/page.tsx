'use client';

import { useState } from 'react';
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
import { ArrowLeft, Plus, Calendar, BookOpen, PenTool, Calculator } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

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
  date: z.date({ required_error: 'Date is required' }),
  skillArea: z.enum(['READING', 'WRITING', 'MATH'], { required_error: 'Skill area is required' }),
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

export default function LessonPlansPage() {
  const { students, isLoading: studentsLoading } = useEducatorStudents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: '',
      skillArea: 'READING',
      specificTopic: '',
      areasOfRemediation: [],
      activityStrategy: '',
      resourcesUsed: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const data = {
        ...values,
        date: values.date.toISOString(),
      };

      await apiClient.createLessonPlan(data);
      toast.success('Lesson plan created successfully!');
      form.reset();
      setShowForm(false);
    } catch (error: any) {
      console.error('Create lesson plan error:', error);
      toast.error(error.response?.data?.error || 'Failed to create lesson plan');
    } finally {
      setIsSubmitting(false);
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
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {showForm ? 'Cancel' : 'New Lesson Plan'}
            </Button>
          </div>
        </div>

        {/* Lesson Plan Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create Lesson Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
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
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date *</FormLabel>
                          <FormControl>
                            <ProfessionalDatePicker
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select date"
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
                      control={form.control}
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
                      control={form.control}
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
                    control={form.control}
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
                                    field.onChange(currentValue.filter((v) => v !== area));
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
                    control={form.control}
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
                    control={form.control}
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
                                    field.onChange(currentValue.filter((v) => v !== resource));
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
                      control={form.control}
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
                      control={form.control}
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
                      control={form.control}
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
                    control={form.control}
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
                    control={form.control}
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

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save Lesson Plan'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Lesson Plans List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Lesson Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No lesson plans yet</p>
              <Button onClick={() => setShowForm(true)} variant="outline">
                Create First Lesson Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

