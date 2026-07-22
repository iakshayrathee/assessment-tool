'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface Props {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export function RatingSlider({ label, value, onChange, disabled, min = 1, max = 5 }: Props) {
  const labels: Record<number, string> = { 1: 'Very Low', 2: 'Low', 3: 'Average', 4: 'Good', 5: 'Excellent' };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <Label className="text-sm">{label}</Label>
        <span className="text-xs font-medium text-primary">
          {value !== undefined ? `${value}/${max}${labels[value] ? ` — ${labels[value]}` : ''}` : '—'}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        value={value !== undefined ? [value] : [Math.floor((min + max) / 2)]}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        {Array.from({ length: max - min + 1 }, (_, i) => (
          <span key={i}>{min + i}</span>
        ))}
      </div>
    </div>
  );
}
