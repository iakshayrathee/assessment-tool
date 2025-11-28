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
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';
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
  referralDate: z.date({
    required_error: 'Referral date is required',
  }),
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
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FormalAssessmentForm({ studentId, referredBy, onSuccess, onCancel }: FormalAssessmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assessmentType: '',
      referralReason: '',
      conductedBy: '',
      credentials: '',
      clinicName: '',
      keyFindings: '',
      diagnosis: '',
      recommendations: '',
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
    try {
      setIsSubmitting(true);
      
      const data = {
        studentId,
        referredBy,
        assessmentType: values.assessmentType,
        referralReason: values.referralReason,
        referralDate: values.referralDate.toISOString(),
        conductedBy: values.conductedBy,
        credentials: values.credentials,
        clinicName: values.clinicName,
        assessmentDate: values.assessmentDate?.toISOString(),
        keyFindings: values.keyFindings,
        diagnosis: values.diagnosis,
        recommendations: values.recommendations,
        uploadedFiles,
      };

      await apiClient.createFormalAssessment(data);
      toast.success('Formal assessment created successfully!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Create formal assessment error:', error);
      toast.error(error.response?.data?.error || 'Failed to create formal assessment');
    } finally {
      setIsSubmitting(false);
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referralDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Date *</FormLabel>
                  <FormControl>
                    <ProfessionalDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select referral date"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>Referred By</Label>
              <Input value={referredBy} disabled className="bg-gray-50" />
            </div>

            <FormField
              control={form.control}
              name="conductedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conducted By</FormLabel>
                  <FormControl>
                    <Input placeholder="Name of professional conducting assessment" {...field} />
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
                    <Input placeholder="Professional credentials (e.g., PhD, M.Ed)" {...field} />
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
                    <Input placeholder="Name of clinic or institution" {...field} />
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
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select assessment date"
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Upload Files */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload PDF or images</p>
                  <p className="text-xs text-gray-500 mt-1">Multiple files supported</p>
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
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
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

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Assessment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

