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
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { TeacherAssistanceLevel } from '@/types';

const IEP_SUBJECTS = [
  'ORAL_LANGUAGE',
  'READING', 
  'WRITING',
  'SPELLING',
  'MATH'
] as const;

const TEACHER_ASSISTANCE_LEVELS = Object.values(TeacherAssistanceLevel) as [string, ...string[]];

const longTermGoalSchema = z.object({
  objective: z.string().min(1, 'Objective is required'),
  durationMonths: z.coerce.number().min(1, 'Duration must be at least 1 month'),
});

const shortTermGoalSchema = z.object({
  objective: z.string().min(1, 'Objective is required'),
  teacherAssistanceLevel: z.enum(TEACHER_ASSISTANCE_LEVELS),
});

const formSchema = z.object({
  subject: z.enum(IEP_SUBJECTS),
  presentLevelReceptive: z.string().min(1, 'Receptive skills assessment is required'),
  presentLevelExpressive: z.string().min(1, 'Expressive skills assessment is required'),
  longTermGoals: z.array(longTermGoalSchema).min(1, 'At least one long-term goal is required'),
  shortTermGoals: z.array(shortTermGoalSchema).min(1, 'At least one short-term goal is required'),
});

interface IEPSubjectSectionFormProps {
  iepDocumentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function IEPSubjectSectionForm({ iepDocumentId, onSuccess, onCancel }: IEPSubjectSectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDemoData = () => {
    const demoData = {
      subject: 'READING',
      presentLevelReceptive: 'Student demonstrates age-appropriate receptive language skills. Can follow 2-step directions and understand basic concepts. Shows good listening comprehension for stories at grade level.',
      presentLevelExpressive: 'Student expresses ideas clearly but struggles with complex sentence structures. Vocabulary is developing appropriately. Occasionally needs prompts to expand on ideas.',
      longTermGoals: [
        {
          objective: 'Improve reading comprehension skills to grade level proficiency',
          durationMonths: 6
        },
        {
          objective: 'Increase reading fluency to 60 words per minute with 95% accuracy',
          durationMonths: 8
        }
      ],
      shortTermGoals: [
        {
          objective: 'Identify main idea and supporting details in grade-level text',
          teacherAssistanceLevel: 'MODERATE_ASSISTANCE'
        },
        {
          objective: 'Use context clues to determine word meanings',
          teacherAssistanceLevel: 'MINIMAL_ASSISTANCE'
        },
        {
          objective: 'Make predictions based on text evidence',
          teacherAssistanceLevel: 'MODERATE_ASSISTANCE'
        }
      ]
    };

    form.setValue('subject', demoData.subject);
    form.setValue('presentLevelReceptive', demoData.presentLevelReceptive);
    form.setValue('presentLevelExpressive', demoData.presentLevelExpressive);
    form.setValue('longTermGoals', demoData.longTermGoals);
    form.setValue('shortTermGoals', demoData.shortTermGoals);
    
    toast.success('Demo data loaded! Review and adjust as needed.');
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: 'READING',
      presentLevelReceptive: '',
      presentLevelExpressive: '',
      longTermGoals: [{ objective: '', durationMonths: 3 }],
      shortTermGoals: [{ objective: '', teacherAssistanceLevel: 'MODERATE_ASSISTANCE' }],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // console.log('Frontend - Submitting subject section data:', JSON.stringify(values, null, 2));
      
      await apiClient.addSubjectSection(iepDocumentId, values);
      toast.success('Subject section added successfully!');
      onSuccess?.();
    } catch (error: any) {
      // console.error('Frontend - Error submitting subject section:', error);
      toast.error(error.response?.data?.message || 'Failed to add subject section');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLongTermGoal = () => {
    const currentGoals = form.getValues('longTermGoals') || [];
    form.setValue('longTermGoals', [...currentGoals, { objective: '', durationMonths: 3 }]);
  };

  const removeLongTermGoal = (index: number) => {
    const currentGoals = form.getValues('longTermGoals') || [];
    form.setValue('longTermGoals', currentGoals.filter((_, i) => i !== index));
  };

  const addShortTermGoal = () => {
    const currentGoals = form.getValues('shortTermGoals') || [];
    form.setValue('shortTermGoals', [...currentGoals, { objective: '', teacherAssistanceLevel: 'MODERATE_ASSISTANCE' }]);
  };

  const removeShortTermGoal = (index: number) => {
    const currentGoals = form.getValues('shortTermGoals') || [];
    form.setValue('shortTermGoals', currentGoals.filter((_, i) => i !== index));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Subject Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
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
              name="presentLevelReceptive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Present Level - Receptive Skills</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe current receptive skills and abilities"
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
              name="presentLevelExpressive"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Present Level - Expressive Skills</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe current expressive skills and abilities"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Long-Term Goals</FormLabel>
              <FormDescription>
                Measurable objectives with duration in months
              </FormDescription>
              
              {form.watch('longTermGoals')?.map((goal, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`longTermGoals.${index}.objective`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objective {index + 1}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Measurable objective"
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
                    name={`longTermGoals.${index}.durationMonths`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (months)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeLongTermGoal(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addLongTermGoal}>
                Add Long-Term Goal
              </Button>
            </div>

            <div>
              <FormLabel>Short-Term Goals</FormLabel>
              <FormDescription>
                Stepping stones with teacher assistance level
              </FormDescription>
              
              {form.watch('shortTermGoals')?.map((goal, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`shortTermGoals.${index}.objective`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objective {index + 1}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Stepping stone objective"
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
                    name={`shortTermGoals.${index}.teacherAssistanceLevel`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher Assistance</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assistance level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INDEPENDENT">Independent</SelectItem>
                            <SelectItem value="MINIMAL_ASSISTANCE">Minimal Assistance</SelectItem>
                            <SelectItem value="MODERATE_ASSISTANCE">Moderate Assistance</SelectItem>
                            <SelectItem value="MAXIMUM_ASSISTANCE">Maximum Assistance</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeShortTermGoal(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addShortTermGoal}>
                Add Short-Term Goal
              </Button>
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
              {isSubmitting ? 'Adding...' : 'Add Subject Section'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}