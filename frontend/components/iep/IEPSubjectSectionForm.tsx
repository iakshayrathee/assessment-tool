'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { TeacherAssistanceLevel } from '@/types';

const IEP_SUBJECTS = [
  'ORAL_LANGUAGE',
  'READING', 
  'WRITING',
  'SPELLING',
  'MATH'
] as const;

const TEACHER_ASSISTANCE_LEVELS = Object.values(TeacherAssistanceLevel) as [string, ...string[]];

const getFormSchema = (t: any) => {
  const longTermGoalSchema = z.object({
    objective: z.string().min(1, t('formObjectiveRequired')),
    durationMonths: z.coerce.number().min(1, t('formDurationMin')),
  });

  const shortTermGoalSchema = z.object({
    objective: z.string().min(1, t('formObjectiveRequired')),
    teacherAssistanceLevel: z.enum(TEACHER_ASSISTANCE_LEVELS),
  });

  return z.object({
    subject: z.enum(IEP_SUBJECTS),
    presentLevelReceptive: z.string().min(1, t('formPresentLevelReceptiveRequired')),
    presentLevelExpressive: z.string().min(1, t('formPresentLevelExpressiveRequired')),
    longTermGoals: z.array(longTermGoalSchema).min(1, t('formLongTermGoalsRequired')),
    shortTermGoals: z.array(shortTermGoalSchema).min(1, t('formShortTermGoalsRequired')),
  });
};

interface IEPSubjectSectionFormProps {
  iepDocumentId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function IEPSubjectSectionForm({ iepDocumentId, onSuccess, onCancel }: IEPSubjectSectionFormProps) {
  const { t } = useTranslation('iep');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSchema = getFormSchema(t);

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

    form.setValue('subject', demoData.subject as any);
    form.setValue('presentLevelReceptive', demoData.presentLevelReceptive);
    form.setValue('presentLevelExpressive', demoData.presentLevelExpressive);
    form.setValue('longTermGoals', demoData.longTermGoals);
    form.setValue('shortTermGoals', demoData.shortTermGoals);
    
    toast.success(t('formDemoSuccess'));
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
      
      await apiClient.addSubjectSection(iepDocumentId, values);
      toast.success(t('subjectAdded'));
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('loadFailed'));
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
            <CardTitle>{t('subjectSectionHeader')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('formSubject')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('formSelectSubject')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ORAL_LANGUAGE">{t('subjects.ORAL_LANGUAGE')}</SelectItem>
                      <SelectItem value="READING">{t('subjects.READING')}</SelectItem>
                      <SelectItem value="WRITING">{t('subjects.WRITING')}</SelectItem>
                      <SelectItem value="SPELLING">{t('subjects.SPELLING')}</SelectItem>
                      <SelectItem value="MATH">{t('subjects.MATH')}</SelectItem>
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
                  <FormLabel>{t('formPresentLevelReceptive')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('formPresentLevelReceptivePlaceholder')}
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
                  <FormLabel>{t('formPresentLevelExpressive')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('formPresentLevelExpressivePlaceholder')}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>{t('formLongTermGoals')}</FormLabel>
              <FormDescription>
                {t('formLongTermGoalsDesc')}
              </FormDescription>
              
              {form.watch('longTermGoals')?.map((goal, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`longTermGoals.${index}.objective`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('formObjective')} {index + 1}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('formObjectivePlaceholder')}
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
                        <FormLabel>{t('formDurationMonths')}</FormLabel>
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
                      {t('formRemove')}
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addLongTermGoal}>
                {t('formAddLongTermGoal')}
              </Button>
            </div>

            <div>
              <FormLabel>{t('formShortTermGoals')}</FormLabel>
              <FormDescription>
                {t('formShortTermGoalsDesc')}
              </FormDescription>
              
              {form.watch('shortTermGoals')?.map((goal, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded-lg">
                  <FormField
                    control={form.control}
                    name={`shortTermGoals.${index}.objective`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('formObjective')} {index + 1}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('formShortTermObjectivePlaceholder')}
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
                        <FormLabel>{t('formTeacherAssistance')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('formSelectAssistance')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="INDEPENDENT">{t('assistanceLevels.INDEPENDENT')}</SelectItem>
                            <SelectItem value="MINIMAL_ASSISTANCE">{t('assistanceLevels.MINIMAL_ASSISTANCE')}</SelectItem>
                            <SelectItem value="MODERATE_ASSISTANCE">{t('assistanceLevels.MODERATE_ASSISTANCE')}</SelectItem>
                            <SelectItem value="MAXIMUM_ASSISTANCE">{t('assistanceLevels.MAXIMUM_ASSISTANCE')}</SelectItem>
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
                      {t('formRemove')}
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" size="sm" onClick={addShortTermGoal}>
                {t('formAddShortTermGoal')}
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
            {t('formLoadDemoData')}
          </Button>
          
          <div className="flex space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t('formCancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('formAdding') : t('formAddSubjectSection')}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}