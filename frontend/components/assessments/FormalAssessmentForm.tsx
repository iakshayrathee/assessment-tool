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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProfessionalDatePicker } from '@/components/ui/professional-date-picker';
import { VersionSelectionDialog } from './VersionSelectionDialog';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Upload, X } from 'lucide-react';

const ASSESSMENT_TYPES = [
  'Psychological Assessment',
  'Educational Assessment',
  'Speech and Language Assessment',
  'Occupational Therapy Assessment',
  'Behavioral Assessment',
  'Neuropsychological Assessment',
  'Other'
];

const DIAGNOSIS_OPTIONS = [
  'Dyslexia',
  'Dyscalculia',
  'Dysgraphia',
  'ADHD',
  'Autism Spectrum Disorder',
  'Specific Learning Disability',
  'Language Disorder',
  'Developmental Delay',
  'Other',
  'No Diagnosis'
];

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(initialData?.uploadedFiles || []);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  
  const isViewMode = mode === 'view';

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
      // In a real implementation, upload files to server and get URLs
      // For now, just store file names
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
      // Show version selection dialog for edit mode
      setPendingFormData(data);
      setShowVersionDialog(true);
    } else {
      // Direct save for create mode
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
        toast.success('Formal assessment updated successfully!');
      } else {
        await apiClient.createFormalAssessment(payload);
        toast.success('Formal assessment created successfully!');
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
            <CardTitle>Referral Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="assessmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assessment Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isViewMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select assessment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ASSESSMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
                  <FormLabel>Referral Reason</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the reason for referral..."
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
                  <FormLabel>Referred By</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of person making the referral" {...field} disabled={isViewMode} />
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
                  <FormLabel>Conducted By</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of professional conducting assessment" {...field} disabled={isViewMode} />
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
                  <FormLabel>Credentials</FormLabel>
                  <FormControl>
                    <Input placeholder="Professional credentials (e.g., PhD, M.Ed)" {...field} disabled={isViewMode} />
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
                  <FormLabel>Clinic Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of clinic or institution" {...field} disabled={isViewMode} />
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
                  <FormLabel>Assessment Date</FormLabel>
                  <FormControl>
                    <ProfessionalDatePicker
                      value={field.value || null}
                      onChange={field.onChange}
                      placeholder="Select assessment date"
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
            <CardTitle>Findings Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="keyFindings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Findings</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Summarize the key findings from the assessment..."
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
                  <FormLabel>Diagnosis</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isViewMode}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select diagnosis" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DIAGNOSIS_OPTIONS.map((diagnosis) => (
                        <SelectItem key={diagnosis} value={diagnosis}>
                          {diagnosis}
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
                  <FormLabel>Recommendations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide recommendations based on the assessment..."
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
              <CardTitle>Upload Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload PDF or images</p>
                    <p className="text-xs text-muted-foreground mt-1">Multiple files supported</p>
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
                <Label>Uploaded Files</Label>
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
              <CardTitle>Uploaded Files</CardTitle>
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
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Assessment' : 'Save Assessment'}
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

