'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAIAssessment } from '@/hooks/useAI';
import { Sparkles, X, Loader2 } from 'lucide-react';

const DOMAINS = [
  'Reading', 'Writing', 'Math', 'Visual Perception', 'Motor Skills', 'Attention', 'Communication', 'Social Skills'
];

const getFormSchema = (t: any) => z.object({
  title: z.string().min(1, t('formTitleRequired')),
  studentId: z.string().min(1, t('formStudentRequired')),
  durationMonths: z.coerce.number().min(1, t('formDurationMin')),
  startDate: z.date({
    required_error: t('formStartDateRequired'),
  }),
  endDate: z.date({
    required_error: t('formEndDateRequired'),
  }),
  areasOfRemediation: z.array(z.string()).min(1, t('formAreasRequired')),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
});

interface IEPDocumentFormProps {
  students: { id: string; fullName: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function IEPDocumentForm({ students, onSuccess, onCancel }: IEPDocumentFormProps) {
  const { user } = useAuth();
  const { t } = useTranslation('iep');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAiBanner, setShowAiBanner] = useState(false);
  const aiAppliedRef = useRef(false);

  const formSchema = getFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      studentId: '',
      durationMonths: 4,
      areasOfRemediation: [],
      status: 'DRAFT',
    },
  });

  // Watch studentId to trigger AI assessment analysis
  const watchedStudentId = form.watch('studentId');
  const aiAssessment = useAIAssessment(watchedStudentId, !!watchedStudentId);

  // AI pre-fill: when student is selected and AI data arrives, pre-fill areas
  useEffect(() => {
    if (watchedStudentId && aiAssessment.data && !aiAppliedRef.current) {
      aiAppliedRef.current = true;
      const profile = aiAssessment.data.domain_profile || {};
      const areas: string[] = [];

      // Extract domains with weaknesses from AI analysis
      Object.entries(profile).forEach(([domain, data]: [string, any]) => {
        if (domain === 'overall_summary') return;
        if (typeof data === 'object' && data.weaknesses?.length > 0) {
          // Map AI domain names to form domain names
          const domainMap: Record<string, string> = {
            'READING': 'Reading', 'WRITING': 'Writing', 'MATH': 'Math',
            'COGNITIVE': 'Visual Perception', 'ATTENTION_BEHAVIOR': 'Attention',
            'BEHAVIOURAL': 'Attention', 'MOTOR': 'Motor Skills',
          };
          const formDomain = domainMap[domain.toUpperCase()] || domain;
          if (DOMAINS.includes(formDomain) && !areas.includes(formDomain)) {
            areas.push(formDomain);
          }
        }
      });

      if (areas.length > 0) {
        form.setValue('areasOfRemediation', areas);
      }

      // Auto-generate title
      const student = students.find(s => s.id === watchedStudentId);
      if (student && !form.getValues('title')) {
        form.setValue('title', `IEP - ${student.fullName} - ${new Date().toLocaleDateString()}`);
      }

      setShowAiBanner(true);
    }
  }, [watchedStudentId, aiAssessment.data, form, students]);

  // Reset AI tracking when student changes
  useEffect(() => {
    aiAppliedRef.current = false;
    setShowAiBanner(false);
  }, [watchedStudentId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const documentData = {
        title: values.title,
        studentId: values.studentId,
        durationMonths: values.durationMonths,
        startDate: values.startDate.toISOString(),
        endDate: values.endDate.toISOString(),
        areasOfRemediation: values.areasOfRemediation,
        status: values.status,
      };

      await apiClient.createIEPDocument(documentData);
      toast.success(t('formSuccessCreated'));
      onSuccess?.();
    } catch (error: any) {
      console.error('Create IEP error:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || t('formFailedCreate'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('formHeaderInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Pre-fill Banner */}
            {showAiBanner && (
              <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm text-indigo-700">
                  <Sparkles className="h-4 w-4" />
                  <span>{t('formAiPreFill')}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-indigo-400 hover:text-primary" onClick={() => setShowAiBanner(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            {watchedStudentId && aiAssessment.isLoading && (
              <div className="flex items-center gap-2 text-sm text-indigo-500 px-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t('formAiAnalyzing')}</span>
              </div>
            )}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('formTitle')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('formTitlePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('formStudent')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('formSelectStudent')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.fullName}
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
              name="durationMonths"
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('formStartDate')}</FormLabel>
                    <FormControl>
                      <ProfessionalDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('formSelectStartDate')}
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
                    <FormLabel>{t('formEndDate')}</FormLabel>
                    <FormControl>
                      <ProfessionalDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={t('formSelectEndDate')}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="areasOfRemediation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('formAreasOfRemediation')}</FormLabel>
                  <FormDescription>
                    {t('formAreasOfRemediationDesc')}
                  </FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {DOMAINS.map((domain) => (
                      <div key={domain} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={domain}
                          checked={field.value?.includes(domain)}
                          onChange={(e) => {
                            const currentValue = field.value || [];
                            if (e.target.checked) {
                              field.onChange([...currentValue, domain]);
                            } else {
                              field.onChange(currentValue.filter((d) => d !== domain));
                            }
                          }}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-blue-500"
                        />
                        <Label htmlFor={domain} className="text-sm font-normal cursor-pointer">
                          {t(`domains.${domain}`)}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('formStatus')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('formSelectStatus')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DRAFT">{t('formStatusDraft')}</SelectItem>
                      <SelectItem value="ACTIVE">{t('formStatusActive')}</SelectItem>
                      <SelectItem value="COMPLETED">{t('formStatusCompleted')}</SelectItem>
                      <SelectItem value="ARCHIVED">{t('formStatusArchived')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('formStatusDesc')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('formCancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('formCreating') : t('formCreateDocument')}
          </Button>
        </div>
      </form>
    </Form>
  );
}