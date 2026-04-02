'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import {
  BehavioralAttentionLevel,
  BehavioralSittingTolerance,
  BehavioralTaskCompletion,
  IEPSubject
} from '@/types';

const BEHAVIORAL_ATTENTION_LEVELS = Object.values(BehavioralAttentionLevel) as [string, ...string[]];
const BEHAVIORAL_SITTING_TOLERANCE = Object.values(BehavioralSittingTolerance) as [string, ...string[]];
const BEHAVIORAL_TASK_COMPLETION = Object.values(BehavioralTaskCompletion) as [string, ...string[]];
const IEP_SUBJECTS = Object.values(IEPSubject) as [string, ...string[]];

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'] as const;

const activitySchema = z.object({
  subject: z.enum(IEP_SUBJECTS),
  testGoalActivity: z.string().min(1, 'Test goal/activity is required'),
  analysis: z.string().min(1, 'Analysis is required'),
  assessment: z.string().min(1, 'Assessment is required'),
  behavioralAttention: z.enum(BEHAVIORAL_ATTENTION_LEVELS),
  behavioralSittingTolerance: z.enum(BEHAVIORAL_SITTING_TOLERANCE),
  behavioralTaskCompletion: z.enum(BEHAVIORAL_TASK_COMPLETION),
});

const formSchema = z.object({
  weekNumber: z.number({
    required_error: 'Week number is required',
  }).min(1, 'Week number must be at least 1'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
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

  const loadDemoData = () => {
    const demoActivities = {
      MONDAY: {
        subject: 'READING',
        testGoalActivity: 'Read and comprehend grade-level text with 80% accuracy',
        analysis: 'Student showed good comprehension but struggled with fluency',
        assessment: 'Scored 75% on reading comprehension assessment',
        behavioralAttention: 'GOOD',
        behavioralSittingTolerance: 'GOOD',
        behavioralTaskCompletion: 'COMPLETED_WITH_ASSISTANCE'
      },
      TUESDAY: {
        subject: 'MATH',
        testGoalActivity: 'Solve basic addition and subtraction problems',
        analysis: 'Student understands concepts but needs practice with speed',
        assessment: 'Completed 15/20 problems correctly in 10 minutes',
        behavioralAttention: 'EXCELLENT',
        behavioralSittingTolerance: 'GOOD',
        behavioralTaskCompletion: 'COMPLETED_INDEPENDENTLY'
      },
      WEDNESDAY: {
        subject: 'WRITING',
        testGoalActivity: 'Write a complete sentence with proper punctuation',
        analysis: 'Student has good ideas but struggles with sentence structure',
        assessment: 'Wrote 3 complete sentences with minimal errors',
        behavioralAttention: 'FAIR',
        behavioralSittingTolerance: 'FAIR',
        behavioralTaskCompletion: 'COMPLETED_WITH_ASSISTANCE'
      },
      THURSDAY: {
        subject: 'SPELLING',
        testGoalActivity: 'Spell weekly vocabulary words correctly',
        analysis: 'Student remembers most words but mixes up similar sounds',
        assessment: 'Spelled 8/10 words correctly on practice test',
        behavioralAttention: 'GOOD',
        behavioralSittingTolerance: 'EXCELLENT',
        behavioralTaskCompletion: 'COMPLETED_INDEPENDENTLY'
      }
    };

    form.setValue('weekNumber', 1);
    form.setValue('startDate', new Date());
    form.setValue('endDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    form.setValue('activities', demoActivities);
    
    toast.success('Demo data loaded! Review and adjust as needed.');
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weekNumber: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      activities: {
        MONDAY: {
          subject: 'READING',
          testGoalActivity: '',
          analysis: '',
          assessment: '',
          behavioralAttention: 'GOOD',
          behavioralSittingTolerance: 'GOOD',
          behavioralTaskCompletion: 'COMPLETED_WITH_ASSISTANCE',
        },
        TUESDAY: {
          subject: 'READING',
          testGoalActivity: '',
          analysis: '',
          assessment: '',
          behavioralAttention: 'GOOD',
          behavioralSittingTolerance: 'GOOD',
          behavioralTaskCompletion: 'COMPLETED_WITH_ASSISTANCE',
        },
        WEDNESDAY: {
          subject: 'READING',
          testGoalActivity: '',
          analysis: '',
          assessment: '',
          behavioralAttention: 'GOOD',
          behavioralSittingTolerance: 'GOOD',
          behavioralTaskCompletion: 'COMPLETED_WITH_ASSISTANCE',
        },
        THURSDAY: {
          subject: 'READING',
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
      
      // Transform activities object into array for backend
      const activitiesArray = Object.entries(values.activities).map(([day, activity]) => ({
        subject: activity.subject,
        activity: activity.testGoalActivity, // Map testGoalActivity to activity
        analysis: activity.analysis,
        assessment: activity.assessment,
        attentionLevel: activity.behavioralAttention, // Map to backend field name
        sittingTolerance: activity.behavioralSittingTolerance, // Map to backend field name
        taskCompletion: activity.behavioralTaskCompletion, // Map to backend field name
        day: day as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY'
      }));
      
      await apiClient.addWeeklyEvaluation(iepDocumentId, {
        ...values,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        activities: activitiesArray,
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="weekNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Week Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Week number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <ProfessionalDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select start date"
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
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <ProfessionalDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select end date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ORAL_LANGUAGE">Oral Language</SelectItem>
                              <SelectItem value="READING">Reading</SelectItem>
                              <SelectItem value="WRITING">Writing</SelectItem>
                              <SelectItem value="SPELLING">Spelling</SelectItem>
                              <SelectItem value="MATH">Math</SelectItem>
                            </SelectContent>
                          </Select>
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
                              <SelectItem value="POOR">Poor</SelectItem>
                              <SelectItem value="FAIR">Fair</SelectItem>
                              <SelectItem value="GOOD">Good</SelectItem>
                              <SelectItem value="EXCELLENT">Excellent</SelectItem>
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
                              <SelectItem value="POOR">Poor</SelectItem>
                              <SelectItem value="FAIR">Fair</SelectItem>
                              <SelectItem value="GOOD">Good</SelectItem>
                              <SelectItem value="EXCELLENT">Excellent</SelectItem>
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

        <div className="flex justify-between">
          <Button 
            type="button" 
            variant="outline" 
            onClick={loadDemoData}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Load Demo Data
          </Button>
          
          <div className="flex space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Weekly Plan'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}