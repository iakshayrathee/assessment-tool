'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Upload, X, FileText, File } from 'lucide-react';

interface FormalAssessmentFormProps {
  studentId: string;
  referredBy: string;
  assessmentId?: string;
  initialData?: any;
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
  onCancel,
}: FormalAssessmentFormProps) {
  const { t } = useTranslation('assessments');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState<string>(initialData?.summary || '');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; file?: File }[]>(
    (initialData?.uploadedFiles || []).map((name: string) => ({ name }))
  );

  const isViewMode = mode === 'view';

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const allowed = Array.from(files).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ext === 'pdf' || ext === 'docx';
    });

    if (allowed.length !== files.length) {
      toast.error('Only PDF and DOCX files are allowed.');
    }

    if (allowed.length > 0) {
      setUploadedFiles((prev) => [
        ...prev,
        ...allowed.map((f) => ({ name: f.name, file: f })),
      ]);
      toast.success(`${allowed.length} file(s) added`);
    }

    // Reset input so the same file can be re-selected
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim() && uploadedFiles.length === 0) {
      toast.error('Please upload a file or enter a summary.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        studentId,
        referredBy,
        summary,
        uploadedFiles: uploadedFiles.map((f) => f.name),
      };

      if (mode === 'edit' && assessmentId) {
        await apiClient.updateFormalAssessment(assessmentId, payload);
      } else {
        await apiClient.createFormalAssessment(payload);
      }

      toast.success(t('assessmentSaved'));
      onSuccess?.();
    } catch (error: any) {
      console.error('Save formal assessment error:', error);
      toast.error(error.response?.data?.error || 'Failed to save formal assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    return ext === 'pdf' ? (
      <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
    ) : (
      <File className="h-4 w-4 text-blue-500 flex-shrink-0" />
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Upload */}
      {!isViewMode && (
        <Card>
          <CardHeader>
            <CardTitle>{t('uploadFiles', { defaultValue: 'Upload Assessment Report' })}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload the formal assessment report as a PDF or DOCX file.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="formal-file-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload PDF or DOCX</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .pdf and .docx formats</p>
              </div>
            </Label>
            <input
              id="formal-file-upload"
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>{t('uploadedFiles', { defaultValue: 'Uploaded Files' })}</Label>
                {uploadedFiles.map((f, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted/40 rounded border">
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(f.name)}
                      <span className="text-sm truncate">{f.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="flex-shrink-0"
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

      {/* View mode: show uploaded files */}
      {isViewMode && uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('uploadedFiles', { defaultValue: 'Uploaded Files' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedFiles.map((f, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/40 rounded border">
                  {getFileIcon(f.name)}
                  <span className="text-sm">{f.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment Summary</CardTitle>
          <p className="text-sm text-muted-foreground">
            Provide a brief summary of the key findings and recommendations from the assessment.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter key findings, diagnosis, and recommendations..."
              rows={6}
              disabled={isViewMode}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {isViewMode ? t('close', { defaultValue: 'Close' }) : t('cancel', { defaultValue: 'Cancel' })}
        </Button>
        {!isViewMode && (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? t('savingAssessment', { defaultValue: 'Saving...' })
              : mode === 'edit'
              ? t('updateAssessment', { defaultValue: 'Update Assessment' })
              : t('saveAssessment', { defaultValue: 'Save Assessment' })}
          </Button>
        )}
      </div>
    </form>
  );
}
