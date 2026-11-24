import { useEffect, useState } from "react";
import { bridge } from "../../../lib/bridge";
import type { Form, VolumeOp } from "../../../lib/actions";

type Props = { form: Form; set: (patch: Partial<Form>) => void; continuous: boolean };

const OPS: { id: VolumeOp; label: string }[] = [
  { id: "up", label: "Aumentar" },
  { id: "down", label: "Diminuir" },
  { id: "mute", label: "Mudo" },
];

export function VolumeFields({ form, set, continuous }: Props) {
  const targets = useAudioTargets();
  const showTarget = continuous || form.volumeOp !== "mute";

  return (
    <>
      {continuous ? (
        <p className="muted">Girar o knob controla o volume direto (0–100%).</p>
      ) : (
        <div className="chips" role="group" aria-label="O que fazer com o volume">
          {OPS.map((op) => (
            <button key={op.id} type="button" className={`chip${form.volumeOp === op.id ? " is-on" : ""}`} aria-pressed={form.volumeOp === op.id} onClick={() => set({ volumeOp: op.id })}>
              {op.label}
            </button>
          ))}
        </div>
      )}

      {showTarget && (
        <label className="field">
          Volume de
          <input
            className="input"
            list="audio-targets"
            value={form.target}
            placeholder="master = volume geral do Windows"
            onChange={(e) => set({ target: e.target.value })}
          />
          <datalist id="audio-targets">
            {targets.map((t) => <option key={t} value={t} />)}
          </datalist>
          <span className="hint">“master” é o volume geral. Ou o nome de um programa: spotify.exe, discord.exe…</span>
        </label>
      )}

      {!continuous && form.volumeOp !== "mute" && (
        <label className="field">
          Quanto muda a cada toque (%)
          <input className="input" type="number" min={1} max={100} value={form.step} onChange={(e) => set({ step: Number(e.target.value) })} />
        </label>
      )}
    </>
  );
}

function useAudioTargets() {
  const [targets, setTargets] = useState<string[]>(["master"]);
  useEffect(() => {
    bridge.audioTargets()
      .then((catalog) => setTargets([...new Set([...catalog.targets, ...catalog.apps.map((a) => a.target)])]))
      .catch(() => {});
  }, []);
  return targets;
}
