import { AppWindow, FileCode2, Keyboard, Play, SquareTerminal, Volume2, type LucideIcon } from "lucide-react";
import { KIND_LABEL, type Kind } from "../../lib/actions";

const ICONS: Record<Kind, LucideIcon> = {
  app: AppWindow,
  script: FileCode2,
  command: SquareTerminal,
  key: Keyboard,
  media: Play,
  volume: Volume2,
};

type Props = { kinds: Kind[]; value: Kind | null; onChange: (kind: Kind) => void };

export function KindPicker({ kinds, value, onChange }: Props) {
  return (
    <div className="kinds" role="group" aria-label="Tipo de ação">
      {kinds.map((kind) => {
        const Icon = ICONS[kind];
        return (
          <button
            key={kind}
            type="button"
            className={`kind${kind === value ? " is-on" : ""}`}
            aria-pressed={kind === value}
            onClick={() => onChange(kind)}
          >
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            {KIND_LABEL[kind]}
          </button>
        );
      })}
    </div>
  );
}
