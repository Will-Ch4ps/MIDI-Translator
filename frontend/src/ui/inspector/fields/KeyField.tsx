import { useEffect, useState } from "react";
import { splitCombos } from "../../../lib/actions";

type Props = { value: string; onChange: (combo: string) => void };

/** Atalho de teclado. Vários atalhos separados por vírgula viram uma sequência (macro). */
export function KeyField({ value, onChange }: Props) {
  const [recording, setRecording] = useState(false);
  const combos = splitCombos(value);

  useEffect(() => {
    if (!recording) return;
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const combo = comboFrom(event);
      if (!combo) return; // só modificador apertado: espera a tecla principal
      onChange(combo);
      setRecording(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [recording, onChange]);

  return (
    <div className="field">
      <span>Atalho</span>
      <div className="keycaps">
        <span className="keycaps__list">
          {recording && <span className="keycaps__hint">Aperte o atalho no teclado…</span>}
          {!recording && combos.length === 0 && <span className="keycaps__hint">Nenhum atalho ainda</span>}
          {!recording && combos.map((combo, i) => (
            <span key={i} className="keycaps__combo">
              {i > 0 && <span className="keycaps__then">depois</span>}
              {combo.split("+").map((k) => <kbd key={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</kbd>)}
            </span>
          ))}
        </span>
        <button type="button" className={`btn btn--tall${recording ? " btn--primary" : ""}`} onClick={() => setRecording((r) => !r)}>
          {recording ? "Cancelar" : "Gravar atalho"}
        </button>
      </div>
      <input
        className="input input--mono"
        aria-label="Atalho em texto"
        value={value}
        placeholder="ou digite: ctrl+shift+p   ·   sequência: ctrl+c, ctrl+v"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

const MODIFIERS = ["control", "shift", "alt", "meta"];
const RENAME: Record<string, string> = { " ": "space", escape: "esc", meta: "windows" };

/** Converte o evento para o formato da lib `keyboard` do Python (ex.: "ctrl+shift+p"). */
function comboFrom(event: KeyboardEvent): string {
  const key = event.key.toLowerCase();
  if (MODIFIERS.includes(key)) return "";
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("ctrl");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");
  if (event.metaKey) parts.push("windows");
  // Letras/números pelo código físico, para shift+1 não virar "!".
  const physical = /^Key([A-Z])$/.exec(event.code)?.[1] ?? /^Digit(\d)$/.exec(event.code)?.[1];
  parts.push(physical ? physical.toLowerCase() : RENAME[key] ?? key.replace(/^arrow/, ""));
  return parts.join("+");
}
