import { Input } from '../../../design';

export function TextField({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        style={{ resize: 'vertical', minHeight: 80 }}
      />
    );
  }
  return <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />;
}
