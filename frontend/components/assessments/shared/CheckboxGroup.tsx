'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Option {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  columns?: number;
}

export function CheckboxGroup({ label, options, value, onChange, disabled, columns = 2 }: Props) {
  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <div
        className={`grid gap-2`}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((o) => (
          <label
            key={o.value}
            className="flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 hover:bg-muted/30 transition-colors"
          >
            <Checkbox
              checked={value.includes(o.value)}
              onCheckedChange={() => toggle(o.value)}
              disabled={disabled}
            />
            <span className="text-sm">{o.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
