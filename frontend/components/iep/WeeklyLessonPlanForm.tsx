'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import {
  BehavioralAttentionLevel,
  BehavioralSittingTolerance,
  BehavioralTaskCompletion
} from '@/types';

const BEHAVIORAL_ATTENTION_LEVELS = Object.values(BehavioralAttentionLevel) as [string, ...string[]];
const BEHAVIORAL_SITTING_TOLERANCE = Object.values(BehavioralSittingTolerance) as [string, ...string[]];
const BEHAVIORAL_TASK_COMPLETION = Object.values(BehavioralTaskCompletion) as [string, ...string[]];

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'] as const;

const activitySchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  testGoalActivity: z.string().min(1, 'Test goal/activity is required'),
  analysis: z.string().min(1, 'Analysis is required'),
  assessment: z.string().min(1, 'Assessment is required'),
  behavioralAttention: z.enum(BEHAVIORAL_ATTENTION_LEVELS),
  behavioralSittingTolerance: z.enum(BEHAVIORAL_SITTING_TOLERANCE),
  behavioralTaskCompletion: z.enum(BEHAVIORAL_TASK_COMPLETION),
});

const formSchema = z.object({
  weekStartDate: z.date({
    required_error: 'Week start date is required',
  }),
  activities: z.record(z.enum(DAYS_OF_WEEK), activitySchema),
});

interface WeeklyLessonPlanFormProps {
  iepDocumentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WeeklyLessonPlanForm({ iepDocumentId, onSuccess, onCancel }: WeeklyLessonPlanFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weekStartDate: new Date(),
      activities: {
        MONDAY: {
          subject: '',
          testGoalActivity: '',
          analysis: '',
          assessment: '',
          behavioralAttention: 'GOOD',
          behavioralSittingTolerance: 'GOOD',
          behavioralTaskCompletion: 'COMPLETED_WITH_ASSISTANCE',
        },
        TUESDAY: {
          subject: '',
          testGoalActivity: '',
          analysis: '',
          assessment: '',
          behavioralAttention: 'GOOD',
          behavioralSittingTolerance: 'GOOD',
          behavioralTaskCompletion: 'COMPLETED_WITH_ASSISTANCE',
        },
        WEDNESDAY: {
          subject: '',
          testGoalActivity: '',
          analysis: '',
          assessment: '',
          behavioralAttention: 'GOOD',
          behavioralSittingTolerance: 'GOOD',
          behavioralTaskCompletion: 'COMPLETED_WITH_ASSISTANCE',
        },
        THURSDAY: {
          subject: '',
          testGoalActivity: '',
          analysis: '',
          assessment: '',
          behavioralAttention: 'GOOD',
          behavioralSittingTolerance: 'GOOD',
          behavioralTaskCompletion: 'COMPLETED_WITH_ASSISTANCE',
        },
      },
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      await apiClient.addWeeklyEvaluation(iepDocumentId, {
        ...values,
        weekStartDate: values.weekStartDate.toISOString(),
      });
      toast.success('Weekly lesson plan created successfully!');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create weekly lesson plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Lesson Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="weekStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Week Start Date</FormLabel>
                  <FormControl>
                    <ProfessionalDatePicker
                      date={field.value}
                      setDate={field.onChange}
                      placeholder="Select week start date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-6">
              {DAYS_OF_WEEK.map((day) => (
                <Card key={day} className="p-4">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-lg capitalize">{day.toLowerCase()}</CardTitle>
                  </CardHeader>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`activities.${day}.subject`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Subject name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`activities.${day}.testGoalActivity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Goal/Activity</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Description of test goal or activity"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`activities.${day}.analysis`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Analysis</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Analysis of performance"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`activities.${day}.assessment`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assessment</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Assessment results"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`activities.${day}.behavioralAttention`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Behavioral Attention</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select attention level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EXCELLENT">Excellent</SelectItem>
                              <SelectItem value="GOOD">Good</SelectItem>
                              <SelectItem value="FAIR">Fair</SelectItem>
                              <SelectItem value="POOR">Poor</SelectItem>
                              <SelectItem value="VERY_POOR">Very Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`activities.${day}.behavioralSittingTolerance`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sitting Tolerance</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tolerance level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EXCELLENT">Excellent</SelectItem>
                              <SelectItem value="GOOD">Good</SelectItem>
                              <SelectItem value="FAIR">Fair</SelectItem>
                              <SelectItem value="POOR">Poor</SelectItem>
                              <SelectItem value="VERY_POOR">Very Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`activities.${day}.behavioralTaskCompletion`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Task Completion</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select completion level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="COMPLETED_INDEPENDENTLY">Completed Independently</SelectItem>
                              <SelectItem value="COMPLETED_WITH_ASSISTANCE">Completed with Assistance</SelectItem>
                              <SelectItem value="PARTIALLY_COMPLETED">Partially Completed</SelectItem>
                              <SelectItem value="NOT_COMPLETED">Not Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Weekly Plan'}
          </Button>
        </div>
      </form>
    </Form>
  );
}