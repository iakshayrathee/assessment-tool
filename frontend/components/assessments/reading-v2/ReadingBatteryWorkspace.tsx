'use client';

import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';

interface BatteryData {
  observation?: string;
  performance?: string;
  remarks?: string;
  reportUrl?: string;
  /** local file selected but not yet uploaded — stored as object URL for preview */
  localFileUrl?: string;
  localFileName?: string;
}

interface Props {
  data: BatteryData;
  onChange: (d: BatteryData) => void;
  disabled?: boolean;
}

const PERFORMANCE_OPTIONS = ['Excellent', 'Good', 'Average', 'Poor'];

export function ReadingBatteryWorkspace({ data, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (field: keyof BatteryData, value: string | undefined) =>
    onChange({ ...data, [field]: value });

  const displayUrl = data.localFileUrl || data.reportUrl;
  const displayName = data.localFileName;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be under 20 MB.');
      return;
    }
    // Revoke any previous object URL to avoid memory leaks
    if (data.localFileUrl) URL.revokeObjectURL(data.localFileUrl);
    const objectUrl = URL.createObjectURL(file);
    onChange({
      ...data,
      localFileUrl: objectUrl,
      localFileName: file.name,
      // Clear the remote URL so the iframe shows the local file
      reportUrl: undefined,
    });
    toast.success(`"${file.name}" selected. Save the assessment to persist.`);
  };

  const handleRemoveFile = () => {
    if (data.localFileUrl) URL.revokeObjectURL(data.localFileUrl);
    onChange({ ...data, localFileUrl: undefined, localFileName: undefined, reportUrl: undefined });
    // Reset the file input value so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* PDF Viewer */}
      {displayUrl && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {displayName || t('batteryTestDocument', { defaultValue: 'Battery Test Document' })}
            </CardTitle>
            {!disabled && (
              <Button variant="ghost" size="sm" onClick={handleRemoveFile} className="text-destructive hover:text-destructive">
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <iframe
              src={displayUrl}
              className="w-full h-96 rounded border"
              title="Reading Battery PDF"
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('batteryTestWorkspace', { defaultValue: 'Reading Battery Workspace' })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* PDF Upload */}
          {!disabled && (
            <div>
              <Label>{t('uploadBatteryPDF', { defaultValue: 'Upload Battery Test PDF' })}</Label>
              <div className="mt-1 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {displayUrl
                    ? t('replacePDF', { defaultValue: 'Replace PDF' })
                    : t('choosePDF', { defaultValue: 'Choose PDF' })}
                </Button>
                {displayName && (
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">{displayName}</span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('uploadPDFHint', { defaultValue: 'PDF only, max 20 MB. The file is available for viewing during this session; save to persist the URL.' })}
              </p>
            </div>
          )}

          {/* Remote URL input (fallback when no file uploaded) */}
          {!displayUrl && !disabled && (
            <div>
              <Label>{t('batteryReportUrl', { defaultValue: 'Or paste Battery Report URL' })}</Label>
              <Input
                value={data.reportUrl || ''}
                onChange={(e) => update('reportUrl', e.target.value)}
                placeholder="https://..."
                disabled={disabled}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label>{t('batteryPerformance', { defaultValue: 'Performance' })}</Label>
            <Select
              value={data.performance || ''}
              onValueChange={(v) => update('performance', v)}
              disabled={disabled}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={t('selectPerformance', { defaultValue: 'Select performance level' })} />
              </SelectTrigger>
              <SelectContent>
                {PERFORMANCE_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('batteryObservation', { defaultValue: 'Observation' })}</Label>
            <Textarea
              value={data.observation || ''}
              onChange={(e) => update('observation', e.target.value)}
              placeholder={t('batteryObservationPlaceholder', { defaultValue: 'Observations from the battery test...' })}
              disabled={disabled}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label>{t('batteryRemarks', { defaultValue: 'Remarks' })}</Label>
            <Textarea
              value={data.remarks || ''}
              onChange={(e) => update('remarks', e.target.value)}
              placeholder={t('batteryRemarksPlaceholder', { defaultValue: 'Additional remarks...' })}
              disabled={disabled}
              className="mt-1"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
