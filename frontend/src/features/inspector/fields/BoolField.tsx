import * as Switch from '@radix-ui/react-switch';
import './BoolField.css';

export function BoolField({ value, onChange }: { value: boolean; onChange: (value: boolean) => void }) {
  return (
    <Switch.Root checked={value} onCheckedChange={onChange} className="bool">
      <Switch.Thumb className="bool__thumb" />
    </Switch.Root>
  );
}
