import type { Form, Kind, MediaOp } from "../../lib/actions";
import { PathField } from "./fields/PathField";
import { KeyField } from "./fields/KeyField";
import { VolumeFields } from "./fields/VolumeFields";

type Props = { kind: Kind; form: Form; set: (patch: Partial<Form>) => void; continuous: boolean };

const MEDIA: { id: MediaOp; label: string }[] = [
  { id: "play", label: "Play / Pause" },
  { id: "next", label: "Próxima faixa" },
  { id: "prev", label: "Faixa anterior" },
];

/** Os campos de cada tipo de ação (passo 2 do painel). */
export function KindFields({ kind, form, set, continuous }: Props) {
  switch (kind) {
    case "app":
      return <PathField kind="app_launch" label="Programa" form={form} set={set} />;
    case "script":
      return (
        <>
          <PathField kind="script" label="Arquivo do script" form={form} set={set} />
          <label className="field">
            Argumentos (opcional)
            <input className="input input--mono" value={form.args} placeholder="Ex.: --perfil trabalho" onChange={(e) => set({ args: e.target.value })} />
          </label>
        </>
      );
    case "command":
      return (
        <label className="field">
          Comando
          <textarea
            className="input input--mono"
            rows={4}
            value={form.command}
            placeholder={'Ex.: powershell -NoExit -Command "cd D:\\projeto; npm run dev"'}
            onChange={(e) => set({ command: e.target.value })}
          />
        </label>
      );
    case "key":
      return <KeyField value={form.combo} onChange={(combo) => set({ combo })} />;
    case "media":
      return (
        <div className="chips" role="group" aria-label="Ação de mídia">
          {MEDIA.map((m) => (
            <button key={m.id} type="button" className={`chip${form.media === m.id ? " is-on" : ""}`} aria-pressed={form.media === m.id} onClick={() => set({ media: m.id })}>
              {m.label}
            </button>
          ))}
        </div>
      );
    case "volume":
      return <VolumeFields form={form} set={set} continuous={continuous} />;
  }
}
