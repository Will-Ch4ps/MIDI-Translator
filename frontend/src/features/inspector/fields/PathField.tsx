import { FolderOpen } from 'lucide-react';
import { Input, Button } from '../../../design';
import { isTauri } from '../../../lib/backend';

export function PathField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <Input
        icon={<FolderOpen />}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="C:\\Programa.exe ou shell:Apps\\... ou https://..."
        style={{ flex: 1 }}
      />
      {isTauri ? (
        <Button variant="secondary" size="md" onClick={() => void pickFile(onChange)}>
          Procurar
        </Button>
      ) : null}
    </div>
  );
}

async function pickFile(onChange: (value: string) => void) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<string | null>('pick_file');
    if (result) onChange(result);
  } catch {
    /* ignore */
  }
}
