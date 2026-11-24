import { useState } from "react";
import { emptyForm, formFrom, kindOf, kindsFor, suggestLabel, toAction, type Form, type Kind } from "../../lib/actions";
import type { Control, Mapping, Trigger } from "../../lib/types";
import type { AppState } from "../../state/useApp";
import { KindPicker } from "./KindPicker";
import { KindFields } from "./KindFields";

type Props = {
  control: Control;
  mapping?: Mapping;
  trigger: Trigger;
  continuous: boolean;
  /** Botões liga/desliga: opção de repetir a mesma ação no outro gatilho. */
  mirror?: { trigger: Trigger; label: string; existing?: Mapping };
  app: AppState;
};

const sameAction = (a?: Mapping, b?: Mapping) => Boolean(a && b) && JSON.stringify(a?.action) === JSON.stringify(b?.action);

/** Passo 1: o que faz. Passo 2: os campos daquele tipo. Salva um vínculo (controle + gatilho). */
export function MappingEditor({ control, mapping, trigger, continuous, mirror, app }: Props) {
  const [kind, setKind] = useState<Kind | null>(() => kindOf(mapping));
  const [form, setForm] = useState<Form>(() => formFrom(mapping));
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [mirrored, setMirrored] = useState(() => sameAction(mapping, mirror?.existing));

  const set = (patch: Partial<Form>) => {
    setForm((current) => ({ ...current, ...patch }));
    setStatus("");
  };
  const action = kind ? toAction(kind, form, continuous) : null;
  const suggestion = kind ? suggestLabel(kind, form) : "";

  async function save() {
    if (!kind || !action) return;
    setSaving(true);
    // Mantém parâmetros que a UI não mostra (ex.: knob_mode) quando o tipo não mudou.
    const params = mapping?.action.type === action.type ? { ...mapping.action.params, ...action.params } : action.params;
    const label = form.label.trim() || suggestion;
    const saved = { control_id: control.id, trigger, label, action: { type: action.type, params } };
    const ok = await app.saveMapping(mirror && mirrored ? [saved, { ...saved, trigger: mirror.trigger }] : saved);
    setSaving(false);
    setStatus(ok ? (app.listener.running ? "Salvo e já valendo" : "Salvo") : "");
  }

  async function remove() {
    if (!mapping) {
      setKind(null);
      return;
    }
    if (mirror && mirrored && mirror.existing) await app.deleteMapping(control.id, mirror.trigger);
    if (await app.deleteMapping(control.id, trigger)) {
      setKind(null);
      setForm(emptyForm());
    }
  }

  return (
    <>
      <div className="inspector__body">
        <section className="inspector__step">
          <h3 className="inspector__step-title">1 · O que faz</h3>
          {!kind && <p className="muted">Este controle está livre. Escolha o que ele vai fazer:</p>}
          <KindPicker kinds={kindsFor(continuous)} value={kind} onChange={(k) => { setKind(k); setStatus(""); }} />
        </section>

        {kind && (
          <section className="inspector__step">
            <h3 className="inspector__step-title">2 · Detalhes</h3>
            <label className="field">
              Nome no controle
              <input
                className="input"
                value={form.label}
                placeholder={suggestion || "Ex.: VSCode, Discord, Cena OBS"}
                onChange={(e) => set({ label: e.target.value })}
              />
            </label>
            <KindFields kind={kind} form={form} set={set} continuous={continuous} />
            {mirror && (
              <label className="check">
                <input type="checkbox" checked={mirrored} onChange={(e) => { setMirrored(e.target.checked); setStatus(""); }} />
                {mirror.label}
              </label>
            )}
          </section>
        )}
      </div>

      {kind && (
        <footer className="inspector__foot">
          <button type="button" className="btn-link btn-link--danger" onClick={() => void remove()}>
            {mapping ? "Remover vínculo" : "Cancelar"}
          </button>
          <span className="inspector__save">
            <span className="inspector__status" role="status">{status}</span>
            <button type="button" className="btn btn--primary btn--tall" disabled={!action || saving} onClick={() => void save()}>
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </span>
        </footer>
      )}
    </>
  );
}
