'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface BatteryData {
  observation?: string;
  performance?: string;
  remarks?: string;
  reportUrl?: string;
}

interface Props {
  data: BatteryData;
  onChange: (d: BatteryData) => void;
  disabled?: boolean;
}

const PERFORMANCE_OPTIONS = ['Excellent', 'Good', 'Average', 'Poor'];

export function ReadingBatteryWorkspace({ data, onChange, disabled }: Props) {
  const { t } = useTranslation('assessments');

  const update = (field: keyof BatteryData, value: string) =>
    onChange({ ...data, [field]: value });

  return (
    <div className="space-y-4">
      {/* PDF Viewer / URL display */}
      {data.reportUrl && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('batteryTestDocument', { defaultValue: 'Battery Test Document' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <iframe
              src={data.reportUrl}
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
          {!data.reportUrl && (
            <div>
              <Label>{t('batteryReportUrl', { defaultValue: 'Battery Report URL (optional)' })}</Label>
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
