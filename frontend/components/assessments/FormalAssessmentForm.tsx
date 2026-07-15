'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { VersionSelectionDialog } from './VersionSelectionDialog';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Upload, X } from 'lucide-react';

const formSchema = z.object({
  assessmentType: z.string().min(1, 'Assessment type is required'),
  referralReason: z.string().optional(),
  referredBy: z.string().optional(),
  conductedBy: z.string().optional(),
  credentials: z.string().optional(),
  clinicName: z.string().optional(),
  assessmentDate: z.date().optional(),
  keyFindings: z.string().optional(),
  diagnosis: z.string().optional(),
  recommendations: z.string().optional(),
});

interface FormalAssessmentFormProps {
  studentId: string;
  referredBy: string; // Educator name
  assessmentId?: string; // For edit mode
  initialData?: any; // Pre-populated data for edit mode
  mode?: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FormalAssessmentForm({
  studentId,
  referredBy,
  assessmentId,
  initialData,
  mode = 'create',
  onSuccess,
  onCancel
}: FormalAssessmentFormProps) {
  const { t } = useTranslation('assessments');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(initialData?.uploadedFiles || []);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  
  const isViewMode = mode === 'view';

  const ASSESSMENT_TYPES = [
    { value: 'Psychological Assessment', label: t('psychological') },
    { value: 'Educational Assessment', label: t('educational') },
    { value: 'Speech and Language Assessment', label: t('speechLanguage') },
    { value: 'Occupational Therapy Assessment', label: t('occupational') },
    { value: 'Behavioral Assessment', label: t('behavioral') },
    { value: 'Neuropsychological Assessment', label: t('neuropsychological') },
    { value: 'Other', label: t('other') }
  ];

  const DIAGNOSIS_OPTIONS = [
    { value: 'Dyslexia', label: t('dyslexia') },
    { value: 'Dyscalculia', label: t('dyscalculia') },
    { value: 'Dysgraphia', label: t('dysgraphia') },
    { value: 'ADHD', label: t('adhd') },
    { value: 'Autism Spectrum Disorder', label: t('autism') },
    { value: 'Specific Learning Disability', label: t('sld') },
    { value: 'Language Disorder', label: t('languageDisorder') },
    { value: 'Developmental Delay', label: t('developmentalDelay') },
    { value: 'Other', label: t('other') },
    { value: 'No Diagnosis', label: t('noDiagnosis') }
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assessmentType: initialData?.assessmentType || '',
      referralReason: initialData?.referralReason || '',
      referredBy: initialData?.referredBy || referredBy || '',
      conductedBy: initialData?.conductedBy || '',
      credentials: initialData?.credentials || '',
      clinicName: initialData?.clinicName || '',
      keyFindings: initialData?.keyFindings || '',
      diagnosis: initialData?.diagnosis || '',
      recommendations: initialData?.recommendations || '',
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileNames = Array.from(files).map(f => f.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
      toast.success(`${files.length} file(s) uploaded`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const data = {
      studentId,
      referredBy,
      assessmentType: values.assessmentType,
      referralReason: values.referralReason,
      conductedBy: values.conductedBy,
      credentials: values.credentials,
      clinicName: values.clinicName,
      assessmentDate: values.assessmentDate?.toISOString(),
      keyFindings: values.keyFindings,
      diagnosis: values.diagnosis,
      recommendations: values.recommendations,
      uploadedFiles,
    };

    if (mode === 'edit') {
      setPendingFormData(data);
      setShowVersionDialog(true);
    } else {
      await saveAssessment(data, 'new-version', 1);
    }
  };

  const saveAssessment = async (data: any, action: 'new-version' | 'overwrite', version?: number) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...data,
        version,
      };

      if (mode === 'edit' && assessmentId) {
        await apiClient.updateFormalAssessment(assessmentId, payload);
        toast.success(t('assessmentSaved'));
      } else {
        await apiClient.createFormalAssessment(payload);
        toast.success(t('assessmentSaved'));
      }

      setShowVersionDialog(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Save formal assessment error:', error);
      toast.error(error.response?.data?.error || 'Failed to save formal assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVersionSelection = (action: 'new-version' | 'overwrite', version?: number) => {
    if (pendingFormData) {
      saveAssessment(pendingFormData, action, version);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Referral Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('referralDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="assessmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('assessmentType')} *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isViewMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectAssessmentType')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSESSMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="referralReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('observations')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('referralReasonPlaceholder')}
                      {...field}
                      rows={3}
                      disabled={isViewMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referredBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('conductedBy')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('referredByPlaceholder')} {...field} disabled={isViewMode} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conductedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('conductedBy')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('conductedByPlaceholder')} {...field} disabled={isViewMode} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credentials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('credentials')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('credentialsPlaceholder')} {...field} disabled={isViewMode} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clinicName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('clinicName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('clinicNamePlaceholder')} {...field} disabled={isViewMode} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assessmentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('date')}</FormLabel>
                  <FormControl>
                    <ProfessionalDatePicker
                      value={field.value || null}
                      onChange={field.onChange}
                      placeholder={t('assessmentDatePlaceholder')}
                      disabled={isViewMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Findings Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t('findingsSummary')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="keyFindings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('observations')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('keyFindingsPlaceholder')}
                      {...field}
                      rows={4}
                      disabled={isViewMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('diagnosis')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isViewMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectDiagnosis')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DIAGNOSIS_OPTIONS.map((diagnosis) => (
                        <SelectItem key={diagnosis.value} value={diagnosis.value}>
                          {diagnosis.label}
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
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('recommendations')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('recommendationsPlaceholder')}
                      {...field}
                      rows={4}
                      disabled={isViewMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Upload Files */}
        {!isViewMode && (
          <Card>
            <CardHeader>
              <CardTitle>{t('uploadFiles')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t('uploadFilesDesc')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('uploadFilesSub')}</p>
                  </div>
                </Label>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('uploadedFiles')}</Label>
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/40 rounded">
                      <span className="text-sm">{file}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {isViewMode && uploadedFiles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('uploadedFiles')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center p-2 bg-muted/40 rounded">
                    <span className="text-sm">{file}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            {isViewMode ? t('close') : t('cancel')}
          </Button>
          {!isViewMode && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('savingAssessment') : mode === 'edit' ? t('updateAssessment') : t('saveAssessment')}
            </Button>
          )}
        </div>
      </form>

      {/* Version Selection Dialog */}
      <VersionSelectionDialog
        isOpen={showVersionDialog}
        onClose={() => {
          setShowVersionDialog(false);
          setPendingFormData(null);
        }}
        onConfirm={handleVersionSelection}
        currentVersion={initialData?.version || 0}
      />
    </Form>
  );
}
