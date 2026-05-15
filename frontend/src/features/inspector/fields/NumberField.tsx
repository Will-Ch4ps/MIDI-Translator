import { Input } from '../../../design';

export function NumberField({
  value,
  onChange,
  integer,
  min,
  max,
  step,
}: {
  value: number;
  onChange: (value: number) => void;
  integer?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Input
      type="number"
      value={Number.isFinite(value) ? value : ''}
      min={min}
      max={max}
      step={step ?? (integer ? 1 : 0.01)}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw === '') {
          onChange(0);
          return;
        }
        const parsed = integer ? parseInt(raw, 10) : parseFloat(raw);
        if (Number.isFinite(parsed)) onChange(parsed);
      }}
    />
  );
}
