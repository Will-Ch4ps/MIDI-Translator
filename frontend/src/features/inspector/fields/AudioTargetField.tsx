import { Speaker } from 'lucide-react';
import { Input } from '../../../design';

const PRESET_TARGETS = ['master', 'spotify', 'discord', 'chrome', 'firefox', 'obs', 'reaper'];

export function AudioTargetField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <Input
        icon={<Speaker />}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="master ou nome do app"
        list="audio-targets"
      />
      <datalist id="audio-targets">
        {PRESET_TARGETS.map((target) => (
          <option key={target} value={target} />
        ))}
      </datalist>
      <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
        {PRESET_TARGETS.map((target) => (
          <button
            key={target}
            type="button"
            onClick={() => onChange(target)}
            style={{
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              background: value === target ? 'var(--accent-bg)' : 'var(--surface)',
              border: `1px solid ${value === target ? 'var(--accent)' : 'var(--border)'}`,
              color: value === target ? 'var(--accent-soft)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            {target}
          </button>
        ))}
      </div>
    </div>
  );
}
