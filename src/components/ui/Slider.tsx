interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Slider({ value, min, max, step, onChange, disabled }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative h-1.5 group">
      <div className="absolute inset-0 rounded-full bg-border" />
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-accent transition-all"
        style={{ width: `${percentage}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ left: `calc(${percentage}% - 6px)` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
    </div>
  );
}
