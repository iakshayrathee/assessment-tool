'use client';

interface Props {
  label: string;
  score: number;
  max?: number;
  className?: string;
}

export function SectionScoreCard({ label, score, max = 100, className = '' }: Props) {
  const pct = max === 100 ? score : (score / max) * 100;
  const color =
    pct >= 60 ? 'text-green-700 bg-green-50 border-green-200' :
    pct >= 40 ? 'text-amber-700 bg-amber-50 border-amber-200' :
    'text-red-700 bg-red-50 border-red-200';

  return (
    <div className={`px-3 py-2 rounded border text-right ${color} ${className}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-bold">{score.toFixed(1)}</p>
    </div>
  );
}
